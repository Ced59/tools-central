import { describe, expect, it } from 'vitest';

import {
  analyzeHreflangAudit,
  analyzeHreflangSet,
  generateHreflangOutputs,
} from './hreflang';

const validSet = [
  'fr | https://example.com/fr/guide',
  'en | https://example.com/en/guide',
  'en-GB | https://example.com/en-gb/guide',
  'x-default | https://example.com/guide',
].join('\n');

describe('hreflang domain', () => {
  it('validates a complete set and generates all three supported formats', () => {
    const analysis = analyzeHreflangSet('https://example.com/fr/guide', validSet);
    const outputs = generateHreflangOutputs(analysis);

    expect(analysis.issues).toEqual([]);
    expect(outputs.html).toContain('hreflang="en-GB"');
    expect(outputs.httpHeader).toMatch(/^Link: <https:\/\/example\.com\/fr\/guide>/u);
    expect(outputs.sitemapXml).toContain('<loc>https://example.com/fr/guide</loc>');
    expect(outputs.sitemapXml).toContain('<xhtml:link');
  });

  it('canonicalizes code casing while reporting the change', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/en-us',
      'EN-us | https://example.com/en-us\nx-default | https://example.com/',
    );

    expect(analysis.entries[0].code).toBe('en-US');
    expect(analysis.issues.map(issue => issue.code)).toContain('noncanonical-code');
  });

  it('rejects country-only, unknown-region and malformed codes', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/fr',
      'US | https://example.com/us\nen-UK | https://example.com/uk\nfrench | https://example.com/fr',
    );

    expect(analysis.entries).toEqual([]);
    expect(analysis.issues.filter(issue => issue.code === 'invalid-code')).toHaveLength(3);
  });

  it('rejects relative, credentialed and fragment URLs', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/fr',
      'fr | /fr\nen | https://user:pass@example.com/en\nde | https://example.com/de#section',
    );

    expect(analysis.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'invalid-url',
      'url-credentials',
      'url-fragment',
    ]));
  });

  it('detects duplicate codes and an absent self-reference', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/fr',
      'en | https://example.com/en\nen | https://example.com/en-2',
    );

    expect(analysis.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'duplicate-code',
      'missing-self-reference',
      'missing-x-default',
    ]));
  });

  it('reports a missing generic language fallback for regional variants', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/en-us',
      'en-US | https://example.com/en-us\nen-GB | https://example.com/en-gb\nx-default | https://example.com/',
    );

    expect(analysis.issues).toContainEqual(expect.objectContaining({
      code: 'missing-language-fallback',
      detail: 'en',
    }));
  });

  it('escapes URLs in generated HTML and XML', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/fr?a=1&b=2',
      'fr | https://example.com/fr?a=1&b=2\nx-default | https://example.com/?a=1&b=2',
    );
    const outputs = generateHreflangOutputs(analysis);

    expect(outputs.html).toContain('?a=1&amp;b=2');
    expect(outputs.sitemapXml).toContain('?a=1&amp;b=2');
    expect(outputs.httpHeader).toContain('?a=1&b=2');
  });

  it('accepts x-default pointing to the same URL as a language', () => {
    const analysis = analyzeHreflangSet(
      'https://example.com/en',
      'en | https://example.com/en\nx-default | https://example.com/en',
    );

    expect(analysis.issues).toContainEqual(expect.objectContaining({
      code: 'same-url-multiple-codes',
      severity: 'info',
    }));
    expect(analysis.issues.some(issue => issue.severity === 'error')).toBe(false);
  });

  it('accepts a fully reciprocal multi-page audit', () => {
    const source = [
      'PAGE https://example.com/fr | https://example.com/fr',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
      'x-default | https://example.com/',
      'PAGE https://example.com/en | https://example.com/en',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
      'x-default | https://example.com/',
      'PAGE https://example.com/ | https://example.com/',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
      'x-default | https://example.com/',
    ].join('\n');

    const audit = analyzeHreflangAudit(source);

    expect(audit.pages).toHaveLength(3);
    expect(audit.linkCount).toBe(9);
    expect(audit.issues.filter(issue => issue.severity === 'error')).toEqual([]);
  });

  it('finds missing return links and inconsistent sets', () => {
    const source = [
      'PAGE https://example.com/fr | https://example.com/fr',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
      'PAGE https://example.com/en | https://example.com/en',
      'en | https://example.com/en',
    ].join('\n');

    const audit = analyzeHreflangAudit(source);

    expect(audit.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'missing-return-link',
      'inconsistent-set',
    ]));
  });

  it('marks targets that were not supplied without claiming a crawl result', () => {
    const audit = analyzeHreflangAudit([
      'PAGE https://example.com/fr | https://example.com/fr',
      'fr | https://example.com/fr',
      'en | https://example.com/en',
    ].join('\n'));

    expect(audit.issues).toContainEqual(expect.objectContaining({
      code: 'target-page-not-provided',
      severity: 'warning',
      detail: 'https://example.com/en',
    }));
  });

  it('requires PAGE headers before alternate rows', () => {
    const audit = analyzeHreflangAudit('fr | https://example.com/fr');

    expect(audit.pages).toEqual([]);
    expect(audit.issues.map(issue => issue.code)).toContain('alternate-before-page');
  });

  it('reports missing, invalid and cross-page canonical declarations', () => {
    const audit = analyzeHreflangAudit([
      'PAGE https://example.com/fr',
      'fr | https://example.com/fr',
      'PAGE https://example.com/en | /en',
      'en | https://example.com/en',
      'PAGE https://example.com/de | https://example.com/en',
      'de | https://example.com/de',
    ].join('\n'));

    expect(audit.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'missing-canonical',
      'invalid-canonical',
      'canonical-mismatch',
    ]));
  });
});
