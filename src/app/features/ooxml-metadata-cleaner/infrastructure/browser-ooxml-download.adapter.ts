import type { OoxmlMetadataDownloadPort } from '../application/ooxml-metadata-cleaner.ports';
import type { OoxmlDocumentKind } from '../domain/ooxml-metadata.models';

export class BrowserOoxmlDownloadAdapter implements OoxmlMetadataDownloadPort {
  download(bytes: Uint8Array, kind: OoxmlDocumentKind, fileName: string): void {
    const output = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([output], { type: mimeType(kind) });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    queueMicrotask(() => {
      URL.revokeObjectURL(url);
    });
  }
}

function mimeType(kind: OoxmlDocumentKind): string {
  if (kind === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (kind === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
}
