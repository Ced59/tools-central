import type { JsonSchemaDownloadPort } from '../application/json-schema-validator.ports';

export class BrowserJsonSchemaDownloadAdapter implements JsonSchemaDownloadPort {
  download(value: string, fileName: string, mimeType: string): void {
    const url = URL.createObjectURL(new Blob([value], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
