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
  ConvertCsvJsonUseCase,
  CopyCsvJsonOutputUseCase,
  CSV_JSON_MAX_FILE_BYTES,
  CSV_JSON_MAX_SOURCE_CHARACTERS,
  CsvJsonValidationError,
  DownloadCsvJsonOutputUseCase,
  ReadCsvJsonSourceFileUseCase,
  type CsvJsonConversionOptions,
  type CsvJsonConversionResult,
  type CsvJsonDelimiter,
  type CsvJsonDirection,
  type CsvJsonIssue,
  type CsvJsonIssueCode,
} from '../application/csv-json.use-cases';
import { BrowserCsvJsonClipboardAdapter } from '../infrastructure/browser-csv-json-clipboard.adapter';
import { BrowserCsvJsonDownloadAdapter } from '../infrastructure/browser-csv-json-download.adapter';
import { BrowserCsvJsonFileReaderAdapter } from '../infrastructure/browser-csv-json-file-reader.adapter';
import { CsvJsonWorkerAdapter } from '../infrastructure/csv-json-worker.adapter';

type ToolState = 'idle' | 'processing' | 'done' | 'error';
type BooleanOption = 'firstRowHeaders' | 'trimCells' | 'inferTypes'
  | 'protectSpreadsheetFormulas' | 'includeBom';

const DEFAULT_CSV = 'nom;email;actif;score\nAda Lovelace;ada@example.test;true;98.5\nGrace Hopper;grace@example.test;true;100';
const DEFAULT_JSON = `[
  {
    "id": 1,
    "profil": { "nom": "Ada Lovelace" },
    "tags": ["mathématiques", "code"]
  },
  {
    "id": 2,
    "profil": { "nom": "Grace Hopper" },
    "tags": ["compilateur", "marine"]
  }
]`;

@Component({
  selector: 'app-csv-json-converter-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './csv-json-converter-tool.component.html',
  styleUrl: './csv-json-converter-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsvJsonConverterToolComponent {
  private readonly convertUseCase = new ConvertCsvJsonUseCase(new CsvJsonWorkerAdapter());
  private readonly readFileUseCase = new ReadCsvJsonSourceFileUseCase(new BrowserCsvJsonFileReaderAdapter());
  private readonly copyUseCase = new CopyCsvJsonOutputUseCase(new BrowserCsvJsonClipboardAdapter());
  private readonly downloadUseCase = new DownloadCsvJsonOutputUseCase(new BrowserCsvJsonDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private abortController: AbortController | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly maxFileSizeLabel = formatBytes(CSV_JSON_MAX_FILE_BYTES, this.locale);
  readonly maxSourceCharacters = CSV_JSON_MAX_SOURCE_CHARACTERS;
  readonly state = signal<ToolState>('idle');
  readonly source = signal(DEFAULT_CSV);
  readonly fileName = signal('');
  readonly options = signal<CsvJsonConversionOptions>(createOptions('csv-to-json'));
  readonly result = signal<CsvJsonConversionResult | null>(null);
  readonly errorMessage = signal('');
  readonly copied = signal(false);
  readonly isBusy = computed(() => this.state() === 'processing');
  readonly canConvert = computed(() => this.source().trim().length > 0 && !this.isBusy());
  readonly outputPreview = computed(() => {
    const output = this.result()?.output ?? '';
    return output.length > 50_000 ? `${output.slice(0, 50_000)}\n…` : output;
  });
  readonly outputPreviewTruncated = computed(() => (this.result()?.output.length ?? 0) > 50_000);
  readonly errorCount = computed(() => this.result()?.issues.filter(issue => issue.severity === 'error').length ?? 0);
  readonly warningCount = computed(() => this.result()?.issues.filter(issue => issue.severity === 'warning').length ?? 0);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelCurrentTask();
      this.clearCopiedTimer();
    });
  }

  selectDirection(direction: CsvJsonDirection): void {
    if (this.options().direction === direction) return;
    this.cancelCurrentTask();
    this.options.set(createOptions(direction));
    this.source.set(direction === 'csv-to-json' ? DEFAULT_CSV : DEFAULT_JSON);
    this.fileName.set('');
    this.clearResult();
  }

  updateSource(event: Event): void {
    this.source.set(readValue(event).slice(0, CSV_JSON_MAX_SOURCE_CHARACTERS + 1));
    this.fileName.set('');
    this.clearResult();
  }

  updateMapping(event: Event): void {
    this.options.update(options => ({ ...options, mapping: readValue(event).slice(0, 20_000) }));
    this.clearResult();
  }

  updateDelimiter(event: Event): void {
    this.options.update(options => ({
      ...options,
      delimiter: (event.target as HTMLSelectElement).value as CsvJsonDelimiter,
    }));
    this.clearResult();
  }

  updateBooleanOption(name: BooleanOption, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.options.update(options => ({ ...options, [name]: checked }));
    this.clearResult();
  }

  async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.errorMessage.set('');
    this.result.set(null);
    this.state.set('processing');
    try {
      const content = await this.readFileUseCase.execute({
        fileName: file.name,
        size: file.size,
        blob: file,
      }, controller.signal);
      if (revision !== this.taskRevision) return;
      const direction: CsvJsonDirection = file.name.toLowerCase().endsWith('.json')
        ? 'json-to-csv'
        : 'csv-to-json';
      this.options.set({
        ...createOptions(direction),
        delimiter: file.name.toLowerCase().endsWith('.tsv') ? 'tab' : 'auto',
      });
      this.source.set(content.slice(0, CSV_JSON_MAX_SOURCE_CHARACTERS + 1));
      this.fileName.set(file.name);
      this.state.set('idle');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) {
        this.errorMessage.set(this.describeError(error));
        this.state.set('error');
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }

  async convert(): Promise<void> {
    if (!this.canConvert()) return;
    const revision = ++this.taskRevision;
    this.cancelCurrentTask();
    const controller = new AbortController();
    this.abortController = controller;
    this.result.set(null);
    this.errorMessage.set('');
    this.copied.set(false);
    this.state.set('processing');
    try {
      const result = await this.convertUseCase.execute(this.source(), this.options(), controller.signal);
      if (revision !== this.taskRevision) return;
      this.result.set(result);
      this.state.set(result.ok ? 'done' : 'error');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) {
        this.errorMessage.set($localize`:@@csv_json_error_generic:La conversion a échoué. Vérifiez la source et réessayez.`);
        this.state.set('error');
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }

  cancel(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.state.set('idle');
  }

  async copyOutput(): Promise<void> {
    const result = this.result();
    if (!result) return;
    const copied = await this.copyUseCase.execute(result);
    this.clearCopiedTimer();
    this.copied.set(copied);
    if (copied) {
      this.copiedTimer = setTimeout(() => {
        this.copied.set(false);
      }, 2_000);
    }
  }

  downloadOutput(): void {
    const result = this.result();
    if (result) this.downloadUseCase.execute(result);
  }

  reset(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    const direction = this.options().direction;
    this.options.set(createOptions(direction));
    this.source.set(direction === 'csv-to-json' ? DEFAULT_CSV : DEFAULT_JSON);
    this.fileName.set('');
    this.errorMessage.set('');
    this.result.set(null);
    this.copied.set(false);
    this.state.set('idle');
  }

  delimiterLabel(delimiter: Exclude<CsvJsonDelimiter, 'auto'>): string {
    if (delimiter === 'comma') return $localize`:@@csv_json_delimiter_comma:Virgule`;
    if (delimiter === 'semicolon') return $localize`:@@csv_json_delimiter_semicolon:Point-virgule`;
    if (delimiter === 'tab') return $localize`:@@csv_json_delimiter_tab:Tabulation`;
    return $localize`:@@csv_json_delimiter_pipe:Barre verticale`;
  }

  issueLabel(issue: CsvJsonIssue): string {
    const labels: Readonly<Record<CsvJsonIssueCode, string>> = {
      'empty-source': $localize`:@@csv_json_issue_empty:La source est vide. Collez du CSV ou du JSON avant la conversion.`,
      'source-too-large': $localize`:@@csv_json_issue_source_large:La source dépasse la limite de 4 000 000 de caractères.`,
      'output-too-large': $localize`:@@csv_json_issue_output_large:La sortie dépasserait la limite de sécurité de 16 000 000 de caractères.`,
      'row-limit': $localize`:@@csv_json_issue_rows:Le tableau dépasse la limite de 100 000 lignes.`,
      'column-limit': $localize`:@@csv_json_issue_columns:Le tableau dépasse la limite de 250 colonnes.`,
      'cell-limit': $localize`:@@csv_json_issue_cell:Une cellule dépasse la limite de 100 000 caractères.`,
      'unclosed-quote': $localize`:@@csv_json_issue_quote_open:Un champ CSV entre guillemets n’est pas fermé.`,
      'unexpected-after-quote': $localize`:@@csv_json_issue_quote_tail:Un caractère inattendu suit la fermeture d’un champ CSV.`,
      'inconsistent-columns': $localize`:@@csv_json_issue_width:Cette ligne n’a pas le même nombre de colonnes que l’en-tête. Les cellules absentes sont laissées vides.`,
      'empty-header': $localize`:@@csv_json_issue_header_empty:Un nom de colonne vide a reçu un identifiant stable.`,
      'duplicate-header': $localize`:@@csv_json_issue_header_duplicate:Un nom de colonne dupliqué a été suffixé pour éviter l’écrasement de données.`,
      'delimiter-fallback': $localize`:@@csv_json_issue_delimiter:Le séparateur n’a pas pu être détecté ; la virgule est utilisée par défaut.`,
      'mapping-invalid': $localize`:@@csv_json_issue_mapping:Le mapping doit contenir une règle « source => sortie » par ligne.`,
      'mapping-source-missing': $localize`:@@csv_json_issue_mapping_source:Une colonne source du mapping n’existe pas dans les données.`,
      'mapping-output-duplicate': $localize`:@@csv_json_issue_mapping_output:Deux règles utilisent le même nom de sortie.`,
      'json-invalid': $localize`:@@csv_json_issue_json_invalid:La source n’est pas un document JSON valide.`,
      'json-number-unsafe': $localize`:@@csv_json_issue_json_number:Un nombre JSON serait arrondi ou rendu infini par JavaScript. Convertissez-le en chaîne pour préserver sa valeur exacte.`,
      'json-root-not-array': $localize`:@@csv_json_issue_json_root:La racine JSON doit être un tableau d’objets.`,
      'json-row-not-object': $localize`:@@csv_json_issue_json_row:Chaque élément du tableau JSON doit être un objet.`,
      'json-depth-limit': $localize`:@@csv_json_issue_depth:Un objet dépasse 12 niveaux d’imbrication.`,
      'json-path-collision': $localize`:@@csv_json_issue_path_collision:Une clé contenant un point entre en collision avec un chemin d’objet imbriqué. Renommez l’une des clés.`,
      'spreadsheet-formula-protected': $localize`:@@csv_json_issue_formula:Les cellules ressemblant à des formules ont été préfixées par une apostrophe pour limiter leur exécution dans un tableur.`,
    };
    const position = issue.row === null
      ? ''
      : issue.column === null
        ? $localize`:@@csv_json_issue_row: Ligne ${this.formatNumber(issue.row)}:row:.`
        : $localize`:@@csv_json_issue_position: Ligne ${this.formatNumber(issue.row)}:row:, colonne ${this.formatNumber(issue.column)}:column:.`;
    return `${labels[issue.code]}${position}`;
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  trackIssue(index: number, issue: CsvJsonIssue): string {
    return `${issue.code}:${String(issue.row)}:${String(issue.column)}:${String(index)}`;
  }

  private clearResult(): void {
    this.taskRevision += 1;
    this.cancelCurrentTask();
    this.result.set(null);
    this.errorMessage.set('');
    this.copied.set(false);
    this.state.set('idle');
  }

  private cancelCurrentTask(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private clearCopiedTimer(): void {
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = null;
  }

  private describeError(error: unknown): string {
    if (error instanceof CsvJsonValidationError) {
      if (error.code === 'empty-file') return $localize`:@@csv_json_file_empty:Le fichier sélectionné est vide.`;
      if (error.code === 'file-too-large') return $localize`:@@csv_json_file_large:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`;
      if (error.code === 'unsupported-file') return $localize`:@@csv_json_file_format:Sélectionnez un fichier CSV, TSV, TXT ou JSON.`;
      return $localize`:@@csv_json_file_encoding:Le fichier n’est pas encodé en UTF-8 valide.`;
    }
    return $localize`:@@csv_json_file_error:Impossible de lire ce fichier localement.`;
  }
}

function createOptions(direction: CsvJsonDirection): CsvJsonConversionOptions {
  return {
    direction,
    delimiter: 'auto',
    firstRowHeaders: true,
    trimCells: false,
    inferTypes: true,
    mapping: '',
    protectSpreadsheetFormulas: true,
    includeBom: false,
  };
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function formatBytes(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000_000) + ' Mo';
}
