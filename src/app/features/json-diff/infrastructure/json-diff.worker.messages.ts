import type { JsonDiffOptions, JsonDiffResult } from '../domain/json-diff.models';

export interface JsonDiffWorkerRequest {
  left: string;
  right: string;
  options: JsonDiffOptions;
}

export type JsonDiffWorkerResponse =
  | { type: 'success'; result: JsonDiffResult }
  | { type: 'failure'; message: string };
