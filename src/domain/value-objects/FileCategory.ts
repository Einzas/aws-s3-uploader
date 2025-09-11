export enum FileCategory {
  IMAGES = 'images',
  DOCUMENTS = 'documents',
  VIDEOS = 'videos',
  AUDIO = 'audio',
  ARCHIVES = 'archives',
  OTHER = 'other',
}

export class FileCategoryHandler {
  private static readonly CATEGORY_MIME_TYPES: Record<FileCategory, string[]> =
    {
      [FileCategory.IMAGES]: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
      ],
      [FileCategory.DOCUMENTS]: [
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'text/html',
        'application/json',
      ],
      [FileCategory.VIDEOS]: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo', // .avi
        'video/x-ms-wmv',
        'video/webm',
        'video/3gpp',
        'video/x-flv',
      ],
      [FileCategory.AUDIO]: [
        'audio/mpeg', // .mp3
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/x-m4a',
        'audio/flac',
        'audio/webm',
      ],
      [FileCategory.ARCHIVES]: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-bzip2',
      ],
      [FileCategory.OTHER]: [],
    };

  static getCategoryFromMimeType(mimeType: string): FileCategory {
    for (const [category, mimeTypes] of Object.entries(
      this.CATEGORY_MIME_TYPES
    )) {
      if (mimeTypes.includes(mimeType)) {
        return category as FileCategory;
      }
    }
    return FileCategory.OTHER;
  }

  static getAllowedMimeTypesForCategory(category: FileCategory): string[] {
    return this.CATEGORY_MIME_TYPES[category] || [];
  }

  static getAllAllowedMimeTypes(): string[] {
    return Object.values(this.CATEGORY_MIME_TYPES).flat();
  }

  static getCategoryDisplayName(category: FileCategory): string {
    const displayNames: Record<FileCategory, string> = {
      [FileCategory.IMAGES]: 'Imágenes',
      [FileCategory.DOCUMENTS]: 'Documentos',
      [FileCategory.VIDEOS]: 'Videos',
      [FileCategory.AUDIO]: 'Audio',
      [FileCategory.ARCHIVES]: 'Archivos Comprimidos',
      [FileCategory.OTHER]: 'Otros',
    };
    return displayNames[category];
  }

  static isValidCategory(category: string): category is FileCategory {
    return Object.values(FileCategory).includes(category as FileCategory);
  }
}
