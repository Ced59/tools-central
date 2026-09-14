import JSZip from 'jszip';

import type { PdfImageArchiveEntry } from '../application/pdf-to-images.ports';

export async function createPdfImageArchive(
  entries: readonly PdfImageArchiveEntry[],
): Promise<Uint8Array> {
  const archive = new JSZip();
  for (const entry of entries) archive.file(entry.fileName, entry.bytes);
  return archive.generateAsync({ type: 'uint8array', compression: 'STORE', streamFiles: true });
}
