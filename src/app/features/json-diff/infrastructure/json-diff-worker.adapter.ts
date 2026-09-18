import type { JsonDiffComparatorPort } from '../application/json-diff.ports';
import type { JsonDiffOptions, JsonDiffResult } from '../domain/json-diff.models';
import type { JsonDiffWorkerRequest, JsonDiffWorkerResponse } from './json-diff.worker.messages';

export interface JsonDiffWorkerLike {
  onmessage: ((event: MessageEvent<JsonDiffWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  readonly postMessage: (message: JsonDiffWorkerRequest) => void;
  readonly terminate: () => void;
}

export type JsonDiffWorkerFactory = () => JsonDiffWorkerLike;

export class JsonDiffWorkerAdapter implements JsonDiffComparatorPort {
  constructor(private readonly createWorker: JsonDiffWorkerFactory = createJsonDiffWorker) {}

  compare(
    left: string,
    right: string,
    options: JsonDiffOptions,
    signal?: AbortSignal,
  ): Promise<JsonDiffResult> {
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
      worker.onmessage = ({ data }) => {
        if (data.type === 'failure') {
          finish(() => {
            reject(new Error(data.message));
          });
          return;
        }
        finish(() => {
          resolve(data.result);
        });
      };
      worker.onerror = event => {
        finish(() => {
          reject(new Error(event.message || 'JSON comparison failed.'));
        });
      };
      worker.postMessage({ left, right, options });
    });
  }
}

function createJsonDiffWorker(): JsonDiffWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./json-diff.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('JSON comparison was cancelled.');
  error.name = 'AbortError';
  return error;
}
