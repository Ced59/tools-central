import type { StructuredDataDownloadPort } from '../application/structured-data.use-cases';

export class BrowserStructuredDataDownloadAdapter implements StructuredDataDownloadPort {
  download(content: string, filename: string, mediaType: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
