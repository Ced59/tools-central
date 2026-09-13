import {
  analyzeSitemapXml,
  generateSitemapXml,
  type SitemapBuilderSettings,
  type SitemapDocument,
  type SitemapGeneration,
  type SitemapKind,
} from '../domain/sitemap-xml';

export type {
  SitemapBuilderSettings,
  SitemapDocument,
  SitemapEntry,
  SitemapGeneration,
  SitemapIssue,
  SitemapIssueCode,
  SitemapIssueSeverity,
  SitemapKind,
} from '../domain/sitemap-xml';

export class GenerateSitemapXmlUseCase {
  execute(settings: SitemapBuilderSettings): SitemapGeneration {
    return generateSitemapXml(settings);
  }
}

export class AnalyzeSitemapXmlUseCase {
  execute(source: string, sitemapUrl: string, todayIso: string): SitemapDocument {
    return analyzeSitemapXml(source, sitemapUrl, todayIso);
  }
}

export interface SitemapXmlDownloadPort {
  download(content: string, filename: string): void;
}

export class DownloadSitemapXmlUseCase {
  constructor(private readonly downloadPort: SitemapXmlDownloadPort) {}

  execute(content: string, kind: SitemapKind): void {
    if (!content.trim()) return;
    this.downloadPort.download(content, kind === 'sitemapindex' ? 'sitemap-index.xml' : 'sitemap.xml');
  }
}
