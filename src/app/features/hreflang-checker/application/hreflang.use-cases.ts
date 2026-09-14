import {
  analyzeHreflangAudit,
  analyzeHreflangSet,
  generateHreflangOutputs,
  type HreflangAudit,
  type HreflangOutputs,
  type HreflangSetAnalysis,
} from '../domain/hreflang';

export type {
  HreflangAudit,
  HreflangAuditPage,
  HreflangEntry,
  HreflangIssue,
  HreflangIssueCode,
  HreflangIssueSeverity,
  HreflangOutputs,
  HreflangSetAnalysis,
} from '../domain/hreflang';

export type HreflangOutputFormat = keyof HreflangOutputs;

export class AnalyzeHreflangSetUseCase {
  execute(currentUrl: string, source: string): HreflangSetAnalysis {
    return analyzeHreflangSet(currentUrl, source);
  }
}

export class GenerateHreflangOutputsUseCase {
  execute(analysis: HreflangSetAnalysis): HreflangOutputs {
    return generateHreflangOutputs(analysis);
  }
}

export class AuditHreflangReciprocityUseCase {
  execute(source: string): HreflangAudit {
    return analyzeHreflangAudit(source);
  }
}

export interface HreflangClipboardPort {
  copy(text: string): Promise<boolean>;
}

export interface HreflangDownloadPort {
  download(content: string, filename: string, mediaType: string): void;
}

export class CopyHreflangOutputUseCase {
  constructor(private readonly clipboard: HreflangClipboardPort) {}

  execute(content: string): Promise<boolean> {
    return content ? this.clipboard.copy(content) : Promise.resolve(false);
  }
}

export class DownloadHreflangOutputUseCase {
  constructor(private readonly downloadPort: HreflangDownloadPort) {}

  execute(format: HreflangOutputFormat, content: string): void {
    if (!content) return;
    const files: Record<HreflangOutputFormat, { filename: string; mediaType: string }> = {
      html: { filename: 'hreflang-tags.html', mediaType: 'text/html;charset=utf-8' },
      httpHeader: { filename: 'hreflang-link-header.txt', mediaType: 'text/plain;charset=utf-8' },
      sitemapXml: { filename: 'hreflang-sitemap-fragment.xml', mediaType: 'application/xml;charset=utf-8' },
    };
    const file = files[format];
    this.downloadPort.download(content, file.filename, file.mediaType);
  }
}
