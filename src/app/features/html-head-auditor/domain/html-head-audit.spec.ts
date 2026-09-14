import { describe, expect, it } from 'vitest';

import { auditHtmlHead, serializeHtmlHeadAudit, type ExtractedHeadSnapshot } from './html-head-audit';

function snapshot(overrides: Partial<ExtractedHeadSnapshot> = {}): ExtractedHeadSnapshot {
  return {
    sourceLength: 200,
    truncated: false,
    tagLimitReached: false,
    scannedTagCount: 4,
    titles: [{ value: 'Une page utile', position: 2 }],
    metas: [
      { name: 'description', property: '', httpEquiv: '', content: 'Une description spécifique.', position: 3 },
      { name: 'viewport', property: '', httpEquiv: '', content: 'width=device-width, initial-scale=1', position: 4 },
    ],
    links: [{ rel: ['canonical'], href: 'https://example.com/page', hreflang: '', media: '', type: '', position: 5 }],
    charsets: [{ value: 'utf-8', position: 1 }],
    baseHrefs: [],
    jsonLdCount: 0,
    parserIssues: [],
    ...overrides,
  };
}

describe('auditHtmlHead', () => {
  it('accepte un head minimal cohérent', () => {
    const result = auditHtmlHead(snapshot(), 'https://example.com/page');

    expect(result.title).toBe('Une page utile');
    expect(result.canonical).toBe('https://example.com/page');
    expect(result.issues).toHaveLength(0);
  });

  it('signale les balises title et description absentes ou multiples', () => {
    const missing = auditHtmlHead(snapshot({ titles: [], metas: [] }), '');
    const duplicate = auditHtmlHead(snapshot({
      titles: [{ value: 'A', position: 1 }, { value: 'B', position: 2 }],
      metas: [
        { name: 'description', property: '', httpEquiv: '', content: 'A', position: 3 },
        { name: 'description', property: '', httpEquiv: '', content: 'B', position: 4 },
      ],
    }), '');

    expect(missing.issues.map(item => item.code)).toEqual(expect.arrayContaining(['missing-title', 'missing-description']));
    expect(duplicate.issues.map(item => item.code)).toEqual(expect.arrayContaining(['multiple-title', 'multiple-description']));
  });

  it('refuse une canonical non HTTP et assainit son fragment', () => {
    const invalid = auditHtmlHead(snapshot({ links: [{ rel: ['canonical'], href: '/page', hreflang: '', media: '', type: '', position: 1 }] }), '');
    const fragment = auditHtmlHead(snapshot({ links: [{ rel: ['canonical'], href: 'https://example.com/page#top', hreflang: '', media: '', type: '', position: 1 }] }), '');

    expect(invalid.issues).toContainEqual(expect.objectContaining({ code: 'invalid-canonical', severity: 'error' }));
    expect(fragment.canonical).toBe('https://example.com/page');
    expect(fragment.issues).toContainEqual(expect.objectContaining({ code: 'canonical-fragment' }));
  });

  it('signale une URL de comparaison relative ou mal formée', () => {
    const result = auditHtmlHead(snapshot(), 'example.com/page');

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'invalid-page-url', severity: 'error' }));
  });

  it('repère les directives robots contradictoires et noindex', () => {
    const result = auditHtmlHead(snapshot({
      metas: [
        ...snapshot().metas,
        { name: 'robots', property: '', httpEquiv: '', content: 'index, noindex, follow', position: 5 },
        { name: 'googlebot', property: '', httpEquiv: '', content: 'max-snippet:20', position: 6 },
      ],
    }), 'https://example.com/page');

    expect(result.robotsDirectives).toContain('max-snippet:20');
    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['robots-conflict', 'page-noindex']));
  });

  it('développe les alias robots all et none pour détecter les conflits', () => {
    const indexNone = auditHtmlHead(
      snapshot({ metas: [{ name: 'robots', property: '', httpEquiv: '', content: 'index, none', position: 5 }] }),
      'https://example.com/page',
    );
    const allNoindex = auditHtmlHead(
      snapshot({ metas: [{ name: 'robots', property: '', httpEquiv: '', content: 'all, noindex', position: 5 }] }),
      'https://example.com/page',
    );

    expect(indexNone.issues.map(item => item.code)).toContain('robots-conflict');
    expect(allNoindex.issues.map(item => item.code)).toContain('robots-conflict');
  });

  it('respecte la portée distincte de robots et googlebot', () => {
    const result = auditHtmlHead(snapshot({
      metas: [
        ...snapshot().metas,
        { name: 'robots', property: '', httpEquiv: '', content: 'index, follow', position: 5 },
        { name: 'googlebot', property: '', httpEquiv: '', content: 'noindex, follow', position: 6 },
      ],
    }), 'https://example.com/page');

    expect(result.issues.map(item => item.code)).not.toContain('robots-conflict');
    expect(result.issues.map(item => item.code)).toContain('page-noindex');
  });

  it('contrôle viewport, charset et redirection meta', () => {
    const result = auditHtmlHead(snapshot({
      metas: [{ name: 'viewport', property: '', httpEquiv: '', content: 'width=980', position: 2 }, { name: '', property: '', httpEquiv: 'refresh', content: '0;url=/autre', position: 3 }],
      charsets: [{ value: 'iso-8859-1', position: 1 }],
    }), 'https://example.com/page');

    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['viewport-not-responsive', 'non-utf8-charset', 'meta-refresh']));
  });

  it('détecte hreflang dupliqué, URL invalide et auto-référence absente', () => {
    const links = [
      ...snapshot().links,
      { rel: ['alternate'], href: 'https://example.com/en', hreflang: 'en', media: '', type: '', position: 6 },
      { rel: ['alternate'], href: '/en-gb', hreflang: 'en', media: '', type: '', position: 7 },
      { rel: ['alternate'], href: 'https://example.com/fake', hreflang: 'english', media: '', type: '', position: 8 },
      { rel: ['alternate'], href: 'https://example.com/zz', hreflang: 'zz-ZZ', media: '', type: '', position: 9 },
    ];
    const result = auditHtmlHead(snapshot({ links }), 'https://example.com/fr');

    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['duplicate-hreflang', 'invalid-hreflang-url', 'invalid-hreflang-code', 'missing-hreflang-self']));
    expect(result.issues.filter(item => item.code === 'invalid-hreflang-code')).toHaveLength(2);
  });

  it('vérifie les propriétés Open Graph de base et la carte Twitter', () => {
    const result = auditHtmlHead(snapshot({
      metas: [
        ...snapshot().metas,
        { name: '', property: 'og:title', httpEquiv: '', content: 'Titre', position: 6 },
        { name: '', property: 'og:url', httpEquiv: '', content: 'https://example.com/autre', position: 7 },
        { name: 'twitter:card', property: '', httpEquiv: '', content: 'gigantic', position: 8 },
      ],
    }), 'https://example.com/page');

    expect(result.issues.filter(item => item.code === 'missing-open-graph-property')).toHaveLength(2);
    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['open-graph-url-mismatch', 'unknown-twitter-card']));
  });

  it('borne les entrées et produit un export stable', () => {
    const result = auditHtmlHead(snapshot({ truncated: true, tagLimitReached: true }), '');
    const exported = JSON.parse(serializeHtmlHeadAudit(result)) as { summary: { tags: number }; issues: unknown[] };

    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['source-too-large', 'tag-limit']));
    expect(exported.summary.tags).toBeGreaterThan(0);
    expect(exported.issues.length).toBe(result.issues.length);
  });
});
