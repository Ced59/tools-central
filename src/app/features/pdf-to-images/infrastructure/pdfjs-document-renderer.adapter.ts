import type { PDFDocumentProxy } from 'pdfjs-dist';

import type { PdfDocumentRendererPort } from '../application/pdf-to-images.ports';
import type { PdfImageRenderWorkerResponse } from './pdfjs-image-render.messages';
import type {
  PdfDocumentSummary,
  PdfRenderedImage,
  PdfRenderPlan,
} from '../domain/pdf-to-images.models';
import { PDF_TO_IMAGES_MAX_DOCUMENT_PAGES } from '../domain/pdf-to-images.models';

const PDFJS_ASSET_ROOT = '/assets/pdfjs/';
export type PdfJsModuleLoader = () => Promise<typeof import('pdfjs-dist')>;
export type PdfImageRenderWorkerFactory = () => Worker;

export class PdfJsDocumentRendererAdapter implements PdfDocumentRendererPort {
  constructor(
    private readonly loadPdfJs: PdfJsModuleLoader = () => import('pdfjs-dist'),
    private readonly createRenderWorker: PdfImageRenderWorkerFactory = createImageRenderWorker,
  ) {}

  async inspect(data: Uint8Array, password?: string, signal?: AbortSignal): Promise<PdfDocumentSummary> {
    const document = await this.load(data, password, signal);
    const destroy = createPdfDestroyer(document);
    const abort = (): void => {
      void destroy();
    };
    signal?.addEventListener('abort', abort, { once: true });
    try {
      throwIfAborted(signal);
      if (document.numPages > PDF_TO_IMAGES_MAX_DOCUMENT_PAGES) {
        return { pageCount: document.numPages, pages: [] };
      }

      const pages = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        throwIfAborted(signal);
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
      signal?.removeEventListener('abort', abort);
      await destroy();
    }
  }

  async render(
    data: Uint8Array,
    password: string | undefined,
    plan: PdfRenderPlan,
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<PdfRenderedImage[]> {
    const worker = this.createRenderWorker();
    const transferableData = data.slice();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void): void => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', abort);
        worker.terminate();
        callback();
      };
      const abort = (): void => {
        finish(() => {
          reject(createAbortError());
        });
      };

      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      worker.onmessage = ({ data: response }: MessageEvent<PdfImageRenderWorkerResponse>) => {
        if (response.type === 'progress') {
          onProgress?.(response.completed, response.total);
        } else if (response.type === 'success') {
          finish(() => {
            resolve(response.images);
          });
        } else {
          const error = new Error(response.message);
          error.name = response.name;
          finish(() => {
            reject(error);
          });
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        finish(() => {
          reject(new Error(event.message || 'The PDF image worker failed.'));
        });
      };
      const assetRoot = new URL(PDFJS_ASSET_ROOT, documentOwner().baseURI).toString();
      worker.postMessage({ data: transferableData.buffer, password, plan, assetRoot }, [transferableData.buffer]);
    });
  }

  private async load(
    data: Uint8Array,
    password?: string,
    signal?: AbortSignal,
  ): Promise<PDFDocumentProxy> {
    const pdfjs = await this.loadPdfJs();
    const baseUrl = new URL(PDFJS_ASSET_ROOT, documentOwner().baseURI);
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerUrl = new URL('pdf.worker.min.mjs', baseUrl);
      workerUrl.searchParams.set('v', pdfjs.version);
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
    let rejectAbort: ((reason: Error) => void) | null = null;
    const abortPromise = new Promise<never>((_, reject) => {
      rejectAbort = reject;
    });
    const abort = (): void => {
      rejectAbort?.(createAbortError());
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    try {
      return await (signal ? Promise.race([loadingTask.promise, abortPromise]) : loadingTask.promise);
    } catch (error: unknown) {
      await loadingTask.destroy().catch(() => undefined);
      if (signal?.aborted) throw createAbortError();
      throw error;
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  }
}

function documentOwner(): Document {
  if (typeof document === 'undefined') throw new Error('PDF rendering is only available in a browser.');
  return document;
}

function createPdfDestroyer(documentProxy: PDFDocumentProxy): () => Promise<void> {
  let destruction: Promise<void> | null = null;
  return () => {
    destruction ??= documentProxy.loadingTask.destroy();
    return destruction;
  };
}

function createImageRenderWorker(): Worker {
  if (typeof Worker === 'undefined') throw new Error('Web Workers are not supported by this browser.');
  return new Worker(new URL('./pdfjs-image-render.worker', import.meta.url), { type: 'module' });
}

function createAbortError(): Error {
  const error = new Error('The PDF image conversion was cancelled.');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createAbortError();
}
