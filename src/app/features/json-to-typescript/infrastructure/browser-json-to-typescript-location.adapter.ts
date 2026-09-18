import type { JsonToTypeScriptLocationPort } from '../application/json-to-typescript.ports';

export class BrowserJsonToTypeScriptLocationAdapter implements JsonToTypeScriptLocationPort {
  currentUrlWithoutQueryOrFragment(): string {
    return `${window.location.origin}${window.location.pathname}`;
  }
}
