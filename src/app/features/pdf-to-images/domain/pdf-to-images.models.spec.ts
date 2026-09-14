import { describe, expect, it } from 'vitest';

import {
  PDF_TO_IMAGES_MAX_SELECTED_PAGES,
  buildPdfImageFileName,
  createPdfRenderEstimate,
  normalizePdfImageQuality,
  parsePdfPageSelection,
} from './pdf-to-images.models';

describe('parsePdfPageSelection', () => {
  it('parses pages, ranges, whitespace and removes duplicates', () => {
    expect(parsePdfPageSelection('3, 1-2, 2, 5', 6)).toEqual({
      pageNumbers: [1, 2, 3, 5],
      error: null,
    });
  });

  it('rejects an empty expression', () => {
    expect(parsePdfPageSelection('  ', 4).error).toBe('empty');
  });

  it.each(['1,a', '1-', '1--2', 'all'])('rejects invalid token %s', (value) => {
    expect(parsePdfPageSelection(value, 10).error).toBe('invalid-syntax');
  });

  it.each(['0', '4-2', '1-11'])('rejects out-of-range token %s', (value) => {
    expect(parsePdfPageSelection(value, 10).error).toBe('out-of-range');
  });

  it('limits the number of rendered pages', () => {
    expect(parsePdfPageSelection(`1-${String(PDF_TO_IMAGES_MAX_SELECTED_PAGES + 1)}`, 100).error).toBe('too-many-pages');
  });
});

describe('createPdfRenderEstimate', () => {
  const pages = [
    { pageNumber: 1, widthPoints: 612, heightPoints: 792, rotation: 0 },
    { pageNumber: 2, widthPoints: 792, heightPoints: 612, rotation: 90 },
  ];

  it('estimates selected output dimensions at the requested DPI', () => {
    expect(createPdfRenderEstimate(pages, [1], 144)).toEqual({
      pageCount: 1,
      totalPixels: 1_938_816,
      largestWidth: 1_224,
      largestHeight: 1_584,
      allowed: true,
      reason: 'ok',
    });
  });

  it('rejects a total pixel budget that is too large', () => {
    const hugePages = Array.from({ length: 20 }, (_, index) => ({
      pageNumber: index + 1,
      widthPoints: 1_000,
      heightPoints: 1_000,
      rotation: 0,
    }));
    expect(createPdfRenderEstimate(hugePages, hugePages.map(page => page.pageNumber), 300).reason)
      .toBe('too-many-pixels');
  });
});

describe('PDF image output helpers', () => {
  it('normalizes quality to a safe range', () => {
    expect(normalizePdfImageQuality(Number.NaN)).toBe(0.88);
    expect(normalizePdfImageQuality(4)).toBe(1);
    expect(normalizePdfImageQuality(0)).toBe(0.1);
    expect(normalizePdfImageQuality(0.876)).toBe(0.88);
  });

  it('builds a filesystem-friendly, padded page name', () => {
    expect(buildPdfImageFileName('Mon document été.pdf', 3, 120, 'png'))
      .toBe('Mon-document-été-page-003.png');
  });
});
