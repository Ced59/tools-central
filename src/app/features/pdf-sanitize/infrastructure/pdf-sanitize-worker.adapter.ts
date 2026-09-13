import type {
  PdfSanitizerPort,
  SanitizePdfCommand,
  SanitizePdfResult,
} from '../application/sanitize-pdf.use-case';

type WorkerResponse =
  | Readonly<{ ok: true; result: SanitizePdfResult }>
  | Readonly<{ ok: false; message: string }>;

export class PdfSanitizeWorkerAdapter implements PdfSanitizerPort {
  sanitize(command: SanitizePdfCommand): Promise<SanitizePdfResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./pdf-sanitize.worker', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        worker.terminate();
        if (data.ok) {
          resolve(data.result);
        } else {
          reject(new Error(data.message));
        }
      };

      worker.onerror = (event: ErrorEvent) => {
        worker.terminate();
        reject(new Error(event.message || 'The PDF worker failed.'));
      };

      worker.postMessage(command, [command.pdfBytes]);
    });
  }
}
