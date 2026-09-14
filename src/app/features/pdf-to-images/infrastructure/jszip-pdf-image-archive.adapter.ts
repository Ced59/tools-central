import type { PdfImageArchiveEntry, PdfImageArchivePort } from '../application/pdf-to-images.ports';

export class JsZipPdfImageArchiveAdapter implements PdfImageArchivePort {
  async create(entries: readonly PdfImageArchiveEntry[]): Promise<Uint8Array> {
    const { default: JSZip } = await import('jszip');
    const archive = new JSZip();
    for (const entry of entries) archive.file(entry.fileName, entry.bytes);
    return archive.generateAsync({ type: 'uint8array', compression: 'STORE', streamFiles: true });
  }
}
