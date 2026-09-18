import type { CsvJsonConverterPort } from '../application/csv-json.ports';
import type {
  CsvJsonConversionOptions,
  CsvJsonConversionResult,
} from '../domain/csv-json.models';
import type { CsvJsonWorkerResponse } from './csv-json.worker.messages';

export interface CsvJsonWorkerLike {
  onmessage: ((event: MessageEvent<CsvJsonWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: { source: string; options: CsvJsonConversionOptions }): void;
  terminate(): void;
}

export type CsvJsonWorkerFactory = () => CsvJsonWorkerLike;

export class CsvJsonWorkerAdapter implements CsvJsonConverterPort {
  constructor(private readonly createWorker: CsvJsonWorkerFactory = createCsvJsonWorker) {}

  convert(
    source: string,
    options: CsvJsonConversionOptions,
    signal?: AbortSignal,
  ): Promise<CsvJsonConversionResult> {
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
          reject(new Error(event.message || 'CSV/JSON conversion failed.'));
        });
      };
      worker.postMessage({ source, options });
    });
  }
}

function createCsvJsonWorker(): CsvJsonWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./csv-json.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('CSV/JSON conversion was cancelled.');
  error.name = 'AbortError';
  return error;
}
