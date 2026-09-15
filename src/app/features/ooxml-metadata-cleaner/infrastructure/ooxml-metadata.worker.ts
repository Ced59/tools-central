/// <reference lib="webworker" />

import type {
  OoxmlMetadataWorkerRequest,
  OoxmlMetadataWorkerResponse,
} from './ooxml-metadata.worker.messages';
import {
  OoxmlMetadataEngineError,
  sanitizeOoxmlBuffer,
} from './ooxml-metadata.engine';
import { OoxmlArchiveError } from '../domain/ooxml-metadata.models';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async ({ data }: MessageEvent<OoxmlMetadataWorkerRequest>) => {
  try {
    const result = await sanitizeOoxmlBuffer(
      new Uint8Array(data.data),
      data.kind,
      data.options,
      percent => {
        post({ type: 'progress', percent });
      },
    );
    const output = result.output.buffer.slice(
      result.output.byteOffset,
      result.output.byteOffset + result.output.byteLength,
    ) as ArrayBuffer;
    const response: OoxmlMetadataWorkerResponse = {
      type: 'success',
      output,
      report: result.report,
    };
    workerScope.postMessage(response, [output]);
  } catch (error: unknown) {
    const knownError = error instanceof OoxmlArchiveError || error instanceof OoxmlMetadataEngineError;
    post({
      type: 'failure',
      code: knownError ? error.code : 'corrupt-document',
      entryName: knownError ? error.entryName : undefined,
      message: error instanceof Error ? error.message : 'The OOXML worker failed.',
    });
  }
};

function post(response: OoxmlMetadataWorkerResponse): void {
  workerScope.postMessage(response);
}
