import { describe, expect, it } from 'vitest';

import { analyzeSerpSnippet, estimateTextWidth } from './serp-snippet';

const BASE_INPUT = {
  siteName: 'Tools Central',
  url: 'https://www.tools-central.com/fr/categories/dev/seo',
  title: 'Prévisualisez votre résultat Google avant de publier',
  description: 'Testez le titre, la description et l’URL de votre page dans un aperçu fidèle, privé et instantané.',
  device: 'desktop' as const,
};

describe('analyzeSerpSnippet', () => {
  it('normalizes a valid URL into a readable breadcrumb', () => {
    const result = analyzeSerpSnippet(BASE_INPUT);

    expect(result.urlValid).toBe(true);
    expect(result.displayUrl).toBe('tools-central.com › fr › categories › dev › seo');
  });

  it('keeps a valid URL when a path segment contains an undecodable escape', () => {
    const result = analyzeSerpSnippet({ ...BASE_INPUT, url: 'https://example.com/caf%E9' });

    expect(result.urlValid).toBe(true);
    expect(result.displayUrl).toBe('example.com › caf%E9');
    expect(result.recommendations).not.toContain('url-invalid');
  });

  it('rejects hostnames containing empty or malformed DNS labels', () => {
    const emptyLabel = analyzeSerpSnippet({ ...BASE_INPUT, url: 'https://example..com/page' });
    const leadingHyphen = analyzeSerpSnippet({ ...BASE_INPUT, url: 'https://-example.com/page' });

    expect(emptyLabel.urlValid).toBe(false);
    expect(leadingHyphen.urlValid).toBe(false);
    expect(emptyLabel.recommendations).toContain('url-invalid');
  });

  it('preserves a complete leading grapheme for the favicon', () => {
    const result = analyzeSerpSnippet({ ...BASE_INPUT, siteName: '👨‍👩‍👧‍👦 Famille' });

    expect(result.siteInitial).toBe('👨‍👩‍👧‍👦');
  });

  it('reports missing content and an invalid URL', () => {
    const result = analyzeSerpSnippet({
      siteName: '',
      url: 'pas une url',
      title: '',
      description: '',
      device: 'desktop',
    });

    expect(result.title.status).toBe('missing');
    expect(result.description.status).toBe('missing');
    expect(result.recommendations).toEqual([
      'title-missing',
      'description-missing',
      'url-invalid',
    ]);
  });

  it('truncates long Unicode titles without splitting grapheme clusters', () => {
    const family = '👨‍👩‍👧‍👦';
    const result = analyzeSerpSnippet({
      ...BASE_INPUT,
      title: family.repeat(90),
    });

    expect(result.title.status).toBe('likely-truncated');
    expect(result.title.preview.endsWith('…')).toBe(true);
    const visibleGraphemes = Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(result.title.preview.slice(0, -1)),
      segment => segment.segment,
    );
    expect(visibleGraphemes.every(grapheme => grapheme === family)).toBe(true);
  });

  it('measures the whitespace collapsed by the rendered preview', () => {
    const result = analyzeSerpSnippet({
      ...BASE_INPUT,
      title: `A${' '.repeat(100)}\t\nB`,
    });

    expect(result.title.characters).toBe(3);
    expect(result.title.estimatedPixels).toBe(estimateTextWidth('A B', 20));
    expect(result.title.preview).toBe('A B');
    expect(result.title.status).toBe('concise');
  });

  it('preserves non-breaking spaces that remain visible in the preview', () => {
    const title = '\u00a0A\u00a0\u00a0B\u00a0';
    const result = analyzeSerpSnippet({ ...BASE_INPUT, title });

    expect(result.title.characters).toBe(6);
    expect(result.title.preview).toBe(title);
  });

  it('handles very large pasted content in a single bounded pass', () => {
    const result = analyzeSerpSnippet({
      ...BASE_INPUT,
      description: 'contenu '.repeat(50_000),
    });

    expect(result.description.status).toBe('likely-truncated');
    expect(result.description.preview.length).toBeLessThan(300);
  });

  it('uses a narrower title limit on mobile', () => {
    const title = 'W'.repeat(31);
    const desktop = analyzeSerpSnippet({ ...BASE_INPUT, title, device: 'desktop' });
    const mobile = analyzeSerpSnippet({ ...BASE_INPUT, title, device: 'mobile' });

    expect(desktop.title.status).toBe('balanced');
    expect(mobile.title.status).toBe('likely-truncated');
  });

  it('accounts for glyph width instead of relying on character count', () => {
    expect(estimateTextWidth('WWWW', 20)).toBeGreaterThan(estimateTextWidth('iiii', 20));
  });

  it('measures composed emoji and accents as rendered graphemes', () => {
    const family = '👨‍👩‍👧‍👦';
    const result = analyzeSerpSnippet({
      ...BASE_INPUT,
      title: family.repeat(8),
    });

    expect(result.title.estimatedPixels).toBeLessThan(200);
    expect(result.title.status).not.toBe('likely-truncated');
    expect(estimateTextWidth('é', 20)).toBe(estimateTextWidth('é', 20));
  });

  it('counts East Asian full-width forms at their rendered width', () => {
    const result = analyzeSerpSnippet({ ...BASE_INPUT, title: 'Ａ'.repeat(40) });

    expect(result.title.estimatedPixels).toBeGreaterThan(580);
    expect(result.title.status).toBe('likely-truncated');
    expect(result.title.preview.endsWith('…')).toBe(true);
  });

  it('detects wide Cyrillic titles that exceed the desktop result width', () => {
    const result = analyzeSerpSnippet({ ...BASE_INPUT, title: 'Ш'.repeat(32) });

    expect(result.title.estimatedPixels).toBeGreaterThan(580);
    expect(result.title.status).toBe('likely-truncated');
    expect(result.title.preview.endsWith('…')).toBe(true);
  });
});
