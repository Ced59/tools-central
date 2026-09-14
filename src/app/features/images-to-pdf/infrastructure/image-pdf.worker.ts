import { PDFDocument, type PDFImage } from 'pdf-lib';

import type {
  ImagePdfWorkerCommand,
  ImagePdfWorkerResponse,
} from './image-pdf.worker.messages';
import {
  IMAGES_TO_PDF_MAX_IMAGE_PIXELS,
  IMAGES_TO_PDF_MAX_SIDE_PIXELS,
  compressionQuality,
  createImagePageLayout,
  estimateEmbeddedImageBytes,
  estimatePngPdfStreamBytes,
  exceedsImagesPdfOutputBudget,
  type ImagesToPdfCompression,
  type SupportedRasterFormat,
} from '../domain/images-to-pdf.models';

addEventListener('message', ({ data }: MessageEvent<ImagePdfWorkerCommand>) => {
  void createPdf(data);
});

async function createPdf(command: ImagePdfWorkerCommand): Promise<void> {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    sendFailure(new Error('OffscreenCanvas image encoding is not supported by this browser.'));
    return;
  }

  try {
    const pdf = await PDFDocument.create();
    pdf.setCreator('Tools Central');
    pdf.setProducer('Tools Central');
    pdf.setTitle('Images to PDF');
    let retainedImageStreamBytes = 0;
    for (let index = 0; index < command.images.length; index += 1) {
      const source = command.images[index];
      if (
        source.format === 'png'
        && command.settings.compression === 'quality'
        && exceedsImagesPdfOutputBudget(
          retainedImageStreamBytes + estimatePngPdfStreamBytes(source.width, source.height),
          index + 1,
        )
      ) throw createOutputBudgetError();
      const encoded = await normalizeImage(source.blob, source.format, command.settings.compression);
      retainedImageStreamBytes += estimateEmbeddedImageBytes(
        encoded.format,
        encoded.width,
        encoded.height,
        encoded.blob.size,
      );
      if (exceedsImagesPdfOutputBudget(retainedImageStreamBytes, index + 1)) {
        throw createOutputBudgetError();
      }
      const bytes = new Uint8Array(await encoded.blob.arrayBuffer());
      const embedded = await embedImage(pdf, bytes, encoded.format);
      const layout = createImagePageLayout(
        encoded.width,
        encoded.height,
        command.settings.pageFormat,
        command.settings.marginMm,
      );
      const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);
      page.drawImage(embedded, {
        x: layout.imageX,
        y: layout.imageY,
        width: layout.imageWidth,
        height: layout.imageHeight,
      });
      send({ type: 'progress', completed: index + 1, total: command.images.length });
    }
    const output = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    send({ type: 'success', pdf: new Blob([output], { type: 'application/pdf' }) });
  } catch (error: unknown) {
    sendFailure(error);
  }
}

function createOutputBudgetError(): Error {
  const error = new Error('The encoded images exceed the safe PDF output budget.');
  error.name = 'ImagesToPdfOutputBudgetError';
  return error;
}

async function normalizeImage(
  blob: Blob,
  sourceFormat: SupportedRasterFormat,
  compression: ImagesToPdfCompression,
): Promise<{ blob: Blob; format: 'png' | 'jpeg'; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    if (
      bitmap.width > IMAGES_TO_PDF_MAX_SIDE_PIXELS
      || bitmap.height > IMAGES_TO_PDF_MAX_SIDE_PIXELS
      || bitmap.width * bitmap.height > IMAGES_TO_PDF_MAX_IMAGE_PIXELS
    ) throw new Error('The decoded image exceeds the safe dimensions.');
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The image canvas could not be initialized.');
    const preservePng = sourceFormat === 'png' && compression === 'quality';
    if (!preservePng) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0);
    const format = preservePng ? 'png' : 'jpeg';
    const encoded = await canvas.convertToBlob({
      type: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: format === 'jpeg' ? compressionQuality(compression) : undefined,
    });
    const result = { blob: encoded, format, width: canvas.width, height: canvas.height };
    canvas.width = 1;
    canvas.height = 1;
    return result;
  } finally {
    bitmap.close();
  }
}

function embedImage(pdf: PDFDocument, bytes: Uint8Array, format: 'png' | 'jpeg'): Promise<PDFImage> {
  return format === 'png' ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
}

function send(response: ImagePdfWorkerResponse): void {
  postMessage(response);
}

function sendFailure(error: unknown): void {
  send({
    type: 'failure',
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : 'The image PDF worker failed.',
  });
}
