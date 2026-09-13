import { describe, expect, it } from 'vitest';

import {
  AnalyzeSitemapXmlUseCase,
  DownloadSitemapXmlUseCase,
  GenerateSitemapXmlUseCase,
  type SitemapXmlDownloadPort,
} from './sitemap-xml.use-cases';

describe('sitemap XML use cases', () => {
  it('keeps generation and analysis behind application boundaries', () => {
    const generated = new GenerateSitemapXmlUseCase().execute({
      kind: 'urlset',
      siteUrl: 'https://example.com',
      lines: ['/', '/guide | 2026-09-01'],
      todayIso: '2026-09-13',
    });
    const document = new AnalyzeSitemapXmlUseCase().execute(
      generated.content,
      'https://example.com/sitemap.xml',
      '2026-09-13',
    );

    expect(generated.siteValid).toBe(true);
    expect(document.issues).toEqual([]);
    expect(document.entries).toHaveLength(2);
  });

  it('delegates downloads with a filename matching the document kind', () => {
    const calls: Array<{ content: string; filename: string }> = [];
    const port: SitemapXmlDownloadPort = {
      download: (content, filename) => calls.push({ content, filename }),
    };
    const useCase = new DownloadSitemapXmlUseCase(port);

    useCase.execute('<urlset/>', 'urlset');
    useCase.execute('<sitemapindex/>', 'sitemapindex');
    useCase.execute('   ', 'urlset');

    expect(calls).toEqual([
      { content: '<urlset/>', filename: 'sitemap.xml' },
      { content: '<sitemapindex/>', filename: 'sitemap-index.xml' },
    ]);
  });
});
