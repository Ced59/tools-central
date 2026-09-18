import type {
  JsonToTypeScriptClipboardPort,
  JsonToTypeScriptDownloadPort,
  JsonToTypeScriptGeneratorPort,
  JsonToTypeScriptLocationPort,
  JsonToTypeScriptSourceFile,
  JsonToTypeScriptTextFileReaderPort,
} from './json-to-typescript.ports';
import {
  JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS,
  type JsonToTypeScriptOptions,
  type JsonToTypeScriptResult,
} from '../domain/json-to-typescript.models';

export { JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS } from '../domain/json-to-typescript.models';
export type {
  JsonToTypeScriptIssue,
  JsonToTypeScriptIssueCode,
  JsonToTypeScriptOptions,
  JsonToTypeScriptResult,
  JsonToTypeScriptWarning,
  JsonToTypeScriptWarningCode,
  TypeScriptArrayObjectMode,
  TypeScriptDeclarationKind,
} from '../domain/json-to-typescript.models';

export const JSON_TO_TYPESCRIPT_MAX_FILE_BYTES = 4_000_000;
export type JsonToTypeScriptArtifact = 'typescript' | 'report';

export type JsonToTypeScriptFileErrorCode =
  | 'empty-file'
  | 'file-too-large'
  | 'unsupported-file'
  | 'invalid-utf8';

export class JsonToTypeScriptFileError extends Error {
  constructor(readonly code: JsonToTypeScriptFileErrorCode) {
    super(code);
    this.name = 'JsonToTypeScriptFileError';
  }
}

export class GenerateTypeScriptFromJsonUseCase {
  constructor(private readonly generator: JsonToTypeScriptGeneratorPort) {}

  execute(
    source: string,
    options: JsonToTypeScriptOptions,
    signal?: AbortSignal,
  ): Promise<JsonToTypeScriptResult> {
    if (source.length > JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS) {
      return Promise.resolve({
        ok: false,
        output: '',
        report: '',
        normalizedRootName: '',
        issues: [{ code: 'source-too-large', position: null, detail: '' }],
        warnings: [],
        stats: {
          inputCharacters: source.length,
          nodes: 0,
          declarations: 0,
          properties: 0,
          optionalProperties: 0,
          unions: 0,
          inferredDates: 0,
          outputCharacters: 0,
        },
      });
    }
    return this.generator.generate(source, options, signal);
  }
}

export class ReadJsonToTypeScriptSourceFileUseCase {
  constructor(private readonly reader: JsonToTypeScriptTextFileReaderPort) {}

  execute(source: JsonToTypeScriptSourceFile, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) return Promise.reject(createAbortError());
    if (source.size === 0) return Promise.reject(new JsonToTypeScriptFileError('empty-file'));
    if (source.size > JSON_TO_TYPESCRIPT_MAX_FILE_BYTES) {
      return Promise.reject(new JsonToTypeScriptFileError('file-too-large'));
    }
    if (!/\.(?:json|txt)$/iu.test(source.fileName)) {
      return Promise.reject(new JsonToTypeScriptFileError('unsupported-file'));
    }
    return this.reader.read(source.blob, signal);
  }
}

export class CopyJsonToTypeScriptArtifactUseCase {
  constructor(private readonly clipboard: JsonToTypeScriptClipboardPort) {}

  execute(result: JsonToTypeScriptResult, artifact: JsonToTypeScriptArtifact): Promise<boolean> {
    if (!result.ok) return Promise.resolve(false);
    return this.clipboard.copy(artifact === 'typescript' ? result.output : result.report);
  }
}

export class DownloadJsonToTypeScriptArtifactUseCase {
  constructor(private readonly download: JsonToTypeScriptDownloadPort) {}

  execute(result: JsonToTypeScriptResult, artifact: JsonToTypeScriptArtifact): void {
    if (!result.ok) return;
    const safeName = result.normalizedRootName.replace(/[^A-Za-z0-9_-]/gu, '') || 'types';
    if (artifact === 'typescript') {
      this.download.download(result.output, `${safeName}.ts`, 'text/typescript;charset=utf-8');
      return;
    }
    this.download.download(result.report, `${safeName}-rapport.json`, 'application/json;charset=utf-8');
  }
}

export class CopyJsonToTypeScriptShareLinkUseCase {
  constructor(
    private readonly clipboard: JsonToTypeScriptClipboardPort,
    private readonly location: JsonToTypeScriptLocationPort,
  ) {}

  execute(): Promise<boolean> {
    return this.clipboard.copy(this.location.currentUrlWithoutQueryOrFragment());
  }
}

function createAbortError(): Error {
  const error = new Error('The operation was cancelled.');
  error.name = 'AbortError';
  return error;
}
