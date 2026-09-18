import { generateTypeScriptFromJson } from '../domain/json-to-typescript.models';
import type {
  JsonToTypeScriptWorkerRequest,
  JsonToTypeScriptWorkerResponse,
} from './json-to-typescript.worker.messages';

addEventListener('message', ({ data }: MessageEvent<JsonToTypeScriptWorkerRequest>) => {
  try {
    send({ type: 'success', result: generateTypeScriptFromJson(data.source, data.options) });
  } catch (error: unknown) {
    send({
      type: 'failure',
      message: error instanceof Error ? error.message : 'JSON to TypeScript generation failed.',
    });
  }
});

function send(response: JsonToTypeScriptWorkerResponse): void {
  postMessage(response);
}
