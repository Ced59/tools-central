import type { JsonSchemaClipboardPort } from '../application/json-schema-validator.ports';

export class BrowserJsonSchemaClipboardAdapter implements JsonSchemaClipboardPort {
  async copy(value: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }
}
