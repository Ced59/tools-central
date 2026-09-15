import type { PdfPrivacyReportDownloadPort } from '../application/pdf-privacy.ports';

export class BrowserPdfPrivacyReportDownloadAdapter implements PdfPrivacyReportDownloadPort {
  download(json: string, fileName: string): void {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
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
