import { UseCase } from '@application/common';
import { DeleteFileRequest, DeleteFileResponse } from './DeleteFileDto';
import { NotFoundError, ConflictError } from '@application/common';
import { FileRepository, FileStorageService, FileId } from '@domain/index';

export class DeleteFileUseCase
  implements UseCase<DeleteFileRequest, DeleteFileResponse>
{
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageService: FileStorageService
  ) {}

  async execute(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    const fileId = FileId.fromString(request.fileId);
    const fileEntity = await this.fileRepository.findById(fileId);

    if (!fileEntity) {
      throw new NotFoundError(`File with ID ${request.fileId} not found`);
    }

    if (!fileEntity.canBeDeleted()) {
      throw new ConflictError(
        `File with ID ${request.fileId} cannot be deleted in its current state`
      );
    }

    try {
      // Delete from S3 storage
      await this.storageService.delete(fileEntity.getS3Key());

      // Mark as deleted in database
      fileEntity.markAsDeleted();
      await this.fileRepository.update(fileEntity);

      return {
        success: true,
        message: `File ${fileEntity.getName().toString()} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ConflictError(`Failed to delete file: ${error.message}`);
      }
      throw error;
    }
  }
}
