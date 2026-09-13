import type { SitemapBuilderSettings } from '../application/sitemap-xml.use-cases';
import { analyzeSitemapXml, generateSitemapXml } from '../domain/sitemap-xml';

type WorkerCommand =
  | Readonly<{
      operation: 'analyze';
      source: string;
      sitemapUrl: string;
      todayIso: string;
    }>
  | Readonly<{
      operation: 'generate';
      settings: SitemapBuilderSettings;
    }>;

addEventListener('message', ({ data }: MessageEvent<WorkerCommand>) => {
  try {
    if (data.operation === 'analyze') {
      postMessage({
        ok: true,
        operation: data.operation,
        result: analyzeSitemapXml(data.source, data.sitemapUrl, data.todayIso),
      });
    } else {
      postMessage({
        ok: true,
        operation: data.operation,
        result: generateSitemapXml(data.settings),
      });
    }
  } catch (error: unknown) {
    postMessage({
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to process this sitemap.',
    });
  }
});
