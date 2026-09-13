import type {
  SitemapBuilderSettings,
  SitemapDocument,
  SitemapGeneration,
} from '../application/sitemap-xml.use-cases';
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

type WorkerResponse =
  | Readonly<{ ok: true; operation: 'analyze'; result: SitemapDocument }>
  | Readonly<{ ok: true; operation: 'generate'; result: SitemapGeneration }>
  | Readonly<{ ok: false; message: string }>;

export class BrowserSitemapXmlProcessingAdapter {
  private activeWorker: Worker | null = null;
  private rejectActive: ((reason: Error) => void) | null = null;

  analyze(source: string, sitemapUrl: string, todayIso: string): Promise<SitemapDocument> {
    const command: WorkerCommand = { operation: 'analyze', source, sitemapUrl, todayIso };
    if (typeof Worker === 'undefined') {
      return Promise.resolve(analyzeSitemapXml(source, sitemapUrl, todayIso));
    }
    return this.run<SitemapDocument>(command, 'analyze');
  }

  generate(settings: SitemapBuilderSettings): Promise<SitemapGeneration> {
    const command: WorkerCommand = { operation: 'generate', settings };
    if (typeof Worker === 'undefined') return Promise.resolve(generateSitemapXml(settings));
    return this.run<SitemapGeneration>(command, 'generate');
  }

  cancel(): void {
    this.activeWorker?.terminate();
    this.activeWorker = null;
    this.rejectActive?.(new Error('Sitemap processing superseded by a newer request.'));
    this.rejectActive = null;
  }

  private run<T>(command: WorkerCommand, expectedOperation: 'analyze' | 'generate'): Promise<T> {
    this.cancel();
    return new Promise<T>((resolve, reject) => {
      const worker = new Worker(new URL('./sitemap-xml-processing.worker', import.meta.url), { type: 'module' });
      this.activeWorker = worker;
      this.rejectActive = reject;

      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        this.finishWorker(worker);
        if (!data.ok) {
          reject(new Error(data.message));
          return;
        }
        if (data.operation !== expectedOperation) {
          reject(new Error('Unexpected sitemap worker response.'));
          return;
        }
        resolve(data.result as T);
      };
      worker.onerror = (event: ErrorEvent) => {
        this.finishWorker(worker);
        reject(new Error(event.message || 'The sitemap worker failed.'));
      };
      worker.postMessage(command);
    });
  }

  private finishWorker(worker: Worker): void {
    worker.terminate();
    if (this.activeWorker === worker) {
      this.activeWorker = null;
      this.rejectActive = null;
    }
  }
}
