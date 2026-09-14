import type { OoxmlMetadataCleanerPort } from '../application/ooxml-metadata-cleaner.ports';
import type { OoxmlMetadataFailureCode } from '../application/ooxml-metadata-cleaner.use-cases';
import type {
  OoxmlMetadataWorkerRequest,
  OoxmlMetadataWorkerResponse,
} from './ooxml-metadata.worker.messages';
import type { OoxmlDocumentKind } from '../domain/ooxml-metadata.models';

export interface OoxmlMetadataWorkerLike {
  onmessage: ((event: MessageEvent<OoxmlMetadataWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: OoxmlMetadataWorkerRequest, transfer: Transferable[]): void;
  terminate(): void;
}

export type OoxmlMetadataWorkerFactory = () => OoxmlMetadataWorkerLike;

export class OoxmlMetadataWorkerFailure extends Error {
  constructor(readonly code: OoxmlMetadataFailureCode, readonly entryName?: string) {
    super(code);
  }
}

export class OoxmlMetadataWorkerAdapter implements OoxmlMetadataCleanerPort {
  constructor(private readonly createWorker: OoxmlMetadataWorkerFactory = createMetadataWorker) {}

  clean(
    data: Uint8Array,
    kind: OoxmlDocumentKind,
    options: Parameters<OoxmlMetadataCleanerPort['clean']>[2],
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): ReturnType<OoxmlMetadataCleanerPort['clean']> {
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
      worker.onmessage = ({ data: response }) => {
        if (response.type === 'progress') {
          onProgress?.(Math.max(0, Math.min(100, response.percent)));
          return;
        }
        if (response.type === 'failure') {
          finish(() => {
            reject(new OoxmlMetadataWorkerFailure(response.code, response.entryName));
          });
          return;
        }
        finish(() => {
          resolve({
            blob: new Blob([response.output], { type: mimeType(kind) }),
            report: response.report,
          });
        });
      };
      worker.onerror = event => {
        finish(() => {
          reject(new Error(event.message || 'The OOXML worker failed.'));
        });
      };

      const input = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      worker.postMessage({ type: 'clean', data: input, kind, options }, [input]);
    });
  }
}

function createMetadataWorker(): OoxmlMetadataWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./ooxml-metadata.worker', import.meta.url), { type: 'module' });
}

function mimeType(kind: OoxmlDocumentKind): string {
  if (kind === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (kind === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
}

function createAbortError(): Error {
  const error = new Error('The metadata cleaning was cancelled.');
  error.name = 'AbortError';
  return error;
}
