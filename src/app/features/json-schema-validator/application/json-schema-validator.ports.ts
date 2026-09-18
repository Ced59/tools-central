import type {
  JsonSchemaValidationOptions,
  JsonSchemaValidationResult,
} from '../domain/json-schema-validator.models';

export interface JsonSchemaValidatorPort {
  validate(
    schema: string,
    instance: string,
    options: JsonSchemaValidationOptions,
    signal?: AbortSignal,
  ): Promise<JsonSchemaValidationResult>;
}

export interface JsonSchemaTextFileReaderPort {
  read(blob: Blob, signal?: AbortSignal): Promise<string>;
}

export interface JsonSchemaClipboardPort {
  copy(value: string): Promise<boolean>;
}

export interface JsonSchemaDownloadPort {
  download(value: string, fileName: string, mimeType: string): void;
}

export interface JsonSchemaLocationPort {
  publicUrlWithoutData(): string;
}
