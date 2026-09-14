import { canonicalizeHreflang } from '../../../shared/i18n/hreflang-code';

export const HTML_HEAD_MAX_SOURCE_CHARACTERS = 1_000_000;
export const HTML_HEAD_MAX_TAGS = 1_000;
export const HTML_HEAD_MAX_ISSUES = 200;

export type HeadAuditSeverity = 'error' | 'warning' | 'info';
export type HeadAuditIssueCode =
  | 'source-too-large'
  | 'empty-source'
  | 'tag-limit'
  | 'parser-unclosed-comment'
  | 'parser-unclosed-tag'
  | 'parser-malformed-tag'
  | 'parser-unclosed-title'
  | 'parser-unclosed-script'
  | 'parser-unclosed-head'
  | 'invalid-page-url'
  | 'missing-title'
  | 'multiple-title'
  | 'empty-title'
  | 'missing-description'
  | 'multiple-description'
  | 'empty-description'
  | 'missing-canonical'
  | 'multiple-canonical'
  | 'invalid-canonical'
  | 'canonical-fragment'
  | 'canonical-credentials'
  | 'canonical-different'
  | 'robots-conflict'
  | 'page-noindex'
  | 'unknown-robots-directive'
  | 'meta-refresh'
  | 'missing-viewport'
  | 'multiple-viewport'
  | 'viewport-not-responsive'
  | 'missing-charset'
  | 'multiple-charset'
  | 'non-utf8-charset'
  | 'duplicate-hreflang'
  | 'invalid-hreflang-url'
  | 'invalid-hreflang-code'
  | 'missing-hreflang-self'
  | 'missing-open-graph-property'
  | 'invalid-open-graph-url'
  | 'open-graph-url-mismatch'
  | 'missing-twitter-card'
  | 'unknown-twitter-card'
  | 'base-element'
  | 'issues-truncated';

export interface HeadAuditIssue {
  code: HeadAuditIssueCode;
  severity: HeadAuditSeverity;
  detail: string;
  position: number | null;
}

export interface ExtractedMetaTag {
  name: string;
  property: string;
  httpEquiv: string;
  content: string;
  position: number;
}

export interface ExtractedLinkTag {
  rel: string[];
  href: string;
  hreflang: string;
  media: string;
  type: string;
  position: number;
}

export interface ExtractedHeadSnapshot {
  sourceLength: number;
  truncated: boolean;
  tagLimitReached: boolean;
  scannedTagCount: number;
  titles: Array<{ value: string; position: number }>;
  metas: ExtractedMetaTag[];
  links: ExtractedLinkTag[];
  charsets: Array<{ value: string; position: number }>;
  baseHrefs: Array<{ value: string; position: number }>;
  jsonLdCount: number;
  parserIssues: HeadAuditIssue[];
}

export interface HeadAlternate {
  hreflang: string;
  href: string;
}

export interface HeadSocialSummary {
  openGraph: Partial<Record<string, string[]>>;
  twitter: Partial<Record<string, string[]>>;
}

export interface HtmlHeadAudit {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  robotsDirectives: string[];
  alternates: HeadAlternate[];
  social: HeadSocialSummary;
  jsonLdCount: number;
  tagCount: number;
  issues: HeadAuditIssue[];
}

const KNOWN_ROBOTS_DIRECTIVES = new Set([
  'all', 'index', 'noindex', 'follow', 'nofollow', 'none', 'nosnippet', 'noarchive',
  'noimageindex', 'notranslate', 'unavailable_after', 'max-snippet', 'max-image-preview',
  'max-video-preview', 'indexifembedded', 'nositelinkssearchbox',
]);

export function auditHtmlHead(snapshot: ExtractedHeadSnapshot, pageUrlSource: string): HtmlHeadAudit {
  const issues: HeadAuditIssue[] = [];
  const add = (value: HeadAuditIssue): void => {
    if (issues.length < HTML_HEAD_MAX_ISSUES) issues.push(value);
  };

  if (snapshot.truncated) add(issue('source-too-large', 'error'));
  if (snapshot.tagLimitReached) add(issue('tag-limit', 'error'));
  if (snapshot.sourceLength === 0) add(issue('empty-source', 'error'));
  for (const parserIssue of snapshot.parserIssues) add(parserIssue);

  const pageUrlCandidate = pageUrlSource.trim();
  const parsedPageUrl = pageUrlCandidate ? parseHttpUrl(pageUrlCandidate) : null;
  if (pageUrlCandidate && (!parsedPageUrl || parsedPageUrl.username || parsedPageUrl.password)) {
    add(issue('invalid-page-url', 'error', pageUrlCandidate));
  }

  const title = analyzeSingleText(snapshot.titles, add);
  const descriptions = snapshot.metas.filter(meta => meta.name === 'description');
  const description = analyzeSingleMeta(descriptions, add);
  const canonicalLinks = snapshot.links.filter(link => link.rel.includes('canonical'));
  const canonical = analyzeCanonical(canonicalLinks, pageUrlSource, add);
  const robotsDirectives = analyzeRobots(snapshot.metas, add);
  analyzeViewport(snapshot.metas, add);
  analyzeCharset(snapshot.charsets, add);
  const alternates = analyzeAlternates(snapshot.links, pageUrlSource, add);
  const social = analyzeSocial(snapshot.metas, canonical, add);

  for (const meta of snapshot.metas.filter(item => item.httpEquiv === 'refresh')) {
    add(issue('meta-refresh', 'warning', meta.content, meta.position));
  }
  for (const base of snapshot.baseHrefs) add(issue('base-element', 'info', base.value, base.position));

  if (issues.length >= HTML_HEAD_MAX_ISSUES && !issues.some(item => item.code === 'issues-truncated')) {
    issues[HTML_HEAD_MAX_ISSUES - 1] = issue('issues-truncated', 'warning');
  }

  return {
    title,
    titleLength: Array.from(title ?? '').length,
    description,
    descriptionLength: Array.from(description ?? '').length,
    canonical,
    robotsDirectives,
    alternates,
    social,
    jsonLdCount: snapshot.jsonLdCount,
    tagCount: snapshot.scannedTagCount,
    issues,
  };
}

export function serializeHtmlHeadAudit(audit: HtmlHeadAudit): string {
  return JSON.stringify({
    summary: {
      title: audit.title,
      titleLength: audit.titleLength,
      description: audit.description,
      descriptionLength: audit.descriptionLength,
      canonical: audit.canonical,
      robotsDirectives: audit.robotsDirectives,
      alternates: audit.alternates.length,
      jsonLdBlocks: audit.jsonLdCount,
      tags: audit.tagCount,
      errors: audit.issues.filter(item => item.severity === 'error').length,
      warnings: audit.issues.filter(item => item.severity === 'warning').length,
    },
    alternates: audit.alternates,
    social: audit.social,
    issues: audit.issues,
  }, null, 2);
}

function analyzeSingleText(
  values: Array<{ value: string; position: number }>,
  add: (value: HeadAuditIssue) => void,
): string | null {
  if (values.length === 0) {
    add(issue('missing-title', 'error'));
    return null;
  }
  if (values.length > 1) add(issue('multiple-title', 'error', String(values.length), values[1].position));
  const value = values[0].value.trim();
  if (!value) add(issue('empty-title', 'error', '', values[0].position));
  return value || null;
}

function analyzeSingleMeta(
  values: ExtractedMetaTag[],
  add: (value: HeadAuditIssue) => void,
): string | null {
  if (values.length === 0) {
    add(issue('missing-description', 'warning'));
    return null;
  }
  if (values.length > 1) add(issue('multiple-description', 'error', String(values.length), values[1].position));
  const value = values[0].content.trim();
  if (!value) add(issue('empty-description', 'warning', '', values[0].position));
  return value || null;
}

function analyzeCanonical(
  links: ExtractedLinkTag[],
  pageUrlSource: string,
  add: (value: HeadAuditIssue) => void,
): string | null {
  if (links.length === 0) {
    add(issue('missing-canonical', 'warning'));
    return null;
  }
  if (links.length > 1) add(issue('multiple-canonical', 'error', String(links.length), links[1].position));
  const first = links[0];
  const parsed = parseHttpUrl(first.href);
  if (!parsed) {
    add(issue('invalid-canonical', 'error', first.href, first.position));
    return null;
  }
  if (parsed.username || parsed.password) add(issue('canonical-credentials', 'error', first.href, first.position));
  if (parsed.hash) add(issue('canonical-fragment', 'warning', first.href, first.position));
  const canonical = withoutHash(parsed).href;
  const pageUrl = parseHttpUrl(pageUrlSource.trim());
  if (pageUrl && withoutHash(pageUrl).href !== canonical) add(issue('canonical-different', 'info', canonical, first.position));
  return canonical;
}

function analyzeRobots(metas: ExtractedMetaTag[], add: (value: HeadAuditIssue) => void): string[] {
  const robots = metas.filter(meta => meta.name === 'robots' || meta.name === 'googlebot');
  const directives: string[] = [];
  const directivesByAgent = new Map<string, string[]>();
  for (const meta of robots) {
    for (const raw of meta.content.split(/[;,]/u)) {
      const directive = raw.trim().toLowerCase();
      if (!directive) continue;
      directives.push(directive);
      const scoped = directivesByAgent.get(meta.name) ?? [];
      scoped.push(directive);
      directivesByAgent.set(meta.name, scoped);
      const name = directive.split(':', 1)[0];
      if (!KNOWN_ROBOTS_DIRECTIVES.has(name)) add(issue('unknown-robots-directive', 'info', directive, meta.position));
    }
  }
  const unique = [...new Set(directives)];
  for (const [agent, scopedDirectives] of directivesByAgent) {
    const scopedUnique = [...new Set(scopedDirectives)];
    const expanded = [...scopedUnique];
    if (hasDirective(scopedUnique, 'all')) expanded.push('index', 'follow');
    if (hasDirective(scopedUnique, 'none')) expanded.push('noindex', 'nofollow');
    if ((hasDirective(expanded, 'index') && hasDirective(expanded, 'noindex')) || (hasDirective(expanded, 'follow') && hasDirective(expanded, 'nofollow'))) {
      add(issue('robots-conflict', 'warning', `${agent}: ${scopedUnique.join(', ')}`, robots.find(meta => meta.name === agent)?.position ?? null));
    }
  }
  if (hasDirective(unique, 'noindex') || hasDirective(unique, 'none')) {
    add(issue('page-noindex', 'warning', unique.join(', '), robots[0]?.position ?? null));
  }
  return unique;
}

function analyzeViewport(metas: ExtractedMetaTag[], add: (value: HeadAuditIssue) => void): void {
  const viewports = metas.filter(meta => meta.name === 'viewport');
  if (viewports.length === 0) {
    add(issue('missing-viewport', 'warning'));
    return;
  }
  if (viewports.length > 1) add(issue('multiple-viewport', 'warning', String(viewports.length), viewports[1].position));
  if (!/\bwidth\s*=\s*device-width\b/iu.test(viewports[0].content)) {
    add(issue('viewport-not-responsive', 'warning', viewports[0].content, viewports[0].position));
  }
}

function analyzeCharset(charsets: Array<{ value: string; position: number }>, add: (value: HeadAuditIssue) => void): void {
  if (charsets.length === 0) {
    add(issue('missing-charset', 'info'));
    return;
  }
  if (charsets.length > 1) add(issue('multiple-charset', 'warning', String(charsets.length), charsets[1].position));
  if (!['utf-8', 'utf8'].includes(charsets[0].value.trim().toLowerCase())) {
    add(issue('non-utf8-charset', 'warning', charsets[0].value, charsets[0].position));
  }
}

function analyzeAlternates(
  links: ExtractedLinkTag[],
  pageUrlSource: string,
  add: (value: HeadAuditIssue) => void,
): HeadAlternate[] {
  const alternates: HeadAlternate[] = [];
  const codes = new Set<string>();
  for (const link of links.filter(item => item.rel.includes('alternate') && item.hreflang)) {
    const code = link.hreflang.toLowerCase();
    if (!isHreflangCode(code)) add(issue('invalid-hreflang-code', 'error', link.hreflang, link.position));
    if (codes.has(code)) add(issue('duplicate-hreflang', 'error', link.hreflang, link.position));
    codes.add(code);
    const url = parseHttpUrl(link.href);
    if (!url || url.username || url.password || url.hash) add(issue('invalid-hreflang-url', 'error', link.href, link.position));
    alternates.push({ hreflang: link.hreflang, href: url ? withoutHash(url).href : link.href });
  }
  const pageUrl = parseHttpUrl(pageUrlSource.trim());
  if (pageUrl && alternates.length > 0 && !alternates.some(item => parseHttpUrl(item.href)?.href === withoutHash(pageUrl).href)) {
    add(issue('missing-hreflang-self', 'warning', withoutHash(pageUrl).href));
  }
  return alternates;
}

function analyzeSocial(
  metas: ExtractedMetaTag[],
  canonical: string | null,
  add: (value: HeadAuditIssue) => void,
): HeadSocialSummary {
  const openGraph = collectProperties(metas, 'og:');
  const twitter = collectProperties(metas, 'twitter:');
  const openGraphKeys = Object.keys(openGraph);
  if (openGraphKeys.length > 0) {
    for (const required of ['og:title', 'og:type', 'og:image', 'og:url']) {
      if (!openGraph[required]?.some(Boolean)) add(issue('missing-open-graph-property', 'warning', required));
    }
    const ogUrl = openGraph['og:url']?.[0];
    if (ogUrl) {
      const parsed = parseHttpUrl(ogUrl);
      if (!parsed) add(issue('invalid-open-graph-url', 'warning', ogUrl));
      else if (canonical && withoutHash(parsed).href !== canonical) add(issue('open-graph-url-mismatch', 'info', ogUrl));
    }
  }
  if (Object.keys(twitter).length > 0) {
    const card = twitter['twitter:card']?.[0]?.toLowerCase();
    if (!card) add(issue('missing-twitter-card', 'warning'));
    else if (!['summary', 'summary_large_image', 'app', 'player'].includes(card)) add(issue('unknown-twitter-card', 'warning', card));
  }
  return { openGraph, twitter };
}

function collectProperties(metas: ExtractedMetaTag[], prefix: string): Partial<Record<string, string[]>> {
  const result: Partial<Record<string, string[]>> = {};
  for (const meta of metas) {
    const key = (meta.property || meta.name).toLowerCase();
    if (!key.startsWith(prefix)) continue;
    (result[key] ??= []).push(meta.content);
  }
  return result;
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function withoutHash(url: URL): URL {
  const copy = new URL(url.href);
  copy.hash = '';
  return copy;
}

function hasDirective(directives: string[], name: string): boolean {
  return directives.some(directive => directive === name || directive.startsWith(`${name}:`));
}

function isHreflangCode(value: string): boolean {
  return canonicalizeHreflang(value) !== null;
}

function issue(code: HeadAuditIssueCode, severity: HeadAuditSeverity, detail = '', position: number | null = null): HeadAuditIssue {
  return { code, severity, detail, position };
}
