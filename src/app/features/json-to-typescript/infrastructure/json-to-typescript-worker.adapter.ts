import type { JsonToTypeScriptGeneratorPort } from '../application/json-to-typescript.ports';
import type {
  JsonToTypeScriptOptions,
  JsonToTypeScriptResult,
} from '../domain/json-to-typescript.models';
import type { JsonToTypeScriptWorkerResponse } from './json-to-typescript.worker.messages';

const WORKER_DEADLINE_MS = 5_000;

export interface JsonToTypeScriptWorkerLike {
  onmessage: ((event: MessageEvent<JsonToTypeScriptWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: { source: string; options: JsonToTypeScriptOptions }): void;
  terminate(): void;
}

export type JsonToTypeScriptWorkerFactory = () => JsonToTypeScriptWorkerLike;

export class JsonToTypeScriptWorkerAdapter implements JsonToTypeScriptGeneratorPort {
  constructor(
    private readonly createWorker: JsonToTypeScriptWorkerFactory = createJsonToTypeScriptWorker,
  ) {}

  generate(
    source: string,
    options: JsonToTypeScriptOptions,
    signal?: AbortSignal,
  ): Promise<JsonToTypeScriptResult> {
    const worker = this.createWorker();
    return new Promise((resolve, reject) => {
      let settled = false;
      const deadline = setTimeout(() => {
        finish(() => {
          reject(new Error('JSON to TypeScript generation timed out.'));
        });
      }, WORKER_DEADLINE_MS);
      const finish = (callback: () => void): void => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
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
          reject(new Error(event.message || 'JSON to TypeScript generation failed.'));
        });
      };
      worker.postMessage({ source, options });
    });
  }
}

function createJsonToTypeScriptWorker(): JsonToTypeScriptWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./json-to-typescript.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('JSON to TypeScript generation was cancelled.');
  error.name = 'AbortError';
  return error;
}
