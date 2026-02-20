import { FileValidationService, ValidationResult } from '@domain/services';
import { FileCategoryHandler } from '@domain/value-objects';
import { logger } from '@shared/services';

export class BasicFileValidationService implements FileValidationService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    maxFileSize: number = 10 * 1024 * 1024,
    allowedMimeTypes?: string[]
  ) {
    this.maxFileSize = maxFileSize;
    this.allowedMimeTypes =
      allowedMimeTypes || FileCategoryHandler.getAllAllowedMimeTypes();
  }

  async validateFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check file size
    if (size > this.maxFileSize) {
      errors.push(
        `File size ${size} exceeds maximum allowed size of ${this.maxFileSize} bytes`
      );
    }

    if (size <= 0) {
      errors.push('File size must be greater than 0');
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      errors.push(`MIME type '${mimeType}' is not allowed`);
    }

    // Check file name
    const sanitizedName = this.sanitizeFileName(originalName);
    if (!sanitizedName) {
      errors.push('Invalid file name');
    }

    // Basic file signature validation
    const signatureError = this.validateFileSignature(buffer, mimeType);
    if (signatureError) {
      errors.push(signatureError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName,
    };
  }

  private sanitizeFileName(fileName: string): string {
    // Remove path traversal characters and normalize
    const sanitized = fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/^\.+/, '')
      .replace(/\.+$/, '')
      .substring(0, 255);

    return sanitized.length > 0 ? sanitized : 'unnamed_file';
  }

  private validateFileSignature(
    buffer: Buffer,
    mimeType: string
  ): string | null {
    // Si la validación estricta está deshabilitada, saltear validación de firmas
    const strictValidation = process.env.STRICT_FILE_VALIDATION === 'true';
    if (!strictValidation) {
      return null;
    }

    // Si está en desarrollo, saltear validación de firmas para JPEGs
    if (
      process.env.NODE_ENV === 'development' &&
      (mimeType === 'image/jpeg' || mimeType === 'image/jpg')
    ) {
      return null;
    }

    if (buffer.length < 4) {
      return 'File is too small to validate';
    }

    const signatures: Record<string, number[][]> = {
      'image/jpeg': [
        [0xff, 0xd8, 0xff, 0xe0], // JPEG JFIF
        [0xff, 0xd8, 0xff, 0xe1], // JPEG EXIF
        [0xff, 0xd8, 0xff, 0xe2], // JPEG EXIF
        [0xff, 0xd8, 0xff, 0xe3], // JPEG EXIF
        [0xff, 0xd8, 0xff, 0xe8], // JPEG SPIFF
        [0xff, 0xd8, 0xff, 0xdb], // JPEG raw
        [0xff, 0xd8, 0xff, 0xec], // JPEG
        [0xff, 0xd8, 0xff, 0xed], // JPEG
        [0xff, 0xd8, 0xff, 0xee], // JPEG
        [0xff, 0xd8, 0xff, 0xc0], // JPEG SOF0
        [0xff, 0xd8, 0xff, 0xc4], // JPEG DHT
        [0xff, 0xd8], // JPEG básico (solo primeros 2 bytes)
      ],
      'image/jpg': [
        [0xff, 0xd8, 0xff, 0xe0], // Same as JPEG
        [0xff, 0xd8, 0xff, 0xe1],
        [0xff, 0xd8, 0xff, 0xe2],
        [0xff, 0xd8, 0xff, 0xe3],
        [0xff, 0xd8, 0xff, 0xe8],
        [0xff, 0xd8, 0xff, 0xdb],
        [0xff, 0xd8, 0xff, 0xec],
        [0xff, 0xd8, 0xff, 0xed],
        [0xff, 0xd8, 0xff, 0xee],
        [0xff, 0xd8, 0xff, 0xc0],
        [0xff, 0xd8, 0xff, 0xc4],
        [0xff, 0xd8], // JPEG básico
      ],
      'image/png': [[0x89, 0x50, 0x4e, 0x47]],
      'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
      ],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      
      // Firmas de video - Optimizado para no consumir muchos recursos
      'video/mp4': [
        [0x00, 0x00, 0x00], // ftyp box (validación parcial)
      ],
      'video/quicktime': [
        [0x00, 0x00, 0x00], // moov/mdat/free atoms
      ],
      'video/x-msvideo': [
        [0x52, 0x49, 0x46, 0x46], // RIFF header para AVI
      ],
      'video/avi': [
        [0x52, 0x49, 0x46, 0x46], // RIFF header
      ],
      'video/msvideo': [
        [0x52, 0x49, 0x46, 0x46], // RIFF header
      ],
      'video/webm': [
        [0x1a, 0x45, 0xdf, 0xa3], // EBML header
      ],
      'video/x-matroska': [
        [0x1a, 0x45, 0xdf, 0xa3], // EBML header (MKV)
      ],
      'video/x-flv': [
        [0x46, 0x4c, 0x56, 0x01], // FLV signature
      ],
      'video/ogg': [
        [0x4f, 0x67, 0x67, 0x53], // OggS
      ],
      'video/mpeg': [
        [0x00, 0x00, 0x01, 0xba], // MPEG Program Stream
        [0x00, 0x00, 0x01, 0xb3], // MPEG Video Stream
      ],
      'video/x-mpeg': [
        [0x00, 0x00, 0x01, 0xba],
        [0x00, 0x00, 0x01, 0xb3],
      ],
      'video/3gpp': [
        [0x00, 0x00, 0x00], // ftyp (parcial - es similar a MP4)
      ],
      'video/3gpp2': [
        [0x00, 0x00, 0x00], // ftyp (parcial)
      ],
      'video/x-ms-wmv': [
        [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11], // ASF header
      ],
      'video/x-ms-asf': [
        [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11], // ASF header
      ],
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      // No signature validation for this MIME type
      // Para videos sin firma conocida, permitir upload (no bloquear)
      if (mimeType.startsWith('video/')) {
        logger.validation('Video MIME type without signature validation', {
          mimeType,
          note: 'Skipping signature check for this video format',
        });
        return null;
      }
      return null;
    }

    const fileHeader = Array.from(buffer.subarray(0, 12)); // Más bytes para analizar
    const hasValidSignature = expectedSignatures.some((signature) =>
      signature.every(
        (byte, index) => index < fileHeader.length && fileHeader[index] === byte
      )
    );

    if (!hasValidSignature) {
      // Para videos, solo avisar pero no bloquear (son archivos complejos)
      if (mimeType.startsWith('video/')) {
        logger.validation('Video signature mismatch (non-blocking)', {
          mimeType,
          actualHeader: fileHeader
            .slice(0, 8)
            .map((b) => '0x' + b.toString(16).padStart(2, '0'))
            .join(' '),
          note: 'Allowing video upload despite signature mismatch',
        });
        return null; // No bloquear videos
      }

      // Log para debug de firmas inválidas (no videos)
      logger.validation('File signature mismatch detected', {
        mimeType,
        expectedSignatures: expectedSignatures.map((sig) =>
          sig.map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ')
        ),
        actualHeader: fileHeader
          .slice(0, 8)
          .map((b) => '0x' + b.toString(16).padStart(2, '0'))
          .join(' '),
      });

      return `File signature does not match MIME type '${mimeType}'`;
    }

    return null;
  }
}
