import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { sanitizePdfBuffer } from './pdf-sanitize.engine';

describe('sanitizePdfBuffer', () => {
  it('rebuilds a valid PDF and clears its public metadata', async () => {
    const source = await PDFDocument.create();
    source.addPage([300, 200]);
    source.setAuthor('Private author');
    const input = Uint8Array.from(await source.save()).buffer;

    const result = await sanitizePdfBuffer({
      pdfBytes: input,
      options: {
        clearMetadata: true,
        removeAnnotations: true,
        removeActions: true,
        removeNames: true,
        removeAcroForm: true,
        rebuildPdf: true,
      },
    });

    const sanitized = await PDFDocument.load(result.pdfBytes);
    expect(sanitized.getPageCount()).toBe(1);
    expect(sanitized.getAuthor()).toBe('');
    expect(result.counts).toMatchObject({
      pages: 1,
      metadataCleared: true,
      rebuilt: true,
    });
  });
});
