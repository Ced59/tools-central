import type { HtmlHeadClipboardPort } from '../application/html-head-audit.use-cases';

export class BrowserHtmlHeadClipboardAdapter implements HtmlHeadClipboardPort {
  async copy(text: string): Promise<boolean> {
    if (!text || typeof navigator === 'undefined') return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
