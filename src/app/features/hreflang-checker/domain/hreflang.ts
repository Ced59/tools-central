import { canonicalizeHreflang } from '../../../shared/i18n/hreflang-code';

export const HREFLANG_MAX_SOURCE_CHARACTERS = 1_000_000;
export const HREFLANG_MAX_PAGES = 200;
export const HREFLANG_MAX_ALTERNATES_PER_PAGE = 100;

export type HreflangIssueSeverity = 'error' | 'warning' | 'info';

export type HreflangIssueCode =
  | 'source-too-large'
  | 'invalid-line'
  | 'missing-code'
  | 'invalid-code'
  | 'noncanonical-code'
  | 'missing-url'
  | 'invalid-url'
  | 'url-credentials'
  | 'url-fragment'
  | 'duplicate-code'
  | 'too-many-alternates'
  | 'missing-current-url'
  | 'invalid-current-url'
  | 'missing-self-reference'
  | 'missing-x-default'
  | 'missing-language-fallback'
  | 'same-url-multiple-codes'
  | 'invalid-page-header'
  | 'missing-canonical'
  | 'invalid-canonical'
  | 'canonical-mismatch'
  | 'empty-audit'
  | 'alternate-before-page'
  | 'duplicate-page'
  | 'too-many-pages'
  | 'target-page-not-provided'
  | 'missing-return-link'
  | 'inconsistent-set'
  | 'issues-truncated';

export interface HreflangIssue {
  code: HreflangIssueCode;
  severity: HreflangIssueSeverity;
  line: number | null;
  detail?: string;
  pageUrl?: string;
}

export interface HreflangEntry {
  code: string;
  url: string;
  line: number;
}

export interface HreflangSetAnalysis {
  currentUrl: string | null;
  entries: HreflangEntry[];
  issues: HreflangIssue[];
}

export interface HreflangOutputs {
  html: string;
  httpHeader: string;
  sitemapXml: string;
}

export interface HreflangAuditPage {
  url: string;
  canonicalUrl: string | null;
  line: number;
  entries: HreflangEntry[];
}

export interface HreflangAudit {
  pages: HreflangAuditPage[];
  linkCount: number;
  issues: HreflangIssue[];
}

type IssueSink = (issue: HreflangIssue) => void;

const MAX_REPORTED_ISSUES = 200;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export function analyzeHreflangSet(currentUrlSource: string, source: string): HreflangSetAnalysis {
  const issues: HreflangIssue[] = [];
  const addIssue = createIssueSink(issues);
  const limitedSource = limitSource(source, addIssue);
  const currentUrl = parsePageUrl(currentUrlSource, 0, addIssue, 'current');
  const entries = parseEntries(limitedSource.split(/\r\n|\n|\r/u), 1, addIssue);

  validateSet(currentUrl, entries, addIssue);
  return { currentUrl, entries, issues };
}

export function generateHreflangOutputs(analysis: HreflangSetAnalysis): HreflangOutputs {
  const html = analysis.entries
    .map(entry => `<link rel="alternate" hreflang="${escapeAttribute(entry.code)}" href="${escapeAttribute(entry.url)}" />`)
    .join('\n');
  const httpHeader = analysis.entries.length
    ? `Link: ${analysis.entries
      .map(entry => `<${entry.url}>; rel="alternate"; hreflang="${entry.code}"`)
      .join(',\n      ')}`
    : '';
  const sitemapLinks = analysis.entries
    .map(entry => `  <xhtml:link rel="alternate" hreflang="${escapeAttribute(entry.code)}" href="${escapeAttribute(entry.url)}" />`)
    .join('\n');
  const sitemapXml = analysis.currentUrl && sitemapLinks
    ? `<url>\n  <loc>${escapeText(analysis.currentUrl)}</loc>\n${sitemapLinks}\n</url>`
    : '';

  return { html, httpHeader, sitemapXml };
}

export function analyzeHreflangAudit(source: string): HreflangAudit {
  const issues: HreflangIssue[] = [];
  const addIssue = createIssueSink(issues);
  const lines = limitSource(source, addIssue).split(/\r\n|\n|\r/u);
  const pages: HreflangAuditPage[] = [];
  let currentPage: {
    url: string;
    canonicalUrl: string | null;
    line: number;
    entryLines: string[];
    firstEntryLine: number;
  } | null = null;

  const commitPage = (): void => {
    if (!currentPage) return;
    const page = currentPage;
    const entries = parseEntries(page.entryLines, page.firstEntryLine, issue => {
      addIssue({ ...issue, pageUrl: page.url });
    });
    if (entries.length > HREFLANG_MAX_ALTERNATES_PER_PAGE) {
      addIssue({
        code: 'too-many-alternates',
        severity: 'error',
        line: currentPage.line,
        detail: String(entries.length),
        pageUrl: currentPage.url,
      });
      entries.length = HREFLANG_MAX_ALTERNATES_PER_PAGE;
    }
    validateSet(page.url, entries, issue => {
      addIssue({ ...issue, pageUrl: page.url });
    });
    pages.push({
      url: currentPage.url,
      canonicalUrl: currentPage.canonicalUrl,
      line: currentPage.line,
      entries,
    });
    currentPage = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---') {
      if (currentPage) currentPage.entryLines.push(rawLine);
      continue;
    }

    const pageMatch = /^PAGE\s+(.+)$/iu.exec(trimmed);
    if (pageMatch) {
      commitPage();
      if (pages.length >= HREFLANG_MAX_PAGES) {
        addIssue({ code: 'too-many-pages', severity: 'error', line, detail: String(HREFLANG_MAX_PAGES) });
        break;
      }
      const [pageUrlSource, canonicalSource] = splitHeader(pageMatch[1]);
      const pageUrl = parsePageUrl(pageUrlSource, line, addIssue, 'page');
      let canonicalUrl: string | null = null;
      if (!canonicalSource) {
        addIssue({ code: 'missing-canonical', severity: 'warning', line, detail: pageUrlSource.trim() });
      } else {
        canonicalUrl = parseCanonicalUrl(canonicalSource, line, addIssue);
        if (pageUrl && canonicalUrl && pageUrl !== canonicalUrl) {
          addIssue({
            code: 'canonical-mismatch',
            severity: 'warning',
            line,
            detail: canonicalUrl,
            pageUrl,
          });
        }
      }
      if (pageUrl) {
        currentPage = { url: pageUrl, canonicalUrl, line, entryLines: [], firstEntryLine: line + 1 };
      }
      continue;
    }

    if (/^PAGE(?:\s|$)/iu.test(trimmed)) {
      commitPage();
      addIssue({ code: 'invalid-page-header', severity: 'error', line, detail: trimmed });
      continue;
    }

    if (!currentPage) {
      addIssue({ code: 'alternate-before-page', severity: 'error', line, detail: trimmed });
      continue;
    }
    currentPage.entryLines.push(rawLine);
  }
  commitPage();

  if (!pages.length) {
    addIssue({ code: 'empty-audit', severity: 'error', line: null });
  }

  const uniquePages = new Map<string, HreflangAuditPage>();
  for (const page of pages) {
    if (uniquePages.has(page.url)) {
      addIssue({ code: 'duplicate-page', severity: 'error', line: page.line, pageUrl: page.url });
    } else {
      uniquePages.set(page.url, page);
    }
  }

  const inconsistentPages = new Set<string>();
  const firstSignature = pageSignature(pages[0]);
  for (const page of pages.slice(1)) {
    if (pageSignature(page) !== firstSignature && !inconsistentPages.has(page.url)) {
      inconsistentPages.add(page.url);
      addIssue({ code: 'inconsistent-set', severity: 'warning', line: page.line, pageUrl: page.url });
    }
  }

  const missingTargets = new Set<string>();
  const missingReturns = new Set<string>();
  for (const page of pages) {
    for (const entry of page.entries) {
      const target = uniquePages.get(entry.url);
      if (!target) {
        if (!missingTargets.has(entry.url)) {
          missingTargets.add(entry.url);
          addIssue({
            code: 'target-page-not-provided',
            severity: 'warning',
            line: entry.line,
            detail: entry.url,
            pageUrl: page.url,
          });
        }
        continue;
      }
      if (target.url === page.url) continue;
      const pair = [page.url, target.url].sort().join('\n');
      if (!target.entries.some(targetEntry => targetEntry.url === page.url) && !missingReturns.has(pair)) {
        missingReturns.add(pair);
        addIssue({
          code: 'missing-return-link',
          severity: 'error',
          line: entry.line,
          detail: target.url,
          pageUrl: page.url,
        });
      }
    }
  }

  return {
    pages,
    linkCount: pages.reduce((total, page) => total + page.entries.length, 0),
    issues,
  };
}

function parseEntries(lines: string[], firstLine: number, addIssue: IssueSink): HreflangEntry[] {
  const entries: HreflangEntry[] = [];
  const codes = new Set<string>();
  const urls = new Map<string, string[]>();

  lines.forEach((rawLine, index) => {
    const line = firstLine + index;
    const value = rawLine.trim();
    if (!value || value === '---') return;
    if (CONTROL_CHARACTER_PATTERN.test(value)) {
      addIssue({ code: 'invalid-line', severity: 'error', line, detail: value });
      return;
    }
    const separator = value.indexOf('|');
    if (separator < 0) {
      addIssue({ code: 'invalid-line', severity: 'error', line, detail: value });
      return;
    }
    const codeSource = value.slice(0, separator).trim();
    const urlSource = value.slice(separator + 1).trim();
    if (!codeSource) {
      addIssue({ code: 'missing-code', severity: 'error', line });
      return;
    }
    if (!urlSource) {
      addIssue({ code: 'missing-url', severity: 'error', line, detail: codeSource });
      return;
    }
    const code = canonicalizeHreflang(codeSource);
    if (!code) {
      addIssue({ code: 'invalid-code', severity: 'error', line, detail: codeSource });
      return;
    }
    if (code !== codeSource) {
      addIssue({ code: 'noncanonical-code', severity: 'warning', line, detail: `${codeSource} → ${code}` });
    }
    const url = parseAlternateUrl(urlSource, line, addIssue);
    if (!url) return;
    if (codes.has(code.toLowerCase())) {
      addIssue({ code: 'duplicate-code', severity: 'error', line, detail: code });
      return;
    }
    codes.add(code.toLowerCase());
    entries.push({ code, url, line });
    const urlCodes = urls.get(url) ?? [];
    urlCodes.push(code);
    urls.set(url, urlCodes);
  });

  for (const [url, urlCodes] of urls) {
    if (urlCodes.length > 1) {
      addIssue({
        code: 'same-url-multiple-codes',
        severity: 'info',
        line: entries.find(entry => entry.url === url)?.line ?? null,
        detail: `${urlCodes.join(', ')} → ${url}`,
      });
    }
  }
  return entries;
}

function validateSet(currentUrl: string | null, entries: HreflangEntry[], addIssue: IssueSink): void {
  if (!entries.length) addIssue({ code: 'invalid-line', severity: 'error', line: null });
  if (entries.length > HREFLANG_MAX_ALTERNATES_PER_PAGE) {
    addIssue({
      code: 'too-many-alternates',
      severity: 'error',
      line: null,
      detail: String(entries.length),
    });
  }
  if (currentUrl && !entries.some(entry => entry.url === currentUrl)) {
    addIssue({ code: 'missing-self-reference', severity: 'error', line: null, detail: currentUrl });
  }
  if (!entries.some(entry => entry.code === 'x-default')) {
    addIssue({ code: 'missing-x-default', severity: 'info', line: null });
  }

  const codes = new Set(entries.map(entry => entry.code));
  const regionalLanguages = new Set(
    entries
      .filter(entry => entry.code !== 'x-default' && entry.code.split('-').length > 1)
      .map(entry => entry.code.split('-')[0]),
  );
  for (const language of regionalLanguages) {
    if (!codes.has(language)) {
      addIssue({ code: 'missing-language-fallback', severity: 'warning', line: null, detail: language });
    }
  }
}

function parsePageUrl(source: string, line: number, addIssue: IssueSink, kind: 'current' | 'page'): string | null {
  const trimmed = source.trim();
  if (!trimmed) {
    addIssue({
      code: kind === 'current' ? 'missing-current-url' : 'invalid-page-header',
      severity: 'error',
      line: line || null,
    });
    return null;
  }
  const url = parseUrl(trimmed);
  if (!url || url.username || url.password || url.hash) {
    addIssue({
      code: kind === 'current' ? 'invalid-current-url' : 'invalid-page-header',
      severity: 'error',
      line: line || null,
      detail: trimmed,
    });
    return null;
  }
  return url.href;
}

function parseAlternateUrl(source: string, line: number, addIssue: IssueSink): string | null {
  const url = parseUrl(source);
  if (!url) {
    addIssue({ code: 'invalid-url', severity: 'error', line, detail: source });
    return null;
  }
  if (url.username || url.password) {
    addIssue({ code: 'url-credentials', severity: 'error', line, detail: source });
    return null;
  }
  if (url.hash) {
    addIssue({ code: 'url-fragment', severity: 'error', line, detail: source });
    return null;
  }
  return url.href;
}

function parseCanonicalUrl(source: string, line: number, addIssue: IssueSink): string | null {
  const url = parseUrl(source.trim());
  if (!url || url.username || url.password || url.hash) {
    addIssue({ code: 'invalid-canonical', severity: 'error', line, detail: source.trim() });
    return null;
  }
  return url.href;
}

function parseUrl(source: string): URL | null {
  try {
    const url = new URL(source);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

function createIssueSink(issues: HreflangIssue[]): IssueSink {
  return issue => {
    if (issues.length < MAX_REPORTED_ISSUES) {
      issues.push(issue);
      return;
    }
    if (!issues.some(current => current.code === 'issues-truncated')) {
      issues.push({ code: 'issues-truncated', severity: 'warning', line: null });
    }
  };
}

function limitSource(source: string, addIssue: IssueSink): string {
  if (source.length <= HREFLANG_MAX_SOURCE_CHARACTERS) return source;
  addIssue({
    code: 'source-too-large',
    severity: 'error',
    line: null,
    detail: String(HREFLANG_MAX_SOURCE_CHARACTERS),
  });
  return source.slice(0, HREFLANG_MAX_SOURCE_CHARACTERS);
}

function pageSignature(page: HreflangAuditPage | undefined): string {
  return page?.entries
    .map(entry => `${entry.code}\u0000${entry.url}`)
    .sort()
    .join('\u0001') ?? '';
}

function splitHeader(value: string): [string, string] {
  const separator = value.indexOf('|');
  return separator < 0
    ? [value, '']
    : [value.slice(0, separator), value.slice(separator + 1)];
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

function escapeText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
}
