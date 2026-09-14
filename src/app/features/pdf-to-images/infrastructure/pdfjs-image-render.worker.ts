import { PDFWorker, getDocument, version } from 'pdfjs-dist';

import type {
  PdfImageRenderWorkerCommand,
  PdfImageRenderWorkerResponse,
} from './pdfjs-image-render.messages';
import {
  PdfJsOffscreenCanvasFactory,
  PdfJsRejectingFilterFactory,
  PdfJsWorkerBinaryDataFactory,
} from './pdfjs-offscreen.factories';
import type { PdfRenderedImage, PdfRenderPlan } from '../domain/pdf-to-images.models';

addEventListener('message', ({ data }: MessageEvent<PdfImageRenderWorkerCommand>) => {
  void renderDocument(data);
});

async function renderDocument(command: PdfImageRenderWorkerCommand): Promise<void> {
  if (typeof OffscreenCanvas === 'undefined') {
    sendFailure(new Error('OffscreenCanvas is not supported by this browser.'));
    return;
  }

  const parsingWorker = new Worker(versionedWorkerUrl(command.assetRoot), { type: 'module' });
  const pdfWorker = new PDFWorker({ port: parsingWorker });
  const loadingTask = getDocument({
    data: new Uint8Array(command.data),
    password: command.password,
    cMapUrl: new URL('cmaps/', command.assetRoot).toString(),
    cMapPacked: true,
    standardFontDataUrl: new URL('standard_fonts/', command.assetRoot).toString(),
    wasmUrl: new URL('wasm/', command.assetRoot).toString(),
    CanvasFactory: PdfJsOffscreenCanvasFactory,
    FilterFactory: PdfJsRejectingFilterFactory,
    BinaryDataFactory: PdfJsWorkerBinaryDataFactory,
    worker: pdfWorker,
    disableFontFace: true,
    useSystemFonts: false,
    useWorkerFetch: false,
    stopAtErrors: true,
  });

  try {
    const document = await loadingTask.promise;
    const images: PdfRenderedImage[] = [];
    try {
      for (let index = 0; index < command.plan.pageNumbers.length; index += 1) {
        images.push(await renderPage(document, command.plan.pageNumbers[index], command.plan));
        send({ type: 'progress', completed: index + 1, total: command.plan.pageNumbers.length });
      }
      const response: PdfImageRenderWorkerResponse = { type: 'success', images };
      postMessage(response);
    } finally {
      await document.loadingTask.destroy();
    }
  } catch (error: unknown) {
    await loadingTask.destroy().catch(() => undefined);
    sendFailure(error);
  } finally {
    pdfWorker.destroy();
  }
}

async function renderPage(
  document: Awaited<ReturnType<typeof getDocument>['promise']>,
  pageNumber: number,
  plan: PdfRenderPlan,
): Promise<PdfRenderedImage> {
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: plan.dpi / 72 });
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  try {
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
      background: plan.background,
    }).promise;
    const encoded = await encodeCanvas(canvas, plan.format, plan.quality);
    return {
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      blob: encoded.blob,
      extension: encoded.extension,
    };
  } finally {
    canvas.width = 1;
    canvas.height = 1;
    page.cleanup();
  }
}

async function encodeCanvas(
  canvas: OffscreenCanvas,
  format: PdfRenderPlan['format'],
  quality: number,
): Promise<{ blob: Blob; extension: string }> {
  const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality: format === 'png' ? undefined : quality,
  });
  return { blob, extension: extensionForMimeType(blob.type, format) };
}

function extensionForMimeType(mimeType: string, requestedFormat: PdfRenderPlan['format']): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return requestedFormat;
}

function versionedWorkerUrl(assetRoot: string): string {
  const workerUrl = new URL('pdf.worker.min.mjs', assetRoot);
  workerUrl.searchParams.set('v', version);
  return workerUrl.toString();
}

function send(response: PdfImageRenderWorkerResponse): void {
  postMessage(response);
}

function sendFailure(error: unknown): void {
  send({
    type: 'failure',
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : 'The PDF image worker failed.',
  });
}
