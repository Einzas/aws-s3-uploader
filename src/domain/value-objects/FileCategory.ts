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
        // Formatos comunes y modernos
        'video/mp4',
        'video/mpeg',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/x-ms-wmv', // .wmv
        'video/webm',
        'video/x-matroska', // .mkv
        'video/x-flv', // .flv
        'video/ogg',
        
        // Formatos móviles
        'video/3gpp', // .3gp
        'video/3gpp2', // .3g2
        
        // Formatos MPEG adicionales
        'video/x-mpeg',
        'video/mp2t', // MPEG transport stream
        'video/mp2p', // MPEG program stream
        'video/mpeg4-generic',
        
        // Formatos Windows/Microsoft
        'video/x-ms-asf',
        'video/x-ms-wm',
        'video/x-ms-wmx',
        'video/x-ms-wvx',
        'video/msvideo',
        'video/avi',
        
        // Formatos QuickTime/Apple
        'video/x-quicktime',
        
        // Formatos Flash
        'video/x-f4v',
        'video/f4v',
        'video/x-fli',
        
        // H.264/H.265
        'video/h264',
        'video/h265',
        'video/hevc', // High Efficiency Video Coding
        
        // Otros formatos
        'video/divx',
        'video/vnd.divx',
        'video/x-divx',
        'video/x-dv',
        'video/dv',
        'video/vnd.mpegurl', // .m3u8 (HLS)
        'video/x-m4v',
        'video/m4v',
        'video/MP2T', // transport stream (case variation)
        'video/x-mpegurl',
        'application/x-mpegURL', // HLS playlist
        'application/vnd.apple.mpegurl', // HLS playlist Apple
        'video/vnd.youtube.yt',
        'video/youtube',
        
        // Formatos AVCHD
        'video/avchd',
        'video/x-avchd',
        
        // VP8/VP9 (usado en WebM)
        'video/vp8',
        'video/vp9',
        
        // AV1 (codec moderno)
        'video/av1',
        
        // Formatos adicionales raros pero válidos
        'video/x-motion-jpeg',
        'video/mjpeg',
        'video/vnd.rn-realvideo',
        'video/x-theora',
        'video/x-xvid',
        
        // Formatos de video sin compresión
        'video/raw',
        'video/x-raw',
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
