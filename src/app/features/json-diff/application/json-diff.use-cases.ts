import type {
  JsonDiffClipboardPort,
  JsonDiffComparatorPort,
  JsonDiffDownloadPort,
  JsonDiffLocationPort,
  JsonDiffTextFileReaderPort,
} from './json-diff.ports';
import {
  JSON_DIFF_MAX_SOURCE_CHARACTERS,
  type JsonDiffOptions,
  type JsonDiffResult,
} from '../domain/json-diff.models';

export {
  JSON_DIFF_MAX_SOURCE_CHARACTERS,
  JSON_DIFF_PREVIEW_CHANGES,
} from '../domain/json-diff.models';
export type {
  JsonDiffArrayMode,
  JsonDiffChangeKind,
  JsonDiffChangePreview,
  JsonDiffIssue,
  JsonDiffIssueCode,
  JsonDiffOptions,
  JsonDiffResult,
} from '../domain/json-diff.models';

export const JSON_DIFF_MAX_FILE_BYTES = 2_000_000;

export type JsonDiffDocumentSide = 'left' | 'right';
export type JsonDiffArtifact = 'patch' | 'report';
export type JsonDiffFileErrorCode = 'empty-file' | 'file-too-large' | 'unsupported-file' | 'invalid-utf8';

export interface JsonDiffSourceFile {
  fileName: string;
  size: number;
  blob: Blob;
}

export class JsonDiffFileError extends Error {
  constructor(readonly code: JsonDiffFileErrorCode) {
    super(code);
    this.name = 'JsonDiffFileError';
  }
}

export class CompareJsonDocumentsUseCase {
  constructor(private readonly comparator: JsonDiffComparatorPort) {}

  execute(
    left: string,
    right: string,
    options: JsonDiffOptions,
    signal?: AbortSignal,
  ): Promise<JsonDiffResult> {
    if (left.length > JSON_DIFF_MAX_SOURCE_CHARACTERS) return Promise.resolve(sourceTooLargeResult('left', left, right));
    if (right.length > JSON_DIFF_MAX_SOURCE_CHARACTERS) return Promise.resolve(sourceTooLargeResult('right', left, right));
    return this.comparator.compare(left, right, options, signal);
  }
}

export class ReadJsonDiffSourceFileUseCase {
  constructor(private readonly reader: JsonDiffTextFileReaderPort) {}

  execute(source: JsonDiffSourceFile, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) return Promise.reject(createAbortError());
    if (source.size === 0) return Promise.reject(new JsonDiffFileError('empty-file'));
    if (source.size > JSON_DIFF_MAX_FILE_BYTES) {
      return Promise.reject(new JsonDiffFileError('file-too-large'));
    }
    if (!/\.(?:json|txt)$/iu.test(source.fileName)) {
      return Promise.reject(new JsonDiffFileError('unsupported-file'));
    }
    return this.reader.read(source.blob, signal);
  }
}

export class CopyJsonDiffArtifactUseCase {
  constructor(private readonly clipboard: JsonDiffClipboardPort) {}

  execute(result: JsonDiffResult, artifact: JsonDiffArtifact): Promise<boolean> {
    if (!result.ok) return Promise.resolve(false);
    return this.clipboard.copy(artifact === 'patch' ? result.patch : result.report);
  }
}

export class DownloadJsonDiffArtifactUseCase {
  constructor(private readonly downloadPort: JsonDiffDownloadPort) {}

  execute(result: JsonDiffResult, artifact: JsonDiffArtifact): void {
    if (!result.ok) return;
    this.downloadPort.download(
      artifact === 'patch' ? result.patch : result.report,
      artifact === 'patch' ? 'json-diff.patch.json' : 'json-diff-report.json',
      'application/json;charset=utf-8',
    );
  }
}

export class CopyJsonDiffShareLinkUseCase {
  constructor(
    private readonly clipboard: JsonDiffClipboardPort,
    private readonly location: JsonDiffLocationPort,
  ) {}

  execute(): Promise<boolean> {
    return this.clipboard.copy(this.location.publicUrlWithoutData());
  }
}

function createAbortError(): Error {
  const error = new Error('The operation was cancelled.');
  error.name = 'AbortError';
  return error;
}

function sourceTooLargeResult(
  side: JsonDiffDocumentSide,
  left: string,
  right: string,
): JsonDiffResult {
  return {
    ok: false,
    equivalent: false,
    issues: [{ code: 'source-too-large', side, path: '', detail: '', position: null }],
    summary: { added: 0, removed: 0, changed: 0, typeChanged: 0, moved: 0, total: 0 },
    changes: [],
    changesTruncated: false,
    patch: '',
    report: '',
    stats: {
      leftCharacters: left.length,
      rightCharacters: right.length,
      leftNodes: 0,
      rightNodes: 0,
      ignoredPaths: 0,
    },
  };
}
