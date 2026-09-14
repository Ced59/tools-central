import type { SoftwareApplicationSchemaDownloadPort } from '../application/software-application-schema.use-cases';

export class BrowserSoftwareApplicationSchemaDownloadAdapter implements SoftwareApplicationSchemaDownloadPort {
  download(content: string, filename: string, mediaType: string): void {
    const objectUrl = URL.createObjectURL(new Blob([content], { type: mediaType }));
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 0);
  }
}
