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
    const bytes = await createPdfImageArchive(command.entries);
    const response: JsZipArchiveWorkerResponse = {
      ok: true,
      blob: new Blob([bytes], { type: 'application/zip' }),
    };
    postMessage(response);
  } catch (error: unknown) {
    const response: JsZipArchiveWorkerResponse = {
      ok: false,
      message: error instanceof Error ? error.message : 'The ZIP worker failed.',
    };
    postMessage(response);
  }
}
