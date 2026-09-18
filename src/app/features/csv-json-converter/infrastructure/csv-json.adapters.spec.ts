import { describe, expect, it, vi } from 'vitest';

import { CsvJsonValidationError } from '../application/csv-json.use-cases';
import type { CsvJsonConversionOptions } from '../domain/csv-json.models';
import { BrowserCsvJsonFileReaderAdapter } from './browser-csv-json-file-reader.adapter';
import {
  CsvJsonWorkerAdapter,
  type CsvJsonWorkerLike,
} from './csv-json-worker.adapter';
import type { CsvJsonWorkerResponse } from './csv-json.worker.messages';

const OPTIONS: CsvJsonConversionOptions = {
  direction: 'csv-to-json',
  delimiter: 'auto',
  firstRowHeaders: true,
  trimCells: false,
  inferTypes: true,
  mapping: '',
  protectSpreadsheetFormulas: true,
  includeBom: false,
};

describe('CSV/JSON browser adapters', () => {
  it('lit strictement un fichier UTF-8 et refuse les octets invalides', async () => {
    const reader = new BrowserCsvJsonFileReaderAdapter();

    await expect(reader.read(new Blob(['é']))).resolves.toBe('é');
    await expect(reader.read(new Blob([Uint8Array.of(0xc3, 0x28)])))
      .rejects.toBeInstanceOf(CsvJsonValidationError);
  });

  it('résout le résultat du Worker puis le termine', async () => {
    const { worker, postMessage, terminate } = createWorkerDouble();
    const promise = new CsvJsonWorkerAdapter(() => worker).convert('a\n1', OPTIONS);
    worker.onmessage?.(new MessageEvent<CsvJsonWorkerResponse>('message', { data: {
      type: 'success',
      result: {
        ok: true,
        direction: 'csv-to-json',
        output: '[{"a":1}]',
        outputMediaType: 'application/json;charset=utf-8',
        outputExtension: 'json',
        detectedDelimiter: 'comma',
        previewHeaders: ['a'],
        previewRows: [['1']],
        issues: [],
        stats: { inputRows: 2, outputRows: 1, columns: 1, inputCharacters: 3, outputCharacters: 9 },
      },
    } }));

    await expect(promise).resolves.toMatchObject({ ok: true, outputExtension: 'json' });
    expect(postMessage).toHaveBeenCalledWith({ source: 'a\n1', options: OPTIONS });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('annule le Worker sans accepter une réponse tardive', async () => {
    const { worker, terminate } = createWorkerDouble();
    const controller = new AbortController();
    const promise = new CsvJsonWorkerAdapter(() => worker).convert('a\n1', OPTIONS, controller.signal);

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(terminate).toHaveBeenCalledOnce();
  });
});

function createWorkerDouble(): {
  worker: CsvJsonWorkerLike;
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
} {
  const postMessage = vi.fn();
  const terminate = vi.fn();
  return {
    worker: { onmessage: null, onerror: null, postMessage, terminate },
    postMessage,
    terminate,
  };
}
