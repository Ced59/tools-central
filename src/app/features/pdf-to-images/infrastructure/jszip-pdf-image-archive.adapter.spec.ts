import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { JsZipPdfImageArchiveAdapter } from './jszip-pdf-image-archive.adapter';

describe('JsZipPdfImageArchiveAdapter', () => {
  it('archives every rendered image under its safe file name', async () => {
    const bytes = await new JsZipPdfImageArchiveAdapter().create([
      { fileName: 'page-01.png', bytes: new Uint8Array([1, 2, 3]) },
      { fileName: 'page-02.webp', bytes: new Uint8Array([4, 5]) },
    ]);
    const archive = await JSZip.loadAsync(bytes);

    await expect(archive.file('page-01.png')?.async('uint8array'))
      .resolves.toEqual(new Uint8Array([1, 2, 3]));
    await expect(archive.file('page-02.webp')?.async('uint8array'))
      .resolves.toEqual(new Uint8Array([4, 5]));
  });
});
