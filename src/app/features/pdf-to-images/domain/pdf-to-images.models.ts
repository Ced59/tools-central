export const PDF_TO_IMAGES_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const PDF_TO_IMAGES_MAX_DOCUMENT_PAGES = 1_000;
export const PDF_TO_IMAGES_MAX_SELECTED_PAGES = 50;
export const PDF_TO_IMAGES_MAX_TOTAL_PIXELS = 40_000_000;
export const PDF_TO_IMAGES_MAX_SIDE_PIXELS = 8_000;

export const PDF_TO_IMAGES_DPI_VALUES = [72, 96, 144, 200, 300] as const;
export type PdfToImagesDpi = typeof PDF_TO_IMAGES_DPI_VALUES[number];

export const PDF_TO_IMAGES_FORMATS = ['png', 'jpeg', 'webp'] as const;
export type PdfToImagesFormat = typeof PDF_TO_IMAGES_FORMATS[number];

export interface PdfPageGeometry {
  pageNumber: number;
  widthPoints: number;
  heightPoints: number;
  rotation: number;
}

export interface PdfDocumentSummary {
  pageCount: number;
  pages: PdfPageGeometry[];
}

export interface PdfRenderPlan {
  pageNumbers: number[];
  dpi: PdfToImagesDpi;
  format: PdfToImagesFormat;
  quality: number;
  background: string;
}

export interface PdfRenderedImage {
  pageNumber: number;
  width: number;
  height: number;
  bytes: Uint8Array;
  mimeType: string;
  extension: string;
}

export interface PdfRenderEstimate {
  pageCount: number;
  totalPixels: number;
  largestWidth: number;
  largestHeight: number;
  allowed: boolean;
  reason: 'ok' | 'too-many-pages' | 'too-many-pixels' | 'side-too-large';
}

export interface PdfPageSelectionResult {
  pageNumbers: number[];
  error: 'empty' | 'invalid-syntax' | 'out-of-range' | 'too-many-pages' | null;
  invalidToken?: string;
}

export function parsePdfPageSelection(expression: string, pageCount: number): PdfPageSelectionResult {
  const source = expression.trim();
  if (!source) return { pageNumbers: [], error: 'empty' };

  const selected = new Set<number>();
  for (const rawToken of source.split(',')) {
    const token = rawToken.trim();
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) return { pageNumbers: [], error: 'invalid-syntax', invalidToken: token || rawToken };

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > pageCount) {
      return { pageNumbers: [], error: 'out-of-range', invalidToken: token };
    }

    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      selected.add(pageNumber);
      if (selected.size > PDF_TO_IMAGES_MAX_SELECTED_PAGES) {
        return { pageNumbers: [], error: 'too-many-pages', invalidToken: token };
      }
    }
  }

  return { pageNumbers: [...selected].sort((left, right) => left - right), error: null };
}

export function createPdfRenderEstimate(
  pages: readonly PdfPageGeometry[],
  selectedPageNumbers: readonly number[],
  dpi: PdfToImagesDpi,
): PdfRenderEstimate {
  const selected = new Set(selectedPageNumbers);
  const scale = dpi / 72;
  let totalPixels = 0;
  let largestWidth = 0;
  let largestHeight = 0;

  for (const page of pages) {
    if (!selected.has(page.pageNumber)) continue;
    const width = Math.ceil(page.widthPoints * scale);
    const height = Math.ceil(page.heightPoints * scale);
    largestWidth = Math.max(largestWidth, width);
    largestHeight = Math.max(largestHeight, height);
    totalPixels += width * height;
  }

  const pageCount = selectedPageNumbers.length;
  const reason = pageCount > PDF_TO_IMAGES_MAX_SELECTED_PAGES
    ? 'too-many-pages'
    : largestWidth > PDF_TO_IMAGES_MAX_SIDE_PIXELS || largestHeight > PDF_TO_IMAGES_MAX_SIDE_PIXELS
      ? 'side-too-large'
      : totalPixels > PDF_TO_IMAGES_MAX_TOTAL_PIXELS
        ? 'too-many-pixels'
        : 'ok';

  return {
    pageCount,
    totalPixels,
    largestWidth,
    largestHeight,
    allowed: reason === 'ok',
    reason,
  };
}

export function normalizePdfImageQuality(value: number): number {
  if (!Number.isFinite(value)) return 0.88;
  return Math.min(1, Math.max(0.1, Math.round(value * 100) / 100));
}

export function buildPdfImageFileName(
  sourceName: string,
  pageNumber: number,
  totalPages: number,
  extension: string,
): string {
  const baseName = sourceName.replace(/\.pdf$/iu, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/gu, '') || 'document';
  const padding = Math.max(2, String(totalPages).length);
  return `${baseName}-page-${String(pageNumber).padStart(padding, '0')}.${extension}`;
}
