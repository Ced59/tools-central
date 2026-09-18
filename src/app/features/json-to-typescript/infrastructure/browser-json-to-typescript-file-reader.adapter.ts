import type { JsonToTypeScriptTextFileReaderPort } from '../application/json-to-typescript.ports';
import { JsonToTypeScriptFileError } from '../application/json-to-typescript.use-cases';

export class BrowserJsonToTypeScriptFileReaderAdapter implements JsonToTypeScriptTextFileReaderPort {
  async read(blob: Blob, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw createAbortError();
    const buffer = await blob.arrayBuffer();
    if (signal?.aborted) throw createAbortError();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new JsonToTypeScriptFileError('invalid-utf8');
    }
  }
}

function createAbortError(): Error {
  const error = new Error('File reading was cancelled.');
  error.name = 'AbortError';
  return error;
}
