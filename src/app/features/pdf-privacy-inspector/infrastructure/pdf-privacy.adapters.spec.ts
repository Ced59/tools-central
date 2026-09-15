import { describe, expect, it, vi } from 'vitest';

import {
  PdfPrivacyWorkerAdapter,
  type PdfPrivacyWorkerLike,
} from './pdf-privacy-worker.adapter';
import type {
  PdfPrivacyWorkerRequest,
  PdfPrivacyWorkerResponse,
} from './pdf-privacy.worker.messages';
import { buildPdfPrivacyReport } from '../domain/pdf-privacy.models';

const report = buildPdfPrivacyReport({
  pdfVersion: '1.7', pageCount: 1, inspectedPages: 1, fileBytes: 8,
  encrypted: false, passwordUsed: false, findings: [],
});

class FakeWorker implements PdfPrivacyWorkerLike {
  onmessage: ((event: MessageEvent<PdfPrivacyWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postMessage = vi.fn<(
    message: PdfPrivacyWorkerRequest,
    transfer: Transferable[],
  ) => void>(() => {
    queueMicrotask(() => {
      this.onmessage?.({ data: { type: 'progress', percent: 42 } } as MessageEvent<PdfPrivacyWorkerResponse>);
      this.onmessage?.({ data: { type: 'success', report } } as MessageEvent<PdfPrivacyWorkerResponse>);
    });
  });
  readonly terminate = vi.fn();
}

describe('PdfPrivacyWorkerAdapter', () => {
  it('transfère les octets, relaie la progression et retourne le rapport', async () => {
    const worker = new FakeWorker();
    const progress = vi.fn();
    const result = await new PdfPrivacyWorkerAdapter(() => worker)
      .inspect(new Uint8Array([1, 2]), 'secret', progress);

    expect(result).toBe(report);
    expect(progress).toHaveBeenCalledWith(42);
    expect(worker.postMessage).toHaveBeenCalledOnce();
    const [message, transfer] = worker.postMessage.mock.calls[0];
    expect(message.type).toBe('inspect');
    expect(message.password).toBe('secret');
    expect(message.assetRoot).toContain('/assets/pdfjs/');
    expect(transfer).toHaveLength(1);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('préserve le code mot de passe du Worker', async () => {
    const worker = new FakeWorker();
    worker.postMessage.mockImplementation(() => {
      queueMicrotask(() => {
        worker.onmessage?.({
          data: { type: 'failure', code: 'password-required', message: 'Password required' },
        } as MessageEvent<PdfPrivacyWorkerResponse>);
      });
    });

    await expect(new PdfPrivacyWorkerAdapter(() => worker).inspect(new Uint8Array([1]), undefined))
      .rejects.toMatchObject({ code: 'password-required' });
  });

  it('termine le Worker à l’annulation', async () => {
    const worker = new FakeWorker();
    worker.postMessage.mockImplementation(() => undefined);
    const controller = new AbortController();
    const promise = new PdfPrivacyWorkerAdapter(() => worker)
      .inspect(new Uint8Array([1]), undefined, undefined, controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
