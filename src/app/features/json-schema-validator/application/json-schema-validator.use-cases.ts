import type {
  JsonSchemaClipboardPort,
  JsonSchemaDownloadPort,
  JsonSchemaLocationPort,
  JsonSchemaTextFileReaderPort,
  JsonSchemaValidatorPort,
} from './json-schema-validator.ports';
import {
  JSON_SCHEMA_MAX_INSTANCE_CHARACTERS,
  JSON_SCHEMA_MAX_SCHEMA_CHARACTERS,
  emptyJsonSchemaResult,
  type JsonSchemaDocumentSide,
  type JsonSchemaValidationOptions,
  type JsonSchemaValidationResult,
} from '../domain/json-schema-validator.models';

export {
  JSON_SCHEMA_MAX_ERRORS,
  JSON_SCHEMA_MAX_INSTANCE_CHARACTERS,
  JSON_SCHEMA_MAX_SCHEMA_CHARACTERS,
} from '../domain/json-schema-validator.models';
export type {
  JsonSchemaCorrection,
  JsonSchemaDocumentSide,
  JsonSchemaDraft,
  JsonSchemaDraftMode,
  JsonSchemaIssue,
  JsonSchemaIssueCode,
  JsonSchemaValidationError,
  JsonSchemaValidationOptions,
  JsonSchemaValidationResult,
} from '../domain/json-schema-validator.models';

export const JSON_SCHEMA_MAX_FILE_BYTES = 2_000_000;

export type JsonSchemaArtifact = 'report' | 'correction';
export type JsonSchemaFileErrorCode = 'empty-file' | 'file-too-large' | 'unsupported-file' | 'invalid-utf8';

export interface JsonSchemaSourceFile {
  fileName: string;
  size: number;
  blob: Blob;
}

export class JsonSchemaFileError extends Error {
  constructor(readonly code: JsonSchemaFileErrorCode) {
    super(code);
    this.name = 'JsonSchemaFileError';
  }
}

export class ValidateJsonSchemaUseCase {
  constructor(private readonly validator: JsonSchemaValidatorPort) {}

  execute(
    schema: string,
    instance: string,
    options: JsonSchemaValidationOptions,
    signal?: AbortSignal,
  ): Promise<JsonSchemaValidationResult> {
    if (schema.length > JSON_SCHEMA_MAX_SCHEMA_CHARACTERS) {
      return Promise.resolve(sourceTooLargeResult('schema', schema, instance));
    }
    if (instance.length > JSON_SCHEMA_MAX_INSTANCE_CHARACTERS) {
      return Promise.resolve(sourceTooLargeResult('instance', schema, instance));
    }
    return this.validator.validate(schema, instance, options, signal);
  }
}

export class ReadJsonSchemaSourceFileUseCase {
  constructor(private readonly reader: JsonSchemaTextFileReaderPort) {}

  execute(source: JsonSchemaSourceFile, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) return Promise.reject(createAbortError());
    if (source.size === 0) return Promise.reject(new JsonSchemaFileError('empty-file'));
    if (source.size > JSON_SCHEMA_MAX_FILE_BYTES) {
      return Promise.reject(new JsonSchemaFileError('file-too-large'));
    }
    if (!/\.(?:json|schema|txt)$/iu.test(source.fileName)) {
      return Promise.reject(new JsonSchemaFileError('unsupported-file'));
    }
    return this.reader.read(source.blob, signal);
  }
}

export class CopyJsonSchemaArtifactUseCase {
  constructor(private readonly clipboard: JsonSchemaClipboardPort) {}

  execute(result: JsonSchemaValidationResult, artifact: JsonSchemaArtifact): Promise<boolean> {
    const value = artifact === 'report' ? result.report : result.correction?.source ?? '';
    if (!value) return Promise.resolve(false);
    return this.clipboard.copy(value);
  }
}

export class DownloadJsonSchemaArtifactUseCase {
  constructor(private readonly downloadPort: JsonSchemaDownloadPort) {}

  execute(result: JsonSchemaValidationResult, artifact: JsonSchemaArtifact): void {
    const value = artifact === 'report' ? result.report : result.correction?.source ?? '';
    if (!value) return;
    this.downloadPort.download(
      value,
      artifact === 'report' ? 'json-schema-validation-report.json' : 'json-schema-corrected-example.json',
      'application/json;charset=utf-8',
    );
  }
}

export class CopyJsonSchemaShareLinkUseCase {
  constructor(
    private readonly clipboard: JsonSchemaClipboardPort,
    private readonly location: JsonSchemaLocationPort,
  ) {}

  execute(): Promise<boolean> {
    return this.clipboard.copy(this.location.publicUrlWithoutData());
  }
}

function sourceTooLargeResult(
  side: JsonSchemaDocumentSide,
  schema: string,
  instance: string,
): JsonSchemaValidationResult {
  return emptyJsonSchemaResult({
    code: 'source-too-large',
    side,
    path: '',
    detail: '',
    position: null,
  }, {
    schemaCharacters: schema.length,
    instanceCharacters: instance.length,
    schemaNodes: 0,
    instanceNodes: 0,
    patterns: 0,
  });
}

function createAbortError(): Error {
  const error = new Error('The operation was cancelled.');
  error.name = 'AbortError';
  return error;
}
