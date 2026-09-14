import { describe, expect, it, vi } from 'vitest';

import {
  CopyStructuredDataReportUseCase,
  DownloadStructuredDataReportUseCase,
  ExtractStructuredDataUseCase,
  type StructuredDataMarkupParserPort,
} from './structured-data.use-cases';

const extract = vi.fn(() => ({
    sourceLength: 0,
    truncated: false,
    jsonLdBlocks: [{ sourceIndex: 1, content: '{"@context":"https://schema.org","@type":"WebSite"}' }],
    markupNodes: [],
    issues: [],
  }));
const parser: StructuredDataMarkupParserPort = {
  extract,
};

describe('structured data use cases', () => {
  it('borne la source puis délègue son extraction au port', () => {
    const useCase = new ExtractStructuredDataUseCase(parser);
    const source = `  ${'x'.repeat(1_000_010)}  `;

    const result = useCase.execute(source, ' https://example.com/page ');

    expect(extract).toHaveBeenCalledWith('x'.repeat(1_000_000), 'https://example.com/page');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'source-too-large' }));
  });

  it('copie un rapport JSON sérialisé', async () => {
    const copy = vi.fn(() => Promise.resolve(true));
    const analysis = new ExtractStructuredDataUseCase(parser).execute('<html></html>');

    await expect(new CopyStructuredDataReportUseCase({ copy }).execute(analysis)).resolves.toBe(true);
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('"summary"'));
  });

  it('télécharge un rapport JSON avec un nom stable', () => {
    const download = vi.fn();
    const analysis = new ExtractStructuredDataUseCase(parser).execute('<html></html>');

    new DownloadStructuredDataReportUseCase({ download }).execute(analysis);

    expect(download).toHaveBeenCalledWith(
      expect.stringContaining('"nodes"'),
      'structured-data-report.json',
      'application/json;charset=utf-8',
    );
  });
});
