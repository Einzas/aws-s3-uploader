import { UseCase } from '@application/common';
import {
  ListFilesByCategoryRequest,
  ListFilesByCategoryResponse,
} from './ListFilesByCategoryDto';
import { FileRepository } from '@domain/repositories';
import { FileCategory, FileCategoryHandler } from '@domain/value-objects';

export class ListFilesByCategoryUseCase
  implements UseCase<ListFilesByCategoryRequest, ListFilesByCategoryResponse>
{
  constructor(private readonly fileRepository: FileRepository) {}

  async execute(
    request: ListFilesByCategoryRequest
  ): Promise<ListFilesByCategoryResponse> {
    const allFiles = await this.fileRepository.findAll();

    // Filter by category if specified
    let filteredFiles = allFiles;
    if (request.category) {
      if (!FileCategoryHandler.isValidCategory(request.category)) {
        throw new Error(`Invalid category: ${request.category}`);
      }
      filteredFiles = allFiles.filter(
        (file) => file.getCategory() === request.category
      );
    }

    // Apply pagination
    const limit = request.limit || 50;
    const offset = request.offset || 0;
    const paginatedFiles = filteredFiles.slice(offset, offset + limit);

    // Calculate category counts
    const categoryCounts = new Map<FileCategory, number>();
    for (const file of allFiles) {
      const category = file.getCategory();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    const categories = Object.values(FileCategory).map((category) => ({
      name: category,
      displayName: FileCategoryHandler.getCategoryDisplayName(category),
      count: categoryCounts.get(category) || 0,
    }));

    const files = paginatedFiles.map((file) => ({
      fileId: file.getId().toString(),
      fileName: file.getName().toString(),
      size: file.getSize().toBytes(),
      mimeType: file.getMimeType().toString(),
      category: file.getCategory(),
      status: file.getStatus(),
      url: file.getUrl(),
      createdAt: file.getCreatedAt(),
      updatedAt: file.getUpdatedAt(),
    }));

    return {
      files,
      total: filteredFiles.length,
      categories,
    };
  }
}
