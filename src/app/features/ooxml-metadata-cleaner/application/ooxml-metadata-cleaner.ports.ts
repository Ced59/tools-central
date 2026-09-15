import type {
  OoxmlDocumentKind,
  OoxmlMetadataOptions,
  OoxmlMetadataReport,
} from '../domain/ooxml-metadata.models';

export interface OoxmlMetadataSource {
  fileName: string;
  size: number;
  blob: Blob;
}

export interface OoxmlFileReaderPort {
  readonly read: (blob: Blob, signal?: AbortSignal) => Promise<Uint8Array>;
}

export interface OoxmlMetadataCleanerPort {
  readonly clean: (
    data: Uint8Array,
    kind: OoxmlDocumentKind,
    options: OoxmlMetadataOptions,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ) => Promise<{ bytes: Uint8Array; report: OoxmlMetadataReport }>;
}

export interface OoxmlMetadataDownloadPort {
  readonly download: (
    bytes: Uint8Array,
    kind: OoxmlDocumentKind,
    fileName: string,
  ) => void;
}
