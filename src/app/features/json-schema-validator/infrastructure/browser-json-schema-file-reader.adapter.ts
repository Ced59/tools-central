import type { JsonSchemaTextFileReaderPort } from '../application/json-schema-validator.ports';
import { JsonSchemaFileError } from '../application/json-schema-validator.use-cases';

export class BrowserJsonSchemaFileReaderAdapter implements JsonSchemaTextFileReaderPort {
  async read(blob: Blob, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw createAbortError();
    const buffer = await blob.arrayBuffer();
    if (signal?.aborted) throw createAbortError();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new JsonSchemaFileError('invalid-utf8');
    }
  }
}

function createAbortError(): Error {
  const error = new Error('File reading was cancelled.');
  error.name = 'AbortError';
  return error;
}
