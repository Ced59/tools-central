import type { JsonSchemaLocationPort } from '../application/json-schema-validator.ports';

export class BrowserJsonSchemaLocationAdapter implements JsonSchemaLocationPort {
  publicUrlWithoutData(): string {
    return `${window.location.origin}${window.location.pathname}`;
  }
}
