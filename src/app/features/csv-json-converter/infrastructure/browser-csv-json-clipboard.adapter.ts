import type { CsvJsonClipboardPort } from '../application/csv-json.ports';

export class BrowserCsvJsonClipboardAdapter implements CsvJsonClipboardPort {
  async copy(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
