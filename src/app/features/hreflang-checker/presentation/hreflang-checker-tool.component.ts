import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AnalyzeHreflangSetUseCase,
  AuditHreflangReciprocityUseCase,
  CopyHreflangOutputUseCase,
  DownloadHreflangOutputUseCase,
  GenerateHreflangOutputsUseCase,
  type HreflangIssueCode,
  type HreflangOutputFormat,
} from '../application/hreflang.use-cases';
import { BrowserHreflangClipboardAdapter } from '../infrastructure/browser-hreflang-clipboard.adapter';
import { BrowserHreflangDownloadAdapter } from '../infrastructure/browser-hreflang-download.adapter';

@Component({
  selector: 'app-hreflang-checker-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hreflang-checker-tool.component.html',
  styleUrl: './hreflang-checker-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HreflangCheckerToolComponent {
  private readonly analyzeSetUseCase = new AnalyzeHreflangSetUseCase();
  private readonly generateUseCase = new GenerateHreflangOutputsUseCase();
  private readonly auditUseCase = new AuditHreflangReciprocityUseCase();
  private readonly copyUseCase = new CopyHreflangOutputUseCase(new BrowserHreflangClipboardAdapter());
  private readonly downloadUseCase = new DownloadHreflangOutputUseCase(new BrowserHreflangDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = createDefaults();
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentUrl = signal(this.defaults.currentUrl);
  readonly alternateLines = signal(this.defaults.alternateLines);
  readonly outputFormats: readonly HreflangOutputFormat[] = ['html', 'httpHeader', 'sitemapXml'];
  readonly outputFormat = signal<HreflangOutputFormat>('html');
  readonly copiedFormat = signal<HreflangOutputFormat | null>(null);
  readonly auditSource = signal(this.defaults.auditSource);
  readonly audit = signal(this.auditUseCase.execute(this.defaults.auditSource));

  readonly setAnalysis = computed(() =>
    this.analyzeSetUseCase.execute(this.currentUrl(), this.alternateLines()),
  );
  readonly outputs = computed(() => this.generateUseCase.execute(this.setAnalysis()));
  readonly activeOutput = computed(() => this.outputs()[this.outputFormat()]);
  readonly builderErrorCount = computed(() =>
    this.setAnalysis().issues.filter(issue => issue.severity === 'error').length,
  );
  readonly builderWarningCount = computed(() =>
    this.setAnalysis().issues.filter(issue => issue.severity === 'warning').length,
  );
  readonly builderInfoCount = computed(() =>
    this.setAnalysis().issues.filter(issue => issue.severity === 'info').length,
  );
  readonly auditErrorCount = computed(() =>
    this.audit().issues.filter(issue => issue.severity === 'error').length,
  );
  readonly auditWarningCount = computed(() =>
    this.audit().issues.filter(issue => issue.severity === 'warning').length,
  );
  readonly auditInfoCount = computed(() =>
    this.audit().issues.filter(issue => issue.severity === 'info').length,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearCopiedTimer();
    });
  }

  updateCurrentUrl(event: Event): void {
    this.currentUrl.set(readValue(event).slice(0, 2_048));
  }

  updateAlternateLines(event: Event): void {
    this.alternateLines.set(readValue(event).slice(0, 1_000_001));
  }

  updateAuditSource(event: Event): void {
    this.auditSource.set(readValue(event).slice(0, 1_000_001));
  }

  setOutputFormat(format: HreflangOutputFormat): void {
    this.outputFormat.set(format);
    this.copiedFormat.set(null);
  }

  runAudit(): void {
    this.audit.set(this.auditUseCase.execute(this.auditSource()));
  }

  async copyOutput(): Promise<void> {
    if (this.builderErrorCount() > 0) return;
    const format = this.outputFormat();
    const copied = await this.copyUseCase.execute(this.activeOutput());
    this.clearCopiedTimer();
    this.copiedFormat.set(copied ? format : null);
    if (copied) {
      this.copiedTimer = setTimeout(() => {
        this.copiedFormat.set(null);
      }, 2_000);
    }
  }

  downloadOutput(): void {
    if (this.builderErrorCount() > 0) return;
    this.downloadUseCase.execute(this.outputFormat(), this.activeOutput());
  }

  reset(): void {
    this.currentUrl.set(this.defaults.currentUrl);
    this.alternateLines.set(this.defaults.alternateLines);
    this.outputFormat.set('html');
    this.auditSource.set(this.defaults.auditSource);
    this.audit.set(this.auditUseCase.execute(this.defaults.auditSource));
    this.clearCopiedTimer();
    this.copiedFormat.set(null);
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  outputLabel(format: HreflangOutputFormat): string {
    if (format === 'html') return $localize`:@@hreflang_output_html:Balises HTML`;
    if (format === 'httpHeader') return $localize`:@@hreflang_output_http:En-tête HTTP`;
    return $localize`:@@hreflang_output_sitemap:Fragment sitemap`;
  }

  issueLabel(code: HreflangIssueCode): string {
    switch (code) {
      case 'source-too-large':
        return $localize`:@@hreflang_issue_source_large:La source dépasse 1 000 000 de caractères et a été tronquée.`;
      case 'invalid-line':
        return $localize`:@@hreflang_issue_invalid_line:La ligne doit suivre le format « code | URL absolue ».`;
      case 'missing-code':
        return $localize`:@@hreflang_issue_missing_code:Le code de langue est manquant.`;
      case 'invalid-code':
        return $localize`:@@hreflang_issue_invalid_code:Le code doit contenir une langue ISO 639-1, puis éventuellement un script et une région.`;
      case 'noncanonical-code':
        return $localize`:@@hreflang_issue_noncanonical_code:La casse du code a été normalisée dans la sortie.`;
      case 'missing-url':
        return $localize`:@@hreflang_issue_missing_url:L’URL associée au code est manquante.`;
      case 'invalid-url':
        return $localize`:@@hreflang_issue_invalid_url:L’adresse doit être une URL HTTP ou HTTPS absolue.`;
      case 'url-credentials':
        return $localize`:@@hreflang_issue_credentials:Les identifiants intégrés dans une URL sont refusés.`;
      case 'url-fragment':
        return $localize`:@@hreflang_issue_fragment:Une URL hreflang ne doit pas cibler un fragment de page.`;
      case 'duplicate-code':
        return $localize`:@@hreflang_issue_duplicate_code:Ce code hreflang apparaît plusieurs fois dans le même ensemble.`;
      case 'too-many-alternates':
        return $localize`:@@hreflang_issue_too_many_alternates:L’analyse est limitée à 100 variantes par page.`;
      case 'missing-current-url':
        return $localize`:@@hreflang_issue_missing_current:L’URL de la page courante est obligatoire.`;
      case 'invalid-current-url':
        return $localize`:@@hreflang_issue_invalid_current:L’URL courante doit être absolue, sans identifiants ni fragment.`;
      case 'missing-self-reference':
        return $localize`:@@hreflang_issue_self:La page courante ne se référence pas elle-même dans l’ensemble.`;
      case 'missing-x-default':
        return $localize`:@@hreflang_issue_x_default:Aucune variante x-default n’est déclarée pour les langues non couvertes.`;
      case 'missing-language-fallback':
        return $localize`:@@hreflang_issue_language_fallback:Des variantes régionales existent sans version générique pour cette langue.`;
      case 'same-url-multiple-codes':
        return $localize`:@@hreflang_issue_same_url:Plusieurs codes ciblent la même URL ; cela peut être volontaire, notamment pour x-default.`;
      case 'invalid-page-header':
        return $localize`:@@hreflang_issue_page_header:L’en-tête doit commencer par PAGE suivi d’une URL absolue valide.`;
      case 'missing-canonical':
        return $localize`:@@hreflang_issue_missing_canonical:L’URL canonical n’est pas fournie pour cette page.`;
      case 'invalid-canonical':
        return $localize`:@@hreflang_issue_invalid_canonical:La canonical doit être une URL HTTP ou HTTPS absolue, sans identifiants ni fragment.`;
      case 'canonical-mismatch':
        return $localize`:@@hreflang_issue_canonical_mismatch:La canonical cible une autre URL ; confirmez qu’elle reste dans la même langue et que ce regroupement est voulu.`;
      case 'empty-audit':
        return $localize`:@@hreflang_issue_empty_audit:Aucun bloc PAGE valide n’a été fourni ; aucune réciprocité ne peut être conclue.`;
      case 'alternate-before-page':
        return $localize`:@@hreflang_issue_before_page:Cette variante apparaît avant le premier en-tête PAGE.`;
      case 'duplicate-page':
        return $localize`:@@hreflang_issue_duplicate_page:Cette page est déclarée plusieurs fois dans l’audit.`;
      case 'too-many-pages':
        return $localize`:@@hreflang_issue_too_many_pages:L’audit local est limité à 200 pages.`;
      case 'target-page-not-provided':
        return $localize`:@@hreflang_issue_target_missing:La cible n’est pas fournie comme bloc PAGE ; son lien retour ne peut pas être vérifié.`;
      case 'missing-return-link':
        return $localize`:@@hreflang_issue_return:La page cible fournie ne contient aucun lien retour vers la page source.`;
      case 'inconsistent-set':
        return $localize`:@@hreflang_issue_inconsistent:L’ensemble diffère de celui de la première page ; vérifiez si cette différence est volontaire.`;
      case 'issues-truncated':
        return $localize`:@@hreflang_issue_truncated:La liste est limitée aux 200 premiers problèmes.`;
    }
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}

function createDefaults() {
  const entries = [
    'fr | https://example.com/fr/guide',
    'en | https://example.com/en/guide',
    'es | https://example.com/es/guia',
    'x-default | https://example.com/language-selector',
  ].join('\n');
  const pages = [
    ['https://example.com/fr/guide', entries],
    ['https://example.com/en/guide', entries],
    ['https://example.com/es/guia', entries],
    ['https://example.com/language-selector', entries],
  ];
  return {
    currentUrl: 'https://example.com/fr/guide',
    alternateLines: entries,
    auditSource: pages.map(([url, links]) => `PAGE ${url} | ${url}\n${links}`).join('\n\n'),
  };
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
