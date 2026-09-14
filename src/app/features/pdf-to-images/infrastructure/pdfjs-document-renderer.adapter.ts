import type { PDFDocumentProxy } from 'pdfjs-dist';

import type { PdfDocumentRendererPort } from '../application/pdf-to-images.ports';
import type {
  PdfDocumentSummary,
  PdfRenderedImage,
  PdfRenderPlan,
} from '../domain/pdf-to-images.models';
import { PDF_TO_IMAGES_MAX_DOCUMENT_PAGES } from '../domain/pdf-to-images.models';

const PDFJS_ASSET_ROOT = '/assets/pdfjs/';
const PDFJS_VERSION = '6.3.289';
export type PdfJsModuleLoader = () => Promise<typeof import('pdfjs-dist')>;

export class PdfJsDocumentRendererAdapter implements PdfDocumentRendererPort {
  constructor(private readonly loadPdfJs: PdfJsModuleLoader = () => import('pdfjs-dist')) {}

  async inspect(data: Uint8Array, password?: string): Promise<PdfDocumentSummary> {
    const document = await this.load(data, password);
    try {
      if (document.numPages > PDF_TO_IMAGES_MAX_DOCUMENT_PAGES) {
        return { pageCount: document.numPages, pages: [] };
      }

      const pages = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({
          pageNumber,
          widthPoints: viewport.width,
          heightPoints: viewport.height,
          rotation: viewport.rotation,
        });
        page.cleanup();
      }
      return { pageCount: document.numPages, pages };
    } finally {
      await destroyPdfDocument(document);
    }
  }

  async render(
    data: Uint8Array,
    password: string | undefined,
    plan: PdfRenderPlan,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<PdfRenderedImage[]> {
    const document = await this.load(data, password);
    const results: PdfRenderedImage[] = [];
    try {
      for (let index = 0; index < plan.pageNumbers.length; index += 1) {
        const pageNumber = plan.pageNumbers[index];
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: plan.dpi / 72 });
        const canvas = documentOwner().createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          viewport,
          background: plan.background,
        }).promise;

        const encoded = await encodeCanvas(canvas, plan.format, plan.quality);
        results.push({
          pageNumber,
          width: canvas.width,
          height: canvas.height,
          bytes: new Uint8Array(await encoded.blob.arrayBuffer()),
          mimeType: encoded.blob.type,
          extension: encoded.extension,
        });
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
        onProgress?.(index + 1, plan.pageNumbers.length);
      }
      return results;
    } finally {
      await destroyPdfDocument(document);
    }
  }

  private async load(data: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
    const pdfjs = await this.loadPdfJs();
    const baseUrl = new URL(PDFJS_ASSET_ROOT, documentOwner().baseURI);
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerUrl = new URL('pdf.worker.min.mjs', baseUrl);
      workerUrl.searchParams.set('v', PDFJS_VERSION);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.toString();
    }
    const loadingTask = pdfjs.getDocument({
      data: data.slice(),
      password,
      cMapUrl: new URL('cmaps/', baseUrl).toString(),
      cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', baseUrl).toString(),
      wasmUrl: new URL('wasm/', baseUrl).toString(),
      stopAtErrors: true,
    });
    try {
      return await loadingTask.promise;
    } catch (error: unknown) {
      await loadingTask.destroy().catch(() => undefined);
      throw error;
    }
  }
}

function documentOwner(): Document {
  if (typeof document === 'undefined') throw new Error('PDF rendering is only available in a browser.');
  return document;
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: PdfRenderPlan['format'],
  quality: number,
): Promise<{ blob: Blob; extension: string }> {
  const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
  const blob = await canvasToBlob(canvas, mimeType, format === 'png' ? undefined : quality);
  if (blob) return { blob, extension: extensionForMimeType(blob.type, format) };

  const fallback = await canvasToBlob(canvas, 'image/png');
  if (!fallback) throw new Error('The browser could not encode the rendered page.');
  return { blob: fallback, extension: 'png' };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

function extensionForMimeType(mimeType: string, requestedFormat: PdfRenderPlan['format']): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return requestedFormat;
}

function destroyPdfDocument(documentProxy: PDFDocumentProxy): Promise<void> {
  return documentProxy.loadingTask.destroy();
}
