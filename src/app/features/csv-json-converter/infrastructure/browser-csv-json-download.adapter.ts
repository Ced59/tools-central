import type { CsvJsonDownloadPort } from '../application/csv-json.ports';

export class BrowserCsvJsonDownloadAdapter implements CsvJsonDownloadPort {
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
