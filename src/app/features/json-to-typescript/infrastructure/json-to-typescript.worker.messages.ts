import type {
  JsonToTypeScriptOptions,
  JsonToTypeScriptResult,
} from '../domain/json-to-typescript.models';

export interface JsonToTypeScriptWorkerRequest {
  source: string;
  options: JsonToTypeScriptOptions;
}

export type JsonToTypeScriptWorkerResponse =
  | Readonly<{ type: 'success'; result: JsonToTypeScriptResult }>
  | Readonly<{ type: 'failure'; message: string }>;
