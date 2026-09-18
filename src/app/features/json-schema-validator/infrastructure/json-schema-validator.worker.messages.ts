import type {
  JsonSchemaValidationOptions,
  JsonSchemaValidationResult,
} from '../domain/json-schema-validator.models';

export interface JsonSchemaValidatorWorkerRequest {
  schema: string;
  instance: string;
  options: JsonSchemaValidationOptions;
}

export type JsonSchemaValidatorWorkerResponse =
  | { type: 'success'; result: JsonSchemaValidationResult }
  | { type: 'failure'; message: string };
