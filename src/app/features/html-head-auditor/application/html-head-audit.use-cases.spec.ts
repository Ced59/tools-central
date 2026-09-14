import { describe, expect, it, vi } from 'vitest';

import {
  AuditHtmlHeadUseCase,
  CopyHtmlHeadAuditUseCase,
  DownloadHtmlHeadAuditUseCase,
  type HtmlHeadParserPort,
} from './html-head-audit.use-cases';

const extract = vi.fn(() => ({
  sourceLength: 0,
  truncated: false,
  tagLimitReached: false,
  scannedTagCount: 4,
  titles: [{ value: 'Titre', position: 2 }],
  metas: [
    { name: 'description', property: '', httpEquiv: '', content: 'Description', position: 3 },
    { name: 'viewport', property: '', httpEquiv: '', content: 'width=device-width', position: 4 },
  ],
  links: [{ rel: ['canonical'], href: 'https://example.com/page', hreflang: '', media: '', type: '', position: 5 }],
  charsets: [{ value: 'utf-8', position: 1 }],
  baseHrefs: [],
  jsonLdCount: 0,
  parserIssues: [],
}));
const parser: HtmlHeadParserPort = { extract };

describe('html head audit use cases', () => {
  it('borne la source avant de lancer l’audit', () => {
    const source = `  ${'x'.repeat(1_000_010)}  `;
    const result = new AuditHtmlHeadUseCase(parser).execute(source, ' https://example.com/page ');

    expect(extract).toHaveBeenCalledWith('x'.repeat(1_000_000));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'source-too-large' }));
  });

  it('copie le rapport JSON sérialisé', async () => {
    const copy = vi.fn(() => Promise.resolve(true));
    const audit = new AuditHtmlHeadUseCase(parser).execute('<head></head>');

    await expect(new CopyHtmlHeadAuditUseCase({ copy }).execute(audit)).resolves.toBe(true);
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('"summary"'));
  });

  it('télécharge le rapport sous un nom stable', () => {
    const download = vi.fn();
    const audit = new AuditHtmlHeadUseCase(parser).execute('<head></head>');

    new DownloadHtmlHeadAuditUseCase({ download }).execute(audit);

    expect(download).toHaveBeenCalledWith(
      expect.stringContaining('"issues"'),
      'html-head-audit.json',
      'application/json;charset=utf-8',
    );
  });
});
