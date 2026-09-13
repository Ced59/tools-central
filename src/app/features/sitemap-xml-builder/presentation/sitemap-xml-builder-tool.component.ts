import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AnalyzeSitemapXmlUseCase,
  DownloadSitemapXmlUseCase,
  GenerateSitemapXmlUseCase,
  type SitemapGeneration,
  type SitemapIssueCode,
  type SitemapKind,
} from '../application/sitemap-xml.use-cases';
import { BrowserSitemapXmlDownloadAdapter } from '../infrastructure/browser-sitemap-xml-download.adapter';

@Component({
  selector: 'app-sitemap-xml-builder-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sitemap-xml-builder-tool.component.html',
  styleUrl: './sitemap-xml-builder-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SitemapXmlBuilderToolComponent {
  private readonly generateUseCase = new GenerateSitemapXmlUseCase();
  private readonly analyzeUseCase = new AnalyzeSitemapXmlUseCase();
  private readonly downloadUseCase = new DownloadSitemapXmlUseCase(new BrowserSitemapXmlDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly todayIso = new Date().toISOString().slice(0, 10);
  private readonly defaults = {
    siteUrl: 'https://www.tools-central.com',
    sitemapUrl: 'https://www.tools-central.com/sitemap.xml',
    lines: `/${this.locale}/\n/${this.locale}/categories/dev/seo/serp-snippet-preview\n/${this.locale}/categories/dev/seo/robots-txt-builder`,
  };

  readonly kind = signal<SitemapKind>('urlset');
  readonly siteUrl = signal(this.defaults.siteUrl);
  readonly sitemapUrl = signal(this.defaults.sitemapUrl);
  readonly sourceLines = signal(this.defaults.lines);
  readonly content = signal(this.generateCurrent().content);

  readonly builderValidation = computed(() => this.generateCurrent());
  readonly analysis = computed(() =>
    this.analyzeUseCase.execute(this.content(), this.sitemapUrl(), this.todayIso),
  );
  readonly errorCount = computed(() =>
    this.analysis().issues.filter(issue => issue.severity === 'error').length,
  );
  readonly warningCount = computed(() =>
    this.analysis().issues.filter(issue => issue.severity === 'warning').length,
  );
  readonly infoCount = computed(() =>
    this.analysis().issues.filter(issue => issue.severity === 'info').length,
  );

  setKind(kind: SitemapKind): void {
    this.kind.set(kind);
    this.sitemapUrl.set(
      kind === 'urlset'
        ? `${this.siteOrigin()}/sitemap.xml`
        : `${this.siteOrigin()}/sitemap-index.xml`,
    );
    this.sourceLines.set(kind === 'urlset'
      ? this.defaults.lines
      : `${this.siteOrigin()}/sitemap-pages.xml\n${this.siteOrigin()}/sitemap-articles.xml`);
    this.generate();
  }

  updateSiteUrl(event: Event): void {
    this.siteUrl.set(readValue(event));
  }

  updateSitemapUrl(event: Event): void {
    this.sitemapUrl.set(readValue(event));
  }

  updateSourceLines(event: Event): void {
    this.sourceLines.set(readValue(event));
  }

  updateContent(event: Event): void {
    this.content.set(readValue(event).slice(0, 10_500_000));
  }

  generate(): void {
    this.content.set(this.generateCurrent().content);
  }

  reset(): void {
    this.kind.set('urlset');
    this.siteUrl.set(this.defaults.siteUrl);
    this.sitemapUrl.set(this.defaults.sitemapUrl);
    this.sourceLines.set(this.defaults.lines);
    this.generate();
  }

  download(): void {
    this.downloadUseCase.execute(this.content(), this.analysis().kind ?? this.kind());
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  kindLabel(kind: SitemapKind | null): string {
    if (kind === 'urlset') return $localize`:@@sitemap_kind_urlset:Sitemap d’URL`;
    if (kind === 'sitemapindex') return $localize`:@@sitemap_kind_index:Index de sitemaps`;
    return $localize`:@@sitemap_kind_unknown:Type non reconnu`;
  }

  issueLabel(code: SitemapIssueCode): string {
    switch (code) {
      case 'file-too-large':
        return $localize`:@@sitemap_issue_file_too_large:Le fichier dépasse la limite de 50 Mio non compressés.`;
      case 'analysis-limit':
        return $localize`:@@sitemap_issue_analysis_limit:L’analyse interactive est limitée à 10 Mio pour protéger le navigateur.`;
      case 'unsafe-doctype':
        return $localize`:@@sitemap_issue_doctype:DOCTYPE est refusé afin d’éviter les entités externes et les traitements dangereux.`;
      case 'malformed-xml':
        return $localize`:@@sitemap_issue_malformed:Le document XML est mal formé ou contient une entité non autorisée.`;
      case 'invalid-root':
        return $localize`:@@sitemap_issue_root:L’élément racine doit être urlset ou sitemapindex.`;
      case 'invalid-namespace':
        return $localize`:@@sitemap_issue_namespace:L’espace de noms officiel du protocole Sitemap est absent ou incorrect.`;
      case 'invalid-sitemap-url':
        return $localize`:@@sitemap_issue_sitemap_url:L’adresse publique du sitemap doit être une URL HTTP ou HTTPS absolue.`;
      case 'empty-sitemap':
        return $localize`:@@sitemap_issue_empty:Le sitemap ne contient aucune entrée.`;
      case 'too-many-entries':
        return $localize`:@@sitemap_issue_too_many:Un fichier ne peut pas contenir plus de 50 000 entrées.`;
      case 'missing-loc':
        return $localize`:@@sitemap_issue_missing_loc:L’entrée ne contient aucun élément loc obligatoire.`;
      case 'multiple-loc':
        return $localize`:@@sitemap_issue_multiple_loc:L’entrée contient plusieurs éléments loc.`;
      case 'invalid-loc':
        return $localize`:@@sitemap_issue_invalid_loc:loc doit contenir une URL HTTP ou HTTPS absolue valide.`;
      case 'loc-too-long':
        return $localize`:@@sitemap_issue_loc_long:L’URL loc atteint ou dépasse 2 048 caractères.`;
      case 'duplicate-loc':
        return $localize`:@@sitemap_issue_duplicate:Cette URL est dupliquée dans le fichier.`;
      case 'different-origin':
        return $localize`:@@sitemap_issue_origin:L’URL utilise une autre origine ; vérifiez les règles de soumission intersites.`;
      case 'outside-sitemap-path':
        return $localize`:@@sitemap_issue_scope:L’URL se trouve hors du répertoire gouverné par l’emplacement du sitemap.`;
      case 'invalid-lastmod':
        return $localize`:@@sitemap_issue_lastmod:La date lastmod doit respecter le format W3C, par exemple 2026-09-13.`;
      case 'future-lastmod':
        return $localize`:@@sitemap_issue_future:La date lastmod est dans le futur.`;
      case 'invalid-changefreq':
        return $localize`:@@sitemap_issue_changefreq:La valeur changefreq n’appartient pas aux valeurs prévues par le protocole.`;
      case 'invalid-priority':
        return $localize`:@@sitemap_issue_priority:La priorité doit être un nombre compris entre 0 et 1.`;
      case 'google-ignores-changefreq':
        return $localize`:@@sitemap_issue_google_changefreq:Google ignore changefreq ; ne l’utilisez pas comme signal de fraîcheur.`;
      case 'google-ignores-priority':
        return $localize`:@@sitemap_issue_google_priority:Google ignore priority ; cette valeur n’améliore pas le classement.`;
      case 'invalid-builder-line':
        return $localize`:@@sitemap_issue_builder_line:La ligne du générateur doit suivre le format « URL | lastmod facultatif ».`;
      case 'issues-truncated':
        return $localize`:@@robots_issue_truncated:La liste est limitée aux 200 premiers problèmes.`;
    }
  }

  private generateCurrent(): SitemapGeneration {
    return this.generateUseCase.execute({
      kind: this.kind(),
      siteUrl: this.siteUrl(),
      lines: this.sourceLines().split(/\r\n|\n|\r/u),
      todayIso: this.todayIso,
    });
  }

  private siteOrigin(): string {
    try {
      return new URL(this.siteUrl()).origin;
    } catch {
      return this.defaults.siteUrl;
    }
  }
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
