import type { PdfPrivacyFileReaderPort } from '../application/pdf-privacy.ports';

export class BrowserPdfPrivacyFileReaderAdapter implements PdfPrivacyFileReaderPort {
  read(blob: Blob, signal?: AbortSignal): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let settled = false;
      const finish = (callback: () => void): void => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        callback();
      };
      const abort = (): void => {
        if (reader.readyState === FileReader.LOADING) reader.abort();
        finish(() => {
          reject(createAbortError());
        });
      };

      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      reader.onerror = () => {
        finish(() => {
          reject(reader.error ?? new Error('Unable to read the PDF.'));
        });
      };
      reader.onabort = () => {
        finish(() => {
          reject(createAbortError());
        });
      };
      reader.onload = () => {
        finish(() => {
          if (!(reader.result instanceof ArrayBuffer)) {
            reject(new Error('Unexpected PDF reader result.'));
            return;
          }
          resolve(new Uint8Array(reader.result));
        });
      };
      reader.readAsArrayBuffer(blob);
    });
  }
}

function createAbortError(): Error {
  const error = new Error('The PDF read was cancelled.');
  error.name = 'AbortError';
  return error;
}
