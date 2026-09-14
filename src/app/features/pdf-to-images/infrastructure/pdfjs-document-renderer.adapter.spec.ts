import { describe, expect, it, vi } from 'vitest';

import {
  PdfJsDocumentRendererAdapter,
  type PdfJsModuleLoader,
} from './pdfjs-document-renderer.adapter';

describe('PdfJsDocumentRendererAdapter', () => {
  it('destroys a failed loading task before propagating the error', async () => {
    const failure = new Error('invalid PDF');
    const destroy = vi.fn().mockResolvedValue(undefined);
    const loadPdfJs = vi.fn().mockResolvedValue({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.reject(failure),
        destroy,
      }),
    }) as PdfJsModuleLoader;

    await expect(new PdfJsDocumentRendererAdapter(loadPdfJs).inspect(new Uint8Array([1])))
      .rejects.toBe(failure);
    expect(destroy).toHaveBeenCalledOnce();
  });
});
