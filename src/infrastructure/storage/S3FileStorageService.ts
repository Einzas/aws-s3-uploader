import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileStorageService, UploadResult } from '@domain/services';
import { S3Key } from '@domain/value-objects';

export class S3FileStorageService implements FileStorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(bucketName: string, region: string) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({ region });
  }

  async upload(
    key: S3Key,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key.toString(),
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    });

    const result = await this.s3Client.send(command);

    return {
      url: this.getFileUrl(key),
      key: key.toString(),
      etag: result.ETag,
    };
  }

  async delete(key: S3Key): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key.toString(),
    });

    await this.s3Client.send(command);
  }

  async generatePresignedUrl(
    key: S3Key,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key.toString(),
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
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
      return true;
    } catch (error) {
      return false;
    }
  }
}
