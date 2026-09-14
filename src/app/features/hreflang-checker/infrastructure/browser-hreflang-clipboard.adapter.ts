import type { HreflangClipboardPort } from '../application/hreflang.use-cases';

export class BrowserHreflangClipboardAdapter implements HreflangClipboardPort {
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
