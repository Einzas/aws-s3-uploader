import dotenv from 'dotenv';
import { FileCategoryHandler } from '@domain/value-objects';

dotenv.config();

export interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3BucketName: string;
  };
  upload: {
    maxFileSize: number;
    allowedFileTypes: string[];
    largeFileThresholdBytes: number;
    multipartPartSizeBytes: number;
    multipartQueueSize: number;
    maxConcurrentLargeUploads: number;
  };
  security: {
    jwtSecret: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1610612736', 10), // 1.5GB
    allowedFileTypes:
      process.env.ALLOWED_FILE_TYPES?.split(',') ||
      FileCategoryHandler.getAllAllowedMimeTypes(),
    largeFileThresholdBytes: parseInt(
      process.env.LARGE_FILE_THRESHOLD_BYTES || '104857600',
      10
    ), // 100MB
    multipartPartSizeBytes: parseInt(
      process.env.MULTIPART_PART_SIZE_BYTES || '8388608',
      10
    ), // 8MB
    multipartQueueSize: parseInt(process.env.MULTIPART_QUEUE_SIZE || '2', 10),
    maxConcurrentLargeUploads: parseInt(
      process.env.MAX_CONCURRENT_LARGE_UPLOADS || '2',
      10
    ),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-here',
    rateLimitWindowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10
    ), // 15 minutes
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    ),
  },
};

export function validateConfig(): void {
  const requiredFields = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
  ];

  const missingFields = requiredFields.filter((field) => !process.env[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingFields.join(', ')}`
    );
  }
}
