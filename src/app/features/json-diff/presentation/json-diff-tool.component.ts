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
  CompareJsonDocumentsUseCase,
  CopyJsonDiffArtifactUseCase,
  CopyJsonDiffShareLinkUseCase,
  DownloadJsonDiffArtifactUseCase,
  JSON_DIFF_MAX_FILE_BYTES,
  JSON_DIFF_MAX_SOURCE_CHARACTERS,
  JsonDiffFileError,
  ReadJsonDiffSourceFileUseCase,
  type JsonDiffArrayMode,
  type JsonDiffArtifact,
  type JsonDiffChangeKind,
  type JsonDiffChangePreview,
  type JsonDiffDocumentSide,
  type JsonDiffIssue,
  type JsonDiffOptions,
  type JsonDiffResult,
} from '../application/json-diff.use-cases';
import { BrowserJsonDiffClipboardAdapter } from '../infrastructure/browser-json-diff-clipboard.adapter';
import { BrowserJsonDiffDownloadAdapter } from '../infrastructure/browser-json-diff-download.adapter';
import { BrowserJsonDiffFileReaderAdapter } from '../infrastructure/browser-json-diff-file-reader.adapter';
import { BrowserJsonDiffLocationAdapter } from '../infrastructure/browser-json-diff-location.adapter';
import { JsonDiffWorkerAdapter } from '../infrastructure/json-diff-worker.adapter';

type ToolState = 'idle' | 'processing' | 'done' | 'error';
type CopiedTarget = JsonDiffArtifact | 'share' | null;

const DEFAULT_LEFT = $localize`:Exemple JSON gauche du comparateur@@json_diff_default_left:{
  "version": "1",
  "utilisateurs": [
    { "id": "ada", "rôle": "administration", "ville": "Londres" },
    { "id": "grace", "rôle": "développement", "ville": "New York" }
  ],
  "métadonnées": { "miseÀJour": "ancienne" }
}`;

const DEFAULT_RIGHT = $localize`:Exemple JSON droit du comparateur@@json_diff_default_right:{
  "version": "2",
  "utilisateurs": [
    { "id": "grace", "rôle": "architecture", "ville": "New York" },
    { "id": "ada", "rôle": "administration", "ville": "Londres" },
    { "id": "margaret", "rôle": "recherche", "ville": "Washington" }
  ],
  "métadonnées": { "miseÀJour": "récente" }
}`;

@Component({
  selector: 'app-json-diff-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './json-diff-tool.component.html',
  styleUrl: './json-diff-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonDiffToolComponent {
  private readonly compareUseCase = new CompareJsonDocumentsUseCase(new JsonDiffWorkerAdapter());
  private readonly readFileUseCase = new ReadJsonDiffSourceFileUseCase(new BrowserJsonDiffFileReaderAdapter());
  private readonly clipboardAdapter = new BrowserJsonDiffClipboardAdapter();
  private readonly copyUseCase = new CopyJsonDiffArtifactUseCase(this.clipboardAdapter);
  private readonly downloadUseCase = new DownloadJsonDiffArtifactUseCase(new BrowserJsonDiffDownloadAdapter());
  private readonly shareUseCase = new CopyJsonDiffShareLinkUseCase(
    this.clipboardAdapter,
    new BrowserJsonDiffLocationAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private abortController: AbortController | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly maxFileSizeLabel = formatBytes(JSON_DIFF_MAX_FILE_BYTES, this.locale);
  readonly maxSourceCharacters = JSON_DIFF_MAX_SOURCE_CHARACTERS;
  readonly state = signal<ToolState>('idle');
  readonly leftSource = signal(DEFAULT_LEFT);
  readonly rightSource = signal(DEFAULT_RIGHT);
  readonly leftFileName = signal('');
  readonly rightFileName = signal('');
  readonly options = signal<JsonDiffOptions>({
    arrayMode: 'index',
    arrayKey: '/id',
    ignoredPaths: '',
  });
  readonly result = signal<JsonDiffResult | null>(null);
  readonly errorMessage = signal('');
  readonly copiedTarget = signal<CopiedTarget>(null);
  readonly isBusy = computed(() => this.state() === 'processing');
  readonly canCompare = computed(() => (
    this.leftSource().trim().length > 0
    && this.rightSource().trim().length > 0
    && !this.isBusy()
  ));
  readonly patchPreview = computed(() => truncateOutput(this.result()?.patch ?? ''));
  readonly reportPreview = computed(() => truncateOutput(this.result()?.report ?? ''));
  readonly patchPreviewTruncated = computed(() => (this.result()?.patch.length ?? 0) > 50_000);
  readonly reportPreviewTruncated = computed(() => (this.result()?.report.length ?? 0) > 50_000);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
      this.clearCopiedTimer();
    });
  }

  updateSource(side: JsonDiffDocumentSide, event: Event): void {
    const value = readValue(event).slice(0, JSON_DIFF_MAX_SOURCE_CHARACTERS + 1);
    if (side === 'left') {
      this.leftSource.set(value);
      this.leftFileName.set('');
    } else {
      this.rightSource.set(value);
      this.rightFileName.set('');
    }
    this.clearResult();
  }

  updateArrayMode(event: Event): void {
    const arrayMode = (event.target as HTMLSelectElement).value as JsonDiffArrayMode;
    this.options.update(options => ({ ...options, arrayMode }));
    this.clearResult();
  }

  updateArrayKey(event: Event): void {
    this.options.update(options => ({ ...options, arrayKey: readValue(event).slice(0, 500) }));
    this.clearResult();
  }

  updateIgnoredPaths(event: Event): void {
    this.options.update(options => ({
      ...options,
      ignoredPaths: readValue(event).slice(0, 20_000),
    }));
    this.clearResult();
  }

  async loadFile(side: JsonDiffDocumentSide, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    this.state.set('idle');
    try {
      const source = await this.readFileUseCase.execute({
        fileName: file.name,
        size: file.size,
        blob: file,
      }, controller.signal);
      if (revision !== this.taskRevision) return;
      if (side === 'left') {
        this.leftSource.set(source);
        this.leftFileName.set(file.name);
      } else {
        this.rightSource.set(source);
        this.rightFileName.set(file.name);
      }
      this.result.set(null);
      this.state.set('idle');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set(this.describeFileError(error));
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  async compare(): Promise<void> {
    if (!this.canCompare()) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.state.set('processing');
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    try {
      const result = await this.compareUseCase.execute(
        this.leftSource(),
        this.rightSource(),
        this.options(),
        controller.signal,
      );
      if (revision !== this.taskRevision) return;
      this.result.set(result);
      this.state.set(result.ok ? 'done' : 'error');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set($localize`:@@json_diff_compare_error:La comparaison a échoué dans le navigateur. Réessayez avec des documents plus petits.`);
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  swapDocuments(): void {
    const left = this.leftSource();
    const leftName = this.leftFileName();
    this.leftSource.set(this.rightSource());
    this.rightSource.set(left);
    this.leftFileName.set(this.rightFileName());
    this.rightFileName.set(leftName);
    this.clearResult();
  }

  resetExamples(): void {
    this.leftSource.set(DEFAULT_LEFT);
    this.rightSource.set(DEFAULT_RIGHT);
    this.leftFileName.set('');
    this.rightFileName.set('');
    this.options.set({ arrayMode: 'index', arrayKey: '/id', ignoredPaths: '' });
    this.clearResult();
  }

  async copyArtifact(artifact: JsonDiffArtifact): Promise<void> {
    const result = this.result();
    if (!result) return;
    const copied = await this.copyUseCase.execute(result, artifact);
    this.showCopied(copied ? artifact : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_diff_copy_error:Copie automatique impossible. Sélectionnez la sortie et copiez-la manuellement.`);
    }
  }

  downloadArtifact(artifact: JsonDiffArtifact): void {
    const result = this.result();
    if (result) this.downloadUseCase.execute(result, artifact);
  }

  async copyShareLink(): Promise<void> {
    const copied = await this.shareUseCase.execute();
    this.showCopied(copied ? 'share' : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_diff_share_error:Impossible de copier le lien. Copiez l’adresse de la page depuis votre navigateur.`);
    }
  }

  issueLabel(issue: JsonDiffIssue): string {
    const labels: Record<JsonDiffIssue['code'], string> = {
      'empty-source': $localize`:@@json_diff_issue_empty:Le document est vide.`,
      'source-too-large': $localize`:@@json_diff_issue_source_large:Le document dépasse la limite de 2 000 000 de caractères.`,
      'invalid-json': $localize`:@@json_diff_issue_invalid:Le document n’est pas un JSON valide.`,
      'duplicate-key': $localize`:@@json_diff_issue_duplicate:Un objet contient deux fois le même nom de propriété.`,
      'unsafe-number': $localize`:@@json_diff_issue_number:Un nombre serait arrondi ou rendu infini par JavaScript. Transformez-le en chaîne pour préserver sa valeur exacte.`,
      'invalid-unicode': $localize`:@@json_diff_issue_unicode:Une chaîne contient un caractère UTF-16 non apparié.`,
      'depth-limit': $localize`:@@json_diff_issue_depth:Le document dépasse 64 niveaux d’imbrication.`,
      'node-limit': $localize`:@@json_diff_issue_nodes:Le document dépasse 100 000 valeurs JSON.`,
      'invalid-ignore-path': $localize`:@@json_diff_issue_ignore:Un chemin ignoré n’est pas un JSON Pointer valide.`,
      'array-key-required': $localize`:@@json_diff_issue_key_required:Indiquez la clé d’association sous forme de JSON Pointer, par exemple /id.`,
      'array-key-invalid': $localize`:@@json_diff_issue_key_invalid:Un objet du tableau ne possède pas une clé d’association scalaire valide.`,
      'array-key-duplicate': $localize`:@@json_diff_issue_key_duplicate:Une même clé d’association apparaît plusieurs fois dans un tableau.`,
      'array-ignore-conflict': $localize`:@@json_diff_issue_array_ignore_conflict:Ces exclusions positionnelles déplaceraient un élément ignoré dans le patch. Ignorez le tableau entier ou comparez-le sans générer ce conflit.`,
      'change-limit': $localize`:@@json_diff_issue_changes:La comparaison dépasse la limite de 20 000 différences.`,
      'output-too-large': $localize`:@@json_diff_issue_output:Le rapport et le patch dépasseraient la limite de sortie.`,
    };
    const side = issue.side === 'left'
      ? $localize`:@@json_diff_side_left: Document gauche.`
      : issue.side === 'right'
        ? $localize`:@@json_diff_side_right: Document droit.`
        : '';
    const path = issue.path
      ? $localize`:@@json_diff_issue_path: Chemin ${issue.path}:path:.`
      : '';
    const position = issue.position === null
      ? ''
      : $localize`:@@json_diff_issue_position: Position ${this.formatNumber(issue.position + 1)}:position:.`;
    return `${labels[issue.code]}${side}${path}${position}`;
  }

  changeKindLabel(kind: JsonDiffChangeKind): string {
    const labels: Record<JsonDiffChangeKind, string> = {
      added: $localize`:@@json_diff_kind_added:Ajout`,
      removed: $localize`:@@json_diff_kind_removed:Suppression`,
      changed: $localize`:@@json_diff_kind_changed:Valeur modifiée`,
      'type-changed': $localize`:@@json_diff_kind_type:Type modifié`,
      moved: $localize`:@@json_diff_kind_moved:Déplacement`,
    };
    return labels[kind];
  }

  moveLabel(change: JsonDiffChangePreview): string {
    if (change.beforeIndex === null || change.afterIndex === null) return '';
    return $localize`:@@json_diff_move_label:Indice ${this.formatNumber(change.beforeIndex)}:before: → ${this.formatNumber(change.afterIndex)}:after:`;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  trackChange(index: number, change: JsonDiffChangePreview): string {
    return `${change.kind}:${change.path}:${String(index)}`;
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

  private showCopied(target: CopiedTarget): void {
    this.clearCopiedTimer();
    this.copiedTarget.set(target);
    if (target !== null) {
      this.copiedTimer = setTimeout(() => {
        this.copiedTarget.set(null);
        this.copiedTimer = null;
      }, 2_500);
    }
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }

  private describeFileError(error: unknown): string {
    if (error instanceof JsonDiffFileError) {
      if (error.code === 'empty-file') return $localize`:@@json_diff_file_empty:Le fichier sélectionné est vide.`;
      if (error.code === 'file-too-large') {
        return $localize`:@@json_diff_file_large:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`;
      }
      if (error.code === 'unsupported-file') return $localize`:@@json_diff_file_format:Sélectionnez un fichier JSON ou TXT.`;
      return $localize`:@@json_diff_file_encoding:Le fichier n’est pas encodé en UTF-8 valide.`;
    }
    return $localize`:@@json_diff_file_error:Impossible de lire ce fichier localement.`;
  }
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function formatBytes(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'megabyte',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value / 1_000_000);
}

function truncateOutput(value: string): string {
  return value.length > 50_000 ? `${value.slice(0, 50_000)}\n…` : value;
}
