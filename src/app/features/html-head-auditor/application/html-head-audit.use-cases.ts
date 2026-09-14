import {
  auditHtmlHead,
  HTML_HEAD_MAX_SOURCE_CHARACTERS,
  serializeHtmlHeadAudit,
  type ExtractedHeadSnapshot,
  type HtmlHeadAudit,
} from '../domain/html-head-audit';

export type {
  ExtractedHeadSnapshot,
  ExtractedLinkTag,
  ExtractedMetaTag,
  HeadAlternate,
  HeadAuditIssue,
  HeadAuditIssueCode,
  HeadAuditSeverity,
  HeadSocialSummary,
  HtmlHeadAudit,
} from '../domain/html-head-audit';

export interface HtmlHeadParserPort {
  extract(source: string): ExtractedHeadSnapshot;
}

export interface HtmlHeadClipboardPort {
  copy(text: string): Promise<boolean>;
}

export interface HtmlHeadDownloadPort {
  download(content: string, filename: string, mediaType: string): void;
}

export class AuditHtmlHeadUseCase {
  constructor(private readonly parser: HtmlHeadParserPort) {}

  execute(source: string, pageUrl = ''): HtmlHeadAudit {
    const normalized = source.trim();
    const truncated = normalized.length > HTML_HEAD_MAX_SOURCE_CHARACTERS;
    const extraction = this.parser.extract(normalized.slice(0, HTML_HEAD_MAX_SOURCE_CHARACTERS));
    return auditHtmlHead({
      ...extraction,
      sourceLength: normalized.length,
      truncated,
    }, pageUrl.trim().slice(0, 2_048));
  }
}

export class CopyHtmlHeadAuditUseCase {
  constructor(private readonly clipboard: HtmlHeadClipboardPort) {}

  execute(audit: HtmlHeadAudit): Promise<boolean> {
    return this.clipboard.copy(serializeHtmlHeadAudit(audit));
  }
}

export class DownloadHtmlHeadAuditUseCase {
  constructor(private readonly downloadPort: HtmlHeadDownloadPort) {}

  execute(audit: HtmlHeadAudit): void {
    this.downloadPort.download(
      serializeHtmlHeadAudit(audit),
      'html-head-audit.json',
      'application/json;charset=utf-8',
    );
  }
}
