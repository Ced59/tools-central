import type { JsonToTypeScriptDownloadPort } from '../application/json-to-typescript.ports';

export class BrowserJsonToTypeScriptDownloadAdapter implements JsonToTypeScriptDownloadPort {
  download(content: string, filename: string, mediaType: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
