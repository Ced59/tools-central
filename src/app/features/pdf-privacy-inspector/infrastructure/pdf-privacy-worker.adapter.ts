import type { PdfPrivacyInspectorPort } from '../application/pdf-privacy.ports';
import type { PdfPrivacyFailureCode } from '../application/pdf-privacy.use-cases';
import type {
  PdfPrivacyWorkerRequest,
  PdfPrivacyWorkerResponse,
} from './pdf-privacy.worker.messages';

export interface PdfPrivacyWorkerLike {
  onmessage: ((event: MessageEvent<PdfPrivacyWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: PdfPrivacyWorkerRequest, transfer: Transferable[]): void;
  terminate(): void;
}

export type PdfPrivacyWorkerFactory = () => PdfPrivacyWorkerLike;

export class PdfPrivacyWorkerFailure extends Error {
  constructor(readonly code: PdfPrivacyFailureCode) {
    super(code);
  }
}

export class PdfPrivacyWorkerAdapter implements PdfPrivacyInspectorPort {
  constructor(private readonly createWorker: PdfPrivacyWorkerFactory = createPdfPrivacyWorker) {}

  inspect(
    data: Uint8Array,
    password: string | undefined,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): ReturnType<PdfPrivacyInspectorPort['inspect']> {
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
            reject(new PdfPrivacyWorkerFailure(response.code));
          });
          return;
        }
        finish(() => {
          resolve(response.report);
        });
      };
      worker.onerror = event => {
        finish(() => {
          reject(new Error(event.message || 'The PDF privacy worker failed.'));
        });
      };

      const input = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      worker.postMessage({
        type: 'inspect',
        data: input,
        password,
        assetRoot: pdfJsAssetRoot(),
      }, [input]);
    });
  }
}

function createPdfPrivacyWorker(): PdfPrivacyWorkerLike {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./pdf-privacy.worker', import.meta.url), { type: 'module' });
}

function pdfJsAssetRoot(): string {
  if (typeof document === 'undefined') throw new Error('The PDF asset root is only available in a browser.');
  return new URL('/assets/pdfjs/', document.baseURI).toString();
}

function createAbortError(): Error {
  const error = new Error('The PDF privacy inspection was cancelled.');
  error.name = 'AbortError';
  return error;
}
