import { UseCase } from '@application/common';
import { GetFileRequest, GetFileResponse } from './GetFileDto';
import { NotFoundError } from '@application/common';
import { FileRepository, FileId } from '@domain/index';

export class GetFileUseCase
  implements UseCase<GetFileRequest, GetFileResponse>
{
  constructor(private readonly fileRepository: FileRepository) {}

  async execute(request: GetFileRequest): Promise<GetFileResponse> {
    const fileId = FileId.fromString(request.fileId);
    const fileEntity = await this.fileRepository.findById(fileId);

    if (!fileEntity) {
      throw new NotFoundError(`File with ID ${request.fileId} not found`);
    }

    return {
      fileId: fileEntity.getId().toString(),
      fileName: fileEntity.getName().toString(),
      size: fileEntity.getSize().toBytes(),
      mimeType: fileEntity.getMimeType().toString(),
      category: fileEntity.getCategory(),
      status: fileEntity.getStatus(),
      url: fileEntity.getUrl(),
      metadata: fileEntity.getMetadata(),
      createdAt: fileEntity.getCreatedAt(),
      updatedAt: fileEntity.getUpdatedAt(),
    };
  }
}
