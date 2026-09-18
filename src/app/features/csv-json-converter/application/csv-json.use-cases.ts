import type {
  CsvJsonClipboardPort,
  CsvJsonConverterPort,
  CsvJsonDownloadPort,
  CsvJsonSourceFile,
  CsvJsonTextFileReaderPort,
} from './csv-json.ports';
import {
  CSV_JSON_MAX_SOURCE_CHARACTERS,
  type CsvJsonConversionOptions,
  type CsvJsonConversionResult,
} from '../domain/csv-json.models';

export { CSV_JSON_MAX_SOURCE_CHARACTERS } from '../domain/csv-json.models';
export type {
  CsvJsonConversionOptions,
  CsvJsonConversionResult,
  CsvJsonDelimiter,
  CsvJsonDirection,
  CsvJsonIssue,
  CsvJsonIssueCode,
} from '../domain/csv-json.models';

export const CSV_JSON_MAX_FILE_BYTES = 4_000_000;

export type CsvJsonValidationErrorCode =
  | 'empty-file'
  | 'file-too-large'
  | 'unsupported-file'
  | 'invalid-utf8';

export class CsvJsonValidationError extends Error {
  constructor(readonly code: CsvJsonValidationErrorCode) {
    super(code);
    this.name = 'CsvJsonValidationError';
  }
}

export class ConvertCsvJsonUseCase {
  constructor(private readonly converter: CsvJsonConverterPort) {}

  execute(
    source: string,
    options: CsvJsonConversionOptions,
    signal?: AbortSignal,
  ): Promise<CsvJsonConversionResult> {
    if (source.length > CSV_JSON_MAX_SOURCE_CHARACTERS) {
      return Promise.resolve({
        ok: false,
        direction: options.direction,
        output: '',
        outputMediaType: options.direction === 'csv-to-json'
          ? 'application/json;charset=utf-8'
          : 'text/csv;charset=utf-8',
        outputExtension: options.direction === 'csv-to-json' ? 'json' : 'csv',
        detectedDelimiter: options.delimiter === 'auto' ? 'comma' : options.delimiter,
        previewHeaders: [],
        previewRows: [],
        issues: [{
          code: 'source-too-large',
          severity: 'error',
          row: null,
          column: null,
          detail: '',
        }],
        stats: {
          inputRows: 0,
          outputRows: 0,
          columns: 0,
          inputCharacters: source.length,
          outputCharacters: 0,
        },
      });
    }
    return this.converter.convert(source, options, signal);
  }
}

export class ReadCsvJsonSourceFileUseCase {
  constructor(private readonly reader: CsvJsonTextFileReaderPort) {}

  execute(source: CsvJsonSourceFile, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) return Promise.reject(createAbortError());
    if (source.size === 0) return Promise.reject(new CsvJsonValidationError('empty-file'));
    if (source.size > CSV_JSON_MAX_FILE_BYTES) {
      return Promise.reject(new CsvJsonValidationError('file-too-large'));
    }
    if (!/\.(?:csv|tsv|txt|json)$/iu.test(source.fileName)) {
      return Promise.reject(new CsvJsonValidationError('unsupported-file'));
    }
    return this.reader.read(source.blob, signal);
  }
}

export class CopyCsvJsonOutputUseCase {
  constructor(private readonly clipboard: CsvJsonClipboardPort) {}

  execute(result: CsvJsonConversionResult): Promise<boolean> {
    if (!result.ok) return Promise.resolve(false);
    return this.clipboard.copy(result.output);
  }
}

export class DownloadCsvJsonOutputUseCase {
  constructor(private readonly downloadPort: CsvJsonDownloadPort) {}

  execute(result: CsvJsonConversionResult): void {
    if (!result.ok) return;
    this.downloadPort.download(
      result.output,
      `conversion-csv-json.${result.outputExtension}`,
      result.outputMediaType,
    );
  }
}

function createAbortError(): Error {
  const error = new Error('The operation was cancelled.');
  error.name = 'AbortError';
  return error;
}
