import type { ImageHeaderReaderPort } from '../application/images-to-pdf.ports';
import type { RasterImageHeader } from '../domain/images-to-pdf.models';
import type { ImageHeaderWorkerResponse } from './image-header.worker.messages';

export type ImageHeaderWorkerFactory = () => Worker;

export class BrowserImageHeaderReaderAdapter implements ImageHeaderReaderPort {
  constructor(private readonly createWorker: ImageHeaderWorkerFactory = createImageHeaderWorker) {}

  async inspect(blob: Blob, signal?: AbortSignal): Promise<RasterImageHeader | null> {
    const worker = this.createWorker();
    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void): void => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        worker.terminate();
        callback();
      };
      const abort = (): void => {
        finish(() => {
          reject(createAbortError());
        });
      };

      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      worker.onmessage = ({ data }: MessageEvent<ImageHeaderWorkerResponse>) => {
        if (data.type === 'success') {
          finish(() => {
            resolve(data.header);
          });
          return;
        }
        finish(() => {
          reject(new Error(data.message));
        });
      };
      worker.onerror = (event: ErrorEvent) => {
        finish(() => {
          reject(new Error(event.message || 'The image header worker failed.'));
        });
      };
      worker.postMessage({ blob });
    });
  }
}

function createImageHeaderWorker(): Worker {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./image-header.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('Image inspection was cancelled.');
  error.name = 'AbortError';
  return error;
}
