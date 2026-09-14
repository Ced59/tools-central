import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CopyStructuredDataReportUseCase,
  DownloadStructuredDataReportUseCase,
  ExtractStructuredDataUseCase,
  type StructuredDataFormat,
  type StructuredDataIssueCode,
} from '../application/structured-data.use-cases';
import { BrowserStructuredDataClipboardAdapter } from '../infrastructure/browser-structured-data-clipboard.adapter';
import { BrowserStructuredDataDownloadAdapter } from '../infrastructure/browser-structured-data-download.adapter';
import { BrowserStructuredDataParserAdapter } from '../infrastructure/browser-structured-data-parser.adapter';

@Component({
  selector: 'app-structured-data-extractor-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './structured-data-extractor-tool.component.html',
  styleUrl: './structured-data-extractor-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructuredDataExtractorToolComponent {
  private readonly extractUseCase = new ExtractStructuredDataUseCase(new BrowserStructuredDataParserAdapter());
  private readonly copyUseCase = new CopyStructuredDataReportUseCase(new BrowserStructuredDataClipboardAdapter());
  private readonly downloadUseCase = new DownloadStructuredDataReportUseCase(new BrowserStructuredDataDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = createDefaults();
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly source = signal(this.defaults.source);
  readonly baseUrl = signal(this.defaults.baseUrl);
  readonly analysis = signal(this.extractUseCase.execute(this.defaults.source, this.defaults.baseUrl));
  readonly selectedNodeKey = signal<string | null>(nodeKey(this.analysis().nodes[0]));
  readonly copied = signal(false);
  readonly errorCount = computed(() => this.analysis().issues.filter(issue => issue.severity === 'error').length);
  readonly warningCount = computed(() => this.analysis().issues.filter(issue => issue.severity === 'warning').length);
  readonly infoCount = computed(() => this.analysis().issues.filter(issue => issue.severity === 'info').length);
  readonly displayedNodes = computed(() => this.analysis().nodes.slice(0, 100));
  readonly selectedNode = computed(() => {
    const key = this.selectedNodeKey();
    return this.analysis().nodes.find(node => nodeKey(node) === key) ?? this.analysis().nodes.at(0) ?? null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearCopiedTimer();
    });
  }

  updateSource(event: Event): void {
    this.source.set(readValue(event).slice(0, 1_000_001));
  }

  updateBaseUrl(event: Event): void {
    this.baseUrl.set(readValue(event).slice(0, 2_048));
  }

  analyze(): void {
    const analysis = this.extractUseCase.execute(this.source(), this.baseUrl());
    this.analysis.set(analysis);
    this.selectedNodeKey.set(nodeKey(analysis.nodes[0]));
    this.copied.set(false);
  }

  selectNode(format: StructuredDataFormat, id: string): void {
    this.selectedNodeKey.set(`${format}:${id}`);
  }

  async copyReport(): Promise<void> {
    const copied = await this.copyUseCase.execute(this.analysis());
    this.clearCopiedTimer();
    this.copied.set(copied);
    if (copied) {
      this.copiedTimer = setTimeout(() => {
        this.copied.set(false);
      }, 2_000);
    }
  }

  downloadReport(): void {
    this.downloadUseCase.execute(this.analysis());
  }

  reset(): void {
    this.source.set(this.defaults.source);
    this.baseUrl.set(this.defaults.baseUrl);
    this.analyze();
  }

  formatNumber(value: number): string {
    return this.formatter.format(value);
  }

  formatLabel(format: StructuredDataFormat): string {
    if (format === 'json-ld') return 'JSON-LD';
    if (format === 'microdata') return 'Microdata';
    return 'RDFa';
  }

  issueLabel(code: StructuredDataIssueCode): string {
    switch (code) {
      case 'source-too-large':
        return $localize`:@@structured_data_issue_source_large:La source dépasse 1 000 000 de caractères. L’analyse est arrêtée sur une copie tronquée.`;
      case 'empty-source':
        return $localize`:@@structured_data_issue_empty:Collez du HTML ou un document JSON-LD avant de lancer l’analyse.`;
      case 'invalid-json':
        return $localize`:@@structured_data_issue_invalid_json:Ce bloc JSON-LD n’est pas un JSON valide.`;
      case 'invalid-json-root':
        return $localize`:@@structured_data_issue_invalid_root:La racine JSON-LD doit être un objet ou un tableau d’objets.`;
      case 'missing-jsonld-context':
        return $localize`:@@structured_data_issue_missing_context:Ce bloc JSON-LD ne déclare aucun @context.`;
      case 'non-schema-context':
        return $localize`:@@structured_data_issue_context:Le contexte ne mentionne pas schema.org. Cela peut être volontaire pour un autre vocabulaire.`;
      case 'missing-type':
        return $localize`:@@structured_data_issue_missing_type:Aucun type n’est déclaré pour cette entité.`;
      case 'depth-limit':
        return $localize`:@@structured_data_issue_depth:Le graphe dépasse 32 niveaux imbriqués et a été borné.`;
      case 'node-limit':
        return $localize`:@@structured_data_issue_nodes:L’analyse est limitée aux 500 premières entités.`;
      case 'property-limit':
        return $localize`:@@structured_data_issue_properties:L’analyse est limitée aux 5 000 premières propriétés.`;
      case 'parser-warning':
        return $localize`:@@structured_data_issue_parser:Une construction HTML avancée n’est extraite que partiellement.`;
      case 'no-structured-data':
        return $localize`:@@structured_data_issue_none:Aucun JSON-LD, Microdata ou RDFa n’a été trouvé dans la source.`;
      case 'issues-truncated':
        return $localize`:@@structured_data_issue_truncated:La liste est limitée aux 200 premiers diagnostics.`;
    }
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}

function createDefaults(): { source: string; baseUrl: string } {
  return {
    baseUrl: 'https://example.com/guide',
    source: `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": "https://example.com/#organization",
      "@type": "Organization",
      "name": "Exemple Studio",
      "url": "https://example.com"
    },
    {
      "@id": "https://example.com/guide#article",
      "@type": "Article",
      "headline": "Guide pratique des données structurées",
      "author": { "@id": "https://example.com/#organization" }
    }
  ]
}`,
  };
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function nodeKey(node: { format: StructuredDataFormat; id: string } | undefined): string | null {
  return node ? `${node.format}:${node.id}` : null;
}
