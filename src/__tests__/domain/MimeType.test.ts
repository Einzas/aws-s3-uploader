import { MimeType } from '../../domain/value-objects/MimeType';

describe('MimeType', () => {
  describe('create', () => {
    it('should create a valid MIME type', () => {
      const mimeType = MimeType.create('image/jpeg');
      expect(mimeType.toString()).toBe('image/jpeg');
    });

    it('should throw error for empty MIME type', () => {
      expect(() => MimeType.create('')).toThrow('MIME type cannot be empty');
    });

    it('should throw error for invalid MIME type format', () => {
      expect(() => MimeType.create('invalid')).toThrow(
        'Invalid MIME type format'
      );
    });

    it('should throw error for disallowed MIME type', () => {
      expect(() => MimeType.create('application/x-executable')).toThrow(
        "MIME type 'application/x-executable' is not allowed"
      );
    });

    it('should accept custom allowed types', () => {
      const customAllowed = ['text/custom'];
      const mimeType = MimeType.create('text/custom', customAllowed);
      expect(mimeType.toString()).toBe('text/custom');
    });
  });

  describe('getMainType', () => {
    it('should return main type', () => {
      const mimeType = MimeType.create('image/jpeg');
      expect(mimeType.getMainType()).toBe('image');
    });
  });

  describe('getSubType', () => {
    it('should return sub type', () => {
      const mimeType = MimeType.create('image/jpeg');
      expect(mimeType.getSubType()).toBe('jpeg');
    });
  });

  describe('isImage', () => {
    it('should return true for image MIME types', () => {
      const mimeType = MimeType.create('image/jpeg');
      expect(mimeType.isImage()).toBe(true);
    });

    it('should return false for non-image MIME types', () => {
      const mimeType = MimeType.create('application/pdf');
      expect(mimeType.isImage()).toBe(false);
    });
  });

  describe('isDocument', () => {
    it('should return true for document MIME types', () => {
      const mimeType = MimeType.create('application/pdf');
      expect(mimeType.isDocument()).toBe(true);
    });

    it('should return true for text MIME types', () => {
      const mimeType = MimeType.create('text/plain');
      expect(mimeType.isDocument()).toBe(true);
    });

    it('should return false for image MIME types', () => {
      const mimeType = MimeType.create('image/jpeg');
      expect(mimeType.isDocument()).toBe(false);
    });
  });
});
