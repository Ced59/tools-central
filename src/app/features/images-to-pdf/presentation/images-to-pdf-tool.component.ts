import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CreateImagesPdfUseCase,
  DownloadImagesPdfUseCase,
  IMAGES_TO_PDF_COMPRESSIONS,
  IMAGES_TO_PDF_MAX_FILE_BYTES,
  IMAGES_TO_PDF_MAX_FILES,
  IMAGES_TO_PDF_MAX_TOTAL_BYTES,
  IMAGES_TO_PDF_PAGE_FORMATS,
  ImagesToPdfValidationError,
  PrepareImagesForPdfUseCase,
  ReorderPdfImagesUseCase,
  createImagePageLayout,
  type ImagesToPdfCompression,
  type ImagesToPdfPageFormat,
  type PreparedPdfImage,
} from '../application/images-to-pdf.use-cases';
import { BrowserImageHeaderReaderAdapter } from '../infrastructure/browser-image-header-reader.adapter';
import { BrowserImagePdfDownloadAdapter } from '../infrastructure/browser-image-pdf-download.adapter';
import { PdfLibImagePdfGeneratorAdapter } from '../infrastructure/pdf-lib-image-pdf-generator.adapter';

type ToolState = 'idle' | 'inspecting' | 'ready' | 'generating' | 'done' | 'error';
type PreviewImage = PreparedPdfImage & { objectUrl: string };

@Component({
  selector: 'app-images-to-pdf-tool',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './images-to-pdf-tool.component.html',
  styleUrl: './images-to-pdf-tool.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagesToPdfToolComponent {
  private readonly prepareUseCase = new PrepareImagesForPdfUseCase(new BrowserImageHeaderReaderAdapter());
  private readonly createUseCase = new CreateImagesPdfUseCase(new PdfLibImagePdfGeneratorAdapter());
  private readonly reorderUseCase = new ReorderPdfImagesUseCase();
  private readonly downloadUseCase = new DownloadImagesPdfUseCase(new BrowserImagePdfDownloadAdapter());
  private readonly locale = inject(LOCALE_ID);
  private readonly numberFormatter = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 });
  private taskRevision = 0;
  private preparationAbortController: AbortController | null = null;
  private generationAbortController: AbortController | null = null;
  private draggedImageId: string | null = null;

  readonly pageFormats = IMAGES_TO_PDF_PAGE_FORMATS;
  readonly compressions = IMAGES_TO_PDF_COMPRESSIONS;
  readonly maxFiles = IMAGES_TO_PDF_MAX_FILES;
  readonly maxFileSizeLabel = formatBytes(IMAGES_TO_PDF_MAX_FILE_BYTES, this.locale);
  readonly maxTotalSizeLabel = formatBytes(IMAGES_TO_PDF_MAX_TOTAL_BYTES, this.locale);
  readonly state = signal<ToolState>('idle');
  readonly images = signal<PreviewImage[]>([]);
  readonly pageFormat = signal<ImagesToPdfPageFormat>('a4-portrait');
  readonly marginMm = signal(10);
  readonly compression = signal<ImagesToPdfCompression>('balanced');
  readonly progress = signal({ completed: 0, total: 0 });
  readonly generatedPdf = signal<Blob | null>(null);
  readonly errorMessage = signal('');
  readonly isBusy = computed(() => this.state() === 'inspecting' || this.state() === 'generating');
  readonly canGenerate = computed(() => this.images().length > 0 && !this.isBusy());
  readonly totalInputBytes = computed(() => this.images().reduce((sum, image) => sum + image.size, 0));
  readonly totalPixels = computed(() => this.images().reduce(
    (sum, image) => sum + image.width * image.height,
    0,
  ));

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.taskRevision += 1;
      this.cancelPreparation();
      this.cancelGeneration();
      this.releaseImages();
      this.generatedPdf.set(null);
    });
  }

  async selectFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    await this.loadFiles(files);
  }

  allowFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  async dropFiles(event: DragEvent): Promise<void> {
    event.preventDefault();
    await this.loadFiles([...(event.dataTransfer?.files ?? [])]);
  }

  startImageDrag(imageId: string, event: DragEvent): void {
    if (this.isBusy()) {
      event.preventDefault();
      return;
    }
    this.draggedImageId = imageId;
    event.dataTransfer?.setData('text/plain', imageId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowImageDrop(event: DragEvent): void {
    if (this.isBusy()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  dropImage(targetId: string, event: DragEvent): void {
    event.preventDefault();
    if (this.isBusy()) return;
    const movedId = event.dataTransfer?.getData('text/plain') || this.draggedImageId;
    this.draggedImageId = null;
    if (!movedId || movedId === targetId) return;
    this.images.set(this.withPreviewUrls(this.reorderUseCase.execute(this.images(), movedId, targetId)));
    this.invalidateOutput();
  }

  moveImage(imageId: string, direction: -1 | 1): void {
    const current = this.images();
    const index = current.findIndex(image => image.id === imageId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    const target = current[targetIndex];
    this.images.set(this.withPreviewUrls(this.reorderUseCase.execute(current, imageId, target.id)));
    this.invalidateOutput();
  }

  removeImage(imageId: string): void {
    const removed = this.images().find(image => image.id === imageId);
    if (removed) URL.revokeObjectURL(removed.objectUrl);
    this.images.update(images => images.filter(image => image.id !== imageId));
    this.invalidateOutput();
    this.state.set(this.images().length > 0 ? 'ready' : 'idle');
  }

  updatePageFormat(event: Event): void {
    const value = readValue(event);
    if (IMAGES_TO_PDF_PAGE_FORMATS.some(format => format === value)) {
      this.pageFormat.set(value as ImagesToPdfPageFormat);
      this.invalidateOutput();
    }
  }

  updateMargin(event: Event): void {
    const value = Number(readValue(event));
    if (Number.isFinite(value) && value >= 0 && value <= 30) {
      this.marginMm.set(value);
      this.invalidateOutput();
    }
  }

  updateCompression(event: Event): void {
    const value = readValue(event);
    if (IMAGES_TO_PDF_COMPRESSIONS.some(compression => compression === value)) {
      this.compression.set(value as ImagesToPdfCompression);
      this.invalidateOutput();
    }
  }

  async generate(): Promise<void> {
    const images = this.images();
    if (images.length === 0 || !this.canGenerate()) return;
    const revision = ++this.taskRevision;
    this.cancelGeneration();
    const abortController = new AbortController();
    this.generationAbortController = abortController;
    this.generatedPdf.set(null);
    this.errorMessage.set('');
    this.progress.set({ completed: 0, total: images.length });
    this.state.set('generating');
    try {
      const pdf = await this.createUseCase.execute(
        images,
        {
          pageFormat: this.pageFormat(),
          marginMm: this.marginMm(),
          compression: this.compression(),
        },
        (completed, total) => {
          if (revision === this.taskRevision) this.progress.set({ completed, total });
        },
        abortController.signal,
      );
      if (revision !== this.taskRevision) return;
      this.generatedPdf.set(pdf);
      this.state.set('done');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) this.fail(this.describeError(error));
    } finally {
      if (this.generationAbortController === abortController) this.generationAbortController = null;
    }
  }

  download(): void {
    const pdf = this.generatedPdf();
    if (!pdf) return;
    this.downloadUseCase.execute(this.images(), pdf);
  }

  reset(): void {
    this.taskRevision += 1;
    this.cancelPreparation();
    this.cancelGeneration();
    this.releaseImages();
    this.generatedPdf.set(null);
    this.errorMessage.set('');
    this.progress.set({ completed: 0, total: 0 });
    this.state.set('idle');
  }

  pageFormatLabel(format: ImagesToPdfPageFormat): string {
    if (format === 'image') return $localize`:@@images_to_pdf_format_image:Taille de l’image`;
    if (format === 'a4-portrait') return $localize`:@@images_to_pdf_format_a4_portrait:A4 portrait`;
    if (format === 'a4-landscape') return $localize`:@@images_to_pdf_format_a4_landscape:A4 paysage`;
    if (format === 'letter-portrait') return $localize`:@@images_to_pdf_format_letter_portrait:Lettre US portrait`;
    return $localize`:@@images_to_pdf_format_letter_landscape:Lettre US paysage`;
  }

  compressionLabel(compression: ImagesToPdfCompression): string {
    if (compression === 'quality') return $localize`:@@images_to_pdf_compression_quality:Qualité élevée`;
    if (compression === 'balanced') return $localize`:@@images_to_pdf_compression_balanced:Équilibrée`;
    return $localize`:@@images_to_pdf_compression_compact:PDF compact`;
  }

  pageAspectRatio(image: PreviewImage): string {
    const layout = createImagePageLayout(image.width, image.height, this.pageFormat(), this.marginMm());
    return `${String(layout.pageWidth)} / ${String(layout.pageHeight)}`;
  }

  previewPageWidth(image: PreviewImage): number {
    const layout = createImagePageLayout(image.width, image.height, this.pageFormat(), this.marginMm());
    return Math.min(13, 16 * layout.pageWidth / layout.pageHeight);
  }

  previewImageWidth(image: PreviewImage): number {
    const layout = createImagePageLayout(image.width, image.height, this.pageFormat(), this.marginMm());
    return layout.imageWidth / layout.pageWidth * 100;
  }

  previewImageHeight(image: PreviewImage): number {
    const layout = createImagePageLayout(image.width, image.height, this.pageFormat(), this.marginMm());
    return layout.imageHeight / layout.pageHeight * 100;
  }

  previewAlt(image: PreviewImage, index: number): string {
    return $localize`:@@images_to_pdf_preview_alt:Page ${String(index + 1)}:pageNumber: : ${image.fileName}:fileName:`;
  }

  moveUpLabel(fileName: string): string {
    return $localize`:@@images_to_pdf_move_up:Monter ${fileName}:fileName:`;
  }

  moveDownLabel(fileName: string): string {
    return $localize`:@@images_to_pdf_move_down:Descendre ${fileName}:fileName:`;
  }

  removeLabel(fileName: string): string {
    return $localize`:@@images_to_pdf_remove:Retirer ${fileName}:fileName:`;
  }

  formatFileSize(value: number): string { return formatBytes(value, this.locale); }
  formatNumber(value: number): string { return this.numberFormatter.format(value); }

  private async loadFiles(files: readonly File[]): Promise<void> {
    if (files.length === 0) return;
    const revision = ++this.taskRevision;
    this.cancelPreparation();
    this.cancelGeneration();
    this.releaseImages();
    this.generatedPdf.set(null);
    this.errorMessage.set('');
    this.progress.set({ completed: 0, total: files.length });
    this.state.set('inspecting');
    const abortController = new AbortController();
    this.preparationAbortController = abortController;
    try {
      const prepared = await this.prepareUseCase.execute(
        files.map((file, index) => ({
          id: `${String(revision)}-${String(index)}`,
          fileName: file.name,
          blob: file,
        })),
        (completed, total) => {
          if (revision === this.taskRevision) this.progress.set({ completed, total });
        },
        abortController.signal,
      );
      if (revision !== this.taskRevision) return;
      this.images.set(prepared.map(image => ({ ...image, objectUrl: URL.createObjectURL(image.blob) })));
      this.state.set('ready');
    } catch (error: unknown) {
      if (revision === this.taskRevision && !isAbortError(error)) this.fail(this.describeError(error));
    } finally {
      if (this.preparationAbortController === abortController) this.preparationAbortController = null;
    }
  }

  private withPreviewUrls(images: readonly PreparedPdfImage[]): PreviewImage[] {
    const urls = new Map(this.images().map(image => [image.id, image.objectUrl]));
    return images.map(image => ({ ...image, objectUrl: urls.get(image.id) ?? URL.createObjectURL(image.blob) }));
  }

  private invalidateOutput(): void {
    this.generatedPdf.set(null);
    if (this.images().length > 0 && !this.isBusy()) this.state.set('ready');
  }

  private releaseImages(): void {
    for (const image of this.images()) URL.revokeObjectURL(image.objectUrl);
    this.images.set([]);
  }

  private cancelPreparation(): void {
    this.preparationAbortController?.abort();
    this.preparationAbortController = null;
  }

  private cancelGeneration(): void {
    this.generationAbortController?.abort();
    this.generationAbortController = null;
  }

  private fail(message: string): void {
    this.state.set('error');
    this.errorMessage.set(message);
  }

  private describeError(error: unknown): string {
    if (error instanceof ImagesToPdfValidationError) {
      const fileName = error.fileName ?? '';
      if (error.code === 'too-many-files') return $localize`:@@images_to_pdf_error_count:Sélectionnez au maximum ${this.maxFiles}:limit: images.`;
      if (error.code === 'file-too-large') return $localize`:@@images_to_pdf_error_file_size:${fileName}:fileName: dépasse ${this.maxFileSizeLabel}:limit:.`;
      if (error.code === 'total-too-large') return $localize`:@@images_to_pdf_error_total_size:La sélection dépasse ${this.maxTotalSizeLabel}:limit:.`;
      if (error.code === 'unsupported-image') return $localize`:@@images_to_pdf_error_unsupported:${fileName}:fileName: n’est pas une image PNG, JPEG ou WebP valide.`;
      if (error.code === 'image-too-large') return $localize`:@@images_to_pdf_error_dimensions:${fileName}:fileName: dépasse les dimensions ou le nombre de pixels autorisés.`;
      if (error.code === 'pixel-budget-exceeded') return $localize`:@@images_to_pdf_error_pixels:La sélection dépasse le budget de pixels sûr. Réduisez le nombre ou les dimensions des images.`;
      if (error.code === 'output-too-large') return $localize`:@@images_to_pdf_error_output:Le PDF généré dépasse la taille de sortie autorisée.`;
    }
    return $localize`:@@images_to_pdf_error_generic:Impossible de créer le PDF. Une image peut être endommagée ou non prise en charge par ce navigateur.`;
  }
}

function readValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value;
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
