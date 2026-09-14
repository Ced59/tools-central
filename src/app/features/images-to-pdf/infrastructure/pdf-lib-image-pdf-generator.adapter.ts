import type {
  ImagePdfGeneratorPort,
  PreparedPdfImage,
} from '../application/images-to-pdf.ports';
import type { ImagePdfSettings } from '../domain/images-to-pdf.models';
import type { ImagePdfWorkerResponse } from './image-pdf.worker.messages';

export type ImagePdfWorkerFactory = () => Worker;

export class PdfLibImagePdfGeneratorAdapter implements ImagePdfGeneratorPort {
  constructor(private readonly createWorker: ImagePdfWorkerFactory = createImagePdfWorker) {}

  create(
    images: readonly PreparedPdfImage[],
    settings: ImagePdfSettings,
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const worker = this.createWorker();
    return new Promise((resolve, reject) => {
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
      worker.onmessage = ({ data }: MessageEvent<ImagePdfWorkerResponse>) => {
        if (data.type === 'progress') {
          onProgress?.(data.completed, data.total);
          return;
        }
        if (data.type === 'success') {
          finish(() => {
            resolve(data.pdf);
          });
          return;
        }
        finish(() => {
          const error = new Error(data.message);
          error.name = data.name;
          reject(error);
        });
      };
      worker.onerror = (event: ErrorEvent) => {
        finish(() => {
          reject(new Error(event.message || 'The image PDF worker failed.'));
        });
      };
      worker.postMessage({ images: [...images], settings });
    });
  }
}

function createImagePdfWorker(): Worker {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./image-pdf.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('Image PDF creation was cancelled.');
  error.name = 'AbortError';
  return error;
}
