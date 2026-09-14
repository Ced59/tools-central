import type { PdfImageDownloadPort } from '../application/pdf-to-images.ports';

export class BrowserPdfImageDownloadAdapter implements PdfImageDownloadPort {
  download(bytes: Uint8Array, mimeType: string, fileName: string): void {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const url = URL.createObjectURL(new Blob([copy.buffer], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }
}
