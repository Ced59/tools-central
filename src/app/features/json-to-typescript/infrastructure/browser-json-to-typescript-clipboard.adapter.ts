import type { JsonToTypeScriptClipboardPort } from '../application/json-to-typescript.ports';

export class BrowserJsonToTypeScriptClipboardAdapter implements JsonToTypeScriptClipboardPort {
  async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
