import type { CsvJsonWorkerRequest, CsvJsonWorkerResponse } from './csv-json.worker.messages';
import { convertCsvJson } from '../domain/csv-json.models';

addEventListener('message', ({ data }: MessageEvent<CsvJsonWorkerRequest>) => {
  try {
    send({ type: 'success', result: convertCsvJson(data.source, data.options) });
  } catch (error: unknown) {
    send({
      type: 'failure',
      message: error instanceof Error ? error.message : 'CSV/JSON conversion failed.',
    });
  }
});

function send(response: CsvJsonWorkerResponse): void {
  postMessage(response);
}
