import { S3Key } from '../value-objects';

export interface UploadResult {
  url: string;
  key: string;
  etag?: string;
}

export interface FileStorageService {
  upload(
    key: S3Key,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult>;

  uploadFromFilePath?(
    key: S3Key,
    filePath: string,
    mimeType: string,
    metadata?: Record<string, string>,
    fileId?: string
  ): Promise<UploadResult>;

  delete(key: S3Key): Promise<void>;

  generatePresignedUrl(key: S3Key, expiresIn?: number): Promise<string>;

  getFileUrl(key: S3Key): string;

  fileExists(key: S3Key): Promise<boolean>;
}
