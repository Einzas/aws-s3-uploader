import {
  FileCategoryHandler,
  FileCategory,
} from '../../domain/value-objects/FileCategory';

describe('FileCategoryHandler', () => {
  describe('getCategoryFromMimeType', () => {
    it('should categorize image MIME types correctly', () => {
      expect(FileCategoryHandler.getCategoryFromMimeType('image/jpeg')).toBe(
        FileCategory.IMAGES
      );
      expect(FileCategoryHandler.getCategoryFromMimeType('image/png')).toBe(
        FileCategory.IMAGES
      );
      expect(FileCategoryHandler.getCategoryFromMimeType('image/gif')).toBe(
        FileCategory.IMAGES
      );
    });

    it('should categorize document MIME types correctly', () => {
      expect(
        FileCategoryHandler.getCategoryFromMimeType('application/pdf')
      ).toBe(FileCategory.DOCUMENTS);
      expect(FileCategoryHandler.getCategoryFromMimeType('text/plain')).toBe(
        FileCategory.DOCUMENTS
      );
      expect(
        FileCategoryHandler.getCategoryFromMimeType('application/msword')
      ).toBe(FileCategory.DOCUMENTS);
    });

    it('should categorize video MIME types correctly', () => {
      expect(FileCategoryHandler.getCategoryFromMimeType('video/mp4')).toBe(
        FileCategory.VIDEOS
      );
      expect(FileCategoryHandler.getCategoryFromMimeType('video/mpeg')).toBe(
        FileCategory.VIDEOS
      );
    });

    it('should categorize audio MIME types correctly', () => {
      expect(FileCategoryHandler.getCategoryFromMimeType('audio/mpeg')).toBe(
        FileCategory.AUDIO
      );
      expect(FileCategoryHandler.getCategoryFromMimeType('audio/wav')).toBe(
        FileCategory.AUDIO
      );
    });

    it('should categorize archive MIME types correctly', () => {
      expect(
        FileCategoryHandler.getCategoryFromMimeType('application/zip')
      ).toBe(FileCategory.ARCHIVES);
      expect(
        FileCategoryHandler.getCategoryFromMimeType(
          'application/x-rar-compressed'
        )
      ).toBe(FileCategory.ARCHIVES);
    });

    it('should return OTHER for unknown MIME types', () => {
      expect(
        FileCategoryHandler.getCategoryFromMimeType('application/unknown')
      ).toBe(FileCategory.OTHER);
      expect(FileCategoryHandler.getCategoryFromMimeType('text/unknown')).toBe(
        FileCategory.OTHER
      );
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return correct display names', () => {
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.IMAGES)
      ).toBe('Imágenes');
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.DOCUMENTS)
      ).toBe('Documentos');
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.VIDEOS)
      ).toBe('Videos');
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.AUDIO)
      ).toBe('Audio');
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.ARCHIVES)
      ).toBe('Archivos Comprimidos');
      expect(
        FileCategoryHandler.getCategoryDisplayName(FileCategory.OTHER)
      ).toBe('Otros');
    });
  });

  describe('getAllAllowedMimeTypes', () => {
    it('should return a comprehensive list of allowed MIME types', () => {
      const allTypes = FileCategoryHandler.getAllAllowedMimeTypes();

      expect(allTypes).toContain('image/jpeg');
      expect(allTypes).toContain('application/pdf');
      expect(allTypes).toContain('video/mp4');
      expect(allTypes).toContain('audio/mpeg');
      expect(allTypes).toContain('application/zip');
      expect(allTypes.length).toBeGreaterThan(10);
    });
  });

  describe('isValidCategory', () => {
    it('should validate category strings correctly', () => {
      expect(FileCategoryHandler.isValidCategory('images')).toBe(true);
      expect(FileCategoryHandler.isValidCategory('documents')).toBe(true);
      expect(FileCategoryHandler.isValidCategory('invalid')).toBe(false);
      expect(FileCategoryHandler.isValidCategory('')).toBe(false);
    });
  });
});
