export interface GetFileRequest {
  fileId: string;
}

export interface GetFileResponse {
  fileId: string;
  fileName: string;
  size: number;
  mimeType: string;
  category: string;
  status: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
