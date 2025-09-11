export class FileName {
  private static readonly MAX_LENGTH = 255;
  private static readonly FORBIDDEN_CHARS = /[<>:"/\\|?*\x00-\x1f]/;

  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(value: string): FileName {
    return new FileName(value);
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('File name cannot be empty');
    }

    if (this.value.length > FileName.MAX_LENGTH) {
      throw new Error(
        `File name cannot exceed ${FileName.MAX_LENGTH} characters`
      );
    }

    if (FileName.FORBIDDEN_CHARS.test(this.value)) {
      throw new Error('File name contains forbidden characters');
    }

    if (this.value.startsWith('.') || this.value.endsWith('.')) {
      throw new Error('File name cannot start or end with a dot');
    }
  }

  toString(): string {
    return this.value;
  }

  getExtension(): string {
    const lastDotIndex = this.value.lastIndexOf('.');
    return lastDotIndex !== -1 ? this.value.substring(lastDotIndex + 1) : '';
  }

  getNameWithoutExtension(): string {
    const lastDotIndex = this.value.lastIndexOf('.');
    return lastDotIndex !== -1
      ? this.value.substring(0, lastDotIndex)
      : this.value;
  }

  equals(other: FileName): boolean {
    return this.value === other.value;
  }
}
