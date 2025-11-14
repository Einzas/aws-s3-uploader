export class FileSize {
  private static readonly MAX_SIZE = 500 * 1024 * 1024; // 500MB default

  private constructor(
    private readonly bytes: number,
    private readonly maxSize?: number
  ) {
    this.validate();
  }

  static create(bytes: number, maxSize?: number): FileSize {
    return new FileSize(bytes, maxSize);
  }

  private validate(): void {
    if (this.bytes < 0) {
      throw new Error('File size cannot be negative');
    }

    const limit = this.maxSize || FileSize.MAX_SIZE;
    if (this.bytes > limit) {
      throw new Error(
        `File size exceeds maximum allowed size of ${limit} bytes`
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
