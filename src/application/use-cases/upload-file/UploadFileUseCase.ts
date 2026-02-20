import { UseCase } from '@application/common';
import { UploadFileRequest, UploadFileResponse } from './UploadFileDto';
import { ValidationError, SecurityError } from '@application/common';
import { logger, LogCategory, uploadProgressTracker } from '@shared/services';
import { config } from '@shared/config';
import {
  FileEntity,
  FileName,
  FileSize,
  MimeType,
  S3Key,
  FileRepository,
  FileStorageService,
  FileValidationService,
} from '@domain/index';

export class UploadFileUseCase
  implements UseCase<UploadFileRequest, UploadFileResponse>
{
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageService: FileStorageService,
    private readonly validationService: FileValidationService
  ) {}

  async execute(request: UploadFileRequest): Promise<UploadFileResponse> {
    const startTime = logger.startOperation('UploadFile', {
      category: LogCategory.UPLOAD,
      fileName: request.fileName,
      fileSize: request.size,
      mimeType: request.mimeType,
    });

    try {
      const validationBuffer =
        request.validationBuffer ?? request.fileBuffer ?? Buffer.alloc(0);

      // 1. Validate the file
      logger.validation('Starting file validation', {
        fileName: request.fileName,
        fileSize: request.size,
        mimeType: request.mimeType,
      });

      const validationResult = await this.validationService.validateFile(
        validationBuffer,
        request.fileName,
        request.mimeType,
        request.size
      );

      if (!validationResult.isValid) {
        logger.validation('File validation failed', {
          fileName: request.fileName,
          errors: validationResult.errors,
        });
        throw new ValidationError(
          `File validation failed: ${validationResult.errors.join(', ')}`
        );
      }

      logger.validation('File validation successful', {
        fileName: request.fileName,
        sanitizedName: validationResult.sanitizedName,
      });

      // 2. Create domain objects
      const fileName = FileName.create(
        validationResult.sanitizedName || request.fileName
      );
      const fileSize = FileSize.create(request.size, config.upload.maxFileSize);
      const mimeType = MimeType.create(request.mimeType);

      // Generate S3 key with category-based folder structure
      const category = mimeType.getCategory();
      const s3Key = S3Key.generateFromFileNameWithCategory(
        fileName.toString(),
        category
      );

      logger.upload('Generated S3 key for upload', {
        fileName: fileName.toString(),
        s3Key: s3Key.toString(),
        fileCategory: category,
      });

      // 3. Create file entity
      const fileEntity = FileEntity.create(
        fileName,
        fileSize,
        mimeType,
        s3Key,
        request.metadata || {}
      );

      logger.upload('File entity created', {
        fileId: fileEntity.getId().toString(),
        fileName: fileEntity.getName().toString(),
      });

      // Iniciar tracking de progreso
      uploadProgressTracker.startTracking(
        fileEntity.getId().toString(),
        fileName.toString(),
        request.size
      );

      try {
        // 4. Save file metadata first
        await this.fileRepository.save(fileEntity);
        
        uploadProgressTracker.updateProgress(
          fileEntity.getId().toString(),
          0,
          'validating'
        );
        
        logger.upload('File metadata saved to repository', {
          fileId: fileEntity.getId().toString(),
        });

        // 5. Mark as uploading
        uploadProgressTracker.updateProgress(
          fileEntity.getId().toString(),
          0,
          'uploading'
        );
        
        fileEntity.markAsUploading();
        await this.fileRepository.update(fileEntity);
        logger.upload('File marked as uploading', {
          fileId: fileEntity.getId().toString(),
        });

        // 6. Upload to S3
        logger.s3('Starting S3 upload', {
          fileId: fileEntity.getId().toString(),
          s3Key: s3Key.toString(),
          fileSize: request.size,
        });

        const uploadMetadata = {
          originalName: fileName.toString(),
          uploadedBy: request.metadata?.uploadedBy || 'anonymous',
          uploadedAt: new Date().toISOString(),
          category: category,
        };

        const uploadResult =
          request.tempFilePath && this.storageService.uploadFromFilePath
            ? await this.storageService.uploadFromFilePath(
                s3Key,
                request.tempFilePath,
                mimeType.toString(),
                uploadMetadata,
                fileEntity.getId().toString()
              )
            : request.fileBuffer
              ? await this.storageService.upload(
                  s3Key,
                  request.fileBuffer,
                  mimeType.toString(),
                  uploadMetadata
                )
              : (() => {
                  throw new ValidationError(
                    'No file content available for upload'
                  );
                })();

        logger.s3('S3 upload successful', {
          fileId: fileEntity.getId().toString(),
          s3Key: s3Key.toString(),
          url: uploadResult.url,
        });

        // 7. Mark as uploaded
        fileEntity.markAsUploaded(uploadResult.url);
        await this.fileRepository.update(fileEntity);

        // Marcar progreso como completado
        uploadProgressTracker.completeUpload(fileEntity.getId().toString());

        logger.upload('File upload completed successfully', {
          fileId: fileEntity.getId().toString(),
          fileName: fileEntity.getName().toString(),
          url: uploadResult.url,
        });

        logger.endOperation('UploadFile', startTime, {
          category: LogCategory.UPLOAD,
          fileId: fileEntity.getId().toString(),
          success: true,
        });

        return {
          fileId: fileEntity.getId().toString(),
          fileName: fileEntity.getName().toString(),
          size: fileEntity.getSize().toBytes(),
          mimeType: fileEntity.getMimeType().toString(),
          category: fileEntity.getCategory(),
          status: fileEntity.getStatus(),
          url: fileEntity.getUrl(),
          uploadedAt: fileEntity.getUpdatedAt(),
        };
      } catch (error) {
        // Mark as failed if something goes wrong
        try {
          fileEntity.markAsFailed();
          await this.fileRepository.update(fileEntity);
          
          // Marcar progreso como fallido
          uploadProgressTracker.failUpload(
            fileEntity.getId().toString(),
            error instanceof Error ? error.message : 'Unknown error'
          );
          
          logger.error('File marked as failed', error, {
            category: LogCategory.UPLOAD,
            fileId: fileEntity.getId().toString(),
          });
        } catch (updateError) {
          logger.error('Failed to update file status to failed', updateError, {
            category: LogCategory.ERROR,
            fileId: fileEntity.getId().toString(),
          });
        }

        logger.error('Upload failed', error, {
          category: LogCategory.UPLOAD,
          fileName: request.fileName,
          fileSize: request.size,
        });

        if (error instanceof Error) {
          throw new SecurityError(`Upload failed: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      logger.endOperation('UploadFile', startTime, {
        category: LogCategory.UPLOAD,
        success: false,
      });
      throw error;
    }
  }
}
