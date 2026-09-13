import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type {
  SerpDevice,
  SerpLengthStatus,
  SerpRecommendation,
} from '../application/analyze-serp-snippet.use-case';
import { AnalyzeSerpSnippetUseCase } from '../application/analyze-serp-snippet.use-case';

@Component({
  selector: 'app-serp-snippet-preview-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './serp-snippet-preview-tool.component.html',
  styleUrl: './serp-snippet-preview-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SerpSnippetPreviewToolComponent {
  private readonly analyzeSnippet = new AnalyzeSerpSnippetUseCase();
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = {
    siteName: $localize`:@@serp_preview_default_site:Tools Central`,
    url: `https://www.tools-central.com/${this.locale}/categories/dev/seo/serp-snippet-preview`,
    title: $localize`:@@serp_preview_default_title:Prévisualiseur de snippet Google gratuit`,
    description: $localize`:@@serp_preview_default_description:Testez votre balise title, votre meta description et votre URL dans un aperçu de résultat Google sur ordinateur et mobile.`,
  };

  readonly siteName = signal(this.defaults.siteName);
  readonly url = signal(this.defaults.url);
  readonly title = signal(this.defaults.title);
  readonly description = signal(this.defaults.description);
  readonly device = signal<SerpDevice>('desktop');

  readonly analysis = computed(() =>
    this.analyzeSnippet.execute({
      siteName: this.siteName(),
      url: this.url(),
      title: this.title(),
      description: this.description(),
      device: this.device(),
    }),
  );

  updateSiteName(event: Event): void {
    this.siteName.set(readInputValue(event));
  }

  updateUrl(event: Event): void {
    this.url.set(readInputValue(event));
  }

  updateTitle(event: Event): void {
    this.title.set(readInputValue(event));
  }

  updateDescription(event: Event): void {
    this.description.set(readInputValue(event));
  }

  selectDevice(device: SerpDevice): void {
    this.device.set(device);
  }

  reset(): void {
    this.siteName.set(this.defaults.siteName);
    this.url.set(this.defaults.url);
    this.title.set(this.defaults.title);
    this.description.set(this.defaults.description);
    this.device.set('desktop');
  }

  meterValue(value: number, maximum: number): number {
    return Math.min(value, maximum);
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  statusLabel(status: SerpLengthStatus): string {
    switch (status) {
      case 'missing':
        return $localize`:@@serp_preview_status_missing:Manquant`;
      case 'concise':
        return $localize`:@@serp_preview_status_concise:Court`;
      case 'balanced':
        return $localize`:@@serp_preview_status_balanced:Équilibré`;
      case 'likely-truncated':
        return $localize`:@@serp_preview_status_truncated:Troncature probable`;
    }
  }

  recommendationLabel(recommendation: SerpRecommendation): string {
    switch (recommendation) {
      case 'title-missing':
        return $localize`:@@serp_preview_rec_title_missing:Ajoutez un titre descriptif et propre à cette page.`;
      case 'title-short':
        return $localize`:@@serp_preview_rec_title_short:Le titre est très court : précisez la promesse ou le sujet si cela aide le lecteur.`;
      case 'title-long':
        return $localize`:@@serp_preview_rec_title_long:Le titre risque d’être tronqué. Placez les mots importants au début et raccourcissez-le.`;
      case 'description-missing':
        return $localize`:@@serp_preview_rec_description_missing:Ajoutez une meta description utile pour résumer la page.`;
      case 'description-short':
        return $localize`:@@serp_preview_rec_description_short:La description est courte : ajoutez un bénéfice concret ou une information distinctive.`;
      case 'description-long':
        return $localize`:@@serp_preview_rec_description_long:La description risque d’être tronquée. Conservez l’information essentielle au début.`;
      case 'url-invalid':
        return $localize`:@@serp_preview_rec_url_invalid:Saisissez une URL HTTP ou HTTPS valide avec un nom de domaine.`;
      case 'ready':
        return $localize`:@@serp_preview_rec_ready:Le titre, la description et l’URL sont prêts pour une vérification éditoriale finale.`;
    }
  }
}

function readInputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
