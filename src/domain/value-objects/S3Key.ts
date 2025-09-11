import { FileCategory } from './FileCategory';

export class S3Key {
  private static readonly MAX_LENGTH = 1024;
  private static readonly FORBIDDEN_CHARS = /[\x00-\x1f\x7f-\x9f]/;

  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(value: string): S3Key {
    return new S3Key(value);
  }

  static generateFromFileName(fileName: string, prefix?: string): S3Key {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = prefix
      ? `${prefix}/${timestamp}-${sanitizedFileName}`
      : `${timestamp}-${sanitizedFileName}`;

    return new S3Key(key);
  }

  static generateFromFileNameWithCategory(
    fileName: string,
    category: FileCategory,
    prefix?: string
  ): S3Key {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    let key: string;
    if (prefix) {
      key = `${prefix}/${category}/${timestamp}-${sanitizedFileName}`;
    } else {
      key = `${category}/${timestamp}-${sanitizedFileName}`;
    }

    return new S3Key(key);
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('S3 key cannot be empty');
    }

    if (this.value.length > S3Key.MAX_LENGTH) {
      throw new Error(`S3 key cannot exceed ${S3Key.MAX_LENGTH} characters`);
    }

    if (S3Key.FORBIDDEN_CHARS.test(this.value)) {
      throw new Error('S3 key contains forbidden characters');
    }

    if (this.value.startsWith('/') || this.value.endsWith('/')) {
      throw new Error('S3 key cannot start or end with a slash');
    }
  }

  toString(): string {
    return this.value;
  }

  getDirectory(): string {
    const lastSlashIndex = this.value.lastIndexOf('/');
    return lastSlashIndex !== -1 ? this.value.substring(0, lastSlashIndex) : '';
  }

  getFileName(): string {
    const lastSlashIndex = this.value.lastIndexOf('/');
    return lastSlashIndex !== -1
      ? this.value.substring(lastSlashIndex + 1)
      : this.value;
  }

  equals(other: S3Key): boolean {
    return this.value === other.value;
  }
}
