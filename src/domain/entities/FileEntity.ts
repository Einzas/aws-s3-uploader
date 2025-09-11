import {
  FileId,
  FileName,
  FileSize,
  MimeType,
  S3Key,
  FileCategory,
} from '../value-objects';

export enum FileStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export interface FileMetadata extends Record<string, unknown> {
  uploadedBy?: string;
  uploadedAt?: Date;
  tags?: Record<string, string>;
  description?: string;
}

export class FileEntity {
  private constructor(
    private readonly id: FileId,
    private readonly name: FileName,
    private readonly size: FileSize,
    private readonly mimeType: MimeType,
    private readonly s3Key: S3Key,
    private status: FileStatus,
    private readonly metadata: FileMetadata,
    private url?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  static create(
    name: FileName,
    size: FileSize,
    mimeType: MimeType,
    s3Key: S3Key,
    metadata: FileMetadata = {}
  ): FileEntity {
    return new FileEntity(
      FileId.create(),
      name,
      size,
      mimeType,
      s3Key,
      FileStatus.PENDING,
      metadata
    );
  }

  static restore(
    id: FileId,
    name: FileName,
    size: FileSize,
    mimeType: MimeType,
    s3Key: S3Key,
    status: FileStatus,
    metadata: FileMetadata,
    url?: string,
    createdAt?: Date,
    updatedAt?: Date
  ): FileEntity {
    return new FileEntity(
      id,
      name,
      size,
      mimeType,
      s3Key,
      status,
      metadata,
      url,
      createdAt,
      updatedAt
    );
  }

  // Getters
  getId(): FileId {
    return this.id;
  }

  getName(): FileName {
    return this.name;
  }

  getSize(): FileSize {
    return this.size;
  }

  getMimeType(): MimeType {
    return this.mimeType;
  }

  getS3Key(): S3Key {
    return this.s3Key;
  }

  getStatus(): FileStatus {
    return this.status;
  }

  getMetadata(): FileMetadata {
    return { ...this.metadata };
  }

  getUrl(): string | undefined {
    return this.url;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCategory(): FileCategory {
    return this.mimeType.getCategory();
  }

  // Business methods
  markAsUploading(): void {
    if (this.status !== FileStatus.PENDING) {
      throw new Error('Only pending files can be marked as uploading');
    }
    this.status = FileStatus.UPLOADING;
    this.updatedAt = new Date();
  }

  markAsUploaded(url: string): void {
    if (this.status !== FileStatus.UPLOADING) {
      throw new Error('Only uploading files can be marked as uploaded');
    }
    this.status = FileStatus.UPLOADED;
    this.url = url;
    this.updatedAt = new Date();
  }

  markAsFailed(): void {
    if (
      this.status === FileStatus.UPLOADED ||
      this.status === FileStatus.DELETED
    ) {
      throw new Error('Cannot mark uploaded or deleted files as failed');
    }
    this.status = FileStatus.FAILED;
    this.updatedAt = new Date();
  }

  markAsDeleted(): void {
    if (this.status === FileStatus.DELETED) {
      throw new Error('File is already deleted');
    }
    this.status = FileStatus.DELETED;
    this.url = undefined;
    this.updatedAt = new Date();
  }

  canBeDeleted(): boolean {
    return (
      this.status === FileStatus.UPLOADED || this.status === FileStatus.FAILED
    );
  }

  isUploadComplete(): boolean {
    return this.status === FileStatus.UPLOADED;
  }

  toJSON() {
    return {
      id: this.id.toString(),
      name: this.name.toString(),
      size: this.size.toBytes(),
      mimeType: this.mimeType.toString(),
      category: this.getCategory(),
      s3Key: this.s3Key.toString(),
      status: this.status,
      metadata: this.metadata,
      url: this.url,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
