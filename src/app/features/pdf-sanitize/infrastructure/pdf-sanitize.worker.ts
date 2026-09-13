import type {
  SanitizePdfCommand,
  SanitizePdfResult,
} from '../application/sanitize-pdf.use-case';
import { sanitizePdfBuffer } from './pdf-sanitize.engine';

type WorkerSuccess = Readonly<{ ok: true; result: SanitizePdfResult }>;
type WorkerFailure = Readonly<{ ok: false; message: string }>;

addEventListener('message', ({ data }: MessageEvent<SanitizePdfCommand>) => {
  void handleMessage(data);
});

async function handleMessage(data: SanitizePdfCommand): Promise<void> {
  try {
    const result = await sanitizePdfBuffer(data);
    const response: WorkerSuccess = { ok: true, result };
    postMessage(response, [result.pdfBytes]);
  } catch (error: unknown) {
    const response: WorkerFailure = {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to sanitize this PDF.',
    };
    postMessage(response);
  }
}
