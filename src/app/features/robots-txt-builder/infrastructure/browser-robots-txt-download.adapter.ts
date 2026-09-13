import type { RobotsTxtDownloadPort } from '../application/robots-txt.use-cases';

export class BrowserRobotsTxtDownloadAdapter implements RobotsTxtDownloadPort {
  download(content: string, filename: string): void {
    const objectUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
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
