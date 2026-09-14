import type {
  PdfDocumentSummary,
  PdfRenderedImage,
  PdfRenderPlan,
} from '../domain/pdf-to-images.models';

export interface PdfDocumentRendererPort {
  readonly inspect: (
    data: Uint8Array,
    password?: string,
    signal?: AbortSignal,
  ) => Promise<PdfDocumentSummary>;
  readonly render: (
    data: Uint8Array,
    password: string | undefined,
    plan: PdfRenderPlan,
    onProgress?: (completed: number, total: number) => void,
    signal?: AbortSignal,
  ) => Promise<PdfRenderedImage[]>;
}

export interface PdfImageArchiveEntry {
  fileName: string;
  blob: Blob;
}

export interface PdfImageArchivePort {
  readonly create: (
    entries: readonly PdfImageArchiveEntry[],
    signal?: AbortSignal,
  ) => Promise<Blob>;
}

export interface PdfImageDownloadPort {
  readonly download: (blob: Blob, fileName: string) => void;
}
