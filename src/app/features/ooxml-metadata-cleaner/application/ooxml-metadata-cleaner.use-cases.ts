import type {
  OoxmlFileReaderPort,
  OoxmlMetadataCleanerPort,
  OoxmlMetadataDownloadPort,
  OoxmlMetadataSource,
} from './ooxml-metadata-cleaner.ports';
import {
  OOXML_METADATA_MAX_FILE_BYTES,
  OOXML_METADATA_MAX_OUTPUT_BYTES,
  buildCleanedOoxmlFileName,
  detectOoxmlKind,
  type OoxmlArchiveFailureCode,
  type OoxmlCleanedDocument,
  type OoxmlMetadataOptions,
} from '../domain/ooxml-metadata.models';

export {
  OOXML_METADATA_MAX_FILE_BYTES,
  OOXML_METADATA_MAX_OUTPUT_BYTES,
  detectOoxmlKind,
  type OoxmlCleanedDocument,
  type OoxmlDocumentKind,
  type OoxmlMetadataFinding,
  type OoxmlMetadataOptions,
  type OoxmlMetadataReport,
  type OoxmlMetadataScope,
} from '../domain/ooxml-metadata.models';

export type OoxmlMetadataFailureCode =
  | OoxmlArchiveFailureCode
  | 'empty-file'
  | 'file-too-large'
  | 'unsupported-format'
  | 'invalid-ooxml'
  | 'macro-package-unsupported'
  | 'signed-package-unsupported'
  | 'metadata-part-too-large'
  | 'output-too-large'
  | 'no-option-selected'
  | 'corrupt-document';

export class OoxmlMetadataValidationError extends Error {
  constructor(readonly code: OoxmlMetadataFailureCode, readonly entryName?: string) {
    super(code);
  }
}

export interface CleanOoxmlMetadataInput {
  source: OoxmlMetadataSource;
  options: OoxmlMetadataOptions;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export class CleanOoxmlMetadataUseCase {
  constructor(
    private readonly reader: OoxmlFileReaderPort,
    private readonly cleaner: OoxmlMetadataCleanerPort,
  ) {}

  async execute(input: CleanOoxmlMetadataInput): Promise<OoxmlCleanedDocument> {
    const kind = detectOoxmlKind(input.source.fileName);
    if (!kind) throw new OoxmlMetadataValidationError('unsupported-format');
    if (input.source.size === 0) throw new OoxmlMetadataValidationError('empty-file');
    if (input.source.size > OOXML_METADATA_MAX_FILE_BYTES) {
      throw new OoxmlMetadataValidationError('file-too-large');
    }
    if (!Object.values(input.options).some(Boolean)) {
      throw new OoxmlMetadataValidationError('no-option-selected');
    }

    try {
      const data = await this.reader.read(input.source.blob, input.signal);
      if (data.byteLength === 0) throw new OoxmlMetadataValidationError('empty-file');
      if (data.byteLength > OOXML_METADATA_MAX_FILE_BYTES) {
        throw new OoxmlMetadataValidationError('file-too-large');
      }
      const result = await this.cleaner.clean(
        data,
        kind,
        input.options,
        input.onProgress,
        input.signal,
      );
      if (result.blob.size > OOXML_METADATA_MAX_OUTPUT_BYTES) {
        throw new OoxmlMetadataValidationError('output-too-large');
      }
      return {
        ...result,
        fileName: buildCleanedOoxmlFileName(input.source.fileName, kind),
      };
    } catch (error: unknown) {
      if (error instanceof OoxmlMetadataValidationError || isAbortError(error)) throw error;
      const code = readFailureCode(error);
      throw new OoxmlMetadataValidationError(code ?? 'corrupt-document', readEntryName(error));
    }
  }
}

export class DownloadCleanedOoxmlUseCase {
  constructor(private readonly downloader: OoxmlMetadataDownloadPort) {}

  execute(document: OoxmlCleanedDocument): void {
    this.downloader.download(document.blob, document.fileName);
  }
}

function readFailureCode(error: unknown): OoxmlMetadataFailureCode | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && FAILURE_CODES.has(code as OoxmlMetadataFailureCode)
    ? code as OoxmlMetadataFailureCode
    : null;
}

function readEntryName(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('entryName' in error)) return undefined;
  const entryName = (error as { entryName?: unknown }).entryName;
  return typeof entryName === 'string' ? entryName : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const FAILURE_CODES = new Set<OoxmlMetadataFailureCode>([
  'invalid-zip',
  'zip64-unsupported',
  'multi-disk-unsupported',
  'encrypted-entry',
  'unsupported-compression',
  'unsafe-entry-path',
  'duplicate-entry',
  'too-many-entries',
  'entry-too-large',
  'archive-too-large',
  'compression-ratio-exceeded',
  'empty-file',
  'file-too-large',
  'unsupported-format',
  'invalid-ooxml',
  'macro-package-unsupported',
  'signed-package-unsupported',
  'metadata-part-too-large',
  'output-too-large',
  'no-option-selected',
  'corrupt-document',
]);
