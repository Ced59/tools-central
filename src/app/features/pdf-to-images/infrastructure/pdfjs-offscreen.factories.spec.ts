import { describe, expect, it } from 'vitest';

import { PdfJsRejectingFilterFactory } from './pdfjs-offscreen.factories';

describe('PdfJsRejectingFilterFactory', () => {
  it.each([
    'addFilter',
    'addAlphaFilter',
    'addLuminosityFilter',
    'addKnockoutFilter',
  ] as const)('rejects %s rather than silently changing the rendered page', method => {
    const factory = new PdfJsRejectingFilterFactory();

    expect(() => factory[method]()).toThrow(/unsupported rendering filter/u);
  });
});
