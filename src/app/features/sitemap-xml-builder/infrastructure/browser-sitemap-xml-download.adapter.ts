import type { SitemapXmlDownloadPort } from '../application/sitemap-xml.use-cases';

export class BrowserSitemapXmlDownloadAdapter implements SitemapXmlDownloadPort {
  download(content: string, filename: string): void {
    const objectUrl = URL.createObjectURL(new Blob([content], { type: 'application/xml;charset=utf-8' }));
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
