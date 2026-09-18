import { describe, expect, it, vi } from 'vitest';

import { BrowserJsonSchemaFileReaderAdapter } from './browser-json-schema-file-reader.adapter';
import {
  JsonSchemaValidatorWorkerAdapter,
  type JsonSchemaValidatorWorkerLike,
} from './json-schema-validator-worker.adapter';
import type { JsonSchemaValidatorWorkerResponse } from './json-schema-validator.worker.messages';

describe('JsonSchemaValidatorWorkerAdapter', () => {
  it('resolves a worker result and terminates the worker', async () => {
    const worker = fakeWorker();
    const adapter = new JsonSchemaValidatorWorkerAdapter(() => worker);
    const promise = adapter.validate('{}', '{}', { draft: 'auto', validateFormats: true });
    expect(worker.postMessage).toHaveBeenCalledWith({
      schema: '{}',
      instance: '{}',
      options: { draft: 'auto', validateFormats: true },
    });
    worker.onmessage?.({
      data: { type: 'success', result: resultFixture() },
    } as unknown as MessageEvent<JsonSchemaValidatorWorkerResponse>);
    await expect(promise).resolves.toMatchObject({ ok: true, valid: true });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('rejects worker failures', async () => {
    const worker = fakeWorker();
    const promise = new JsonSchemaValidatorWorkerAdapter(() => worker)
      .validate('{}', '{}', { draft: 'auto', validateFormats: true });
    worker.onmessage?.({
      data: { type: 'failure', message: 'boom' },
    } as unknown as MessageEvent<JsonSchemaValidatorWorkerResponse>);
    await expect(promise).rejects.toThrow('boom');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('terminates and rejects when validation is cancelled', async () => {
    const worker = fakeWorker();
    const controller = new AbortController();
    const promise = new JsonSchemaValidatorWorkerAdapter(() => worker)
      .validate('{}', '{}', { draft: 'auto', validateFormats: true }, controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('rejects low-level worker errors', async () => {
    const worker = fakeWorker();
    const promise = new JsonSchemaValidatorWorkerAdapter(() => worker)
      .validate('{}', '{}', { draft: 'auto', validateFormats: true });
    worker.onerror?.({ message: 'worker crashed' } as ErrorEvent);
    await expect(promise).rejects.toThrow('worker crashed');
  });

  it('terminates pathological validation after the automatic deadline', async () => {
    vi.useFakeTimers();
    try {
      const worker = fakeWorker();
      const promise = new JsonSchemaValidatorWorkerAdapter(() => worker, 25)
        .validate('{"pattern":"^(a+)+$"}', '"aaaaaaaaaaaaaaaa!"', {
          draft: 'auto',
          validateFormats: true,
        });
      await vi.advanceTimersByTimeAsync(25);
      await expect(promise).resolves.toMatchObject({
        ok: false,
        issues: [{ code: 'validation-limit', detail: '25ms' }],
      });
      expect(worker.terminate).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('BrowserJsonSchemaFileReaderAdapter', () => {
  it('decodes UTF-8 strictly', async () => {
    const source = await new BrowserJsonSchemaFileReaderAdapter().read(new Blob(['{"name":"Ada"}']));
    expect(source).toBe('{"name":"Ada"}');
  });

  it('rejects malformed UTF-8', async () => {
    const blob = new Blob([new Uint8Array([0xc3, 0x28])]);
    await expect(new BrowserJsonSchemaFileReaderAdapter().read(blob)).rejects.toMatchObject({
      code: 'invalid-utf8',
    });
  });

  it('honours cancellation before reading', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(new BrowserJsonSchemaFileReaderAdapter().read(new Blob(['{}']), controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
  });
});

function fakeWorker(): JsonSchemaValidatorWorkerLike {
  return {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  };
}

function resultFixture() {
  return {
    ok: true,
    valid: true,
    draft: 'draft-07' as const,
    issues: [],
    errors: [],
    errorsTruncated: false,
    totalErrors: 0,
    correction: null,
    report: '{}',
    stats: { schemaCharacters: 2, instanceCharacters: 2, schemaNodes: 1, instanceNodes: 1, patterns: 0 },
  };
}
