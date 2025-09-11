export class FileSize {
  private static readonly MAX_SIZE = 100 * 1024 * 1024; // 100MB default

  private constructor(private readonly bytes: number) {
    this.validate();
  }

  static create(bytes: number, maxSize?: number): FileSize {
    const instance = new FileSize(bytes);
    if (maxSize && bytes > maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${maxSize} bytes`
      );
    }
    return instance;
  }

  private validate(): void {
    if (this.bytes < 0) {
      throw new Error('File size cannot be negative');
    }

    if (this.bytes > FileSize.MAX_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${FileSize.MAX_SIZE} bytes`
      );
    }
  }

  toBytes(): number {
    return this.bytes;
  }

  toKilobytes(): number {
    return Math.round((this.bytes / 1024) * 100) / 100;
  }

  toMegabytes(): number {
    return Math.round((this.bytes / (1024 * 1024)) * 100) / 100;
  }

  toString(): string {
    if (this.bytes < 1024) {
      return `${this.bytes} B`;
    } else if (this.bytes < 1024 * 1024) {
      return `${this.toKilobytes()} KB`;
    } else {
      return `${this.toMegabytes()} MB`;
    }
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.bytes;
  }
}
