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
});
