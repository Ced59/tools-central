import type {
  ImageHeaderReaderPort,
  ImagePdfDownloadPort,
  ImagePdfGeneratorPort,
  ImageSourceFile,
  PreparedPdfImage,
} from './images-to-pdf.ports';
import {
  IMAGES_TO_PDF_COMPRESSIONS,
  IMAGES_TO_PDF_MAX_FILE_BYTES,
  IMAGES_TO_PDF_MAX_FILES,
  IMAGES_TO_PDF_MAX_IMAGE_PIXELS,
  IMAGES_TO_PDF_MAX_OUTPUT_BYTES,
  IMAGES_TO_PDF_MAX_SIDE_PIXELS,
  IMAGES_TO_PDF_MAX_TOTAL_BYTES,
  IMAGES_TO_PDF_MAX_TOTAL_PIXELS,
  IMAGES_TO_PDF_PAGE_FORMATS,
  buildImagesPdfFileName,
  reorderById,
  type ImagePdfSettings,
} from '../domain/images-to-pdf.models';

export {
  IMAGES_TO_PDF_COMPRESSIONS,
  IMAGES_TO_PDF_MAX_FILE_BYTES,
  IMAGES_TO_PDF_MAX_FILES,
  IMAGES_TO_PDF_MAX_TOTAL_BYTES,
  IMAGES_TO_PDF_PAGE_FORMATS,
  buildImagesPdfFileName,
  createImagePageLayout,
  pageDimensions,
  type ImagePdfSettings,
  type ImagesToPdfCompression,
  type ImagesToPdfPageFormat,
} from '../domain/images-to-pdf.models';
export type { ImageSourceFile, PreparedPdfImage } from './images-to-pdf.ports';

export type ImagesToPdfFailureCode =
  | 'empty-selection'
  | 'too-many-files'
  | 'file-too-large'
  | 'total-too-large'
  | 'unsupported-image'
  | 'image-too-large'
  | 'pixel-budget-exceeded'
  | 'invalid-settings'
  | 'output-too-large';

export class ImagesToPdfValidationError extends Error {
  constructor(readonly code: ImagesToPdfFailureCode, readonly fileName?: string) {
    super(fileName ? `${code}: ${fileName}` : code);
  }
}

export class PrepareImagesForPdfUseCase {
  constructor(private readonly headerReader: ImageHeaderReaderPort) {}

  async execute(
    files: readonly ImageSourceFile[],
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<PreparedPdfImage[]> {
    if (files.length === 0) throw new ImagesToPdfValidationError('empty-selection');
    if (files.length > IMAGES_TO_PDF_MAX_FILES) throw new ImagesToPdfValidationError('too-many-files');

    let totalBytes = 0;
    for (const file of files) {
      if (file.blob.size === 0) throw new ImagesToPdfValidationError('unsupported-image', file.fileName);
      if (file.blob.size > IMAGES_TO_PDF_MAX_FILE_BYTES) {
        throw new ImagesToPdfValidationError('file-too-large', file.fileName);
      }
      totalBytes += file.blob.size;
      if (totalBytes > IMAGES_TO_PDF_MAX_TOTAL_BYTES) {
        throw new ImagesToPdfValidationError('total-too-large');
      }
    }

    const prepared: PreparedPdfImage[] = [];
    let totalPixels = 0;
    for (let index = 0; index < files.length; index += 1) {
      throwIfAborted(signal);
      const file = files[index];
      const header = await this.headerReader.inspect(file.blob, signal);
      if (!header) throw new ImagesToPdfValidationError('unsupported-image', file.fileName);
      const pixels = header.width * header.height;
      if (
        header.width > IMAGES_TO_PDF_MAX_SIDE_PIXELS
        || header.height > IMAGES_TO_PDF_MAX_SIDE_PIXELS
        || pixels > IMAGES_TO_PDF_MAX_IMAGE_PIXELS
      ) throw new ImagesToPdfValidationError('image-too-large', file.fileName);
      totalPixels += pixels;
      if (totalPixels > IMAGES_TO_PDF_MAX_TOTAL_PIXELS) {
        throw new ImagesToPdfValidationError('pixel-budget-exceeded');
      }
      prepared.push({ ...file, ...header, size: file.blob.size });
      onProgress?.(index + 1, files.length);
    }
    return prepared;
  }
}

export class CreateImagesPdfUseCase {
  constructor(private readonly generator: ImagePdfGeneratorPort) {}

  async execute(
    images: readonly PreparedPdfImage[],
    settings: ImagePdfSettings,
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> {
    if (images.length === 0) throw new ImagesToPdfValidationError('empty-selection');
    if (images.length > IMAGES_TO_PDF_MAX_FILES) throw new ImagesToPdfValidationError('too-many-files');
    if (
      !IMAGES_TO_PDF_PAGE_FORMATS.includes(settings.pageFormat)
      || !IMAGES_TO_PDF_COMPRESSIONS.includes(settings.compression)
      || !Number.isFinite(settings.marginMm)
      || settings.marginMm < 0
      || settings.marginMm > 30
    ) throw new ImagesToPdfValidationError('invalid-settings');

    validatePreparedImages(images);

    let output: Blob;
    try {
      output = await this.generator.create(images, settings, onProgress, signal);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ImagesToPdfOutputBudgetError') {
        throw new ImagesToPdfValidationError('output-too-large');
      }
      throw error;
    }
    if (output.size > IMAGES_TO_PDF_MAX_OUTPUT_BYTES) {
      throw new ImagesToPdfValidationError('output-too-large');
    }
    return output;
  }
}

function validatePreparedImages(images: readonly PreparedPdfImage[]): void {
  let totalBytes = 0;
  let totalPixels = 0;
  for (const image of images) {
    const pixels = image.width * image.height;
    if (image.blob.size === 0) throw new ImagesToPdfValidationError('unsupported-image', image.fileName);
    if (image.blob.size > IMAGES_TO_PDF_MAX_FILE_BYTES) {
      throw new ImagesToPdfValidationError('file-too-large', image.fileName);
    }
    if (
      !Number.isSafeInteger(image.width)
      || !Number.isSafeInteger(image.height)
      || image.width <= 0
      || image.height <= 0
      || image.width > IMAGES_TO_PDF_MAX_SIDE_PIXELS
      || image.height > IMAGES_TO_PDF_MAX_SIDE_PIXELS
      || pixels > IMAGES_TO_PDF_MAX_IMAGE_PIXELS
    ) throw new ImagesToPdfValidationError('image-too-large', image.fileName);
    totalBytes += image.blob.size;
    totalPixels += pixels;
    if (totalBytes > IMAGES_TO_PDF_MAX_TOTAL_BYTES) {
      throw new ImagesToPdfValidationError('total-too-large');
    }
    if (totalPixels > IMAGES_TO_PDF_MAX_TOTAL_PIXELS) {
      throw new ImagesToPdfValidationError('pixel-budget-exceeded');
    }
  }
}

export class ReorderPdfImagesUseCase {
  execute(images: readonly PreparedPdfImage[], movedId: string, targetId: string): PreparedPdfImage[] {
    return reorderById(images, movedId, targetId);
  }
}

export class DownloadImagesPdfUseCase {
  constructor(private readonly download: ImagePdfDownloadPort) {}

  execute(images: readonly PreparedPdfImage[], pdf: Blob): void {
    if (images.length === 0 || pdf.size === 0) return;
    this.download.download(pdf, buildImagesPdfFileName(images[0].fileName));
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Image preparation was cancelled.');
  error.name = 'AbortError';
  throw error;
}
