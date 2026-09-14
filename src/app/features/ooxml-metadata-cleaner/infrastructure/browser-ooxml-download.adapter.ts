import type { OoxmlMetadataDownloadPort } from '../application/ooxml-metadata-cleaner.ports';

export class BrowserOoxmlDownloadAdapter implements OoxmlMetadataDownloadPort {
  download(blob: Blob, fileName: string): void {
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
