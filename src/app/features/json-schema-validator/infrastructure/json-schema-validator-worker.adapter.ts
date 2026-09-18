import type { JsonSchemaValidatorPort } from '../application/json-schema-validator.ports';
import type {
  JsonSchemaValidationOptions,
  JsonSchemaValidationResult,
} from '../domain/json-schema-validator.models';
import type {
  JsonSchemaValidatorWorkerRequest,
  JsonSchemaValidatorWorkerResponse,
} from './json-schema-validator.worker.messages';

export interface JsonSchemaValidatorWorkerLike {
  onmessage: ((event: MessageEvent<JsonSchemaValidatorWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  readonly postMessage: (message: JsonSchemaValidatorWorkerRequest) => void;
  readonly terminate: () => void;
}

export type JsonSchemaValidatorWorkerFactory = () => JsonSchemaValidatorWorkerLike;

export class JsonSchemaValidatorWorkerAdapter implements JsonSchemaValidatorPort {
  constructor(
    private readonly createWorker: JsonSchemaValidatorWorkerFactory = createJsonSchemaValidatorWorker,
  ) {}

  validate(
    schema: string,
    instance: string,
    options: JsonSchemaValidationOptions,
    signal?: AbortSignal,
  ): Promise<JsonSchemaValidationResult> {
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
          reject(new Error(event.message || 'JSON Schema validation failed.'));
        });
      };
      worker.postMessage({ schema, instance, options });
    });
  }
}

function createJsonSchemaValidatorWorker(): JsonSchemaValidatorWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./json-schema-validator.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('JSON Schema validation was cancelled.');
  error.name = 'AbortError';
  return error;
}
