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

  it('neutralizes source timestamps without requiring a document rebuild', async () => {
    const source = await PDFDocument.create({ updateMetadata: false });
    source.addPage([300, 200]);
    source.setCreationDate(new Date('2014-03-02T12:00:00.000Z'));
    source.setModificationDate(new Date('2020-07-08T18:30:00.000Z'));
    const input = Uint8Array.from(await source.save()).buffer;

    const result = await sanitizePdfBuffer({
      pdfBytes: input,
      options: {
        clearMetadata: true,
        removeAnnotations: false,
        removeActions: false,
        removeNames: false,
        removeAcroForm: false,
        rebuildPdf: false,
      },
    });

    const sanitized = await PDFDocument.load(result.pdfBytes, { updateMetadata: false });
    expect(sanitized.getCreationDate()?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(sanitized.getModificationDate()?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
  });
});
