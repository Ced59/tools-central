import type { HreflangDownloadPort } from '../application/hreflang.use-cases';

export class BrowserHreflangDownloadAdapter implements HreflangDownloadPort {
  download(content: string, filename: string, mediaType: string): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
