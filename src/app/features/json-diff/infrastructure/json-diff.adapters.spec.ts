import { describe, expect, it, vi } from 'vitest';

import { BrowserJsonDiffFileReaderAdapter } from './browser-json-diff-file-reader.adapter';
import { JsonDiffWorkerAdapter, type JsonDiffWorkerLike } from './json-diff-worker.adapter';
import type { JsonDiffResult } from '../domain/json-diff.models';

const OPTIONS = { arrayMode: 'index' as const, arrayKey: '/id', ignoredPaths: '' };
const RESULT: JsonDiffResult = {
  ok: true,
  equivalent: true,
  issues: [],
  summary: { added: 0, removed: 0, changed: 0, typeChanged: 0, moved: 0, total: 0 },
  changes: [],
  changesTruncated: false,
  patch: '[]',
  report: '{}',
  stats: { leftCharacters: 2, rightCharacters: 2, leftNodes: 1, rightNodes: 1, ignoredPaths: 0 },
};

describe('JSON diff browser adapters', () => {
  it('termine le Worker après une réponse réussie', async () => {
    const worker = createWorker();
    const adapter = new JsonDiffWorkerAdapter(() => worker);
    const promise = adapter.compare('{}', '{}', OPTIONS);

    worker.onmessage?.(new MessageEvent('message', { data: { type: 'success', result: RESULT } }));

    await expect(promise).resolves.toBe(RESULT);
    expect(worker.postMessage).toHaveBeenCalledWith({ left: '{}', right: '{}', options: OPTIONS });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('rejette une erreur Worker et termine la ressource', async () => {
    const worker = createWorker();
    const adapter = new JsonDiffWorkerAdapter(() => worker);
    const promise = adapter.compare('{}', '{}', OPTIONS);

    worker.onmessage?.(new MessageEvent('message', { data: { type: 'failure', message: 'failed' } }));

    await expect(promise).rejects.toThrow('failed');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('annule et termine le Worker même avant son premier message', async () => {
    const worker = createWorker();
    const controller = new AbortController();
    const adapter = new JsonDiffWorkerAdapter(() => worker);
    const promise = adapter.compare('{}', '{}', OPTIONS, controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('décode strictement un fichier UTF-8 et rejette les octets invalides', async () => {
    const adapter = new BrowserJsonDiffFileReaderAdapter();

    await expect(adapter.read(new Blob(['{"é":1}']))).resolves.toBe('{"é":1}');
    await expect(adapter.read(new Blob([new Uint8Array([0xc3, 0x28])]))).rejects.toMatchObject({
      code: 'invalid-utf8',
    });
  });
});

function createWorker(): JsonDiffWorkerLike {
  return {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  };
}
