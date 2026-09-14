import type { SoftwareApplicationSchemaClipboardPort } from '../application/software-application-schema.use-cases';

export class BrowserSoftwareApplicationSchemaClipboardAdapter implements SoftwareApplicationSchemaClipboardPort {
  async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
