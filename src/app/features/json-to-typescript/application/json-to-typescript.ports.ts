import type {
  JsonToTypeScriptOptions,
  JsonToTypeScriptResult,
} from '../domain/json-to-typescript.models';

export interface JsonToTypeScriptSourceFile {
  fileName: string;
  size: number;
  blob: Blob;
}

export interface JsonToTypeScriptGeneratorPort {
  readonly generate: (
    source: string,
    options: JsonToTypeScriptOptions,
    signal?: AbortSignal,
  ) => Promise<JsonToTypeScriptResult>;
}

export interface JsonToTypeScriptTextFileReaderPort {
  readonly read: (blob: Blob, signal?: AbortSignal) => Promise<string>;
}

export interface JsonToTypeScriptClipboardPort {
  readonly copy: (text: string) => Promise<boolean>;
}

export interface JsonToTypeScriptDownloadPort {
  readonly download: (content: string, filename: string, mediaType: string) => void;
}

export interface JsonToTypeScriptLocationPort {
  readonly currentUrlWithoutQueryOrFragment: () => string;
}
