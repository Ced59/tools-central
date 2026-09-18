import type { JsonDiffClipboardPort } from '../application/json-diff.ports';

export class BrowserJsonDiffClipboardAdapter implements JsonDiffClipboardPort {
  async copy(text: string): Promise<boolean> {
    const navigatorValue = Reflect.get(globalThis, 'navigator') as Navigator | undefined;
    const clipboard = navigatorValue
      ? Reflect.get(navigatorValue, 'clipboard') as Clipboard | undefined
      : undefined;
    if (!clipboard) return false;
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
