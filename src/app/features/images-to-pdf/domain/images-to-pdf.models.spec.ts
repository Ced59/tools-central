import { describe, expect, it } from 'vitest';

import {
  buildImagesPdfFileName,
  compressionQuality,
  createImagePageLayout,
  inspectRasterImageHeader,
  reorderById,
} from './images-to-pdf.models';

describe('image header inspection', () => {
  it('reads dimensions from a PNG IHDR chunk', () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    bytes.set([0, 0, 3, 0, 0, 0, 2, 0], 16);

    expect(inspectRasterImageHeader(bytes)).toEqual({
      format: 'png', mimeType: 'image/png', width: 768, height: 512,
    });
  });

  it('reads dimensions from a JPEG start-of-frame segment', () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x02,
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x01, 0x20, 0x02, 0x80, 0x03, 0x01, 0x11, 0x00,
    ]);

    expect(inspectRasterImageHeader(bytes)).toEqual({
      format: 'jpeg', mimeType: 'image/jpeg', width: 640, height: 288,
    });
  });

  it('reads dimensions from an extended WebP header', () => {
    const bytes = new Uint8Array(30);
    bytes.set(new TextEncoder().encode('RIFF'), 0);
    bytes.set(new TextEncoder().encode('WEBP'), 8);
    bytes.set(new TextEncoder().encode('VP8X'), 12);
    bytes.set([0xff, 0x01, 0x00, 0xff, 0x00, 0x00], 24);

    expect(inspectRasterImageHeader(bytes)).toEqual({
      format: 'webp', mimeType: 'image/webp', width: 512, height: 256,
    });
  });

  it('rejects content whose image signature is missing or incomplete', () => {
    expect(inspectRasterImageHeader(new TextEncoder().encode('not an image'))).toBeNull();
    expect(inspectRasterImageHeader(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
  });
});

describe('image PDF layout', () => {
  it('centers a landscape image inside an A4 portrait page and its margins', () => {
    const layout = createImagePageLayout(1_600, 900, 'a4-portrait', 20);

    expect(layout.pageWidth).toBeCloseTo(595.28);
    expect(layout.imageX).toBeCloseTo(56.69);
    expect(layout.imageY).toBeGreaterThan(250);
    expect(layout.imageWidth).toBeCloseTo(481.89);
  });

  it('creates a natural 96 DPI page when image size is selected', () => {
    const layout = createImagePageLayout(960, 480, 'image', 0);
    expect(layout).toMatchObject({ pageWidth: 720, pageHeight: 360, imageWidth: 720, imageHeight: 360 });
  });
});

describe('image PDF options', () => {
  it('reorders items without mutating the source array', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(reorderById(items, 'c', 'a').map(item => item.id)).toEqual(['c', 'a', 'b']);
    expect(items.map(item => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('maps compression levels and sanitizes the output name', () => {
    expect(compressionQuality('quality')).toBe(0.96);
    expect(compressionQuality('compact')).toBe(0.72);
    expect(buildImagesPdfFileName('  Mon scan été.PNG')).toBe('Mon-scan-été-images.pdf');
  });
});
