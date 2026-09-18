/// <reference lib="webworker" />

import { validateJsonSchemaDocuments } from './json-schema-validator.engine';
import type {
  JsonSchemaValidatorWorkerRequest,
  JsonSchemaValidatorWorkerResponse,
} from './json-schema-validator.worker.messages';

addEventListener('message', ({ data }: MessageEvent<JsonSchemaValidatorWorkerRequest>) => {
  try {
    const result = validateJsonSchemaDocuments(data.schema, data.instance, data.options);
    postMessage({ type: 'success', result } satisfies JsonSchemaValidatorWorkerResponse);
  } catch (error) {
    postMessage({
      type: 'failure',
      message: error instanceof Error ? error.message : 'JSON Schema validation failed.',
    } satisfies JsonSchemaValidatorWorkerResponse);
  }
});
