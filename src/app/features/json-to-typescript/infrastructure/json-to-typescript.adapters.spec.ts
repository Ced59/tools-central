import { afterEach, describe, expect, it, vi } from 'vitest';

import { JsonToTypeScriptFileError } from '../application/json-to-typescript.use-cases';
import {
  generateTypeScriptFromJson,
  type JsonToTypeScriptOptions,
} from '../domain/json-to-typescript.models';
import { BrowserJsonToTypeScriptFileReaderAdapter } from './browser-json-to-typescript-file-reader.adapter';
import {
  JsonToTypeScriptWorkerAdapter,
  type JsonToTypeScriptWorkerLike,
} from './json-to-typescript-worker.adapter';
import type { JsonToTypeScriptWorkerResponse } from './json-to-typescript.worker.messages';

const OPTIONS: JsonToTypeScriptOptions = {
  rootName: 'User',
  declarationKind: 'interface',
  arrayObjectMode: 'merge',
  inferDates: false,
  readonlyProperties: false,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('JSON to TypeScript browser adapters', () => {
  it('reads strict UTF-8 and rejects invalid byte sequences', async () => {
    const reader = new BrowserJsonToTypeScriptFileReaderAdapter();

    await expect(reader.read(new Blob(['{"name":"Zoé"}']))).resolves.toBe('{"name":"Zoé"}');
    await expect(reader.read(new Blob([Uint8Array.of(0xc3, 0x28)])))
      .rejects.toBeInstanceOf(JsonToTypeScriptFileError);
  });

  it('resolves a Worker result and terminates the Worker', async () => {
    const { worker, postMessage, terminate } = createWorkerDouble();
    const promise = new JsonToTypeScriptWorkerAdapter(() => worker)
      .generate('{"id":1}', OPTIONS);
    worker.onmessage?.(new MessageEvent<JsonToTypeScriptWorkerResponse>('message', { data: {
      type: 'success',
      result: generateTypeScriptFromJson('{"id":1}', OPTIONS),
    } }));

    await expect(promise).resolves.toMatchObject({ ok: true, normalizedRootName: 'User' });
    expect(postMessage).toHaveBeenCalledWith({ source: '{"id":1}', options: OPTIONS });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('propagates Worker failures and terminates the Worker', async () => {
    const { worker, terminate } = createWorkerDouble();
    const promise = new JsonToTypeScriptWorkerAdapter(() => worker)
      .generate('{"id":1}', OPTIONS);
    worker.onmessage?.(new MessageEvent<JsonToTypeScriptWorkerResponse>('message', { data: {
      type: 'failure',
      message: 'broken worker',
    } }));

    await expect(promise).rejects.toThrow('broken worker');
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('cancels a Worker without accepting a late response', async () => {
    const { worker, terminate } = createWorkerDouble();
    const controller = new AbortController();
    const promise = new JsonToTypeScriptWorkerAdapter(() => worker)
      .generate('{"id":1}', OPTIONS, controller.signal);

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('terminates a Worker that exceeds the generation deadline', async () => {
    vi.useFakeTimers();
    const { worker, terminate } = createWorkerDouble();
    const promise = new JsonToTypeScriptWorkerAdapter(() => worker)
      .generate('{"id":1}', OPTIONS);
    const rejection = expect(promise).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(5_000);

    await rejection;
    expect(terminate).toHaveBeenCalledOnce();
  });
});

function createWorkerDouble(): {
  worker: JsonToTypeScriptWorkerLike;
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
