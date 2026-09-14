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
  bytes: Uint8Array;
}

export interface PdfImageArchivePort {
  readonly create: (
    entries: readonly PdfImageArchiveEntry[],
    signal?: AbortSignal,
  ) => Promise<Uint8Array>;
}

export interface PdfImageDownloadPort {
  readonly download: (bytes: Uint8Array, mimeType: string, fileName: string) => void;
}
