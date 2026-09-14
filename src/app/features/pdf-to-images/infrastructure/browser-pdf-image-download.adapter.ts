import type { PdfImageDownloadPort } from '../application/pdf-to-images.ports';

export class BrowserPdfImageDownloadAdapter implements PdfImageDownloadPort {
  download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }
}
