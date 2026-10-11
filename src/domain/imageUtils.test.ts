import { describe, it, expect, vi } from 'vitest';
import {
  formatFileSize,
  calculateAspectRatio,
  readFileAsDataUrl,
  loadImageDimensions,
  processImageFile,
} from './imageUtils';

describe('imageUtils', () => {
  describe('formatFileSize', () => {
    it('handles undefined, null, negative, or invalid bytes gracefully', () => {
      expect(formatFileSize(undefined)).toBe('—');
      expect(formatFileSize(null as any)).toBe('—');
      expect(formatFileSize(-10)).toBe('—');
      expect(formatFileSize(NaN)).toBe('—');
    });

    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });
  });

  describe('calculateAspectRatio', () => {
    it('handles invalid or zero dimensions', () => {
      expect(calculateAspectRatio(0, 0)).toEqual({ ratioString: '—', decimalRatio: 0 });
      expect(calculateAspectRatio(100, 0)).toEqual({ ratioString: '—', decimalRatio: 0 });
      expect(calculateAspectRatio(undefined, 100)).toEqual({ ratioString: '—', decimalRatio: 0 });
    });

    it('identifies standard aspect ratios', () => {
      // 1:1
      const sq = calculateAspectRatio(500, 500);
      expect(sq.ratioString).toBe('1:1');
      expect(sq.decimalRatio).toBe(1);
      expect(sq.label).toBe('Square');

      // 16:9
      const wide = calculateAspectRatio(1920, 1080);
      expect(wide.ratioString).toBe('16:9');
      expect(wide.decimalRatio).toBe(1.78);
      expect(wide.label).toBe('Widescreen');

      // 4:3
      const standard = calculateAspectRatio(1024, 768);
      expect(standard.ratioString).toBe('4:3');
      expect(standard.decimalRatio).toBe(1.33);

      // 3:2
      const photo = calculateAspectRatio(1200, 800);
      expect(photo.ratioString).toBe('3:2');
      expect(photo.decimalRatio).toBe(1.5);

      // 9:16
      const vert = calculateAspectRatio(1080, 1920);
      expect(vert.ratioString).toBe('9:16');
      expect(vert.decimalRatio).toBe(0.56);
    });

    it('handles arbitrary dimensions using simplified GCD or decimal ratio', () => {
      const custom = calculateAspectRatio(500, 300);
      expect(custom.ratioString).toBe('5:3');
      expect(custom.decimalRatio).toBe(1.67);
    });
  });

  describe('readFileAsDataUrl', () => {
    it('reads a Blob/File as data URL', async () => {
      const blob = new Blob(['test image data'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      const dataUrl = await readFileAsDataUrl(file);
      expect(dataUrl).toContain('data:text/plain;base64,');
    });
  });
});
