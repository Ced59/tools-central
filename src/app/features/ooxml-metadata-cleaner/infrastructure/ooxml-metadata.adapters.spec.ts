import { describe, expect, it, vi } from 'vitest';

import {
  OoxmlMetadataWorkerAdapter,
  type OoxmlMetadataWorkerLike,
} from './ooxml-metadata-worker.adapter';
import type {
  OoxmlMetadataWorkerRequest,
  OoxmlMetadataWorkerResponse,
} from './ooxml-metadata.worker.messages';

function report() {
  return {
    kind: 'docx' as const,
    detected: [],
    removed: [],
    remaining: [],
    detectedCount: 0,
    removedCount: 0,
    remainingCount: 0,
    truncatedFindingCount: 0,
    archiveEntryCount: 3,
    uncompressedBytes: 20,
  };
}

class FakeWorker implements OoxmlMetadataWorkerLike {
  onmessage: ((event: MessageEvent<OoxmlMetadataWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn<(
    message: OoxmlMetadataWorkerRequest,
    transfer: Transferable[],
  ) => void>((_message: OoxmlMetadataWorkerRequest) => {
    queueMicrotask(() => {
      this.onmessage?.({ data: { type: 'progress', percent: 42 } } as MessageEvent<OoxmlMetadataWorkerResponse>);
      this.onmessage?.({
        data: { type: 'success', output: new Uint8Array([1, 2]).buffer, report: report() },
      } as unknown as MessageEvent<OoxmlMetadataWorkerResponse>);
    });
  });
  readonly terminate = vi.fn();
}

describe('OoxmlMetadataWorkerAdapter', () => {
  it('transfers input, forwards progress and returns the generated document', async () => {
    const worker = new FakeWorker();
    const progress = vi.fn();
    const result = await new OoxmlMetadataWorkerAdapter(() => worker).clean(
      new Uint8Array([3, 4]),
      'docx',
      {
        removeCoreProperties: true,
        removeApplicationProperties: true,
        removeCustomProperties: true,
        removeThumbnail: true,
      },
      progress,
    );
    expect(worker.postMessage).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenCalledWith(42);
    expect(result.bytes).toEqual(new Uint8Array([1, 2]));
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates the Worker when the task is cancelled', async () => {
    const worker = new FakeWorker();
    worker.postMessage.mockImplementation(() => undefined);
    const controller = new AbortController();
    const promise = new OoxmlMetadataWorkerAdapter(() => worker).clean(
      new Uint8Array([3]),
      'xlsx',
      {
        removeCoreProperties: true,
        removeApplicationProperties: false,
        removeCustomProperties: false,
        removeThumbnail: false,
      },
      undefined,
      controller.signal,
    );
    controller.abort();
    await expect(promise).rejects.toEqual(expect.objectContaining({ name: 'AbortError' }));
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('preserves bounded failure codes from the Worker', async () => {
    const worker = new FakeWorker();
    worker.postMessage.mockImplementation(() => {
      queueMicrotask(() => worker.onmessage?.({
        data: {
          type: 'failure',
          code: 'encrypted-entry',
          entryName: 'word/document.xml',
          message: 'encrypted-entry',
        },
      } as MessageEvent<OoxmlMetadataWorkerResponse>));
    });
    await expect(new OoxmlMetadataWorkerAdapter(() => worker).clean(
      new Uint8Array([3]),
      'docx',
      {
        removeCoreProperties: true,
        removeApplicationProperties: false,
        removeCustomProperties: false,
        removeThumbnail: false,
      },
    )).rejects.toEqual(expect.objectContaining({
      code: 'encrypted-entry',
      entryName: 'word/document.xml',
    }));
  });
});
