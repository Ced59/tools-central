import type { ImageHeaderReaderPort } from '../application/images-to-pdf.ports';
import { inspectRasterImageHeader, type RasterImageHeader } from '../domain/images-to-pdf.models';

const IMAGE_HEADER_SCAN_BYTES = 1024 * 1024;

export class BrowserImageHeaderReaderAdapter implements ImageHeaderReaderPort {
  async inspect(blob: Blob, signal?: AbortSignal): Promise<RasterImageHeader | null> {
    throwIfAborted(signal);
    const header = new Uint8Array(await blob.slice(0, IMAGE_HEADER_SCAN_BYTES).arrayBuffer());
    throwIfAborted(signal);
    return inspectRasterImageHeader(header);
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Image inspection was cancelled.');
  error.name = 'AbortError';
  throw error;
}
