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
  CopyJsonToTypeScriptArtifactUseCase,
  CopyJsonToTypeScriptShareLinkUseCase,
  DownloadJsonToTypeScriptArtifactUseCase,
  GenerateTypeScriptFromJsonUseCase,
  JSON_TO_TYPESCRIPT_MAX_FILE_BYTES,
  JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS,
  JsonToTypeScriptFileError,
  ReadJsonToTypeScriptSourceFileUseCase,
  type JsonToTypeScriptArtifact,
  type JsonToTypeScriptIssue,
  type JsonToTypeScriptOptions,
  type JsonToTypeScriptResult,
  type JsonToTypeScriptWarning,
  type TypeScriptArrayObjectMode,
  type TypeScriptDeclarationKind,
} from '../application/json-to-typescript.use-cases';
import { BrowserJsonToTypeScriptClipboardAdapter } from '../infrastructure/browser-json-to-typescript-clipboard.adapter';
import { BrowserJsonToTypeScriptDownloadAdapter } from '../infrastructure/browser-json-to-typescript-download.adapter';
import { BrowserJsonToTypeScriptFileReaderAdapter } from '../infrastructure/browser-json-to-typescript-file-reader.adapter';
import { BrowserJsonToTypeScriptLocationAdapter } from '../infrastructure/browser-json-to-typescript-location.adapter';
import { JsonToTypeScriptWorkerAdapter } from '../infrastructure/json-to-typescript-worker.adapter';

type ToolState = 'idle' | 'loading' | 'processing' | 'done' | 'error';
type CopiedTarget = JsonToTypeScriptArtifact | 'share' | null;

const DEFAULT_SOURCE = $localize`:Exemple JSON du générateur TypeScript@@json_ts_default_source:{
  "id": "cmd_2026_001",
  "createdAt": "2026-09-18T14:30:00Z",
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.test"
  },
  "items": [
    { "sku": "BOOK-01", "quantity": 2, "discount": null },
    { "sku": "PEN-02", "quantity": 4, "note": "Livraison rapide" }
  ],
  "paid": true
}`;

const API_SOURCE = $localize`:Second exemple JSON du générateur TypeScript@@json_ts_api_source:[
  { "id": 1, "role": "admin", "profile": { "displayName": "Ada" } },
  { "id": 2, "role": "editor", "profile": { "displayName": "Grace", "avatarUrl": null } },
  { "id": 3, "role": null }
]`;

@Component({
  selector: 'app-json-to-typescript-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './json-to-typescript-tool.component.html',
  styleUrl: './json-to-typescript-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonToTypeScriptToolComponent {
  private readonly generateUseCase = new GenerateTypeScriptFromJsonUseCase(
    new JsonToTypeScriptWorkerAdapter(),
  );
  private readonly readFileUseCase = new ReadJsonToTypeScriptSourceFileUseCase(
    new BrowserJsonToTypeScriptFileReaderAdapter(),
  );
  private readonly clipboard = new BrowserJsonToTypeScriptClipboardAdapter();
  private readonly copyUseCase = new CopyJsonToTypeScriptArtifactUseCase(this.clipboard);
  private readonly downloadUseCase = new DownloadJsonToTypeScriptArtifactUseCase(
    new BrowserJsonToTypeScriptDownloadAdapter(),
  );
  private readonly shareUseCase = new CopyJsonToTypeScriptShareLinkUseCase(
    this.clipboard,
    new BrowserJsonToTypeScriptLocationAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private abortController: AbortController | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly maxSourceCharacters = JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS;
  readonly maxFileSizeLabel = formatBytes(JSON_TO_TYPESCRIPT_MAX_FILE_BYTES, this.locale);
  readonly state = signal<ToolState>('idle');
  readonly source = signal(DEFAULT_SOURCE);
  readonly fileName = signal('');
  readonly options = signal<JsonToTypeScriptOptions>({
    rootName: 'Commande',
    declarationKind: 'interface',
    arrayObjectMode: 'merge',
    inferDates: true,
    readonlyProperties: false,
  });
  readonly result = signal<JsonToTypeScriptResult | null>(null);
  readonly errorMessage = signal('');
  readonly copiedTarget = signal<CopiedTarget>(null);
  readonly isLoading = computed(() => this.state() === 'loading');
  readonly isProcessing = computed(() => this.state() === 'processing');
  readonly isBusy = computed(() => this.isLoading() || this.isProcessing());
  readonly canGenerate = computed(() => this.source().trim().length > 0 && !this.isBusy());
  readonly outputPreview = computed(() => truncateOutput(this.result()?.output ?? ''));
  readonly reportPreview = computed(() => truncateOutput(this.result()?.report ?? ''));
  readonly outputPreviewTruncated = computed(() => (this.result()?.output.length ?? 0) > 80_000);
  readonly reportPreviewTruncated = computed(() => (this.result()?.report.length ?? 0) > 80_000);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
      this.clearCopiedTimer();
    });
  }

  updateSource(event: Event): void {
    this.source.set(readValue(event).slice(0, JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS + 1));
    this.fileName.set('');
    this.clearResult();
  }

  updateRootName(event: Event): void {
    this.options.update(options => ({ ...options, rootName: readValue(event).slice(0, 120) }));
    this.clearResult();
  }

  updateDeclarationKind(event: Event): void {
    const declarationKind = (event.target as HTMLSelectElement).value as TypeScriptDeclarationKind;
    this.options.update(options => ({ ...options, declarationKind }));
    this.clearResult();
  }

  updateArrayObjectMode(event: Event): void {
    const arrayObjectMode = (event.target as HTMLSelectElement).value as TypeScriptArrayObjectMode;
    this.options.update(options => ({ ...options, arrayObjectMode }));
    this.clearResult();
  }

  updateInferDates(event: Event): void {
    const inferDates = (event.target as HTMLInputElement).checked;
    this.options.update(options => ({ ...options, inferDates }));
    this.clearResult();
  }

  updateReadonlyProperties(event: Event): void {
    const readonlyProperties = (event.target as HTMLInputElement).checked;
    this.options.update(options => ({ ...options, readonlyProperties }));
    this.clearResult();
  }

  async loadFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.state.set('loading');
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    try {
      const source = await this.readFileUseCase.execute({
        fileName: file.name,
        size: file.size,
        blob: file,
      }, controller.signal);
      if (revision !== this.taskRevision) return;
      this.source.set(source.slice(0, JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS + 1));
      this.fileName.set(file.name);
      this.state.set('idle');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set(this.describeFileError(error));
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  async generate(): Promise<void> {
    if (!this.canGenerate()) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.state.set('processing');
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    try {
      const result = await this.generateUseCase.execute(
        this.source(),
        this.options(),
        controller.signal,
      );
      if (revision !== this.taskRevision) return;
      this.result.set(result);
      this.state.set(result.ok ? 'done' : 'error');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set($localize`:@@json_ts_generation_error:La génération a échoué dans le navigateur. Réessayez avec un document plus petit.`);
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  cancelGeneration(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.state.set('idle');
  }

  loadExample(kind: 'order' | 'api'): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.source.set(kind === 'order' ? DEFAULT_SOURCE : API_SOURCE);
    this.fileName.set('');
    this.options.update(options => ({
      ...options,
      rootName: kind === 'order' ? 'Commande' : 'Utilisateurs',
    }));
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    this.state.set('idle');
  }

  async copyArtifact(artifact: JsonToTypeScriptArtifact): Promise<void> {
    const result = this.result();
    if (!result) return;
    const copied = await this.copyUseCase.execute(result, artifact);
    this.showCopied(copied ? artifact : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_ts_copy_error:Copie automatique impossible. Sélectionnez la sortie et copiez-la manuellement.`);
    }
  }

  downloadArtifact(artifact: JsonToTypeScriptArtifact): void {
    const result = this.result();
    if (result) this.downloadUseCase.execute(result, artifact);
  }

  async copyShareLink(): Promise<void> {
    const copied = await this.shareUseCase.execute();
    this.showCopied(copied ? 'share' : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_ts_share_error:Impossible de copier le lien. Copiez l’adresse depuis votre navigateur.`);
    }
  }

  issueLabel(issue: JsonToTypeScriptIssue): string {
    const labels: Record<JsonToTypeScriptIssue['code'], string> = {
      'empty-source': $localize`:@@json_ts_issue_empty:Le document JSON est vide.`,
      'source-too-large': $localize`:@@json_ts_issue_source_large:Le document dépasse la limite de 2 000 000 de caractères.`,
      'invalid-json': $localize`:@@json_ts_issue_invalid:Le document n’est pas un JSON valide.`,
      'duplicate-key': $localize`:@@json_ts_issue_duplicate:Un objet contient deux fois le même nom de propriété.`,
      'unsafe-number': $localize`:@@json_ts_issue_number:Un nombre ne peut pas être représenté exactement en JavaScript.`,
      'invalid-unicode': $localize`:@@json_ts_issue_unicode:Une chaîne contient une séquence Unicode invalide.`,
      'depth-limit': $localize`:@@json_ts_issue_depth:Le document dépasse la profondeur maximale de 64 niveaux.`,
      'node-limit': $localize`:@@json_ts_issue_nodes:Le document dépasse la limite de 100 000 valeurs.`,
      'complexity-limit': $localize`:@@json_ts_issue_complexity:La structure contient trop de déclarations ou de propriétés pour un export sûr.`,
      'output-too-large': $localize`:@@json_ts_issue_output:Le code généré dépasse la limite de 2 000 000 de caractères.`,
    };
    const suffix = issue.position === null
      ? ''
      : ` ${$localize`:@@json_ts_position:Position`} ${this.formatNumber(issue.position + 1)}.`;
    return `${labels[issue.code]}${suffix}`;
  }

  warningLabel(warning: JsonToTypeScriptWarning): string {
    const count = this.formatNumber(warning.count);
    const labels: Record<JsonToTypeScriptWarning['code'], string> = {
      'root-name-normalized': $localize`:@@json_ts_warning_name:Le nom de racine a été normalisé en ${warning.detail}:normalizedName:.`,
      'date-inference': $localize`:@@json_ts_warning_dates:${count}:count: chaîne(s) ISO ont été typées Date. Le JSON reçu contient toujours des chaînes : hydratez-les avant utilisation.`,
      'empty-array': $localize`:@@json_ts_warning_empty_array:${count}:count: tableau(x) vide(s) utilisent unknown faute d’échantillon.`,
      'empty-object': $localize`:@@json_ts_warning_empty_object:${count}:count: objet(s) vide(s) ne permettent pas d’inférer de propriétés.`,
      'optional-properties': $localize`:@@json_ts_warning_optional:${count}:count: propriété(s) absente(s) de certains échantillons ont été rendues optionnelles.`,
      'heterogeneous-array': $localize`:@@json_ts_warning_heterogeneous:${count}:count: tableau(x) hétérogène(s) ont nécessité une fusion ou une union.`,
    };
    return labels[warning.code];
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  private clearResult(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    this.state.set('idle');
  }

  private cancelCurrentTask(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private describeFileError(error: unknown): string {
    if (!(error instanceof JsonToTypeScriptFileError)) {
      return $localize`:@@json_ts_file_unknown:Le fichier n’a pas pu être lu localement.`;
    }
    const messages: Record<JsonToTypeScriptFileError['code'], string> = {
      'empty-file': $localize`:@@json_ts_file_empty:Le fichier sélectionné est vide.`,
      'file-too-large': $localize`:@@json_ts_file_large:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:maxFileSize:.`,
      'unsupported-file': $localize`:@@json_ts_file_type:Choisissez un fichier .json ou .txt.`,
      'invalid-utf8': $localize`:@@json_ts_file_utf8:Le fichier n’est pas un texte UTF-8 valide.`,
    };
    return messages[error.code];
  }

  private showCopied(target: CopiedTarget): void {
    this.clearCopiedTimer();
    this.copiedTarget.set(target);
    if (target) {
      this.copiedTimer = setTimeout(() => {
        this.copiedTarget.set(null);
      }, 2_000);
    }
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function truncateOutput(value: string): string {
  return value.length > 80_000 ? `${value.slice(0, 80_000)}\n…` : value;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function formatBytes(bytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1_000_000)} MB`;
}
