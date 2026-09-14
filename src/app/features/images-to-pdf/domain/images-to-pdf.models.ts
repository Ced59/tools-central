export const IMAGES_TO_PDF_MAX_FILES = 50;
export const IMAGES_TO_PDF_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const IMAGES_TO_PDF_MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const IMAGES_TO_PDF_MAX_IMAGE_PIXELS = 20_000_000;
export const IMAGES_TO_PDF_MAX_TOTAL_PIXELS = 60_000_000;
export const IMAGES_TO_PDF_MAX_SIDE_PIXELS = 8_192;
export const IMAGES_TO_PDF_MAX_OUTPUT_BYTES = 150 * 1024 * 1024;
const IMAGES_TO_PDF_OUTPUT_BASE_RESERVE_BYTES = 1024 * 1024;
const IMAGES_TO_PDF_OUTPUT_PAGE_RESERVE_BYTES = 16 * 1024;

export const IMAGES_TO_PDF_PAGE_FORMATS = [
  'image',
  'a4-portrait',
  'a4-landscape',
  'letter-portrait',
  'letter-landscape',
] as const;
export type ImagesToPdfPageFormat = typeof IMAGES_TO_PDF_PAGE_FORMATS[number];

export const IMAGES_TO_PDF_COMPRESSIONS = ['quality', 'balanced', 'compact'] as const;
export type ImagesToPdfCompression = typeof IMAGES_TO_PDF_COMPRESSIONS[number];
export type SupportedRasterFormat = 'png' | 'jpeg' | 'webp';

export interface RasterImageHeader {
  format: SupportedRasterFormat;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

export interface ImagePageLayout {
  pageWidth: number;
  pageHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
}

export interface ImagePdfSettings {
  pageFormat: ImagesToPdfPageFormat;
  marginMm: number;
  compression: ImagesToPdfCompression;
}

const MILLIMETERS_TO_POINTS = 72 / 25.4;
const SCREEN_PIXELS_TO_POINTS = 72 / 96;

export function inspectRasterImageHeader(bytes: Uint8Array): RasterImageHeader | null {
  return inspectPng(bytes) ?? inspectJpeg(bytes) ?? inspectWebp(bytes);
}

export function createImagePageLayout(
  imageWidthPixels: number,
  imageHeightPixels: number,
  pageFormat: ImagesToPdfPageFormat,
  marginMm: number,
): ImagePageLayout {
  const margin = clampMargin(marginMm) * MILLIMETERS_TO_POINTS;
  let [pageWidth, pageHeight] = pageDimensions(pageFormat);
  if (pageFormat === 'image') {
    pageWidth = imageWidthPixels * SCREEN_PIXELS_TO_POINTS + margin * 2;
    pageHeight = imageHeightPixels * SCREEN_PIXELS_TO_POINTS + margin * 2;
  }

  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);
  const scale = Math.min(
    availableWidth / Math.max(1, imageWidthPixels),
    availableHeight / Math.max(1, imageHeightPixels),
  );
  const imageWidth = imageWidthPixels * scale;
  const imageHeight = imageHeightPixels * scale;

  return {
    pageWidth,
    pageHeight,
    imageX: (pageWidth - imageWidth) / 2,
    imageY: (pageHeight - imageHeight) / 2,
    imageWidth,
    imageHeight,
  };
}

export function pageDimensions(pageFormat: ImagesToPdfPageFormat): [number, number] {
  if (pageFormat === 'a4-portrait') return [595.28, 841.89];
  if (pageFormat === 'a4-landscape') return [841.89, 595.28];
  if (pageFormat === 'letter-portrait') return [612, 792];
  if (pageFormat === 'letter-landscape') return [792, 612];
  return [0, 0];
}

export function compressionQuality(compression: ImagesToPdfCompression): number {
  if (compression === 'compact') return 0.72;
  if (compression === 'balanced') return 0.86;
  return 0.96;
}

export function exceedsImagesPdfOutputBudget(encodedBytes: number, pageCount: number): boolean {
  const reservedBytes = IMAGES_TO_PDF_OUTPUT_BASE_RESERVE_BYTES
    + Math.max(0, pageCount) * IMAGES_TO_PDF_OUTPUT_PAGE_RESERVE_BYTES;
  return encodedBytes + reservedBytes > IMAGES_TO_PDF_MAX_OUTPUT_BYTES;
}

export function reorderById<T extends { id: string }>(
  items: readonly T[],
  movedId: string,
  targetId: string,
): T[] {
  const fromIndex = items.findIndex(item => item.id === movedId);
  const targetIndex = items.findIndex(item => item.id === targetId);
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return [...items];
  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(targetIndex, 0, moved);
  return reordered;
}

export function buildImagesPdfFileName(firstImageName: string): string {
  const baseName = firstImageName
    .replace(/\.(?:png|jpe?g|webp)$/iu, '')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/gu, '') || 'images';
  return `${baseName}-images.pdf`;
}

function inspectPng(bytes: Uint8Array): RasterImageHeader | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value)) return null;
  if (readAscii(bytes, 12, 4) !== 'IHDR') return null;
  return validHeader('png', 'image/png', readUint32(bytes, 16), readUint32(bytes, 20));
}

function inspectJpeg(bytes: Uint8Array): RasterImageHeader | null {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
  let offset = 2;
  let swapDimensions = false;
  while (offset + 6 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    if (marker === 0xe1) {
      const orientation = readExifOrientation(bytes, offset + 2, segmentLength - 2);
      if (orientation !== null) swapDimensions = orientation >= 5 && orientation <= 8;
    }
    if (isJpegStartOfFrame(marker) && segmentLength >= 7) {
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      return validHeader(
        'jpeg',
        'image/jpeg',
        swapDimensions ? height : width,
        swapDimensions ? width : height,
      );
    }
    offset += segmentLength;
  }
  return null;
}

function readExifOrientation(bytes: Uint8Array, start: number, length: number): number | null {
  const end = Math.min(bytes.length, start + length);
  if (
    length < 20
    || readAscii(bytes, start, 4) !== 'Exif'
    || bytes[start + 4] !== 0
    || bytes[start + 5] !== 0
  ) return null;

  const tiffStart = start + 6;
  const byteOrder = readAscii(bytes, tiffStart, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return null;
  if (readUint16(bytes, tiffStart + 2, littleEndian) !== 42) return null;
  const directoryOffset = readUint32Endian(bytes, tiffStart + 4, littleEndian);
  const directoryStart = tiffStart + directoryOffset;
  if (directoryStart + 2 > end) return null;
  const entryCount = readUint16(bytes, directoryStart, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entry = directoryStart + 2 + index * 12;
    if (entry + 12 > end) return null;
    const tag = readUint16(bytes, entry, littleEndian);
    const type = readUint16(bytes, entry + 2, littleEndian);
    const count = readUint32Endian(bytes, entry + 4, littleEndian);
    if (tag === 0x0112 && type === 3 && count === 1) {
      const orientation = readUint16(bytes, entry + 8, littleEndian);
      return orientation >= 1 && orientation <= 8 ? orientation : null;
    }
  }
  return null;
}

function inspectWebp(bytes: Uint8Array): RasterImageHeader | null {
  if (
    bytes.length < 30
    || readAscii(bytes, 0, 4) !== 'RIFF'
    || readAscii(bytes, 8, 4) !== 'WEBP'
  ) return null;
  const chunk = readAscii(bytes, 12, 4);
  if (chunk === 'VP8X') {
    return validHeader(
      'webp',
      'image/webp',
      1 + readUint24LittleEndian(bytes, 24),
      1 + readUint24LittleEndian(bytes, 27),
    );
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    return validHeader('webp', 'image/webp', width, height);
  }
  if (
    chunk === 'VP8 '
    && bytes[23] === 0x9d
    && bytes[24] === 0x01
    && bytes[25] === 0x2a
  ) {
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return validHeader('webp', 'image/webp', width, height);
  }
  return null;
}

function validHeader(
  format: SupportedRasterFormat,
  mimeType: RasterImageHeader['mimeType'],
  width: number,
  height: number,
): RasterImageHeader | null {
  return width > 0 && height > 0 ? { format, mimeType, width, height } : null;
}

function isJpegStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000
    + bytes[offset + 1] * 0x10000
    + bytes[offset + 2] * 0x100
    + bytes[offset + 3]
  );
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32Endian(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return (
      bytes[offset]
      + bytes[offset + 1] * 0x100
      + bytes[offset + 2] * 0x10000
      + bytes[offset + 3] * 0x1000000
    );
  }
  return readUint32(bytes, offset);
}

function clampMargin(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(30, Math.max(0, value));
}
