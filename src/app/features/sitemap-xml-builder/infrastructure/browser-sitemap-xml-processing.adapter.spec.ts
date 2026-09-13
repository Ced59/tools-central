import { afterEach, describe, expect, it, vi } from 'vitest';

import { BrowserSitemapXmlProcessingAdapter } from './browser-sitemap-xml-processing.adapter';

class FakeWorker {
  static lastCommand: unknown = null;

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly terminate = vi.fn();

  postMessage(command: { operation: 'analyze' | 'generate' }): void {
    FakeWorker.lastCommand = command;
    queueMicrotask(() => {
      if (command.operation === 'analyze') {
        this.onmessage?.({
          data: {
            ok: true,
            operation: 'analyze',
            result: {
              kind: 'urlset',
              entries: [],
              issues: [],
              sourceBytes: 0,
              analyzed: true,
              namespaceValid: true,
            },
          },
        } as MessageEvent);
      } else {
        this.onmessage?.({
          data: {
            ok: true,
            operation: 'generate',
            result: { content: '<urlset/>', entries: [], issues: [], siteValid: true },
          },
        } as MessageEvent);
      }
    });
  }
}

describe('BrowserSitemapXmlProcessingAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWorker.lastCommand = null;
  });

  it('delegates XML analysis to a browser worker', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const adapter = new BrowserSitemapXmlProcessingAdapter();

    const result = await adapter.analyze('<urlset/>', 'https://example.com/sitemap.xml', '2026-09-13');

    expect(FakeWorker.lastCommand).toMatchObject({ operation: 'analyze' });
    expect(result.analyzed).toBe(true);
  });

  it('delegates large generation work and can release the worker', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const adapter = new BrowserSitemapXmlProcessingAdapter();

    const result = await adapter.generate({
      kind: 'urlset',
      siteUrl: 'https://example.com',
      lines: ['/'],
      todayIso: '2026-09-13',
    });
    adapter.cancel();

    expect(FakeWorker.lastCommand).toMatchObject({ operation: 'generate' });
    expect(result.content).toBe('<urlset/>');
  });
});
