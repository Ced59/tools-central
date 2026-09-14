import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CopySoftwareApplicationSchemaUseCase,
  DownloadSoftwareApplicationSchemaUseCase,
  GenerateSoftwareApplicationSchemaUseCase,
  SOFTWARE_APPLICATION_CATEGORIES,
  SOFTWARE_APPLICATION_TYPES,
  type SoftwareApplicationCategory,
  type SoftwareApplicationSchemaField,
  type SoftwareApplicationSchemaIssueCode,
  type SoftwareApplicationSchemaOutputFormat,
  type SoftwareApplicationType,
} from '../application/software-application-schema.use-cases';
import { BrowserSoftwareApplicationSchemaClipboardAdapter } from '../infrastructure/browser-software-application-schema-clipboard.adapter';
import { BrowserSoftwareApplicationSchemaDownloadAdapter } from '../infrastructure/browser-software-application-schema-download.adapter';

@Component({
  selector: 'app-software-application-schema-builder-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './software-application-schema-builder-tool.component.html',
  styleUrl: './software-application-schema-builder-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoftwareApplicationSchemaBuilderToolComponent {
  private readonly generateUseCase = new GenerateSoftwareApplicationSchemaUseCase();
  private readonly copyUseCase = new CopySoftwareApplicationSchemaUseCase(
    new BrowserSoftwareApplicationSchemaClipboardAdapter(),
  );
  private readonly downloadUseCase = new DownloadSoftwareApplicationSchemaUseCase(
    new BrowserSoftwareApplicationSchemaDownloadAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private readonly defaults = createDefaults();
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly types = SOFTWARE_APPLICATION_TYPES;
  readonly categories = SOFTWARE_APPLICATION_CATEGORIES;
  readonly type = signal<SoftwareApplicationType>(this.defaults.type);
  readonly name = signal(this.defaults.name);
  readonly description = signal(this.defaults.description);
  readonly url = signal(this.defaults.url);
  readonly screenshotUrl = signal(this.defaults.screenshotUrl);
  readonly applicationCategory = signal<SoftwareApplicationCategory | ''>(this.defaults.applicationCategory);
  readonly operatingSystem = signal(this.defaults.operatingSystem);
  readonly softwareVersion = signal(this.defaults.softwareVersion);
  readonly price = signal(this.defaults.price);
  readonly priceCurrency = signal(this.defaults.priceCurrency);
  readonly includeAggregateRating = signal(this.defaults.includeAggregateRating);
  readonly ratingValue = signal(this.defaults.ratingValue);
  readonly ratingCount = signal(this.defaults.ratingCount);
  readonly bestRating = signal(this.defaults.bestRating);
  readonly worstRating = signal(this.defaults.worstRating);
  readonly outputFormat = signal<SoftwareApplicationSchemaOutputFormat>('scriptTag');
  readonly copied = signal(false);
  readonly copyFailed = signal(false);

  readonly result = computed(() => this.generateUseCase.execute({
    type: this.type(),
    name: this.name(),
    description: this.description(),
    url: this.url(),
    screenshotUrl: this.screenshotUrl(),
    applicationCategory: this.applicationCategory(),
    operatingSystem: this.operatingSystem(),
    softwareVersion: this.softwareVersion(),
    price: this.price(),
    priceCurrency: this.priceCurrency(),
    includeAggregateRating: this.includeAggregateRating(),
    ratingValue: this.ratingValue(),
    ratingCount: this.ratingCount(),
    bestRating: this.bestRating(),
    worstRating: this.worstRating(),
  }));
  readonly activeOutput = computed(() => this.result()[this.outputFormat()]);
  readonly errorCount = computed(() => this.result().issues.filter(item => item.severity === 'error').length);
  readonly warningCount = computed(() => this.result().issues.filter(item => item.severity === 'warning').length);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearCopiedTimer();
    });
  }

  updateType(event: Event): void {
    const value = readValue(event);
    if (SOFTWARE_APPLICATION_TYPES.some(item => item === value)) this.type.set(value as SoftwareApplicationType);
  }

  updateName(event: Event): void { this.name.set(readValue(event).slice(0, 201)); }
  updateDescription(event: Event): void { this.description.set(readValue(event).slice(0, 2_001)); }
  updateUrl(event: Event): void { this.url.set(readValue(event).slice(0, 2_049)); }
  updateScreenshotUrl(event: Event): void { this.screenshotUrl.set(readValue(event).slice(0, 2_049)); }

  updateCategory(event: Event): void {
    const value = readValue(event);
    if (!value || SOFTWARE_APPLICATION_CATEGORIES.some(item => item === value)) {
      this.applicationCategory.set(value as SoftwareApplicationCategory | '');
    }
  }

  updateOperatingSystem(event: Event): void { this.operatingSystem.set(readValue(event).slice(0, 201)); }
  updateSoftwareVersion(event: Event): void { this.softwareVersion.set(readValue(event).slice(0, 101)); }
  updatePrice(event: Event): void { this.price.set(readValue(event).slice(0, 32)); }
  updatePriceCurrency(event: Event): void { this.priceCurrency.set(readValue(event).slice(0, 32).toUpperCase()); }

  updateIncludeAggregateRating(event: Event): void {
    this.includeAggregateRating.set((event.target as HTMLInputElement).checked);
  }

  updateRatingValue(event: Event): void { this.ratingValue.set(readValue(event).slice(0, 32)); }
  updateRatingCount(event: Event): void { this.ratingCount.set(readValue(event).slice(0, 32)); }
  updateBestRating(event: Event): void { this.bestRating.set(readValue(event).slice(0, 32)); }
  updateWorstRating(event: Event): void { this.worstRating.set(readValue(event).slice(0, 32)); }

  setOutputFormat(format: SoftwareApplicationSchemaOutputFormat): void {
    this.outputFormat.set(format);
    this.copied.set(false);
    this.copyFailed.set(false);
  }

  async copyOutput(): Promise<void> {
    const copied = await this.copyUseCase.execute(this.activeOutput());
    this.clearCopiedTimer();
    this.copied.set(copied);
    this.copyFailed.set(!copied);
    this.copiedTimer = setTimeout(() => {
      this.copied.set(false);
      this.copyFailed.set(false);
    }, copied ? 2_000 : 6_000);
  }

  downloadOutput(): void {
    this.downloadUseCase.execute(this.outputFormat(), this.activeOutput());
  }

  reset(): void {
    this.type.set(this.defaults.type);
    this.name.set(this.defaults.name);
    this.description.set(this.defaults.description);
    this.url.set(this.defaults.url);
    this.screenshotUrl.set(this.defaults.screenshotUrl);
    this.applicationCategory.set(this.defaults.applicationCategory);
    this.operatingSystem.set(this.defaults.operatingSystem);
    this.softwareVersion.set(this.defaults.softwareVersion);
    this.price.set(this.defaults.price);
    this.priceCurrency.set(this.defaults.priceCurrency);
    this.includeAggregateRating.set(this.defaults.includeAggregateRating);
    this.ratingValue.set(this.defaults.ratingValue);
    this.ratingCount.set(this.defaults.ratingCount);
    this.bestRating.set(this.defaults.bestRating);
    this.worstRating.set(this.defaults.worstRating);
    this.outputFormat.set('scriptTag');
    this.clearCopiedTimer();
    this.copied.set(false);
    this.copyFailed.set(false);
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  outputLabel(format: SoftwareApplicationSchemaOutputFormat): string {
    return format === 'scriptTag'
      ? $localize`:@@software_schema_output_script:Balise script prête à intégrer`
      : $localize`:@@software_schema_output_json:JSON-LD seul`;
  }

  stateLabel(): string {
    if (this.result().state === 'google-ready') {
      return $localize`:@@software_schema_state_google:Propriétés requises par Google présentes`;
    }
    if (this.result().state === 'schema-valid') {
      return $localize`:@@software_schema_state_schema:Schema.org valide, résultat enrichi Google incomplet`;
    }
    return $localize`:@@software_schema_state_invalid:Corrigez les erreurs avant export`;
  }

  fieldLabel(field: SoftwareApplicationSchemaField): string {
    const labels: Record<SoftwareApplicationSchemaField, string> = {
      name: $localize`:@@software_schema_field_name:Nom`,
      description: $localize`:@@software_schema_field_description:Description`,
      url: 'URL',
      screenshotUrl: $localize`:@@software_schema_field_screenshot:Capture`,
      applicationCategory: $localize`:@@software_schema_field_category:Catégorie`,
      operatingSystem: $localize`:@@software_schema_field_os:Système`,
      softwareVersion: $localize`:@@software_schema_field_version:Version`,
      price: $localize`:@@software_schema_field_price:Prix`,
      priceCurrency: $localize`:@@software_schema_field_currency:Devise`,
      ratingValue: $localize`:@@software_schema_field_rating:Note`,
      ratingCount: $localize`:@@software_schema_field_rating_count:Nombre de notes`,
      ratingScale: $localize`:@@software_schema_field_rating_scale:Échelle`,
    };
    return labels[field];
  }

  issueLabel(code: SoftwareApplicationSchemaIssueCode): string {
    const labels: Record<SoftwareApplicationSchemaIssueCode, string> = {
      'missing-name': $localize`:@@software_schema_issue_missing_name:Le nom de l’application est obligatoire.`,
      'name-too-long': $localize`:@@software_schema_issue_name_long:Le nom dépasse la limite de 200 caractères.`,
      'description-too-long': $localize`:@@software_schema_issue_description_long:La description dépasse la limite de 2 000 caractères.`,
      'operating-system-too-long': $localize`:@@software_schema_issue_os_long:Le système dépasse la limite de 200 caractères.`,
      'version-too-long': $localize`:@@software_schema_issue_version_long:La version dépasse la limite de 100 caractères.`,
      'invalid-url': $localize`:@@software_schema_issue_url:L’URL de l’application doit être une adresse HTTP ou HTTPS absolue.`,
      'url-credentials': $localize`:@@software_schema_issue_url_credentials:Les identifiants intégrés dans l’URL de l’application sont refusés.`,
      'url-fragment': $localize`:@@software_schema_issue_url_fragment:L’URL contient un fragment ; vérifiez que la page décrite reste canonique.`,
      'invalid-screenshot-url': $localize`:@@software_schema_issue_screenshot_url:L’URL de capture doit être une adresse HTTP ou HTTPS absolue.`,
      'screenshot-url-credentials': $localize`:@@software_schema_issue_screenshot_credentials:Les identifiants intégrés dans l’URL de capture sont refusés.`,
      'invalid-price': $localize`:@@software_schema_issue_price:Le prix doit être un nombre positif ou zéro, avec au plus deux décimales.`,
      'price-too-large': $localize`:@@software_schema_issue_price_large:Le prix dépasse la limite prise en charge par cet outil.`,
      'missing-price-currency': $localize`:@@software_schema_issue_currency_missing:Pour une offre payante, ajoutez une devise ISO 4217 afin d’éviter une interprétation ambiguë.`,
      'invalid-price-currency': $localize`:@@software_schema_issue_currency_invalid:La devise doit contenir exactement trois lettres ISO 4217, par exemple EUR ou USD.`,
      'missing-aggregate-rating': $localize`:@@software_schema_issue_rating_missing:Google exige une note agrégée ou un avis réel pour ce résultat enrichi. N’inventez jamais cette donnée.`,
      'invalid-rating-value': $localize`:@@software_schema_issue_rating_value:La note moyenne doit être un nombre avec au plus deux décimales.`,
      'invalid-rating-count': $localize`:@@software_schema_issue_rating_count:Le nombre de notes doit être un entier strictement positif.`,
      'invalid-rating-scale': $localize`:@@software_schema_issue_rating_scale:L’échelle est invalide : la meilleure note doit être supérieure à la plus basse.`,
      'rating-out-of-range': $localize`:@@software_schema_issue_rating_range:La note moyenne doit rester comprise dans l’échelle déclarée.`,
      'missing-application-category': $localize`:@@software_schema_issue_category_missing:La catégorie est recommandée par Google et améliore la précision du balisage.`,
      'missing-operating-system': $localize`:@@software_schema_issue_os_missing:Le système d’exploitation est recommandé par Google.`,
    };
    return labels[code];
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}

function createDefaults() {
  return {
    type: 'WebApplication' as const,
    name: $localize`:@@software_schema_default_name:Planificateur de projet`,
    description: $localize`:@@software_schema_default_description:Une application web pour organiser des tâches, des échéances et des projets.`,
    url: 'https://example.com/project-planner',
    screenshotUrl: 'https://example.com/images/project-planner.png',
    applicationCategory: 'BusinessApplication' as const,
    operatingSystem: $localize`:@@software_schema_default_os:Navigateur web moderne`,
    softwareVersion: '2.1.0',
    price: '0',
    priceCurrency: 'EUR',
    includeAggregateRating: false,
    ratingValue: '4.7',
    ratingCount: '128',
    bestRating: '5',
    worstRating: '1',
  };
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
}
