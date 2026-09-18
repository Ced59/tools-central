import type { JsonDiffTextFileReaderPort } from '../application/json-diff.ports';
import { JsonDiffFileError } from '../application/json-diff.use-cases';

export class BrowserJsonDiffFileReaderAdapter implements JsonDiffTextFileReaderPort {
  async read(blob: Blob, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw createAbortError();
    const buffer = await blob.arrayBuffer();
    if (signal?.aborted) throw createAbortError();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new JsonDiffFileError('invalid-utf8');
    }
  }
}

function createAbortError(): Error {
  const error = new Error('File reading was cancelled.');
  error.name = 'AbortError';
  return error;
}
