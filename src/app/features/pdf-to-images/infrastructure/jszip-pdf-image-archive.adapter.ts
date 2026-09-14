import type { PdfImageArchiveEntry, PdfImageArchivePort } from '../application/pdf-to-images.ports';
import type { JsZipArchiveWorkerResponse } from './jszip-archive.messages';

export type JsZipArchiveWorkerFactory = () => Worker;

export class JsZipPdfImageArchiveAdapter implements PdfImageArchivePort {
  constructor(private readonly createWorker: JsZipArchiveWorkerFactory = createArchiveWorker) {}

  create(entries: readonly PdfImageArchiveEntry[], signal?: AbortSignal): Promise<Uint8Array> {
    const worker = this.createWorker();
    const transferableEntries = entries.map(entry => ({
      fileName: entry.fileName,
      bytes: entry.bytes.slice().buffer,
    }));
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
      worker.onmessage = ({ data }: MessageEvent<JsZipArchiveWorkerResponse>) => {
        if (data.ok) {
          finish(() => {
            resolve(new Uint8Array(data.bytes));
          });
        } else {
          finish(() => {
            reject(new Error(data.message));
          });
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        finish(() => {
          reject(new Error(event.message || 'The ZIP worker failed.'));
        });
      };
      worker.postMessage({ entries: transferableEntries }, transferableEntries.map(entry => entry.bytes));
    });
  }
}

function createArchiveWorker(): Worker {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./jszip-archive.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('The ZIP creation was cancelled.');
  error.name = 'AbortError';
  return error;
}
