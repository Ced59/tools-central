export class PdfJsOffscreenCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }

  reset(target: CanvasAndContext, width: number, height: number): void {
    target.canvas.width = width;
    target.canvas.height = height;
  }

  destroy(target: CanvasAndContext): void {
    target.canvas.width = 1;
    target.canvas.height = 1;
    target.context = null;
  }
}

export class PdfJsRejectingFilterFactory {
  addFilter(): never { return unsupportedFilter('color-map'); }
  addHCMFilter(): never { return unsupportedFilter('high-contrast'); }
  addAlphaFilter(): never { return unsupportedFilter('alpha-mask'); }
  addLuminosityFilter(): never { return unsupportedFilter('luminosity-mask'); }
  addKnockoutFilter(): never { return unsupportedFilter('knockout'); }
  addHighlightHCMFilter(): never { return unsupportedFilter('highlight'); }
  addSelectionHCMFilter(): never { return unsupportedFilter('selection-high-contrast'); }
  addSelectionFilter(): never { return unsupportedFilter('selection'); }
  createSelectionStyle(): null { return null; }
  destroy(): void {}
}

type BinaryDataKind = 'cMapUrl' | 'standardFontDataUrl' | 'wasmUrl';

export class PdfJsWorkerBinaryDataFactory {
  private readonly roots: Record<BinaryDataKind, string | null>;

  constructor(roots: Record<BinaryDataKind, string | null>) {
    this.roots = roots;
  }

  async fetch({ kind, filename }: { kind: BinaryDataKind; filename: string }): Promise<Uint8Array> {
    const root = this.roots[kind];
    if (!root) throw new Error(`Missing PDF.js resource root for ${kind}.`);
    const response = await fetch(new URL(filename, root));
    if (!response.ok) throw new Error(`Unable to load PDF.js resource: ${filename}.`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

interface CanvasAndContext {
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D | null;
}

function unsupportedFilter(name: string): never {
  const error = new Error(`This PDF requires an unsupported rendering filter (${name}).`);
  error.name = 'NotSupportedError';
  throw error;
}
