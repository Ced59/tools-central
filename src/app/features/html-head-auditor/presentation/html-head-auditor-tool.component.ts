import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AuditHtmlHeadUseCase,
  CopyHtmlHeadAuditUseCase,
  DownloadHtmlHeadAuditUseCase,
  type HeadAuditIssueCode,
} from '../application/html-head-audit.use-cases';
import { BrowserHtmlHeadClipboardAdapter } from '../infrastructure/browser-html-head-clipboard.adapter';
import { BrowserHtmlHeadDownloadAdapter } from '../infrastructure/browser-html-head-download.adapter';
import { LocalHtmlHeadParserAdapter } from '../infrastructure/local-html-head-parser.adapter';

@Component({
  selector: 'app-html-head-auditor-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './html-head-auditor-tool.component.html',
  styleUrl: './html-head-auditor-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HtmlHeadAuditorToolComponent {
  private readonly auditUseCase = new AuditHtmlHeadUseCase(new LocalHtmlHeadParserAdapter());
  private readonly copyUseCase = new CopyHtmlHeadAuditUseCase(new BrowserHtmlHeadClipboardAdapter());
  private readonly downloadUseCase = new DownloadHtmlHeadAuditUseCase(new BrowserHtmlHeadDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = createDefaults(this.locale);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly source = signal(this.defaults.source);
  readonly pageUrl = signal(this.defaults.pageUrl);
  readonly audit = signal(this.auditUseCase.execute(this.defaults.source, this.defaults.pageUrl));
  readonly copied = signal(false);
  readonly errorCount = computed(() => this.audit().issues.filter(issue => issue.severity === 'error').length);
  readonly warningCount = computed(() => this.audit().issues.filter(issue => issue.severity === 'warning').length);
  readonly infoCount = computed(() => this.audit().issues.filter(issue => issue.severity === 'info').length);
  readonly openGraphEntries = computed(() => sortedEntries(this.audit().social.openGraph));
  readonly twitterEntries = computed(() => sortedEntries(this.audit().social.twitter));

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearCopiedTimer();
    });
  }

  updateSource(event: Event): void {
    this.source.set(readValue(event).slice(0, 1_000_001));
  }

  updatePageUrl(event: Event): void {
    this.pageUrl.set(readValue(event).slice(0, 2_048));
  }

  analyze(): void {
    this.audit.set(this.auditUseCase.execute(this.source(), this.pageUrl()));
    this.copied.set(false);
  }

  async copyReport(): Promise<void> {
    const copied = await this.copyUseCase.execute(this.audit());
    this.clearCopiedTimer();
    this.copied.set(copied);
    if (copied) {
      this.copiedTimer = setTimeout(() => {
        this.copied.set(false);
      }, 2_000);
    }
  }

  downloadReport(): void {
    this.downloadUseCase.execute(this.audit());
  }

  reset(): void {
    this.source.set(this.defaults.source);
    this.pageUrl.set(this.defaults.pageUrl);
    this.analyze();
  }

  formatNumber(value: number): string {
    return this.formatter.format(value);
  }

  issueLabel(code: HeadAuditIssueCode): string {
    switch (code) {
      case 'source-too-large': return $localize`:@@html_head_issue_source_large:La source dépasse 1 000 000 de caractères et a été tronquée.`;
      case 'empty-source': return $localize`:@@html_head_issue_empty:Collez un document HTML ou le contenu d’un head avant l’analyse.`;
      case 'tag-limit': return $localize`:@@html_head_issue_tag_limit:L’analyse est limitée aux 1 000 premières balises.`;
      case 'parser-unclosed-comment': return $localize`:@@html_head_issue_parser_comment:Un commentaire HTML n’est pas terminé.`;
      case 'parser-unclosed-tag': return $localize`:@@html_head_issue_parser_tag:Une balise HTML n’est pas terminée.`;
      case 'parser-malformed-tag': return $localize`:@@html_head_issue_parser_malformed:Une balise HTML mal formée a été ignorée.`;
      case 'parser-unclosed-title': return $localize`:@@html_head_issue_parser_title:La balise title n’est pas terminée.`;
      case 'parser-unclosed-script': return $localize`:@@html_head_issue_parser_script:Une balise script n’est pas terminée.`;
      case 'parser-unclosed-head': return $localize`:@@html_head_issue_parser_head:La balise head n’est pas terminée.`;
      case 'invalid-page-url': return $localize`:@@html_head_issue_invalid_page_url:L’URL publique doit être une URL HTTP ou HTTPS absolue sans identifiants.`;
      case 'missing-title': return $localize`:@@html_head_issue_missing_title:La balise title est absente.`;
      case 'multiple-title': return $localize`:@@html_head_issue_multiple_title:Plusieurs balises title sont présentes.`;
      case 'empty-title': return $localize`:@@html_head_issue_empty_title:La balise title est vide.`;
      case 'missing-description': return $localize`:@@html_head_issue_missing_description:La meta description est absente.`;
      case 'multiple-description': return $localize`:@@html_head_issue_multiple_description:Plusieurs meta descriptions sont présentes.`;
      case 'empty-description': return $localize`:@@html_head_issue_empty_description:La meta description est vide.`;
      case 'missing-canonical': return $localize`:@@html_head_issue_missing_canonical:Le lien canonical est absent.`;
      case 'multiple-canonical': return $localize`:@@html_head_issue_multiple_canonical:Plusieurs liens canonical sont présents.`;
      case 'invalid-canonical': return $localize`:@@html_head_issue_invalid_canonical:L’URL canonical doit être une URL HTTP ou HTTPS absolue.`;
      case 'canonical-fragment': return $localize`:@@html_head_issue_canonical_fragment:L’URL canonical contient un fragment, ignoré dans le rapport.`;
      case 'canonical-credentials': return $localize`:@@html_head_issue_canonical_credentials:L’URL canonical expose des identifiants.`;
      case 'canonical-different': return $localize`:@@html_head_issue_canonical_different:La canonical diffère de l’URL de page fournie.`;
      case 'robots-conflict': return $localize`:@@html_head_issue_robots_conflict:Des directives robots contradictoires sont déclarées.`;
      case 'page-noindex': return $localize`:@@html_head_issue_noindex:Une directive demande de ne pas indexer cette page.`;
      case 'unknown-robots-directive': return $localize`:@@html_head_issue_unknown_robots:Une directive robots n’est pas reconnue par cet auditeur.`;
      case 'meta-refresh': return $localize`:@@html_head_issue_refresh:Une redirection ou actualisation meta refresh est présente.`;
      case 'missing-viewport': return $localize`:@@html_head_issue_missing_viewport:La meta viewport est absente.`;
      case 'multiple-viewport': return $localize`:@@html_head_issue_multiple_viewport:Plusieurs meta viewport sont présentes.`;
      case 'viewport-not-responsive': return $localize`:@@html_head_issue_viewport_responsive:La meta viewport ne déclare pas width=device-width.`;
      case 'missing-charset': return $localize`:@@html_head_issue_missing_charset:L’encodage du document n’est pas déclaré dans le head.`;
      case 'multiple-charset': return $localize`:@@html_head_issue_multiple_charset:Plusieurs déclarations d’encodage sont présentes.`;
      case 'non-utf8-charset': return $localize`:@@html_head_issue_non_utf8:L’encodage déclaré n’est pas UTF-8.`;
      case 'duplicate-hreflang': return $localize`:@@html_head_issue_duplicate_hreflang:Une langue hreflang est déclarée plusieurs fois.`;
      case 'invalid-hreflang-url': return $localize`:@@html_head_issue_invalid_hreflang_url:Une URL hreflang n’est pas une URL HTTP ou HTTPS absolue sans fragment.`;
      case 'invalid-hreflang-code': return $localize`:@@html_head_issue_invalid_hreflang_code:Un code de langue hreflang est invalide.`;
      case 'missing-hreflang-self': return $localize`:@@html_head_issue_hreflang_self:Le groupe hreflang ne contient pas d’auto-référence vers l’URL fournie.`;
      case 'missing-open-graph-property': return $localize`:@@html_head_issue_missing_og:Une propriété Open Graph de base est absente.`;
      case 'invalid-open-graph-url': return $localize`:@@html_head_issue_invalid_og_url:La propriété og:url n’est pas une URL HTTP ou HTTPS absolue.`;
      case 'open-graph-url-mismatch': return $localize`:@@html_head_issue_og_mismatch:La propriété og:url diffère de la canonical.`;
      case 'missing-twitter-card': return $localize`:@@html_head_issue_missing_twitter_card:Les métadonnées Twitter sont présentes sans twitter:card.`;
      case 'unknown-twitter-card': return $localize`:@@html_head_issue_unknown_twitter_card:Le type twitter:card n’est pas reconnu.`;
      case 'base-element': return $localize`:@@html_head_issue_base:Une balise base peut modifier la résolution des URL relatives.`;
      case 'issues-truncated': return $localize`:@@html_head_issue_truncated:La liste est limitée aux 200 premiers diagnostics.`;
    }
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}

function sortedEntries(source: Partial<Record<string, string[]>>): Array<{ key: string; values: string[] }> {
  return Object.entries(source)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, values]) => ({ key, values: values ?? [] }));
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function createDefaults(locale: string): { source: string; pageUrl: string } {
  const normalizedLocale = locale.replaceAll('_', '-');
  const hreflangLocale = normalizedLocale.toLowerCase() === 'fil' ? 'tl' : normalizedLocale;
  const alternateLocale = hreflangLocale.toLowerCase().startsWith('en') ? 'fr' : 'en';
  const pageUrl = `https://example.com/${normalizedLocale}/guide`;
  const title = $localize`:@@html_head_example_title:Guide pratique pour auditer un head HTML`;
  const description = $localize`:@@html_head_example_description:Un exemple complet pour contrôler les métadonnées essentielles d’une page web.`;
  return {
    pageUrl,
    source: `<!doctype html>
<html lang="${escapeHtmlAttribute(normalizedLocale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtmlText(title)}</title>
  <meta name="description" content="${escapeHtmlAttribute(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="${escapeHtmlAttribute(hreflangLocale)}" href="${pageUrl}">
  <link rel="alternate" hreflang="${alternateLocale}" href="https://example.com/${alternateLocale}/guide">
  <meta property="og:title" content="${escapeHtmlAttribute(title)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://example.com/images/guide.jpg">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
</head>
</html>`,
  };
}

function escapeHtmlText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtmlText(value).replaceAll('"', '&quot;');
}
