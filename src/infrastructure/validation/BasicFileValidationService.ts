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
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      // No signature validation for this MIME type
      return null;
    }

    const fileHeader = Array.from(buffer.subarray(0, 12)); // Más bytes para analizar
    const hasValidSignature = expectedSignatures.some((signature) =>
      signature.every(
        (byte, index) => index < fileHeader.length && fileHeader[index] === byte
      )
    );

    if (!hasValidSignature) {
      // Log para debug de firmas inválidas
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
