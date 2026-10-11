/**
 * Utility functions for image sizing, aspect ratio calculation,
 * and client-side image file reading.
 */

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);

  return `${unitIndex === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`;
}

export interface AspectRatioResult {
  ratioString: string;
  decimalRatio: number;
  label?: string;
}

export function calculateAspectRatio(width?: number, height?: number): AspectRatioResult {
  if (!width || !height || width <= 0 || height <= 0) {
    return { ratioString: '—', decimalRatio: 0 };
  }

  const decimal = width / height;

  const standardRatios: Array<{ name: string; ratio: number; label?: string }> = [
    { name: '1:1', ratio: 1, label: 'Square' },
    { name: '16:9', ratio: 16 / 9, label: 'Widescreen' },
    { name: '9:16', ratio: 9 / 16, label: 'Vertical' },
    { name: '4:3', ratio: 4 / 3, label: 'Standard' },
    { name: '3:4', ratio: 3 / 4, label: 'Portrait' },
    { name: '3:2', ratio: 3 / 2, label: 'Photo' },
    { name: '2:3', ratio: 2 / 3, label: 'Vertical Photo' },
    { name: '21:9', ratio: 21 / 9, label: 'Ultrawide' },
    { name: '16:10', ratio: 16 / 10, label: 'Display' },
    { name: '5:4', ratio: 5 / 4 },
    { name: '4:5', ratio: 4 / 5 },
  ];

  // Match against standard ratios (within 2.5% tolerance)
  for (const std of standardRatios) {
    if (Math.abs(decimal - std.ratio) / std.ratio < 0.025) {
      return {
        ratioString: std.name,
        decimalRatio: Number(decimal.toFixed(2)),
        label: std.label,
      };
    }
  }

  // Greatest Common Divisor simplification
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  const roundedW = Math.round(width);
  const roundedH = Math.round(height);
  const divisor = gcd(roundedW, roundedH);
  const simW = roundedW / divisor;
  const simH = roundedH / divisor;

  if (simW <= 50 && simH <= 50) {
    return {
      ratioString: `${simW}:${simH}`,
      decimalRatio: Number(decimal.toFixed(2)),
    };
  }

  return {
    ratioString: `${decimal.toFixed(2)}:1`,
    decimalRatio: Number(decimal.toFixed(2)),
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // If not in a browser environment with Image constructor
    if (typeof Image === 'undefined') {
      return resolve({ width: 0, height: 0 });
    }

    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image from source'));
    };
    img.src = src;
  });
}

export interface ProcessedImageData {
  assetUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileName: string;
  aspectRatio: string;
  ratioLabel?: string;
}

export async function processImageFile(file: File): Promise<ProcessedImageData> {
  const dataUrl = await readFileAsDataUrl(file);
  let dimensions = { width: 0, height: 0 };
  try {
    dimensions = await loadImageDimensions(dataUrl);
  } catch {
    // Fallback if dimensions cannot be measured
  }

  const ratio = calculateAspectRatio(dimensions.width, dimensions.height);

  return {
    assetUrl: dataUrl,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    fileName: file.name,
    aspectRatio: ratio.ratioString !== '—' ? ratio.ratioString : '1:1',
    ratioLabel: ratio.label,
  };
}
