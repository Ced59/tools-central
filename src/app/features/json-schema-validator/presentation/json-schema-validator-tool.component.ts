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
  CopyJsonSchemaArtifactUseCase,
  CopyJsonSchemaShareLinkUseCase,
  DownloadJsonSchemaArtifactUseCase,
  JSON_SCHEMA_MAX_FILE_BYTES,
  JSON_SCHEMA_MAX_INSTANCE_CHARACTERS,
  JSON_SCHEMA_MAX_SCHEMA_CHARACTERS,
  JsonSchemaFileError,
  ReadJsonSchemaSourceFileUseCase,
  ValidateJsonSchemaUseCase,
  type JsonSchemaArtifact,
  type JsonSchemaDocumentSide,
  type JsonSchemaDraft,
  type JsonSchemaDraftMode,
  type JsonSchemaIssue,
  type JsonSchemaValidationError,
  type JsonSchemaValidationOptions,
  type JsonSchemaValidationResult,
} from '../application/json-schema-validator.use-cases';
import { BrowserJsonSchemaClipboardAdapter } from '../infrastructure/browser-json-schema-clipboard.adapter';
import { BrowserJsonSchemaDownloadAdapter } from '../infrastructure/browser-json-schema-download.adapter';
import { BrowserJsonSchemaFileReaderAdapter } from '../infrastructure/browser-json-schema-file-reader.adapter';
import { BrowserJsonSchemaLocationAdapter } from '../infrastructure/browser-json-schema-location.adapter';
import { JsonSchemaValidatorWorkerAdapter } from '../infrastructure/json-schema-validator-worker.adapter';

type ToolState = 'idle' | 'processing' | 'done' | 'error';
type CopiedTarget = JsonSchemaArtifact | 'share' | null;

const DEFAULT_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Profil utilisateur",
  "type": "object",
  "required": ["nom", "email", "age"],
  "properties": {
    "nom": {
      "type": "string",
      "minLength": 2,
      "examples": ["Ada Lovelace"]
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 18
    },
    "roles": {
      "type": "array",
      "items": { "enum": ["lecture", "édition", "administration"] },
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}`;

const INVALID_INSTANCE = `{
  "email": "adresse-invalide",
  "age": 15,
  "roles": ["lecture"],
  "interne": true
}`;

const VALID_INSTANCE = `{
  "nom": "Ada Lovelace",
  "email": "ada@example.com",
  "age": 36,
  "roles": ["administration"]
}`;

@Component({
  selector: 'app-json-schema-validator-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './json-schema-validator-tool.component.html',
  styleUrl: './json-schema-validator-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonSchemaValidatorToolComponent {
  private readonly validateUseCase = new ValidateJsonSchemaUseCase(new JsonSchemaValidatorWorkerAdapter());
  private readonly readFileUseCase = new ReadJsonSchemaSourceFileUseCase(new BrowserJsonSchemaFileReaderAdapter());
  private readonly clipboardAdapter = new BrowserJsonSchemaClipboardAdapter();
  private readonly copyUseCase = new CopyJsonSchemaArtifactUseCase(this.clipboardAdapter);
  private readonly downloadUseCase = new DownloadJsonSchemaArtifactUseCase(new BrowserJsonSchemaDownloadAdapter());
  private readonly shareUseCase = new CopyJsonSchemaShareLinkUseCase(
    this.clipboardAdapter,
    new BrowserJsonSchemaLocationAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private abortController: AbortController | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly maxFileSizeLabel = formatBytes(JSON_SCHEMA_MAX_FILE_BYTES, this.locale);
  readonly maxSchemaCharacters = JSON_SCHEMA_MAX_SCHEMA_CHARACTERS;
  readonly maxInstanceCharacters = JSON_SCHEMA_MAX_INSTANCE_CHARACTERS;
  readonly state = signal<ToolState>('idle');
  readonly schemaSource = signal(DEFAULT_SCHEMA);
  readonly instanceSource = signal(INVALID_INSTANCE);
  readonly schemaFileName = signal('');
  readonly instanceFileName = signal('');
  readonly options = signal<JsonSchemaValidationOptions>({ draft: 'auto', validateFormats: true });
  readonly result = signal<JsonSchemaValidationResult | null>(null);
  readonly errorMessage = signal('');
  readonly copiedTarget = signal<CopiedTarget>(null);
  readonly isBusy = computed(() => this.state() === 'processing');
  readonly canValidate = computed(() => (
    this.schemaSource().trim().length > 0
    && this.instanceSource().trim().length > 0
    && !this.isBusy()
  ));
  readonly reportPreview = computed(() => truncateOutput(this.result()?.report ?? ''));
  readonly reportPreviewTruncated = computed(() => (this.result()?.report.length ?? 0) > 50_000);
  readonly correctionPreview = computed(() => truncateOutput(this.result()?.correction?.source ?? ''));
  readonly correctionPreviewTruncated = computed(() => (this.result()?.correction?.source.length ?? 0) > 50_000);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
      this.clearCopiedTimer();
    });
  }

  updateSource(side: Exclude<JsonSchemaDocumentSide, 'engine'>, event: Event): void {
    const maximum = side === 'schema' ? JSON_SCHEMA_MAX_SCHEMA_CHARACTERS : JSON_SCHEMA_MAX_INSTANCE_CHARACTERS;
    const value = readValue(event).slice(0, maximum + 1);
    if (side === 'schema') {
      this.schemaSource.set(value);
      this.schemaFileName.set('');
    } else {
      this.instanceSource.set(value);
      this.instanceFileName.set('');
    }
    this.clearResult();
  }

  updateDraft(event: Event): void {
    const draft = (event.target as HTMLSelectElement).value as JsonSchemaDraftMode;
    this.options.update(options => ({ ...options, draft }));
    this.clearResult();
  }

  updateFormats(event: Event): void {
    const validateFormats = (event.target as HTMLInputElement).checked;
    this.options.update(options => ({ ...options, validateFormats }));
    this.clearResult();
  }

  async loadFile(side: Exclude<JsonSchemaDocumentSide, 'engine'>, event: Event): Promise<void> {
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
      if (side === 'schema') {
        this.schemaSource.set(source);
        this.schemaFileName.set(file.name);
      } else {
        this.instanceSource.set(source);
        this.instanceFileName.set(file.name);
      }
      this.state.set('idle');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set(this.describeFileError(error));
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  async validate(): Promise<void> {
    if (!this.canValidate()) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.state.set('processing');
    this.result.set(null);
    this.errorMessage.set('');
    this.copiedTarget.set(null);
    try {
      const result = await this.validateUseCase.execute(
        this.schemaSource(),
        this.instanceSource(),
        this.options(),
        controller.signal,
      );
      if (revision !== this.taskRevision) return;
      this.result.set(result);
      this.state.set(result.ok ? 'done' : 'error');
    } catch (error) {
      if (revision !== this.taskRevision || isAbortError(error)) return;
      this.errorMessage.set($localize`:@@json_schema_validate_error:La validation a échoué dans le navigateur. Réessayez avec des documents plus petits ou simplifiez les expressions régulières.`);
      this.state.set('error');
    } finally {
      if (revision === this.taskRevision) this.abortController = null;
    }
  }

  cancelValidation(): void {
    if (!this.isBusy()) return;
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.state.set('idle');
  }

  loadExample(kind: 'invalid' | 'valid'): void {
    this.schemaSource.set(DEFAULT_SCHEMA);
    this.instanceSource.set(kind === 'valid' ? VALID_INSTANCE : INVALID_INSTANCE);
    this.schemaFileName.set('');
    this.instanceFileName.set('');
    this.options.set({ draft: 'auto', validateFormats: true });
    this.clearResult();
  }

  applyCorrection(): void {
    const source = this.result()?.correction?.source;
    if (!source) return;
    this.instanceSource.set(source);
    this.instanceFileName.set('');
    this.clearResult();
  }

  async copyArtifact(artifact: JsonSchemaArtifact): Promise<void> {
    const result = this.result();
    if (!result) return;
    const copied = await this.copyUseCase.execute(result, artifact);
    this.showCopied(copied ? artifact : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_schema_copy_error:Copie automatique impossible. Sélectionnez la sortie et copiez-la manuellement.`);
    }
  }

  downloadArtifact(artifact: JsonSchemaArtifact): void {
    const result = this.result();
    if (result) this.downloadUseCase.execute(result, artifact);
  }

  async copyShareLink(): Promise<void> {
    const copied = await this.shareUseCase.execute();
    this.showCopied(copied ? 'share' : null);
    if (!copied) {
      this.errorMessage.set($localize`:@@json_schema_share_error:Impossible de copier le lien. Copiez l’adresse de la page depuis votre navigateur.`);
    }
  }

  issueLabel(issue: JsonSchemaIssue): string {
    const labels: Record<JsonSchemaIssue['code'], string> = {
      'empty-source': $localize`:@@json_schema_issue_empty:Le document est vide.`,
      'source-too-large': $localize`:@@json_schema_issue_source_large:Le document dépasse la limite autorisée.`,
      'invalid-json': $localize`:@@json_schema_issue_invalid_json:Le document n’est pas un JSON valide.`,
      'duplicate-key': $localize`:@@json_schema_issue_duplicate:Un objet contient deux fois le même nom de propriété.`,
      'unsafe-number': $localize`:@@json_schema_issue_number:Un nombre serait arrondi ou rendu infini par JavaScript. Transformez-le en chaîne pour préserver sa valeur exacte.`,
      'invalid-unicode': $localize`:@@json_schema_issue_unicode:Une chaîne contient un caractère UTF-16 non apparié.`,
      'depth-limit': $localize`:@@json_schema_issue_depth:Le document dépasse 64 niveaux d’imbrication.`,
      'node-limit': $localize`:@@json_schema_issue_nodes:Le document dépasse 100 000 valeurs JSON.`,
      'schema-root-invalid': $localize`:@@json_schema_issue_root:Un schéma JSON doit être un objet ou une valeur booléenne.`,
      'unsupported-draft': $localize`:@@json_schema_issue_draft:La déclaration $schema ne correspond pas à un brouillon pris en charge. Choisissez explicitement un brouillon pour la remplacer.`,
      'external-reference': $localize`:@@json_schema_issue_reference:Les références distantes sont désactivées. Regroupez les définitions dans le schéma et utilisez une référence locale commençant par #.`,
      'pattern-limit': $localize`:@@json_schema_issue_pattern:Le schéma contient trop d’expressions régulières ou une expression trop longue.`,
      'schema-invalid': $localize`:@@json_schema_issue_schema:Le schéma n’est pas valide pour le brouillon sélectionné.`,
      'validation-limit': $localize`:@@json_schema_issue_validation_limit:Le diagnostic exhaustif dépasserait 50 000 opérations de validation estimées. Réduisez la taille du document invalide ou validez un fragment à la fois.`,
      'validation-failed': $localize`:@@json_schema_issue_runtime:Le moteur a interrompu la validation de ce schéma.`,
      'output-too-large': $localize`:@@json_schema_issue_output:Le rapport dépasserait la limite de sortie.`,
    };
    const side = issue.side === 'schema'
      ? $localize`:@@json_schema_side_schema: Schéma.`
      : issue.side === 'instance'
        ? $localize`:@@json_schema_side_instance: Données.`
        : '';
    const path = issue.path ? $localize`:@@json_schema_issue_path: Chemin ${issue.path}:path:.` : '';
    const position = issue.position === null
      ? ''
      : $localize`:@@json_schema_issue_position: Position ${this.formatNumber(issue.position + 1)}:position:.`;
    const detail = issue.detail ? $localize`:@@json_schema_issue_detail: Détail : ${issue.detail}:detail:.` : '';
    return `${labels[issue.code]}${side}${path}${position}${detail}`;
  }

  validationErrorLabel(error: JsonSchemaValidationError): string {
    const path = this.displayPath(error.instancePath);
    const property = error.property || '';
    const expected = error.expected || '';
    const limit = error.limit === null ? '' : this.formatNumber(error.limit);
    const labels: Readonly<Record<string, string>> = {
      required: $localize`:@@json_schema_error_required:${path}:path: doit contenir la propriété obligatoire « ${property}:property: ».`,
      additionalProperties: $localize`:@@json_schema_error_additional:${path}:path: contient la propriété non autorisée « ${property}:property: ».`,
      type: $localize`:@@json_schema_error_type:${path}:path: doit être du type ${expected}:expected:.`,
      enum: $localize`:@@json_schema_error_enum:${path}:path: doit correspondre à l’une des valeurs autorisées ${expected}:expected:.`,
      const: $localize`:@@json_schema_error_const:${path}:path: doit correspondre à la valeur constante attendue.`,
      format: $localize`:@@json_schema_error_format:${path}:path: ne respecte pas le format ${expected}:expected:.`,
      pattern: $localize`:@@json_schema_error_pattern:${path}:path: ne respecte pas l’expression régulière du schéma.`,
      minLength: $localize`:@@json_schema_error_min_length:${path}:path: doit contenir au moins ${limit}:limit: caractères.`,
      maxLength: $localize`:@@json_schema_error_max_length:${path}:path: doit contenir au maximum ${limit}:limit: caractères.`,
      minimum: $localize`:@@json_schema_error_minimum:${path}:path: doit être supérieur ou égal à ${limit}:limit:.`,
      maximum: $localize`:@@json_schema_error_maximum:${path}:path: doit être inférieur ou égal à ${limit}:limit:.`,
      exclusiveMinimum: $localize`:@@json_schema_error_exclusive_min:${path}:path: doit être strictement supérieur à ${limit}:limit:.`,
      exclusiveMaximum: $localize`:@@json_schema_error_exclusive_max:${path}:path: doit être strictement inférieur à ${limit}:limit:.`,
      minItems: $localize`:@@json_schema_error_min_items:${path}:path: doit contenir au moins ${limit}:limit: éléments.`,
      maxItems: $localize`:@@json_schema_error_max_items:${path}:path: doit contenir au maximum ${limit}:limit: éléments.`,
      uniqueItems: $localize`:@@json_schema_error_unique:${path}:path: ne doit pas contenir de doublons.`,
      minProperties: $localize`:@@json_schema_error_min_properties:${path}:path: doit contenir au moins ${limit}:limit: propriétés.`,
      maxProperties: $localize`:@@json_schema_error_max_properties:${path}:path: doit contenir au maximum ${limit}:limit: propriétés.`,
      multipleOf: $localize`:@@json_schema_error_multiple:${path}:path: doit être un multiple de ${limit}:limit:.`,
      anyOf: $localize`:@@json_schema_error_any_of:${path}:path: doit respecter au moins une variante anyOf.`,
      oneOf: $localize`:@@json_schema_error_one_of:${path}:path: doit respecter exactement une variante oneOf.`,
      allOf: $localize`:@@json_schema_error_all_of:${path}:path: doit respecter toutes les variantes allOf.`,
      not: $localize`:@@json_schema_error_not:${path}:path: respecte une variante interdite par not.`,
      'false schema': $localize`:@@json_schema_error_false:${path}:path: est interdit par le schéma.`,
      unevaluatedProperties: $localize`:@@json_schema_error_unevaluated:${path}:path: contient une propriété non évaluée par le schéma.`,
    };
    return labels[error.keyword]
      ?? $localize`:@@json_schema_error_generic:${path}:path: ne respecte pas la règle « ${error.keyword}:keyword: » du schéma.`;
  }

  draftLabel(draft: JsonSchemaDraft | null): string {
    if (draft === 'draft-2020-12') return 'Draft 2020-12';
    if (draft === 'draft-2019-09') return 'Draft 2019-09';
    if (draft === 'draft-07') return 'Draft 7';
    return '—';
  }

  displayPath(path: string): string {
    return path || $localize`:@@json_schema_root_path:Racine`;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  trackError(index: number, error: JsonSchemaValidationError): string {
    return `${error.keyword}:${error.instancePath}:${error.schemaPath}:${String(index)}`;
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
    if (error instanceof JsonSchemaFileError) {
      if (error.code === 'empty-file') return $localize`:@@json_schema_file_empty:Le fichier sélectionné est vide.`;
      if (error.code === 'file-too-large') {
        return $localize`:@@json_schema_file_large:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`;
      }
      if (error.code === 'unsupported-file') return $localize`:@@json_schema_file_format:Sélectionnez un fichier JSON, SCHEMA ou TXT.`;
      return $localize`:@@json_schema_file_encoding:Le fichier n’est pas encodé en UTF-8 valide.`;
    }
    return $localize`:@@json_schema_file_error:Impossible de lire ce fichier localement.`;
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
