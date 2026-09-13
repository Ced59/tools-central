import { describe, expect, it } from 'vitest';

import {
  analyzeSitemapXml,
  generateSitemapXml,
  SITEMAP_ANALYSIS_MAX_BYTES,
} from './sitemap-xml';

const TODAY = '2026-09-13';

describe('generateSitemapXml', () => {
  it('generates a URL set from absolute and relative locations with XML escaping', () => {
    const result = generateSitemapXml({
      kind: 'urlset',
      siteUrl: 'https://example.com',
      lines: ['/', '/catalog?q=red&sort=asc | 2026-09-12', 'https://example.com/about#team'],
      todayIso: TODAY,
    });

    expect(result.siteValid).toBe(true);
    expect(result.entries).toHaveLength(3);
    expect(result.content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(result.content).toContain('<loc>https://example.com/catalog?q=red&amp;sort=asc</loc>');
    expect(result.content).toContain('<lastmod>2026-09-12</lastmod>');
    expect(result.content).toContain('<loc>https://example.com/about</loc>');
  });

  it('generates a sitemap index with the correct entry element', () => {
    const result = generateSitemapXml({
      kind: 'sitemapindex',
      siteUrl: 'https://example.com',
      lines: ['/sitemap-pages.xml', '/sitemap-products.xml | 2026-09-13'],
      todayIso: TODAY,
    });

    expect(result.content).toContain('<sitemapindex');
    expect(result.content).toContain('<sitemap>');
    expect(result.content).not.toContain('<url>');
  });

  it('rejects invalid, cross-origin and malformed builder lines while deduplicating', () => {
    const result = generateSitemapXml({
      kind: 'urlset',
      siteUrl: 'https://example.com',
      lines: ['/ok', '/ok', 'https://other.test/page', 'ftp://example.com/file', '/page | bad-date', '/a | date | extra'],
      todayIso: TODAY,
    });

    expect(result.entries.map(entry => entry.loc)).toEqual(['https://example.com/ok']);
    expect(result.issues.map(issue => issue.code)).toEqual([
      'duplicate-loc',
      'different-origin',
      'invalid-loc',
      'invalid-lastmod',
      'invalid-builder-line',
    ]);
  });

  it('reports a future lastmod without dropping the entry', () => {
    const result = generateSitemapXml({
      kind: 'urlset',
      siteUrl: 'example.com',
      lines: ['/future | 2027-01-01'],
      todayIso: TODAY,
    });

    expect(result.siteValid).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.issues[0].code).toBe('future-lastmod');
  });
});

describe('analyzeSitemapXml', () => {
  it('parses a valid prefixed sitemap and decodes XML entities', () => {
    const document = analyzeSitemapXml(`<?xml version="1.0" encoding="UTF-8"?>
<sm:urlset xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sm:url><sm:loc>https://example.com/catalog?a=1&amp;b=2</sm:loc><sm:lastmod>2026-09-12</sm:lastmod></sm:url>
</sm:urlset>`, 'https://example.com/sitemap.xml', TODAY);

    expect(document.kind).toBe('urlset');
    expect(document.namespaceValid).toBe(true);
    expect(document.entries[0]).toMatchObject({
      loc: 'https://example.com/catalog?a=1&b=2',
      lastmod: '2026-09-12',
    });
    expect(document.issues).toEqual([]);
  });

  it('rejects malformed XML and external entity declarations without using a DOM', () => {
    const malformed = analyzeSitemapXml('<urlset><url></urlset>', 'https://example.com/sitemap.xml', TODAY);
    const unsafe = analyzeSitemapXml('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///secret">]><urlset/>', 'https://example.com/sitemap.xml', TODAY);

    expect(malformed.issues[0].code).toBe('malformed-xml');
    expect(unsafe.issues[0].code).toBe('unsafe-doctype');
  });

  it('reports root, namespace and empty sitemap problems', () => {
    const wrongRoot = analyzeSitemapXml('<feed/>', 'https://example.com/sitemap.xml', TODAY);
    const empty = analyzeSitemapXml('<urlset/>', 'https://example.com/sitemap.xml', TODAY);

    expect(wrongRoot.issues.map(issue => issue.code)).toEqual(['invalid-root', 'invalid-namespace']);
    expect(empty.issues.map(issue => issue.code)).toEqual(['invalid-namespace', 'empty-sitemap']);
  });

  it('reports missing, invalid, duplicate and overlong locations', () => {
    const longLocation = `https://example.com/${'a'.repeat(2040)}`;
    const document = analyzeSitemapXml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url></url>
<url><loc>relative</loc></url>
<url><loc>https://example.com/page</loc><loc>https://example.com/other</loc></url>
<url><loc>https://example.com/page</loc></url>
<url><loc>${longLocation}</loc></url>
</urlset>`, 'https://example.com/sitemap.xml', TODAY);

    expect(document.issues.map(issue => issue.code)).toEqual([
      'missing-loc',
      'invalid-loc',
      'multiple-loc',
      'duplicate-loc',
      'loc-too-long',
    ]);
  });

  it('validates dates, change frequency and priority while explaining Google behavior once', () => {
    const document = analyzeSitemapXml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://example.com/a</loc><lastmod>2026-02-30</lastmod><changefreq>sometimes</changefreq><priority>1.5</priority></url>
<url><loc>https://example.com/b</loc><lastmod>2027-01-01</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
<url><loc>https://example.com/c</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
</urlset>`, 'https://example.com/sitemap.xml', TODAY);

    expect(document.issues.map(issue => issue.code)).toEqual([
      'invalid-lastmod',
      'invalid-changefreq',
      'invalid-priority',
      'future-lastmod',
      'google-ignores-changefreq',
      'google-ignores-priority',
    ]);
  });

  it('checks sitemap scope and treats cross-origin index entries as errors', () => {
    const urlset = analyzeSitemapXml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://other.test/page</loc></url>
<url><loc>https://example.com/outside</loc></url>
</urlset>`, 'https://example.com/catalog/sitemap.xml', TODAY);
    const index = analyzeSitemapXml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://other.test/sitemap.xml</loc></sitemap>
</sitemapindex>`, 'https://example.com/sitemap-index.xml', TODAY);

    expect(urlset.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'different-origin', severity: 'warning' }),
      expect.objectContaining({ code: 'outside-sitemap-path' }),
    ]));
    expect(index.issues).toContainEqual(expect.objectContaining({ code: 'different-origin', severity: 'error' }));
  });

  it('refuses oversized interactive analysis before parsing', () => {
    const document = analyzeSitemapXml(' '.repeat(SITEMAP_ANALYSIS_MAX_BYTES + 1), 'https://example.com/sitemap.xml', TODAY);

    expect(document.analyzed).toBe(false);
    expect(document.issues.map(issue => issue.code)).toEqual(['analysis-limit']);
  });

  it('accepts comments, CDATA and numeric entities but rejects unknown entities', () => {
    const valid = analyzeSitemapXml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><!-- note --><url><loc><![CDATA[https://example.com/a?x=1&y=2]]></loc></url><url><loc>https://example.com/&#x62;</loc></url></urlset>`, 'https://example.com/sitemap.xml', TODAY);
    const invalid = analyzeSitemapXml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/&copy;</loc></url></urlset>', 'https://example.com/sitemap.xml', TODAY);

    expect(valid.entries.map(entry => entry.loc)).toEqual(['https://example.com/a?x=1&y=2', 'https://example.com/b']);
    expect(invalid.issues[0].code).toBe('malformed-xml');
  });

  it('bounds the diagnostic list for hostile files', () => {
    const entries = Array.from({ length: 250 }, () => '<url/>').join('');
    const document = analyzeSitemapXml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, 'https://example.com/sitemap.xml', TODAY);

    expect(document.issues).toHaveLength(200);
    expect(document.issues.at(-1)?.code).toBe('issues-truncated');
  });
});
