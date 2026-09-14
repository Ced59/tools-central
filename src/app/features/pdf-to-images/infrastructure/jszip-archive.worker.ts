import type {
  JsZipArchiveWorkerCommand,
  JsZipArchiveWorkerResponse,
} from './jszip-archive.messages';
import { createPdfImageArchive } from './jszip-archive.engine';

addEventListener('message', ({ data }: MessageEvent<JsZipArchiveWorkerCommand>) => {
  void createArchive(data);
});

async function createArchive(command: JsZipArchiveWorkerCommand): Promise<void> {
  try {
    const bytes = await createPdfImageArchive(command.entries.map(entry => ({
      fileName: entry.fileName,
      bytes: new Uint8Array(entry.bytes),
    })));
    const response: JsZipArchiveWorkerResponse = { ok: true, bytes: bytes.buffer as ArrayBuffer };
    postMessage(response, [response.bytes]);
  } catch (error: unknown) {
    const response: JsZipArchiveWorkerResponse = {
      ok: false,
      message: error instanceof Error ? error.message : 'The ZIP worker failed.',
    };
    postMessage(response);
  }
}
