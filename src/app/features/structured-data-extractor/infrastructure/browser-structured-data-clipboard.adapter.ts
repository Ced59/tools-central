import type { StructuredDataClipboardPort } from '../application/structured-data.use-cases';

export class BrowserStructuredDataClipboardAdapter implements StructuredDataClipboardPort {
  async copy(text: string): Promise<boolean> {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
