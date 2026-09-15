import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CleanOoxmlMetadataUseCase,
  DownloadCleanedOoxmlUseCase,
  OOXML_METADATA_MAX_FILE_BYTES,
  OoxmlMetadataValidationError,
  detectOoxmlKind,
  type OoxmlCleanedDocument,
  type OoxmlMetadataFinding,
  type OoxmlMetadataOptions,
  type OoxmlMetadataScope,
} from '../application/ooxml-metadata-cleaner.use-cases';
import { BrowserOoxmlDownloadAdapter } from '../infrastructure/browser-ooxml-download.adapter';
import { BrowserOoxmlFileReaderAdapter } from '../infrastructure/browser-ooxml-file-reader.adapter';
import { OoxmlMetadataWorkerAdapter } from '../infrastructure/ooxml-metadata-worker.adapter';

type ToolState = 'idle' | 'ready' | 'processing' | 'done' | 'error';
type OptionName = keyof OoxmlMetadataOptions;

const DEFAULT_OPTIONS: OoxmlMetadataOptions = {
  removeCoreProperties: true,
  removeApplicationProperties: true,
  removeCustomProperties: true,
  removeThumbnail: true,
};

@Component({
  selector: 'app-ooxml-metadata-cleaner-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ooxml-metadata-cleaner-tool.component.html',
  styleUrl: './ooxml-metadata-cleaner-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OoxmlMetadataCleanerToolComponent {
  private readonly cleanUseCase = new CleanOoxmlMetadataUseCase(
    new BrowserOoxmlFileReaderAdapter(),
    new OoxmlMetadataWorkerAdapter(),
  );
  private readonly downloadUseCase = new DownloadCleanedOoxmlUseCase(new BrowserOoxmlDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private taskRevision = 0;
  private abortController: AbortController | null = null;

  readonly maxFileSizeLabel = formatBytes(OOXML_METADATA_MAX_FILE_BYTES, this.locale);
  readonly state = signal<ToolState>('idle');
  readonly file = signal<File | null>(null);
  readonly options = signal<OoxmlMetadataOptions>({ ...DEFAULT_OPTIONS });
  readonly progress = signal(0);
  readonly result = signal<OoxmlCleanedDocument | null>(null);
  readonly errorMessage = signal('');
  readonly isBusy = computed(() => this.state() === 'processing');
  readonly canClean = computed(() => (
    this.file() !== null
    && !this.isBusy()
    && Object.values(this.options()).some(Boolean)
  ));

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
    });
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    input.value = '';
    if (!selected) return;
    this.cancelCurrentTask();
    this.taskRevision += 1;
    this.file.set(selected);
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    this.state.set('ready');
  }

  updateOption(name: OptionName, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.options.update(options => ({ ...options, [name]: checked }));
    this.invalidateResult();
  }

  async clean(): Promise<void> {
    const file = this.file();
    if (!file || !this.canClean()) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    this.state.set('processing');
    try {
      const result = await this.cleanUseCase.execute({
        source: { fileName: file.name, size: file.size, blob: file },
        options: this.options(),
        onProgress: percent => {
          if (revision === this.taskRevision) this.progress.set(percent);
        },
        signal: controller.signal,
      });
      if (revision !== this.taskRevision) return;
      this.result.set(result);
      this.progress.set(100);
      this.state.set('done');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) {
        this.errorMessage.set(this.describeError(error));
        this.state.set('error');
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }

  cancel(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.progress.set(0);
    this.state.set(this.file() ? 'ready' : 'idle');
  }

  download(): void {
    const result = this.result();
    if (result) this.downloadUseCase.execute(result);
  }

  reset(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.file.set(null);
    this.options.set({ ...DEFAULT_OPTIONS });
    this.result.set(null);
    this.errorMessage.set('');
    this.progress.set(0);
    this.state.set('idle');
  }

  fileKindLabel(file: File): string {
    return detectOoxmlKind(file.name)?.toUpperCase() ?? $localize`:@@ooxml_metadata_unknown_format:Format inconnu`;
  }

  scopeLabel(scope: OoxmlMetadataScope): string {
    if (scope === 'core') return $localize`:@@ooxml_metadata_scope_core:Propriétés du document`;
    if (scope === 'application') return $localize`:@@ooxml_metadata_scope_application:Application et organisation`;
    if (scope === 'custom') return $localize`:@@ooxml_metadata_scope_custom:Propriété personnalisée`;
    return $localize`:@@ooxml_metadata_scope_thumbnail:Aperçu intégré`;
  }

  fieldLabel(finding: OoxmlMetadataFinding): string {
    const labels: Readonly<Record<string, string>> = {
      title: $localize`:@@ooxml_metadata_field_title:Titre`,
      subject: $localize`:@@ooxml_metadata_field_subject:Sujet`,
      creator: $localize`:@@ooxml_metadata_field_creator:Auteur`,
      keywords: $localize`:@@ooxml_metadata_field_keywords:Mots-clés`,
      description: $localize`:@@ooxml_metadata_field_description:Description`,
      lastModifiedBy: $localize`:@@ooxml_metadata_field_last_modified_by:Dernière modification par`,
      revision: $localize`:@@ooxml_metadata_field_revision:Révision`,
      created: $localize`:@@ooxml_metadata_field_created:Création`,
      modified: $localize`:@@ooxml_metadata_field_modified:Modification`,
      lastPrinted: $localize`:@@ooxml_metadata_field_last_printed:Dernière impression`,
      category: $localize`:@@ooxml_metadata_field_category:Catégorie`,
      contentStatus: $localize`:@@ooxml_metadata_field_content_status:État du contenu`,
      identifier: $localize`:@@ooxml_metadata_field_identifier:Identifiant`,
      language: $localize`:@@ooxml_metadata_field_language:Langue`,
      version: $localize`:@@ooxml_metadata_field_version:Version`,
      contentType: $localize`:@@ooxml_metadata_field_content_type:Type de contenu`,
      Application: $localize`:@@ooxml_metadata_field_application:Application`,
      AppVersion: $localize`:@@ooxml_metadata_field_app_version:Version de l’application`,
      Company: $localize`:@@ooxml_metadata_field_company:Société`,
      Manager: $localize`:@@ooxml_metadata_field_manager:Responsable`,
      Template: $localize`:@@ooxml_metadata_field_template:Modèle`,
      HyperlinkBase: $localize`:@@ooxml_metadata_field_hyperlink_base:Base des liens`,
      DocSecurity: $localize`:@@ooxml_metadata_field_doc_security:Indicateur de sécurité`,
      TotalTime: $localize`:@@ooxml_metadata_field_total_time:Temps d’édition`,
      PresentationFormat: $localize`:@@ooxml_metadata_field_presentation_format:Format de présentation`,
      'Aperçu intégré': $localize`:@@ooxml_metadata_field_thumbnail:Aperçu intégré`,
    };
    return labels[finding.name] ?? finding.name;
  }

  formatFileSize(value: number): string {
    return formatBytes(value, this.locale);
  }

  private invalidateResult(): void {
    this.result.set(null);
    this.errorMessage.set('');
    if (!this.isBusy()) this.state.set(this.file() ? 'ready' : 'idle');
  }

  private cancelCurrentTask(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private describeError(error: unknown): string {
    if (error instanceof OoxmlMetadataValidationError) {
      if (error.code === 'empty-file') return $localize`:@@ooxml_metadata_error_empty:Le fichier sélectionné est vide.`;
      if (error.code === 'file-too-large') return $localize`:@@ooxml_metadata_error_file_size:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`;
      if (error.code === 'unsupported-format') return $localize`:@@ooxml_metadata_error_format:Sélectionnez un fichier DOCX, XLSX ou PPTX sans macros.`;
      if (error.code === 'macro-package-unsupported') return $localize`:@@ooxml_metadata_error_macro:Le package contient réellement un projet de macros. Utilisez une copie sans macros avant le nettoyage.`;
      if (error.code === 'signed-package-unsupported') return $localize`:@@ooxml_metadata_error_signature:Le package contient une signature numérique qui serait invalidée par la reconstruction.`;
      if (error.code === 'no-option-selected') return $localize`:@@ooxml_metadata_error_options:Sélectionnez au moins une catégorie à nettoyer.`;
      if (error.code === 'encrypted-entry') return $localize`:@@ooxml_metadata_error_encrypted:Le package contient une entrée chiffrée et ne peut pas être traité en sécurité.`;
      if (error.code === 'zip64-unsupported' || error.code === 'multi-disk-unsupported') return $localize`:@@ooxml_metadata_error_zip_variant:Cette variante d’archive ZIP n’est pas prise en charge.`;
      if (error.code === 'too-many-entries' || error.code === 'entry-too-large' || error.code === 'archive-too-large' || error.code === 'compression-ratio-exceeded') return $localize`:@@ooxml_metadata_error_archive_budget:Le document dépasse les limites de décompression sûre.`;
      if (error.code === 'metadata-part-too-large') return $localize`:@@ooxml_metadata_error_metadata_budget:Une partie de métadonnées est anormalement volumineuse.`;
      if (error.code === 'output-too-large') return $localize`:@@ooxml_metadata_error_output:Le document nettoyé dépasse la taille de sortie autorisée.`;
      if (error.code === 'unsafe-entry-path' || error.code === 'duplicate-entry' || error.code === 'unsupported-compression') return $localize`:@@ooxml_metadata_error_unsafe:La structure interne du document est ambiguë ou non sûre.`;
      if (error.code === 'invalid-zip' || error.code === 'invalid-ooxml') return $localize`:@@ooxml_metadata_error_invalid:Le fichier ne correspond pas à un document Office Open XML valide pour cette extension.`;
    }
    return $localize`:@@ooxml_metadata_error_generic:Impossible de nettoyer ce document. Il peut être endommagé ou utiliser une fonctionnalité non prise en charge.`;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function formatBytes(value: number, locale: string): string {
  if (value < 1_024) return `${String(value)} o`;
  const units = ['Kio', 'Mio', 'Gio'];
  let current = value / 1_024;
  let index = 0;
  while (current >= 1_024 && index < units.length - 1) {
    current /= 1_024;
    index += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(current)} ${units[index]}`;
}
