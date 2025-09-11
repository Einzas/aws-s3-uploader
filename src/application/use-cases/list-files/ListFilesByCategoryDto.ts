export interface ListFilesByCategoryRequest {
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ListFilesByCategoryResponse {
  files: Array<{
    fileId: string;
    fileName: string;
    size: number;
    mimeType: string;
    category: string;
    status: string;
    url?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  categories: Array<{
    name: string;
    displayName: string;
    count: number;
  }>;
}
