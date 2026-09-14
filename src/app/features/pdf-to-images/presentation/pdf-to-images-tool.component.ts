import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ConvertPdfToImagesUseCase,
  DownloadPdfImagesUseCase,
  InspectPdfForImagesUseCase,
  PDF_TO_IMAGES_DPI_VALUES,
  PDF_TO_IMAGES_FORMATS,
  PDF_TO_IMAGES_MAX_FILE_BYTES,
  PDF_TO_IMAGES_MAX_SELECTED_PAGES,
  PdfToImagesValidationError,
  createPdfRenderEstimate,
  parsePdfPageSelection,
  type PdfDocumentSummary,
  type PdfToImagesConversionResult,
  type PdfToImagesDpi,
  type PdfToImagesFormat,
} from '../application/pdf-to-images.use-cases';
import { BrowserPdfImageDownloadAdapter } from '../infrastructure/browser-pdf-image-download.adapter';
import { JsZipPdfImageArchiveAdapter } from '../infrastructure/jszip-pdf-image-archive.adapter';
import { PdfJsDocumentRendererAdapter } from '../infrastructure/pdfjs-document-renderer.adapter';

type ToolState = 'idle' | 'inspecting' | 'ready' | 'rendering' | 'done' | 'error';

type PreviewImage = PdfToImagesConversionResult['images'][number] & { objectUrl: string };

@Component({
  selector: 'app-pdf-to-images-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pdf-to-images-tool.component.html',
  styleUrl: './pdf-to-images-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfToImagesToolComponent {
  private readonly renderer = new PdfJsDocumentRendererAdapter();
  private readonly inspectUseCase = new InspectPdfForImagesUseCase(this.renderer);
  private readonly convertUseCase = new ConvertPdfToImagesUseCase(this.renderer);
  private readonly downloadUseCase = new DownloadPdfImagesUseCase(
    new JsZipPdfImageArchiveAdapter(),
    new BrowserPdfImageDownloadAdapter(),
  );
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private inspectionAbortController: AbortController | null = null;
  private renderAbortController: AbortController | null = null;

  readonly dpiValues = PDF_TO_IMAGES_DPI_VALUES;
  readonly formats = PDF_TO_IMAGES_FORMATS;
  readonly maxFileSizeLabel = formatBytes(PDF_TO_IMAGES_MAX_FILE_BYTES, this.locale);
  readonly maxSelectedPages = PDF_TO_IMAGES_MAX_SELECTED_PAGES;
  readonly state = signal<ToolState>('idle');
  readonly sourceName = signal('');
  readonly sourceSize = signal(0);
  readonly sourceBytes = signal<Uint8Array | null>(null);
  readonly password = signal('');
  readonly documentSummary = signal<PdfDocumentSummary | null>(null);
  readonly pageSelection = signal('');
  readonly dpi = signal<PdfToImagesDpi>(144);
  readonly format = signal<PdfToImagesFormat>('png');
  readonly quality = signal(0.88);
  readonly background = signal('#ffffff');
  readonly progress = signal({ completed: 0, total: 0 });
  readonly previews = signal<PreviewImage[]>([]);
  readonly errorMessage = signal('');
  readonly downloadError = signal(false);

  readonly isBusy = computed(() => this.state() === 'inspecting' || this.state() === 'rendering');
  readonly selection = computed(() => {
    const document = this.documentSummary();
    return document ? parsePdfPageSelection(this.pageSelection(), document.pageCount) : null;
  });
  readonly estimate = computed(() => {
    const document = this.documentSummary();
    const selection = this.selection();
    if (!document || !selection || selection.error) return null;
    return createPdfRenderEstimate(document.pages, selection.pageNumbers, this.dpi());
  });
  readonly canConvert = computed(() => Boolean(
    this.sourceBytes()
    && this.documentSummary()
    && this.selection()?.error === null
    && this.estimate()?.allowed
    && !this.isBusy(),
  ));
  readonly totalOutputBytes = computed(() => this.previews().reduce((sum, image) => sum + image.bytes.byteLength, 0));

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.taskRevision += 1;
      this.cancelActiveInspection();
      this.cancelActiveRender();
      this.releasePreviews();
    });
  }

  async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.taskRevision += 1;
    this.cancelActiveInspection();
    this.cancelActiveRender();
    const revision = this.taskRevision;
    this.resetDocumentState();
    this.sourceName.set(file.name);
    this.sourceSize.set(file.size);

    if (!isPdfFile(file)) {
      this.fail($localize`:@@pdf_to_images_error_type:Choisissez un fichier PDF valide.`);
      return;
    }
    if (file.size === 0) {
      this.fail($localize`:@@pdf_to_images_error_empty:Le fichier est vide.`);
      return;
    }
    if (file.size > PDF_TO_IMAGES_MAX_FILE_BYTES) {
      this.fail($localize`:@@pdf_to_images_error_size:Le fichier dépasse la limite de ${this.maxFileSizeLabel}:limit:.`);
      return;
    }

    this.state.set('inspecting');
    const abortController = new AbortController();
    this.inspectionAbortController = abortController;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const summary = await this.inspectUseCase.execute(bytes, this.password(), abortController.signal);
      if (revision !== this.taskRevision) return;
      this.sourceBytes.set(bytes);
      this.documentSummary.set(summary);
      this.pageSelection.set(summary.pageCount <= this.maxSelectedPages
        ? `1-${String(summary.pageCount)}`
        : `1-${String(this.maxSelectedPages)}`);
      this.state.set('ready');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) this.fail(this.describeError(error));
    } finally {
      if (this.inspectionAbortController === abortController) this.inspectionAbortController = null;
    }
  }

  updatePassword(event: Event): void {
    this.password.set(readValue(event).slice(0, 256));
  }

  updatePageSelection(event: Event): void {
    this.pageSelection.set(readValue(event).slice(0, 500));
    this.invalidateOutput();
  }

  updateDpi(event: Event): void {
    const next = Number(readValue(event));
    if (PDF_TO_IMAGES_DPI_VALUES.some(value => value === next)) this.dpi.set(next as PdfToImagesDpi);
    this.invalidateOutput();
  }

  updateFormat(event: Event): void {
    const next = readValue(event);
    if (PDF_TO_IMAGES_FORMATS.some(value => value === next)) this.format.set(next as PdfToImagesFormat);
    this.invalidateOutput();
  }

  updateQuality(event: Event): void {
    this.quality.set(Number(readValue(event)) / 100);
    this.invalidateOutput();
  }

  updateBackground(event: Event): void {
    this.background.set(readValue(event));
    this.invalidateOutput();
  }

  async convert(): Promise<void> {
    const bytes = this.sourceBytes();
    const document = this.documentSummary();
    if (!bytes || !document || !this.canConvert()) return;

    const revision = ++this.taskRevision;
    this.cancelActiveRender();
    const abortController = new AbortController();
    this.renderAbortController = abortController;
    this.releasePreviews();
    this.errorMessage.set('');
    this.downloadError.set(false);
    const total = this.selection()?.pageNumbers.length ?? 0;
    this.progress.set({ completed: 0, total });
    this.state.set('rendering');
    try {
      const result = await this.convertUseCase.execute({
        data: bytes,
        sourceName: this.sourceName(),
        password: this.password(),
        document,
        pageSelection: this.pageSelection(),
        dpi: this.dpi(),
        format: this.format(),
        quality: this.quality(),
        background: this.background(),
        onProgress: (completed, progressTotal) => {
          if (revision === this.taskRevision) this.progress.set({ completed, total: progressTotal });
        },
        signal: abortController.signal,
      });
      if (revision !== this.taskRevision) return;
      this.previews.set(result.images.map(image => ({
        ...image,
        objectUrl: URL.createObjectURL(new Blob([copyBuffer(image.bytes)], { type: image.mimeType })),
      })));
      this.state.set('done');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) this.fail(this.describeError(error));
    } finally {
      if (this.renderAbortController === abortController) this.renderAbortController = null;
    }
  }

  async downloadAll(): Promise<void> {
    const images = this.previews();
    if (images.length === 0) return;
    this.downloadError.set(false);
    try {
      await this.downloadUseCase.execute(this.sourceName(), images);
    } catch {
      this.downloadError.set(true);
    }
  }

  async downloadOne(image: PreviewImage): Promise<void> {
    this.downloadError.set(false);
    try {
      await this.downloadUseCase.execute(this.sourceName(), [image]);
    } catch {
      this.downloadError.set(true);
    }
  }

  reset(): void {
    this.taskRevision += 1;
    this.cancelActiveInspection();
    this.cancelActiveRender();
    this.resetDocumentState();
    this.password.set('');
    this.sourceName.set('');
    this.sourceSize.set(0);
    this.state.set('idle');
  }

  selectionErrorLabel(): string | null {
    const error = this.selection()?.error;
    if (!error) return null;
    if (error === 'empty') return $localize`:@@pdf_to_images_selection_empty:Indiquez au moins une page.`;
    if (error === 'invalid-syntax') return $localize`:@@pdf_to_images_selection_syntax:Utilisez des numéros et des plages séparés par des virgules, par exemple 1-3, 7.`;
    if (error === 'out-of-range') return $localize`:@@pdf_to_images_selection_range:Une page ou une plage sort du document.`;
    return $localize`:@@pdf_to_images_selection_limit:Une conversion est limitée à ${this.maxSelectedPages}:limit: pages.`;
  }

  estimateErrorLabel(): string | null {
    const estimate = this.estimate();
    if (!estimate || estimate.allowed) return null;
    if (estimate.reason === 'too-many-pages') return this.selectionErrorLabel();
    if (estimate.reason === 'side-too-large') {
      return $localize`:@@pdf_to_images_estimate_side:Cette résolution produit une image trop grande pour un navigateur. Réduisez les DPI.`;
    }
    return $localize`:@@pdf_to_images_estimate_pixels:Le rendu dépasserait le budget mémoire sûr. Réduisez les pages ou les DPI.`;
  }

  formatNumber(value: number): string { return this.numberFormatter.format(value); }
  formatFileSize(value: number): string { return formatBytes(value, this.locale); }
  qualityPercent(): number { return Math.round(this.quality() * 100); }

  formatLabel(format: PdfToImagesFormat): string {
    if (format === 'jpeg') return 'JPEG';
    return format.toUpperCase();
  }

  previewAlt(pageNumber: number): string {
    return $localize`:@@pdf_to_images_preview_alt:Aperçu de la page ${String(pageNumber)}:pageNumber: du PDF`;
  }

  downloadPageLabel(pageNumber: number): string {
    return $localize`:@@pdf_to_images_download_page:Télécharger la page ${String(pageNumber)}:pageNumber:`;
  }

  private invalidateOutput(): void {
    if (this.isBusy()) return;
    this.releasePreviews();
    if (this.documentSummary()) this.state.set('ready');
  }

  private resetDocumentState(): void {
    this.releasePreviews();
    this.sourceBytes.set(null);
    this.documentSummary.set(null);
    this.pageSelection.set('');
    this.progress.set({ completed: 0, total: 0 });
    this.errorMessage.set('');
    this.downloadError.set(false);
  }

  private releasePreviews(): void {
    for (const preview of this.previews()) URL.revokeObjectURL(preview.objectUrl);
    this.previews.set([]);
  }

  private cancelActiveRender(): void {
    this.renderAbortController?.abort();
    this.renderAbortController = null;
  }

  private cancelActiveInspection(): void {
    this.inspectionAbortController?.abort();
    this.inspectionAbortController = null;
  }

  private fail(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }

  private describeError(error: unknown): string {
    if (error instanceof PdfToImagesValidationError) {
      if (error.code === 'file-too-large') return $localize`:@@pdf_to_images_error_size_short:Le PDF dépasse la taille maximale autorisée.`;
      if (error.code === 'document-too-large') return $localize`:@@pdf_to_images_error_pages:Ce PDF contient trop de pages pour cet outil.`;
      if (error.code === 'render-budget-exceeded') return $localize`:@@pdf_to_images_error_budget:Le rendu demandé dépasse les limites mémoire sûres.`;
      return $localize`:@@pdf_to_images_error_selection:La sélection de pages est invalide.`;
    }
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : '';
    if (name === 'PasswordException' || /password/iu.test(message)) {
      return $localize`:@@pdf_to_images_error_password:Le PDF est protégé. Saisissez le bon mot de passe puis sélectionnez de nouveau le fichier.`;
    }
    return $localize`:@@pdf_to_images_error_invalid:Impossible de lire ou de rendre ce PDF. Il peut être endommagé ou utiliser une fonction non prise en charge.`;
  }
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
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
