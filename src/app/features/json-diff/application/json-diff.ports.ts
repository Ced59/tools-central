import type { JsonDiffOptions, JsonDiffResult } from '../domain/json-diff.models';

export interface JsonDiffComparatorPort {
  readonly compare: (
    left: string,
    right: string,
    options: JsonDiffOptions,
    signal?: AbortSignal,
  ) => Promise<JsonDiffResult>;
}

export interface JsonDiffTextFileReaderPort {
  readonly read: (blob: Blob, signal?: AbortSignal) => Promise<string>;
}

export interface JsonDiffClipboardPort {
  readonly copy: (text: string) => Promise<boolean>;
}

export interface JsonDiffDownloadPort {
  readonly download: (content: string, filename: string, mediaType: string) => void;
}

export interface JsonDiffLocationPort {
  readonly publicUrlWithoutData: () => string;
}
