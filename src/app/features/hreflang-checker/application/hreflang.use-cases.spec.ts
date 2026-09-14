import { describe, expect, it, vi } from 'vitest';

import {
  AnalyzeHreflangSetUseCase,
  AuditHreflangReciprocityUseCase,
  CopyHreflangOutputUseCase,
  DownloadHreflangOutputUseCase,
  GenerateHreflangOutputsUseCase,
  type HreflangClipboardPort,
  type HreflangDownloadPort,
} from './hreflang.use-cases';

describe('hreflang use cases', () => {
  it('orchestrates generation from a validated set', () => {
    const analysis = new AnalyzeHreflangSetUseCase().execute(
      'https://example.com/fr',
      'fr | https://example.com/fr\nx-default | https://example.com/',
    );

    expect(new GenerateHreflangOutputsUseCase().execute(analysis).html).toContain('hreflang="fr"');
  });

  it('orchestrates a reciprocity audit', () => {
    const audit = new AuditHreflangReciprocityUseCase().execute(
      'PAGE https://example.com/fr | https://example.com/fr\nfr | https://example.com/fr',
    );

    expect(audit.pages).toHaveLength(1);
  });

  it('copies only non-empty output', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const clipboard: HreflangClipboardPort = { copy };
    const useCase = new CopyHreflangOutputUseCase(clipboard);

    await expect(useCase.execute('tags')).resolves.toBe(true);
    await expect(useCase.execute('')).resolves.toBe(false);
    expect(copy).toHaveBeenCalledTimes(1);
  });

  it('downloads the selected format with a stable file type', () => {
    const download = vi.fn();
    const downloadPort: HreflangDownloadPort = { download };
    const useCase = new DownloadHreflangOutputUseCase(downloadPort);

    useCase.execute('sitemapXml', '<url />');

    expect(download).toHaveBeenCalledWith(
      '<url />',
      'hreflang-sitemap-fragment.xml',
      'application/xml;charset=utf-8',
    );
  });
});
