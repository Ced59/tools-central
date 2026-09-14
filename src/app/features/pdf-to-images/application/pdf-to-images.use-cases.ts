import type {
  PdfDocumentRendererPort,
  PdfImageArchivePort,
  PdfImageDownloadPort,
} from './pdf-to-images.ports';
import {
  PDF_TO_IMAGES_DPI_VALUES,
  PDF_TO_IMAGES_FORMATS,
  PDF_TO_IMAGES_MAX_DOCUMENT_PAGES,
  PDF_TO_IMAGES_MAX_FILE_BYTES,
  buildPdfImageFileName,
  createPdfRenderEstimate,
  normalizePdfImageQuality,
  parsePdfPageSelection,
  type PdfDocumentSummary,
  type PdfRenderedImage,
  type PdfRenderPlan,
  type PdfToImagesDpi,
  type PdfToImagesFormat,
} from '../domain/pdf-to-images.models';

export {
  PDF_TO_IMAGES_DPI_VALUES,
  PDF_TO_IMAGES_FORMATS,
  PDF_TO_IMAGES_MAX_FILE_BYTES,
  PDF_TO_IMAGES_MAX_SELECTED_PAGES,
  createPdfRenderEstimate,
  parsePdfPageSelection,
  type PdfDocumentSummary,
  type PdfToImagesDpi,
  type PdfToImagesFormat,
} from '../domain/pdf-to-images.models';

export type PdfToImagesFailureCode =
  | 'empty-file'
  | 'file-too-large'
  | 'document-too-large'
  | 'invalid-page-selection'
  | 'page-out-of-range'
  | 'too-many-pages'
  | 'render-budget-exceeded';

export class PdfToImagesValidationError extends Error {
  constructor(readonly code: PdfToImagesFailureCode) {
    super(code);
  }
}

export interface PdfToImagesConversionInput {
  data: Uint8Array;
  sourceName: string;
  password?: string;
  document: PdfDocumentSummary;
  pageSelection: string;
  dpi: PdfToImagesDpi;
  format: PdfToImagesFormat;
  quality: number;
  background: string;
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}

export interface PdfToImagesConversionResult {
  images: Array<PdfRenderedImage & { fileName: string }>;
  totalBytes: number;
}

export class InspectPdfForImagesUseCase {
  constructor(private readonly renderer: PdfDocumentRendererPort) {}

  async execute(data: Uint8Array, password?: string, signal?: AbortSignal): Promise<PdfDocumentSummary> {
    validateInputBytes(data);
    const document = await this.renderer.inspect(data, password?.trim() || undefined, signal);
    if (document.pageCount > PDF_TO_IMAGES_MAX_DOCUMENT_PAGES) {
      throw new PdfToImagesValidationError('document-too-large');
    }
    return document;
  }
}

export class ConvertPdfToImagesUseCase {
  constructor(private readonly renderer: PdfDocumentRendererPort) {}

  async execute(input: PdfToImagesConversionInput): Promise<PdfToImagesConversionResult> {
    validateInputBytes(input.data);
    const pageSelection = parsePdfPageSelection(input.pageSelection, input.document.pageCount);
    if (pageSelection.error) throw new PdfToImagesValidationError(mapPageSelectionError(pageSelection.error));
    if (!PDF_TO_IMAGES_DPI_VALUES.includes(input.dpi)) {
      throw new PdfToImagesValidationError('render-budget-exceeded');
    }
    if (!PDF_TO_IMAGES_FORMATS.includes(input.format)) {
      throw new PdfToImagesValidationError('render-budget-exceeded');
    }

    const estimate = createPdfRenderEstimate(input.document.pages, pageSelection.pageNumbers, input.dpi);
    if (!estimate.allowed) {
      throw new PdfToImagesValidationError(
        estimate.reason === 'too-many-pages' ? 'too-many-pages' : 'render-budget-exceeded',
      );
    }

    const plan: PdfRenderPlan = {
      pageNumbers: pageSelection.pageNumbers,
      dpi: input.dpi,
      format: input.format,
      quality: normalizePdfImageQuality(input.quality),
      background: /^#[\da-f]{6}$/iu.test(input.background) ? input.background : '#ffffff',
    };
    const rendered = await this.renderer.render(
      input.data,
      input.password?.trim() || undefined,
      plan,
      input.onProgress,
      input.signal,
    );
    const images = rendered.map(image => ({
      ...image,
      fileName: buildPdfImageFileName(
        input.sourceName,
        image.pageNumber,
        input.document.pageCount,
        image.extension,
      ),
    }));

    return {
      images,
      totalBytes: images.reduce((total, image) => total + image.bytes.byteLength, 0),
    };
  }
}

export class DownloadPdfImagesUseCase {
  constructor(
    private readonly archive: PdfImageArchivePort,
    private readonly download: PdfImageDownloadPort,
  ) {}

  async execute(
    sourceName: string,
    images: PdfToImagesConversionResult['images'],
    signal?: AbortSignal,
  ): Promise<void> {
    if (images.length === 0) return;
    if (images.length === 1) {
      const image = images[0];
      this.download.download(image.bytes, image.mimeType, image.fileName);
      return;
    }

    const archiveBytes = await this.archive.create(images.map(image => ({
      fileName: image.fileName,
      bytes: image.bytes,
    })), signal);
    const baseName = buildPdfImageFileName(sourceName, 1, 1, 'zip').replace(/-page-01\.zip$/u, '');
    this.download.download(archiveBytes, 'application/zip', `${baseName}-images.zip`);
  }
}

function validateInputBytes(data: Uint8Array): void {
  if (data.byteLength === 0) throw new PdfToImagesValidationError('empty-file');
  if (data.byteLength > PDF_TO_IMAGES_MAX_FILE_BYTES) {
    throw new PdfToImagesValidationError('file-too-large');
  }
}

function mapPageSelectionError(
  code: Exclude<ReturnType<typeof parsePdfPageSelection>['error'], null>,
): PdfToImagesFailureCode {
  if (code === 'too-many-pages') return 'too-many-pages';
  if (code === 'out-of-range') return 'page-out-of-range';
  return 'invalid-page-selection';
}
