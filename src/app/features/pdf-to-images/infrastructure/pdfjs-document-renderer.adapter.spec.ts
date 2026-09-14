import { describe, expect, it, vi } from 'vitest';

import {
  PdfJsDocumentRendererAdapter,
  type PdfImageRenderWorkerFactory,
  type PdfJsModuleLoader,
} from './pdfjs-document-renderer.adapter';

describe('PdfJsDocumentRendererAdapter', () => {
  it('destroys a failed loading task before propagating the error', async () => {
    const failure = new Error('invalid PDF');
    const destroy = vi.fn().mockResolvedValue(undefined);
    const loadPdfJs = vi.fn().mockResolvedValue({
      GlobalWorkerOptions: { workerSrc: '' },
      version: '6.3.289',
      getDocument: () => ({
        promise: Promise.reject(failure),
        destroy,
      }),
    }) as PdfJsModuleLoader;

    await expect(new PdfJsDocumentRendererAdapter(loadPdfJs).inspect(new Uint8Array([1])))
      .rejects.toBe(failure);
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('delegates rasterization to a cancellable module worker', async () => {
    const worker = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as ((event: ErrorEvent) => void) | null,
      postMessage: vi.fn(),
      terminate: vi.fn(),
    };
    const createWorker = vi.fn(() => worker as unknown as Worker) as PdfImageRenderWorkerFactory;
    const adapter = new PdfJsDocumentRendererAdapter(() => import('pdfjs-dist'), createWorker);
    const progress = vi.fn();
    const conversion = adapter.render(
      new Uint8Array([1, 2, 3]),
      undefined,
      { pageNumbers: [1], dpi: 96, format: 'png', quality: 1, background: '#ffffff' },
      progress,
    );

    expect(worker.postMessage).toHaveBeenCalledOnce();
    const receive = worker.onmessage;
    expect(receive).not.toBeNull();
    receive?.(new MessageEvent('message', {
      data: { type: 'progress', completed: 1, total: 1 },
    }));
    receive?.(new MessageEvent('message', {
      data: {
        type: 'success',
        images: [{
          pageNumber: 1,
          width: 96,
          height: 96,
          bytes: new Uint8Array([9]),
          mimeType: 'image/png',
          extension: 'png',
        }],
      },
    }));

    await expect(conversion).resolves.toEqual([
      expect.objectContaining({ pageNumber: 1, width: 96, height: 96 }),
    ]);
    expect(progress).toHaveBeenCalledWith(1, 1);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates the render worker when conversion is aborted', async () => {
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage: vi.fn(),
      terminate: vi.fn(),
    };
    const createWorker = vi.fn(() => worker as unknown as Worker) as PdfImageRenderWorkerFactory;
    const adapter = new PdfJsDocumentRendererAdapter(() => import('pdfjs-dist'), createWorker);
    const abortController = new AbortController();
    const conversion = adapter.render(
      new Uint8Array([1]),
      undefined,
      { pageNumbers: [1], dpi: 300, format: 'png', quality: 1, background: '#ffffff' },
      undefined,
      abortController.signal,
    );

    abortController.abort();

    await expect(conversion).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
