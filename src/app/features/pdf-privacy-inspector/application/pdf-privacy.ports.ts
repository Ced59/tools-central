import type { PdfPrivacyReport } from '../domain/pdf-privacy.models';

export interface PdfPrivacySource {
  fileName: string;
  size: number;
  blob: Blob;
}

export interface PdfPrivacyFileReaderPort {
  readonly read: (blob: Blob, signal?: AbortSignal) => Promise<Uint8Array>;
}

export interface PdfPrivacyInspectorPort {
  readonly inspect: (
    data: Uint8Array,
    password: string | undefined,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ) => Promise<PdfPrivacyReport>;
}

export interface PdfPrivacyReportDownloadPort {
  readonly download: (json: string, fileName: string) => void;
}
