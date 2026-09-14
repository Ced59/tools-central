import { describe, expect, it, vi } from 'vitest';

import { BrowserImageHeaderReaderAdapter } from './browser-image-header-reader.adapter';
import {
  PdfLibImagePdfGeneratorAdapter,
  type ImagePdfWorkerFactory,
} from './pdf-lib-image-pdf-generator.adapter';
import type { PreparedPdfImage } from '../application/images-to-pdf.ports';

describe('BrowserImageHeaderReaderAdapter', () => {
  it('identifies a PNG from its bytes instead of trusting its MIME type', async () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    bytes.set([0, 0, 0, 2, 0, 0, 0, 3], 16);

    await expect(new BrowserImageHeaderReaderAdapter().inspect(new Blob([bytes], { type: 'text/plain' })))
      .resolves.toMatchObject({ format: 'png', width: 2, height: 3 });
  });
});

describe('PdfLibImagePdfGeneratorAdapter', () => {
  it('shares immutable image Blobs with the worker and returns its PDF', async () => {
    const worker = fakeWorker();
    const createWorker = vi.fn(() => worker as unknown as Worker) as ImagePdfWorkerFactory;
    const blob = new Blob(['png'], { type: 'image/png' });
    const image = preparedImage(blob);
    const adapter = new PdfLibImagePdfGeneratorAdapter(createWorker);
    const progress = vi.fn();
    const creation = adapter.create(
      [image],
      { pageFormat: 'a4-portrait', marginMm: 10, compression: 'balanced' },
      progress,
    );

    expect(worker.postMessage).toHaveBeenCalledWith({
      images: [image],
      settings: { pageFormat: 'a4-portrait', marginMm: 10, compression: 'balanced' },
    });
    worker.onmessage?.(new MessageEvent('message', {
      data: { type: 'progress', completed: 1, total: 1 },
    }));
    const pdf = new Blob(['pdf'], { type: 'application/pdf' });
    worker.onmessage?.(new MessageEvent('message', { data: { type: 'success', pdf } }));

    await expect(creation).resolves.toBe(pdf);
    expect(progress).toHaveBeenCalledWith(1, 1);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates the conversion worker when the caller aborts', async () => {
    const worker = fakeWorker();
    const createWorker = vi.fn(() => worker as unknown as Worker) as ImagePdfWorkerFactory;
    const abortController = new AbortController();
    const creation = new PdfLibImagePdfGeneratorAdapter(createWorker).create(
      [preparedImage(new Blob(['png']))],
      { pageFormat: 'image', marginMm: 0, compression: 'quality' },
      undefined,
      abortController.signal,
    );

    abortController.abort();

    await expect(creation).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});

function fakeWorker() {
  return {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: ErrorEvent) => void) | null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  };
}

function preparedImage(blob: Blob): PreparedPdfImage {
  return {
    id: 'one', fileName: 'one.png', blob, size: blob.size,
    format: 'png', mimeType: 'image/png', width: 2, height: 3,
  };
}
