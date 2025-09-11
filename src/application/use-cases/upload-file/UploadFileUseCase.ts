import { UseCase } from '@application/common';
import { UploadFileRequest, UploadFileResponse } from './UploadFileDto';
import { ValidationError, SecurityError } from '@application/common';
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
    // 1. Validate the file
    const validationResult = await this.validationService.validateFile(
      request.fileBuffer,
      request.fileName,
      request.mimeType,
      request.size
    );

    if (!validationResult.isValid) {
      throw new ValidationError(
        `File validation failed: ${validationResult.errors.join(', ')}`
      );
    }

    // 2. Create domain objects
    const fileName = FileName.create(
      validationResult.sanitizedName || request.fileName
    );
    const fileSize = FileSize.create(request.size);
    const mimeType = MimeType.create(request.mimeType);

    // Generate S3 key with category-based folder structure
    const category = mimeType.getCategory();
    const s3Key = S3Key.generateFromFileNameWithCategory(
      fileName.toString(),
      category
    );

    // 3. Create file entity
    const fileEntity = FileEntity.create(
      fileName,
      fileSize,
      mimeType,
      s3Key,
      request.metadata || {}
    );

    try {
      // 4. Save file metadata first
      await this.fileRepository.save(fileEntity);

      // 5. Mark as uploading
      fileEntity.markAsUploading();
      await this.fileRepository.update(fileEntity);

      // 6. Upload to S3
      const uploadResult = await this.storageService.upload(
        s3Key,
        request.fileBuffer,
        mimeType.toString(),
        {
          originalName: fileName.toString(),
          uploadedBy: request.metadata?.uploadedBy || 'anonymous',
          uploadedAt: new Date().toISOString(),
          category: category,
        }
      );

      // 7. Mark as uploaded
      fileEntity.markAsUploaded(uploadResult.url);
      await this.fileRepository.update(fileEntity);

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
      } catch (updateError) {
        // Log update error but don't mask the original error
        console.error('Failed to update file status to failed:', updateError);
      }

      if (error instanceof Error) {
        throw new SecurityError(`Upload failed: ${error.message}`);
      }
      throw error;
    }
  }
}
