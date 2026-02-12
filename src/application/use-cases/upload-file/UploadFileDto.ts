export interface UploadFileRequest {
  fileName: string;
  fileBuffer?: Buffer;
  validationBuffer?: Buffer;
  tempFilePath?: string;
  mimeType: string;
  size: number;
  metadata?: {
    uploadedBy?: string;
    tags?: Record<string, string>;
    description?: string;
  };
}

export interface UploadFileResponse {
  fileId: string;
  fileName: string;
  size: number;
  mimeType: string;
  category: string;
  status: string;
  url?: string;
  uploadedAt: Date;
}
