import { FileValidationService, ValidationResult } from '@domain/services';

export class BasicFileValidationService implements FileValidationService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    maxFileSize: number = 10 * 1024 * 1024,
    allowedMimeTypes?: string[]
  ) {
    this.maxFileSize = maxFileSize;
    this.allowedMimeTypes = allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];
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
    if (buffer.length < 4) {
      return 'File is too small to validate';
    }

    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xff, 0xd8, 0xff]],
      'image/png': [[0x89, 0x50, 0x4e, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      // No signature validation for this MIME type
      return null;
    }

    const fileHeader = Array.from(buffer.subarray(0, 8));
    const hasValidSignature = expectedSignatures.some((signature) =>
      signature.every((byte, index) => fileHeader[index] === byte)
    );

    if (!hasValidSignature) {
      return `File signature does not match MIME type '${mimeType}'`;
    }

    return null;
  }
}
