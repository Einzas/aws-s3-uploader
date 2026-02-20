import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';
import { S3Key } from '@domain/value-objects';
import { logger } from '@shared/services';
import { UploadResult } from '@domain/services';

const pipeline = promisify(stream.pipeline);

export interface VideoUploadOptions {
  partSize?: number; // Tamaño de cada parte en bytes (default: 5MB)
  maxConcurrentParts?: number; // Máximo de partes en paralelo (default: 3)
  abortOnError?: boolean; // Abortar el upload si hay un error (default: true)
}

export interface PresignedUploadUrlOptions {
  expiresIn?: number; // Segundos hasta que expire (default: 3600)
  partNumber?: number; // Para multipart uploads
  uploadId?: string; // Para multipart uploads
}

/**
 * Servicio optimizado para subida de videos grandes
 * Características:
 * - Upload chunked eficiente
 * - Control de memoria mejorado
 * - Manejo de errores robusto
 * - Presigned URLs para uploads desde cliente
 * - Streaming de archivos sin cargar todo en memoria
 */
export class OptimizedVideoUploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  // Configuración optimizada para videos
  private readonly DEFAULT_PART_SIZE = 8 * 1024 * 1024; // 8MB - óptimo para videos
  private readonly MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB - mínimo de S3
  private readonly MAX_CONCURRENT_PARTS = 3; // No sobrecargar memoria
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(bucketName: string, region: string) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({ 
      region,
      maxAttempts: this.MAX_RETRY_ATTEMPTS, // Retry automático
    });
    
    logger.s3('OptimizedVideoUploadService initialized', {
      bucketName,
      region,
      defaultPartSize: this.DEFAULT_PART_SIZE,
      maxConcurrentParts: this.MAX_CONCURRENT_PARTS,
    });
  }

  /**
   * Upload optimizado de video desde filepath usando streaming
   * No carga el archivo completo en memoria
   */
  async uploadVideoFromFile(
    key: S3Key,
    filePath: string,
    mimeType: string,
    metadata?: Record<string, string>,
    options?: VideoUploadOptions
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const stats = await fs.promises.stat(filePath);
    const fileSize = stats.size;

    logger.s3('Starting optimized video upload', {
      key: key.toString(),
      filePath,
      fileSize,
      mimeType,
    });

    // Para archivos pequeños (< 100MB), usar upload simple
    if (fileSize < 100 * 1024 * 1024) {
      return this.uploadSmallVideo(key, filePath, mimeType, metadata);
    }

    // Para archivos grandes, usar multipart upload
    return this.uploadLargeVideoMultipart(
      key,
      filePath,
      fileSize,
      mimeType,
      metadata,
      options
    );
  }

  /**
   * Upload simple para videos pequeños (< 100MB)
   */
  private async uploadSmallVideo(
    key: S3Key,
    filePath: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const fileStream = fs.createReadStream(filePath);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        Body: fileStream,
        ContentType: mimeType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      });

      const result = await this.s3Client.send(command);

      logger.s3('Small video upload successful', {
        key: key.toString(),
        etag: result.ETag,
      });

      return {
        url: this.getFileUrl(key),
        key: key.toString(),
        etag: result.ETag,
      };
    } catch (error) {
      logger.error('Small video upload failed', error, {
        key: key.toString(),
      });
      throw error;
    }
  }

  /**
   * Upload multipart optimizado para videos grandes
   * Usa streaming y control de concurrencia
   */
  private async uploadLargeVideoMultipart(
    key: S3Key,
    filePath: string,
    fileSize: number,
    mimeType: string,
    metadata?: Record<string, string>,
    options?: VideoUploadOptions
  ): Promise<UploadResult> {
    const partSize = options?.partSize || this.DEFAULT_PART_SIZE;
    const maxConcurrentParts = options?.maxConcurrentParts || this.MAX_CONCURRENT_PARTS;
    
    let uploadId: string | undefined;

    try {
      // 1. Iniciar multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        ContentType: mimeType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      });

      const createResponse = await this.s3Client.send(createCommand);
      uploadId = createResponse.UploadId;

      if (!uploadId) {
        throw new Error('Failed to get upload ID');
      }

      logger.s3('Multipart upload initiated', {
        key: key.toString(),
        uploadId,
        fileSize,
        partSize,
      });

      // 2. Calcular número de partes
      const totalParts = Math.ceil(fileSize / partSize);
      const parts: Array<{ ETag: string; PartNumber: number }> = [];

      logger.s3('Starting part uploads', {
        totalParts,
        maxConcurrentParts,
      });

      // 3. Subir partes con control de concurrencia
      for (let startPartNum = 1; startPartNum <= totalParts; startPartNum += maxConcurrentParts) {
        const endPartNum = Math.min(startPartNum + maxConcurrentParts - 1, totalParts);
        
        // Subir múltiples partes en paralelo (controlado)
        const partPromises = [];
        for (let partNumber = startPartNum; partNumber <= endPartNum; partNumber++) {
          partPromises.push(
            this.uploadPart(filePath, uploadId, partNumber, partSize, key)
          );
        }

        const partResults = await Promise.all(partPromises);
        parts.push(...partResults);

        // Log de progreso
        logger.s3('Parts uploaded', {
          uploadedParts: parts.length,
          totalParts,
          progress: `${((parts.length / totalParts) * 100).toFixed(2)}%`,
        });
      }

      // 4. Completar multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      });

      const completeResponse = await this.s3Client.send(completeCommand);

      logger.s3('Multipart upload completed successfully', {
        key: key.toString(),
        uploadId,
        totalParts,
        etag: completeResponse.ETag,
      });

      return {
        url: this.getFileUrl(key),
        key: key.toString(),
        etag: completeResponse.ETag,
      };

    } catch (error) {
      // Abortar upload en caso de error
      if (uploadId && options?.abortOnError !== false) {
        await this.abortMultipartUpload(key, uploadId);
      }

      logger.error('Multipart upload failed', error, {
        key: key.toString(),
        uploadId,
      });
      throw error;
    }
  }

  /**
   * Subir una parte individual del archivo
   */
  private async uploadPart(
    filePath: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    key: S3Key
  ): Promise<{ ETag: string; PartNumber: number }> {
    const startByte = (partNumber - 1) * partSize;
    const endByte = Math.min(startByte + partSize, await this.getFileSize(filePath));
    const partLength = endByte - startByte;

    // Crear stream para esta parte específica
    const partStream = fs.createReadStream(filePath, {
      start: startByte,
      end: endByte - 1, // end es inclusivo
    });

    // Leer el stream en un buffer (solo esta parte)
    const chunks: Buffer[] = [];
    for await (const chunk of partStream) {
      chunks.push(chunk);
    }
    const partBuffer = Buffer.concat(chunks);

    const uploadPartCommand = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key.toString(),
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: partBuffer,
    });

    const response = await this.s3Client.send(uploadPartCommand);

    if (!response.ETag) {
      throw new Error(`Failed to get ETag for part ${partNumber}`);
    }

    logger.s3('Part uploaded', {
      partNumber,
      size: partLength,
      etag: response.ETag,
    });

    return {
      ETag: response.ETag,
      PartNumber: partNumber,
    };
  }

  /**
   * Abortar un upload multipart
   */
  private async abortMultipartUpload(key: S3Key, uploadId: string): Promise<void> {
    try {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        UploadId: uploadId,
      });

      await this.s3Client.send(abortCommand);

      logger.s3('Multipart upload aborted', {
        key: key.toString(),
        uploadId,
      });
    } catch (error) {
      logger.error('Failed to abort multipart upload', error, {
        key: key.toString(),
        uploadId,
      });
    }
  }

  /**
   * Generar presigned URLs para upload directo desde cliente
   * Útil para aplicaciones frontend
   */
  async generatePresignedUploadUrl(
    key: S3Key,
    mimeType: string,
    options?: PresignedUploadUrlOptions
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        ContentType: mimeType,
      });

      const url = await getSignedUrl(
        this.s3Client,
        command,
        { expiresIn: options?.expiresIn || 3600 }
      );

      logger.s3('Presigned upload URL generated', {
        key: key.toString(),
        expiresIn: options?.expiresIn || 3600,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', error, {
        key: key.toString(),
      });
      throw error;
    }
  }

  /**
   * Iniciar multipart upload y devolver uploadId + presigned URLs
   * Para uploads chunked desde el cliente
   */
  async initiateMultipartUploadWithPresignedUrls(
    key: S3Key,
    mimeType: string,
    fileSize: number,
    partSize?: number
  ): Promise<{
    uploadId: string;
    partUrls: Array<{ partNumber: number; url: string }>;
  }> {
    try {
      const actualPartSize = partSize || this.DEFAULT_PART_SIZE;
      const totalParts = Math.ceil(fileSize / actualPartSize);

      // Iniciar multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key.toString(),
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      });

      const createResponse = await this.s3Client.send(createCommand);
      const uploadId = createResponse.UploadId;

      if (!uploadId) {
        throw new Error('Failed to get upload ID');
      }

      // Generar presigned URLs para cada parte
      const partUrls: Array<{ partNumber: number; url: string }> = [];
      
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const uploadPartCommand = new UploadPartCommand({
          Bucket: this.bucketName,
          Key: key.toString(),
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(this.s3Client, uploadPartCommand, {
          expiresIn: 3600,
        });

        partUrls.push({ partNumber, url });
      }

      logger.s3('Multipart upload initiated with presigned URLs', {
        key: key.toString(),
        uploadId,
        totalParts,
      });

      return {
        uploadId,
        partUrls,
      };
    } catch (error) {
      logger.error('Failed to initiate multipart upload with presigned URLs', error, {
        key: key.toString(),
      });
      throw error;
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }

  private getFileUrl(key: S3Key): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key.toString()}`;
  }
}
