export interface FileValidationService {
  validateFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedName?: string;
}

export interface FileVirusScanner {
  scanFile(buffer: Buffer): Promise<ScanResult>;
}

export interface ScanResult {
  isClean: boolean;
  threatFound?: string;
  scanId?: string;
}
