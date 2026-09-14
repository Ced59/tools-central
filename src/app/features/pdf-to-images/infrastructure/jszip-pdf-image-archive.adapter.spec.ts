import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';

import { createPdfImageArchive } from './jszip-archive.engine';
import {
  JsZipPdfImageArchiveAdapter,
  type JsZipArchiveWorkerFactory,
} from './jszip-pdf-image-archive.adapter';

describe('JsZipPdfImageArchiveAdapter', () => {
  it('archives every rendered image under its safe file name', async () => {
    const bytes = await createPdfImageArchive([
      { fileName: 'page-01.png', blob: new Blob([new Uint8Array([1, 2, 3])]) },
      { fileName: 'page-02.webp', blob: new Blob([new Uint8Array([4, 5])]) },
    ]);
    const archive = await JSZip.loadAsync(bytes);

    await expect(archive.file('page-01.png')?.async('uint8array'))
      .resolves.toEqual(new Uint8Array([1, 2, 3]));
    await expect(archive.file('page-02.webp')?.async('uint8array'))
      .resolves.toEqual(new Uint8Array([4, 5]));
  });

  it('terminates archive generation when the caller aborts', async () => {
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage: vi.fn(),
      terminate: vi.fn(),
    };
    const createWorker = vi.fn(() => worker as unknown as Worker) as JsZipArchiveWorkerFactory;
    const abortController = new AbortController();
    const blob = new Blob(['1'], { type: 'image/png' });
    const archive = new JsZipPdfImageArchiveAdapter(createWorker).create([
      { fileName: 'page.png', blob },
    ], abortController.signal);

    expect(worker.postMessage).toHaveBeenCalledWith({
      entries: [{ fileName: 'page.png', blob }],
    });

    abortController.abort();

    await expect(archive).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
