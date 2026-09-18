/// <reference lib="webworker" />

import { compareJsonDocuments } from '../domain/json-diff.models';
import type { JsonDiffWorkerRequest, JsonDiffWorkerResponse } from './json-diff.worker.messages';

addEventListener('message', ({ data }: MessageEvent<JsonDiffWorkerRequest>) => {
  try {
    const response: JsonDiffWorkerResponse = {
      type: 'success',
      result: compareJsonDocuments(data.left, data.right, data.options),
    };
    postMessage(response);
  } catch {
    const response: JsonDiffWorkerResponse = {
      type: 'failure',
      message: 'JSON comparison failed.',
    };
    postMessage(response);
  }
});
