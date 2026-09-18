import type {
  CsvJsonConversionOptions,
  CsvJsonConversionResult,
} from '../domain/csv-json.models';

export interface CsvJsonSourceFile {
  fileName: string;
  size: number;
  blob: Blob;
}

export interface CsvJsonConverterPort {
  readonly convert: (
    source: string,
    options: CsvJsonConversionOptions,
    signal?: AbortSignal,
  ) => Promise<CsvJsonConversionResult>;
}

export interface CsvJsonTextFileReaderPort {
  readonly read: (blob: Blob, signal?: AbortSignal) => Promise<string>;
}

export interface CsvJsonClipboardPort {
  readonly copy: (text: string) => Promise<boolean>;
}

export interface CsvJsonDownloadPort {
  readonly download: (content: string, filename: string, mediaType: string) => void;
}
