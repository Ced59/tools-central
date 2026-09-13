import { describe, expect, it } from 'vitest';

import {
  evaluateRobotsAccess,
  generateRobotsTxt,
  parseRobotsTxt,
  ROBOTS_TXT_MAX_BYTES,
} from './robots-txt';

describe('parseRobotsTxt', () => {
  it('parses groups, rules, comments and sitemaps case-insensitively', () => {
    const document = parseRobotsTxt(`
      USER-AGENT: Googlebot
      User-agent: Bingbot
      Disallow: /private/ # internal pages
      Allow: /private/public.html
      Sitemap: https://example.com/sitemap.xml
    `);

    expect(document.groups).toHaveLength(1);
    expect(document.groups[0].userAgents).toEqual(['Googlebot', 'Bingbot']);
    expect(document.groups[0].rules).toEqual([
      { directive: 'disallow', path: '/private/', line: 4 },
      { directive: 'allow', path: '/private/public.html', line: 5 },
    ]);
    expect(document.sitemaps).toEqual(['https://example.com/sitemap.xml']);
    expect(document.issues).toEqual([]);
  });

  it('keeps a group open across sitemap and unknown records', () => {
    const document = parseRobotsTxt(`User-agent: FirstBot
Sitemap: https://example.com/sitemap.xml
Host: example.com
User-agent: SecondBot
Disallow: /private/`);

    expect(document.groups).toHaveLength(1);
    expect(document.groups[0].userAgents).toEqual(['FirstBot', 'SecondBot']);
    expect(document.groups[0].rules).toHaveLength(1);
    expect(document.issues.map(issue => issue.code)).toContain('unknown-directive');
  });

  it('reports invalid and ignored lines while preserving parseable rules', () => {
    const document = parseRobotsTxt(`Disallow: /orphan/
User-agent:
User-agent: Bot/1.0
User-agent: ValidBot
Disallow:
Allow: private area
Disallow: /ok/
Crawl-delay: 10
broken line`);

    expect(document.groups[0].rules).toEqual([{ directive: 'disallow', path: '/ok/', line: 7 }]);
    expect(document.issues.map(issue => issue.code)).toEqual([
      'orphan-rule',
      'empty-user-agent',
      'invalid-user-agent',
      'empty-rule-ignored',
      'invalid-rule-path',
      'unsupported-crawl-delay',
      'invalid-line',
    ]);
  });

  it('warns when content exceeds 500 KiB and ignores rules after that limit', () => {
    const padding = '#'.repeat(ROBOTS_TXT_MAX_BYTES - 25);
    const document = parseRobotsTxt(`User-agent: *\n${padding}\nDisallow: /late/`);

    expect(document.sourceBytes).toBeGreaterThan(ROBOTS_TXT_MAX_BYTES);
    expect(document.analyzedBytes).toBe(ROBOTS_TXT_MAX_BYTES);
    expect(document.issues.map(issue => issue.code)).toContain('file-too-large');
    expect(document.groups[0].rules).toEqual([]);
  });

  it('reports HTML, control characters, invalid sitemaps and duplicates', () => {
    const document = parseRobotsTxt(`<!doctype html>
User-agent: *
Disallow: /private/
Disallow: /private/
Sitemap: relative.xml
Unknown\u0000: value`);

    expect(document.issues.map(issue => issue.code)).toEqual([
      'html-content',
      'invalid-line',
      'duplicate-rule',
      'invalid-sitemap',
      'invalid-control-character',
    ]);
  });

  it('recognizes a BOM without treating it as part of the first field', () => {
    const document = parseRobotsTxt('\ufeffUser-agent: *\nDisallow: /private/');

    expect(document.groups).toHaveLength(1);
    expect(document.issues.map(issue => issue.code)).toEqual(['bom-ignored']);
  });

  it('preserves non-breaking spaces because REP only trims ASCII space and tabs', () => {
    const document = parseRobotsTxt('User-agent: *\nDisallow: /private\u00a0');

    expect(document.groups[0].rules[0].path).toBe('/private\u00a0');
  });

  it('rejects a dollar marker before the end of a rule', () => {
    const document = parseRobotsTxt('User-agent: *\nDisallow: /first$second$');

    expect(document.groups[0].rules).toEqual([]);
    expect(document.issues.map(issue => issue.code)).toContain('invalid-dollar-position');
  });

  it('bounds diagnostics for hostile files with many invalid records', () => {
    const document = parseRobotsTxt(Array.from({ length: 250 }, () => 'invalid').join('\n'));

    expect(document.issues).toHaveLength(201);
    expect(document.issues.at(-1)?.code).toBe('issues-truncated');
  });
});

describe('generateRobotsTxt', () => {
  it('generates rooted, deduplicated rules and a sitemap from the site origin', () => {
    const result = generateRobotsTxt({
      siteUrl: 'https://example.com/store/page',
      userAgent: 'Googlebot',
      allowPaths: ['assets/', '/assets/'],
      disallowPaths: ['admin area/', 'private/#draft'],
      includeSitemap: true,
    });

    expect(result.siteValid).toBe(true);
    expect(result.userAgentValid).toBe(true);
    expect(result.content).toBe(`User-agent: Googlebot
Allow: /assets/
Disallow: /admin%20area/
Disallow: /private/%23draft

Sitemap: https://example.com/sitemap.xml
`);
  });

  it('falls back safely when builder inputs are invalid', () => {
    const result = generateRobotsTxt({
      siteUrl: 'not a host',
      userAgent: 'Bad Bot/1.0',
      allowPaths: [],
      disallowPaths: ['/'],
      includeSitemap: true,
    });

    expect(result.siteValid).toBe(false);
    expect(result.userAgentValid).toBe(false);
    expect(result.content).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('evaluateRobotsAccess', () => {
  const document = parseRobotsTxt(`User-agent: *
Disallow: /private/
Disallow: /*.pdf$

User-agent: Googlebot
Disallow: /
Allow: /public/
Allow: /public/exact.html$

User-agent: Googlebot
Disallow: /public/drafts/`);

  it('uses exact user-agent groups instead of combining them with the wildcard group', () => {
    const decision = evaluateRobotsAccess(
      document,
      'https://example.com',
      'Googlebot',
      'https://example.com/public/article',
    );

    expect(decision.allowed).toBe(true);
    expect(decision.matchedUserAgents).toEqual(['Googlebot']);
    expect(decision.matchedRule?.path).toBe('/public/');
  });

  it('combines repeated exact groups and chooses the longest matching rule', () => {
    const decision = evaluateRobotsAccess(
      document,
      'example.com',
      'Googlebot',
      '/public/drafts/launch',
    );

    expect(decision.allowed).toBe(false);
    expect(decision.matchedRule?.path).toBe('/public/drafts/');
  });

  it('lets Allow win when matching rules have equal specificity', () => {
    const tied = parseRobotsTxt(`User-agent: *
Disallow: /same
Allow: /same`);
    const decision = evaluateRobotsAccess(tied, 'https://example.com', 'OtherBot', '/same/page');

    expect(decision.allowed).toBe(true);
    expect(decision.matchedRule?.directive).toBe('allow');
  });

  it('supports wildcards, terminal markers, queries and case-sensitive matching', () => {
    const blockedPdf = evaluateRobotsAccess(document, 'https://example.com', 'OtherBot', '/guide.pdf');
    const pdfWithQuery = evaluateRobotsAccess(document, 'https://example.com', 'OtherBot', '/guide.pdf?v=2');
    const upperCase = evaluateRobotsAccess(document, 'https://example.com', 'OtherBot', '/Private/page');

    expect(blockedPdf.allowed).toBe(false);
    expect(pdfWithQuery.allowed).toBe(true);
    expect(upperCase.allowed).toBe(true);
  });

  it('matches equivalent UTF-8 and percent-encoded paths', () => {
    const unicode = parseRobotsTxt('User-agent: *\nDisallow: /café/');
    const decision = evaluateRobotsAccess(
      unicode,
      'https://example.com',
      'OtherBot',
      'https://example.com/caf%C3%A9/menu',
    );

    expect(decision.allowed).toBe(false);
  });

  it('always allows the robots.txt resource itself', () => {
    const blockAll = parseRobotsTxt('User-agent: *\nDisallow: /');
    const decision = evaluateRobotsAccess(blockAll, 'https://example.com', 'OtherBot', '/robots.txt');

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('robots-file');
  });

  it('rejects invalid agents, URLs and targets on another origin', () => {
    expect(evaluateRobotsAccess(document, 'bad host', 'Googlebot', '/page').reason).toBe('invalid-site-url');
    expect(evaluateRobotsAccess(document, 'https://example.com', '*', '/page').reason).toBe('invalid-test-agent');
    expect(evaluateRobotsAccess(document, 'https://example.com', 'Googlebot', 'https://other.test/page').reason).toBe('different-origin');
    expect(evaluateRobotsAccess(document, 'https://example.com', 'Googlebot', 'http://[').reason).toBe('invalid-test-url');
    expect(evaluateRobotsAccess(document, 'https://example.com', 'Googlebot', '').reason).toBe('invalid-test-url');
    expect(evaluateRobotsAccess(document, 'https://example.com', 'Googlebot', 'ftp://example.com/file').reason).toBe('invalid-test-url');
  });

  it('does not throw on an unpaired surrogate in an untrusted rule', () => {
    const unusual = parseRobotsTxt('User-agent: *\nDisallow: /\ud800');

    expect(() => evaluateRobotsAccess(unusual, 'https://example.com', 'OtherBot', '/path')).not.toThrow();
  });
});
