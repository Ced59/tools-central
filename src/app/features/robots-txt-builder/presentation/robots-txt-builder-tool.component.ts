import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AnalyzeRobotsTxtUseCase,
  DownloadRobotsTxtUseCase,
  GenerateRobotsTxtUseCase,
  TestRobotsUrlUseCase,
  type RobotsDecisionReason,
  type RobotsGeneration,
  type RobotsIssueCode,
} from '../application/robots-txt.use-cases';
import { BrowserRobotsTxtDownloadAdapter } from '../infrastructure/browser-robots-txt-download.adapter';

type RobotsPreset = 'recommended' | 'allow-all' | 'block-all';

@Component({
  selector: 'app-robots-txt-builder-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './robots-txt-builder-tool.component.html',
  styleUrl: './robots-txt-builder-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RobotsTxtBuilderToolComponent {
  private readonly analyzeUseCase = new AnalyzeRobotsTxtUseCase();
  private readonly generateUseCase = new GenerateRobotsTxtUseCase();
  private readonly testUseCase = new TestRobotsUrlUseCase();
  private readonly downloadUseCase = new DownloadRobotsTxtUseCase(new BrowserRobotsTxtDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = {
    siteUrl: 'https://www.tools-central.com',
    userAgent: '*',
    allowPaths: '/assets/',
    disallowPaths: '/admin/\n/private/\n/search?',
    testAgent: 'Googlebot',
    testUrl: `https://www.tools-central.com/${this.locale}/categories/dev/seo/robots-txt-builder`,
  };

  readonly siteUrl = signal(this.defaults.siteUrl);
  readonly userAgent = signal(this.defaults.userAgent);
  readonly allowPaths = signal(this.defaults.allowPaths);
  readonly disallowPaths = signal(this.defaults.disallowPaths);
  readonly includeSitemap = signal(true);
  readonly testAgent = signal(this.defaults.testAgent);
  readonly testUrl = signal(this.defaults.testUrl);
  readonly content = signal(this.generateCurrent().content);

  readonly analysis = computed(() => this.analyzeUseCase.execute(this.content()));
  readonly builderValidation = computed(() => this.generateCurrent());
  readonly ruleCount = computed(() =>
    this.analysis().groups.reduce((total, group) => total + group.rules.length, 0),
  );
  readonly errorCount = computed(() =>
    this.analysis().issues.filter(issue => issue.severity === 'error').length,
  );
  readonly warningCount = computed(() =>
    this.analysis().issues.filter(issue => issue.severity === 'warning').length,
  );
  readonly decision = computed(() =>
    this.testUseCase.execute(
      this.analysis(),
      this.siteUrl(),
      this.testAgent(),
      this.testUrl(),
    ),
  );

  updateSiteUrl(event: Event): void {
    this.siteUrl.set(readValue(event));
  }

  updateUserAgent(event: Event): void {
    this.userAgent.set(readValue(event));
  }

  updateAllowPaths(event: Event): void {
    this.allowPaths.set(readValue(event));
  }

  updateDisallowPaths(event: Event): void {
    this.disallowPaths.set(readValue(event));
  }

  updateIncludeSitemap(event: Event): void {
    this.includeSitemap.set((event.target as HTMLInputElement).checked);
  }

  updateContent(event: Event): void {
    this.content.set(readValue(event).slice(0, 600_000));
  }

  updateTestAgent(event: Event): void {
    this.testAgent.set(readValue(event));
  }

  updateTestUrl(event: Event): void {
    this.testUrl.set(readValue(event));
  }

  generate(): void {
    this.content.set(this.generateCurrent().content);
  }

  applyPreset(preset: RobotsPreset): void {
    if (preset === 'allow-all') {
      this.allowPaths.set('');
      this.disallowPaths.set('');
    } else if (preset === 'block-all') {
      this.allowPaths.set('');
      this.disallowPaths.set('/');
    } else {
      this.allowPaths.set(this.defaults.allowPaths);
      this.disallowPaths.set(this.defaults.disallowPaths);
    }
    this.generate();
  }

  reset(): void {
    this.siteUrl.set(this.defaults.siteUrl);
    this.userAgent.set(this.defaults.userAgent);
    this.allowPaths.set(this.defaults.allowPaths);
    this.disallowPaths.set(this.defaults.disallowPaths);
    this.includeSitemap.set(true);
    this.testAgent.set(this.defaults.testAgent);
    this.testUrl.set(this.defaults.testUrl);
    this.generate();
  }

  download(): void {
    this.downloadUseCase.execute(this.content());
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  issueLabel(code: RobotsIssueCode): string {
    switch (code) {
      case 'file-too-large':
        return $localize`:@@robots_issue_file_too_large:Le fichier dépasse 500 Kio ; les moteurs peuvent ignorer la suite.`;
      case 'bom-ignored':
        return $localize`:@@robots_issue_bom:Le marqueur BOM initial est ignoré.`;
      case 'invalid-control-character':
        return $localize`:@@robots_issue_control:Caractère de contrôle non autorisé.`;
      case 'html-content':
        return $localize`:@@robots_issue_html:Le contenu ressemble à une page HTML, pas à un fichier robots.txt.`;
      case 'invalid-line':
        return $localize`:@@robots_issue_line:Ligne invalide : une directive et un deux-points sont attendus.`;
      case 'empty-user-agent':
        return $localize`:@@robots_issue_empty_agent:Le nom du robot est vide.`;
      case 'invalid-user-agent':
        return $localize`:@@robots_issue_invalid_agent:Le product token contient des caractères non autorisés.`;
      case 'orphan-rule':
        return $localize`:@@robots_issue_orphan:Cette règle n’est précédée d’aucun User-agent valide.`;
      case 'empty-rule-ignored':
        return $localize`:@@robots_issue_empty_rule:La règle vide est ignorée et ne bloque aucune URL.`;
      case 'invalid-rule-path':
        return $localize`:@@robots_issue_path:Le chemin doit commencer par « / » et ne pas contenir d’espace brut.`;
      case 'invalid-dollar-position':
        return $localize`:@@robots_issue_dollar:Le symbole « $ » ne peut apparaître qu’une fois, à la fin du chemin.`;
      case 'invalid-sitemap':
        return $localize`:@@robots_issue_sitemap:L’adresse du sitemap doit être une URL HTTP ou HTTPS absolue.`;
      case 'unsupported-crawl-delay':
        return $localize`:@@robots_issue_crawl_delay:Crawl-delay n’est pas pris en charge par Google.`;
      case 'unknown-directive':
        return $localize`:@@robots_issue_unknown:Directive inconnue ou non standard ; elle peut être ignorée par les robots.`;
      case 'duplicate-rule':
        return $localize`:@@robots_issue_duplicate_rule:Règle dupliquée dans le même groupe.`;
      case 'duplicate-sitemap':
        return $localize`:@@robots_issue_duplicate_sitemap:Sitemap dupliqué.`;
      case 'missing-user-agent':
        return $localize`:@@robots_issue_missing_agent:Aucun groupe User-agent valide n’a été trouvé.`;
      case 'issues-truncated':
        return $localize`:@@robots_issue_truncated:La liste est limitée aux 200 premiers problèmes.`;
    }
  }

  decisionLabel(reason: RobotsDecisionReason): string {
    switch (reason) {
      case 'matched-rule':
        return $localize`:@@robots_decision_matched:Décision calculée avec la règle la plus spécifique.`;
      case 'no-matching-rule':
        return $localize`:@@robots_decision_no_rule:Aucune règle applicable : l’exploration est autorisée par défaut.`;
      case 'robots-file':
        return $localize`:@@robots_decision_file:Le fichier /robots.txt lui-même est toujours autorisé.`;
      case 'invalid-site-url':
        return $localize`:@@robots_decision_invalid_site:Corrigez l’URL du site avant de lancer le test.`;
      case 'invalid-test-url':
        return $localize`:@@robots_decision_invalid_url:Saisissez une URL HTTP ou HTTPS valide à tester.`;
      case 'different-origin':
        return $localize`:@@robots_decision_origin:L’URL testée doit utiliser le même protocole, hôte et port que le site.`;
      case 'invalid-test-agent':
        return $localize`:@@robots_decision_invalid_agent:Saisissez un product token précis, par exemple Googlebot.`;
    }
  }

  private generateCurrent(): RobotsGeneration {
    return this.generateUseCase.execute({
      siteUrl: this.siteUrl(),
      userAgent: this.userAgent(),
      allowPaths: splitLines(this.allowPaths()),
      disallowPaths: splitLines(this.disallowPaths()),
      includeSitemap: this.includeSitemap(),
    });
  }
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function splitLines(value: string): string[] {
  return value.split(/\r\n|\n|\r/);
}
