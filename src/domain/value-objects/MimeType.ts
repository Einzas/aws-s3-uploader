import { FileCategory, FileCategoryHandler } from './FileCategory';

export class MimeType {
  private static readonly ALLOWED_TYPES =
    FileCategoryHandler.getAllAllowedMimeTypes();

  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(value: string, allowedTypes?: string[]): MimeType {
    const instance = new MimeType(value);
    const allowed = allowedTypes || MimeType.ALLOWED_TYPES;

    if (!allowed.includes(value)) {
      throw new Error(`MIME type '${value}' is not allowed`);
    }

    return instance;
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('MIME type cannot be empty');
    }

    const mimeTypePattern =
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/;
    if (!mimeTypePattern.test(this.value)) {
      throw new Error('Invalid MIME type format');
    }
  }

  toString(): string {
    return this.value;
  }

  getMainType(): string {
    return this.value.split('/')[0];
  }

  getSubType(): string {
    return this.value.split('/')[1];
  }

  isImage(): boolean {
    return this.getMainType() === 'image';
  }

  isDocument(): boolean {
    return (
      this.getMainType() === 'application' || this.getMainType() === 'text'
    );
  }

  getCategory(): FileCategory {
    return FileCategoryHandler.getCategoryFromMimeType(this.value);
  }

  isVideo(): boolean {
    return this.getMainType() === 'video';
  }

  isAudio(): boolean {
    return this.getMainType() === 'audio';
  }

  isArchive(): boolean {
    const category = this.getCategory();
    return category === FileCategory.ARCHIVES;
  }

  equals(other: MimeType): boolean {
    return this.value === other.value;
  }
}
