import type { JsonDiffLocationPort } from '../application/json-diff.ports';

export class BrowserJsonDiffLocationAdapter implements JsonDiffLocationPort {
  publicUrlWithoutData(): string {
    const url = new URL(globalThis.location.href);
    url.search = '';
    url.hash = '';
    return url.toString();
  }
}
