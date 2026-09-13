import { describe, expect, it, vi } from 'vitest';

import {
  SanitizePdfUseCase,
  type PdfSanitizerPort,
} from './sanitize-pdf.use-case';

describe('SanitizePdfUseCase', () => {
  it('delegates bytes and options to the configured port', async () => {
    const output = {
      pdfBytes: new ArrayBuffer(2),
      counts: {
        pages: 1,
        annotationsRemoved: 0,
        openActionRemoved: false,
        catalogAaRemoved: false,
        namesRemoved: false,
        acroFormRemoved: false,
        metadataCleared: true,
        rebuilt: true,
      },
      annotationsMayRemain: false,
    };
    const sanitize = vi.fn<PdfSanitizerPort['sanitize']>().mockResolvedValue(output);
    const useCase = new SanitizePdfUseCase({ sanitize });
    const command = {
      pdfBytes: new ArrayBuffer(4),
      options: {
        clearMetadata: true,
        removeAnnotations: true,
        removeActions: true,
        removeNames: true,
        removeAcroForm: true,
        rebuildPdf: true,
      },
    };

    await expect(useCase.execute(command)).resolves.toBe(output);
    expect(sanitize).toHaveBeenCalledWith(command);
  });
});
