import { FileName } from '../../domain/value-objects/FileName';

describe('FileName', () => {
  describe('create', () => {
    it('should create a valid file name', () => {
      const fileName = FileName.create('document.pdf');
      expect(fileName.toString()).toBe('document.pdf');
    });

    it('should throw error for empty file name', () => {
      expect(() => FileName.create('')).toThrow('File name cannot be empty');
    });

    it('should throw error for file name with forbidden characters', () => {
      expect(() => FileName.create('file<>name.pdf')).toThrow(
        'File name contains forbidden characters'
      );
    });

    it('should throw error for file name that starts with a dot', () => {
      expect(() => FileName.create('.hidden')).toThrow(
        'File name cannot start or end with a dot'
      );
    });

    it('should throw error for file name that exceeds maximum length', () => {
      const longName = 'a'.repeat(256) + '.pdf';
      expect(() => FileName.create(longName)).toThrow(
        'File name cannot exceed 255 characters'
      );
    });
  });

  describe('getExtension', () => {
    it('should return file extension', () => {
      const fileName = FileName.create('document.pdf');
      expect(fileName.getExtension()).toBe('pdf');
    });

    it('should return empty string for file without extension', () => {
      const fileName = FileName.create('README');
      expect(fileName.getExtension()).toBe('');
    });
  });

  describe('getNameWithoutExtension', () => {
    it('should return file name without extension', () => {
      const fileName = FileName.create('document.pdf');
      expect(fileName.getNameWithoutExtension()).toBe('document');
    });
  });

  describe('equals', () => {
    it('should return true for equal file names', () => {
      const fileName1 = FileName.create('document.pdf');
      const fileName2 = FileName.create('document.pdf');
      expect(fileName1.equals(fileName2)).toBe(true);
    });

    it('should return false for different file names', () => {
      const fileName1 = FileName.create('document.pdf');
      const fileName2 = FileName.create('image.jpg');
      expect(fileName1.equals(fileName2)).toBe(false);
    });
  });
});
