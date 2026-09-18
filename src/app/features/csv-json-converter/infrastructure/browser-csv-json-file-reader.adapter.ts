import {
  CsvJsonValidationError,
} from '../application/csv-json.use-cases';
import type { CsvJsonTextFileReaderPort } from '../application/csv-json.ports';

export class BrowserCsvJsonFileReaderAdapter implements CsvJsonTextFileReaderPort {
  async read(blob: Blob, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw createAbortError();
    const bytes = await blob.arrayBuffer();
    if (signal?.aborted) throw createAbortError();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new CsvJsonValidationError('invalid-utf8');
    }
  }
}

function createAbortError(): Error {
  const error = new Error('File reading was cancelled.');
  error.name = 'AbortError';
  return error;
}
