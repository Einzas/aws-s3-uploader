import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileStorageService, UploadResult } from '@domain/services';
import { S3Key } from '@domain/value-objects';
import { logger } from '@shared/services';

export class S3FileStorageService implements FileStorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(bucketName: string, region: string) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({ region });
    logger.s3('S3FileStorageService initialized', {
      bucketName,
      region,
    });
  }

  async upload(
    key: S3Key,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      logger.s3('Starting S3 upload', {
        key: key.toString(),
        mimeType,
        size: buffer.length,
        bucket: this.bucketName,
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        Body: buffer,
        ContentType: mimeType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      });

      const result = await this.s3Client.send(command);

      const duration = Date.now() - startTime;
      logger.s3('S3 upload successful', {
        key: key.toString(),
        etag: result.ETag,
        duration,
        bucket: this.bucketName,
      });

      return {
        url: this.getFileUrl(key),
        key: key.toString(),
        etag: result.ETag,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('S3 upload failed', error, {
        key: key.toString(),
        bucket: this.bucketName,
        duration,
      });
      throw error;
    }
  }

  async delete(key: S3Key): Promise<void> {
    try {
      logger.s3('Starting S3 delete', {
        key: key.toString(),
        bucket: this.bucketName,
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
      });

      await this.s3Client.send(command);

      logger.s3('S3 delete successful', {
        key: key.toString(),
        bucket: this.bucketName,
      });
    } catch (error) {
      logger.error('S3 delete failed', error, {
        key: key.toString(),
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  async generatePresignedUrl(
    key: S3Key,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      logger.s3('Generating presigned URL', {
        key: key.toString(),
        expiresIn,
        bucket: this.bucketName,
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      logger.s3('Presigned URL generated', {
        key: key.toString(),
        expiresIn,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', error, {
        key: key.toString(),
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  getFileUrl(key: S3Key): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key.toString()}`;
  }

  async fileExists(key: S3Key): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
      });

      await this.s3Client.send(command);

      logger.s3('File exists check: found', {
        key: key.toString(),
        bucket: this.bucketName,
      });

      return true;
    } catch (error) {
      logger.s3('File exists check: not found', {
        key: key.toString(),
        bucket: this.bucketName,
      });
      return false;
    }
  }
}
