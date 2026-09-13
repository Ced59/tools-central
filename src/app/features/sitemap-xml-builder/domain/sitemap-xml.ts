export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
export const SITEMAP_MAX_ENTRIES = 50_000;
export const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
export const SITEMAP_ANALYSIS_MAX_BYTES = 10 * 1024 * 1024;

export type SitemapKind = 'urlset' | 'sitemapindex';
export type SitemapIssueSeverity = 'error' | 'warning' | 'info';
export type SitemapIssueCode =
  | 'file-too-large'
  | 'analysis-limit'
  | 'unsafe-doctype'
  | 'malformed-xml'
  | 'invalid-root'
  | 'invalid-namespace'
  | 'invalid-sitemap-url'
  | 'empty-sitemap'
  | 'too-many-entries'
  | 'missing-loc'
  | 'multiple-loc'
  | 'invalid-loc'
  | 'loc-too-long'
  | 'duplicate-loc'
  | 'different-origin'
  | 'outside-sitemap-path'
  | 'invalid-lastmod'
  | 'future-lastmod'
  | 'invalid-changefreq'
  | 'invalid-priority'
  | 'google-ignores-changefreq'
  | 'google-ignores-priority'
  | 'invalid-builder-line'
  | 'issues-truncated';

export interface SitemapIssue {
  code: SitemapIssueCode;
  severity: SitemapIssueSeverity;
  line: number | null;
  detail?: string;
}

export interface SitemapEntry {
  loc: string;
  lastmod: string | null;
  changefreq: string | null;
  priority: string | null;
  line: number;
}

export interface SitemapDocument {
  kind: SitemapKind | null;
  entries: SitemapEntry[];
  issues: SitemapIssue[];
  sourceBytes: number;
  analyzed: boolean;
  namespaceValid: boolean;
}

export interface SitemapBuilderSettings {
  kind: SitemapKind;
  siteUrl: string;
  lines: string[];
  todayIso: string;
}

export interface SitemapGeneration {
  content: string;
  entries: SitemapEntry[];
  issues: SitemapIssue[];
  siteValid: boolean;
}

interface XmlElement {
  name: string;
  namespace: string | null;
  namespaces: Map<string, string>;
  attributes: Map<string, string>;
  children: XmlElement[];
  text: string;
  line: number;
}

interface XmlParseResult {
  root: XmlElement | null;
  issue: SitemapIssue | null;
}

const MAX_REPORTED_ISSUES = 200;
const MAX_XML_DEPTH = 64;
const MAX_XML_ELEMENTS = 300_100;
const CHANGE_FREQUENCIES = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const XML_NAME_PATTERN = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/u;
const W3C_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/u;

export function generateSitemapXml(settings: SitemapBuilderSettings): SitemapGeneration {
  const siteOrigin = parseHttpOrigin(settings.siteUrl);
  const issues: SitemapIssue[] = [];
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();
  const entryName = settings.kind === 'urlset' ? 'url' : 'sitemap';
  const outputLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${settings.kind} xmlns="${SITEMAP_NAMESPACE}">`,
  ];
  const closingLine = `</${settings.kind}>`;
  let outputBytes = utf8ByteLength(`${outputLines.join('\n')}\n${closingLine}\n`);

  const addIssue = issueCollector(issues);
  for (let index = 0; index < settings.lines.length; index += 1) {
    const line = index + 1;
    const raw = settings.lines[index].trim();
    if (!raw) continue;
    if (entries.length >= SITEMAP_MAX_ENTRIES) {
      addIssue({ code: 'too-many-entries', severity: 'error', line });
      break;
    }

    const separator = raw.indexOf('|');
    const rawLocation = (separator >= 0 ? raw.slice(0, separator) : raw).trim();
    const rawLastmod = separator >= 0 ? raw.slice(separator + 1).trim() : '';
    if (!rawLocation || rawLastmod.includes('|')) {
      addIssue({ code: 'invalid-builder-line', severity: 'error', line, detail: raw });
      continue;
    }

    const location = normalizeLocation(rawLocation, siteOrigin);
    if (!location) {
      addIssue({ code: 'invalid-loc', severity: 'error', line, detail: rawLocation });
      continue;
    }
    if (location.length >= 2048) {
      addIssue({ code: 'loc-too-long', severity: 'error', line, detail: location.slice(0, 180) });
      continue;
    }
    if (siteOrigin && new URL(location).origin !== siteOrigin) {
      addIssue({ code: 'different-origin', severity: 'error', line, detail: location });
      continue;
    }
    if (seen.has(location)) {
      addIssue({ code: 'duplicate-loc', severity: 'warning', line, detail: location });
      continue;
    }
    if (rawLastmod && !isValidW3cDate(rawLastmod)) {
      addIssue({ code: 'invalid-lastmod', severity: 'error', line, detail: rawLastmod });
      continue;
    }
    if (rawLastmod && isFutureDate(rawLastmod, settings.todayIso)) {
      addIssue({ code: 'future-lastmod', severity: 'warning', line, detail: rawLastmod });
    }

    const entry: SitemapEntry = {
      loc: location,
      lastmod: rawLastmod || null,
      changefreq: null,
      priority: null,
      line,
    };
    const entryLines = [`  <${entryName}>`, `    <loc>${escapeXml(entry.loc)}</loc>`];
    if (entry.lastmod) entryLines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    entryLines.push(`  </${entryName}>`);
    const entryBytes = utf8ByteLength(`${entryLines.join('\n')}\n`);
    if (outputBytes + entryBytes > SITEMAP_MAX_BYTES) {
      addIssue({ code: 'file-too-large', severity: 'error', line });
      break;
    }

    outputBytes += entryBytes;
    seen.add(location);
    entries.push(entry);
    outputLines.push(...entryLines);
  }
  outputLines.push(closingLine);

  return {
    content: `${outputLines.join('\n')}\n`,
    entries,
    issues,
    siteValid: siteOrigin !== null,
  };
}

export function analyzeSitemapXml(
  source: string,
  sitemapUrl: string,
  todayIso: string,
): SitemapDocument {
  const sourceBytes = utf8ByteLength(source);
  const issues: SitemapIssue[] = [];
  const addIssue = issueCollector(issues);
  if (sourceBytes > SITEMAP_MAX_BYTES) {
    addIssue({ code: 'file-too-large', severity: 'error', line: null });
  }
  if (sourceBytes > SITEMAP_ANALYSIS_MAX_BYTES) {
    addIssue({ code: 'analysis-limit', severity: 'error', line: null });
    return { kind: null, entries: [], issues, sourceBytes, analyzed: false, namespaceValid: false };
  }

  const parsed = parseXml(source);
  if (parsed.issue) addIssue(parsed.issue);
  if (!parsed.root) {
    if (!parsed.issue) addIssue({ code: 'malformed-xml', severity: 'error', line: 1 });
    return { kind: null, entries: [], issues, sourceBytes, analyzed: true, namespaceValid: false };
  }

  const rootName = localName(parsed.root.name);
  const kind = rootName === 'urlset' || rootName === 'sitemapindex' ? rootName : null;
  if (!kind) {
    addIssue({ code: 'invalid-root', severity: 'error', line: parsed.root.line, detail: parsed.root.name });
  }
  const namespaceValid = rootNamespace(parsed.root) === SITEMAP_NAMESPACE;
  if (!namespaceValid) {
    addIssue({ code: 'invalid-namespace', severity: 'error', line: parsed.root.line });
  }
  if (!kind) {
    return { kind, entries: [], issues, sourceBytes, analyzed: true, namespaceValid };
  }

  const sitemapLocation = parseAbsoluteHttpUrl(sitemapUrl);
  if (!sitemapLocation) {
    addIssue({ code: 'invalid-sitemap-url', severity: 'error', line: null, detail: sitemapUrl });
  }
  const expectedEntryName = kind === 'urlset' ? 'url' : 'sitemap';
  const entryElements = directChildren(parsed.root, expectedEntryName);
  if (!entryElements.length) {
    addIssue({ code: 'empty-sitemap', severity: 'warning', line: parsed.root.line });
  }
  if (entryElements.length > SITEMAP_MAX_ENTRIES) {
    addIssue({ code: 'too-many-entries', severity: 'error', line: parsed.root.line });
  }

  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();
  let reportedIgnoredChangefreq = false;
  let reportedIgnoredPriority = false;

  for (const entryElement of entryElements.slice(0, SITEMAP_MAX_ENTRIES)) {
    const locationElements = directChildren(entryElement, 'loc');
    if (!locationElements.length) {
      addIssue({ code: 'missing-loc', severity: 'error', line: entryElement.line });
      continue;
    }
    if (locationElements.length > 1) {
      addIssue({ code: 'multiple-loc', severity: 'error', line: entryElement.line });
    }

    const rawLocation = textContent(locationElements[0]).trim();
    const location = parseAbsoluteHttpUrl(rawLocation);
    if (!location) {
      addIssue({ code: 'invalid-loc', severity: 'error', line: locationElements[0].line, detail: rawLocation });
      continue;
    }
    if (rawLocation.length >= 2048) {
      addIssue({ code: 'loc-too-long', severity: 'error', line: locationElements[0].line, detail: rawLocation.slice(0, 180) });
    }
    if (seen.has(location.href)) {
      addIssue({ code: 'duplicate-loc', severity: 'warning', line: locationElements[0].line, detail: location.href });
    }
    seen.add(location.href);
    if (sitemapLocation && location.origin !== sitemapLocation.origin) {
      addIssue({ code: 'different-origin', severity: kind === 'sitemapindex' ? 'error' : 'warning', line: locationElements[0].line, detail: location.href });
    }
    if (sitemapLocation && location.origin === sitemapLocation.origin) {
      const parentPath = sitemapDirectory(sitemapLocation.pathname);
      if (!location.pathname.startsWith(parentPath)) {
        addIssue({ code: 'outside-sitemap-path', severity: 'warning', line: locationElements[0].line, detail: location.href });
      }
    }

    const lastmodElement = directChildren(entryElement, 'lastmod').at(0);
    const lastmod = lastmodElement ? textContent(lastmodElement).trim() : null;
    if (lastmodElement && lastmod && !isValidW3cDate(lastmod)) {
      addIssue({ code: 'invalid-lastmod', severity: 'error', line: lastmodElement.line, detail: lastmod });
    } else if (lastmodElement && lastmod && isFutureDate(lastmod, todayIso)) {
      addIssue({ code: 'future-lastmod', severity: 'warning', line: lastmodElement.line, detail: lastmod });
    }

    const changefreqElement = directChildren(entryElement, 'changefreq').at(0);
    const changefreq = changefreqElement ? textContent(changefreqElement).trim() : null;
    if (changefreqElement && changefreq && !CHANGE_FREQUENCIES.has(changefreq)) {
      addIssue({ code: 'invalid-changefreq', severity: 'error', line: changefreqElement.line, detail: changefreq });
    } else if (changefreqElement && changefreq && !reportedIgnoredChangefreq) {
      addIssue({ code: 'google-ignores-changefreq', severity: 'info', line: changefreqElement.line });
      reportedIgnoredChangefreq = true;
    }

    const priorityElement = directChildren(entryElement, 'priority').at(0);
    const priority = priorityElement ? textContent(priorityElement).trim() : null;
    if (priorityElement && priority && !isValidPriority(priority)) {
      addIssue({ code: 'invalid-priority', severity: 'error', line: priorityElement.line, detail: priority });
    } else if (priorityElement && priority && !reportedIgnoredPriority) {
      addIssue({ code: 'google-ignores-priority', severity: 'info', line: priorityElement.line });
      reportedIgnoredPriority = true;
    }

    entries.push({ loc: location.href, lastmod, changefreq, priority, line: entryElement.line });
  }

  return { kind, entries, issues, sourceBytes, analyzed: true, namespaceValid };
}

function issueCollector(issues: SitemapIssue[]): (issue: SitemapIssue) => void {
  let truncated = false;
  return (issue): void => {
    if (issues.length >= MAX_REPORTED_ISSUES) {
      if (!truncated) {
        issues[MAX_REPORTED_ISSUES - 1] = { code: 'issues-truncated', severity: 'warning', line: null };
        truncated = true;
      }
      return;
    }
    if ((issue.code === 'too-many-entries' || issue.code === 'file-too-large')
      && issues.some(existing => existing.code === issue.code)) return;
    issues.push(issue);
  };
}

function parseXml(source: string): XmlParseResult {
  const stack: XmlElement[] = [];
  let root: XmlElement | null = null;
  let index = source.startsWith('\ufeff') ? 1 : 0;
  let line = 1;
  let elementCount = 0;

  const fail = (detail: string): XmlParseResult => ({
    root: null,
    issue: { code: 'malformed-xml', severity: 'error', line, detail },
  });
  const advance = (nextIndex: number): void => {
    for (let cursor = index; cursor < nextIndex; cursor += 1) {
      if (source[cursor] === '\n') line += 1;
    }
    index = nextIndex;
  };

  for (const character of source) {
    if (!isValidXmlCodePoint(character.codePointAt(0) ?? 0)) return fail('character');
  }

  while (index < source.length) {
    if (source[index] !== '<') {
      const nextTag = source.indexOf('<', index);
      const end = nextTag < 0 ? source.length : nextTag;
      const rawText = source.slice(index, end);
      const decoded = decodeXmlEntities(rawText);
      if (decoded === null) return fail('entity');
      const parent = stack.at(-1);
      if (parent) parent.text += decoded;
      else if (rawText.trim()) return fail('text-outside-root');
      advance(end);
      continue;
    }

    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4);
      if (end < 0) return fail('comment');
      advance(end + 3);
      continue;
    }
    if (source.startsWith('<![CDATA[', index)) {
      const end = source.indexOf(']]>', index + 9);
      if (end < 0) return fail('cdata');
      const parent = stack.at(-1);
      if (!parent) return fail('cdata-outside-root');
      parent.text += source.slice(index + 9, end);
      advance(end + 3);
      continue;
    }
    if (source.slice(index, index + 9).toUpperCase() === '<!DOCTYPE') {
      return { root: null, issue: { code: 'unsafe-doctype', severity: 'error', line } };
    }
    if (source.startsWith('<?', index)) {
      const end = source.indexOf('?>', index + 2);
      if (end < 0) return fail('processing-instruction');
      advance(end + 2);
      continue;
    }
    if (source.startsWith('<!', index)) return fail('declaration');

    const tagEnd = findTagEnd(source, index + 1);
    if (tagEnd < 0) return fail('tag');
    const tokenLine = line;
    const rawToken = source.slice(index + 1, tagEnd);
    if (rawToken.startsWith('/')) {
      const name = rawToken.slice(1).trim();
      if (!XML_NAME_PATTERN.test(name) || stack.at(-1)?.name !== name) return fail(`closing:${name}`);
      stack.pop();
      advance(tagEnd + 1);
      continue;
    }

    const selfClosing = /\/\s*$/u.test(rawToken);
    const opening = parseOpeningTag(selfClosing ? rawToken.replace(/\/\s*$/u, '') : rawToken);
    if (!opening) return fail('opening-tag');
    elementCount += 1;
    if (elementCount > MAX_XML_ELEMENTS) return fail('element-limit');
    if (stack.length >= MAX_XML_DEPTH) return fail('depth-limit');
    const parent = stack.at(-1);
    const namespaces = new Map(parent?.namespaces);
    for (const [attributeName, value] of opening.attributes) {
      if (attributeName === 'xmlns') namespaces.set('', value);
      else if (attributeName.startsWith('xmlns:')) namespaces.set(attributeName.slice(6), value);
    }
    const element: XmlElement = {
      name: opening.name,
      namespace: namespaces.get(elementPrefix(opening.name)) ?? null,
      namespaces,
      attributes: opening.attributes,
      children: [],
      text: '',
      line: tokenLine,
    };
    if (parent) parent.children.push(element);
    else if (root) return fail('multiple-roots');
    else root = element;
    if (!selfClosing) stack.push(element);
    advance(tagEnd + 1);
  }

  const unclosedElement = stack.at(-1);
  if (unclosedElement) return fail(`unclosed:${unclosedElement.name}`);
  return { root, issue: null };
}

function findTagEnd(source: string, start: number): number {
  let quote = '';
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '>') return index;
  }
  return -1;
}

function parseOpeningTag(token: string): { name: string; attributes: Map<string, string> } | null {
  const nameMatch = token.trimStart().match(/^([^\s]+)([\s\S]*)$/u);
  if (!nameMatch || !XML_NAME_PATTERN.test(nameMatch[1])) return null;
  const attributes = new Map<string, string>();
  let rest = nameMatch[2];
  while (rest.trim()) {
    const match = rest.match(/^\s+([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(["'])([\s\S]*?)\2/u);
    if (!match || attributes.has(match[1])) return null;
    const value = decodeXmlEntities(match[3]);
    if (value === null || value.includes('<')) return null;
    attributes.set(match[1], value);
    rest = rest.slice(match[0].length);
  }
  return { name: nameMatch[1], attributes };
}

function decodeXmlEntities(value: string): string | null {
  if (/&(?!(?:#x[0-9A-Fa-f]+|#\d+|amp|apos|quot|lt|gt);)/u.test(value)) return null;
  const decoded = value.replace(/&(#x[0-9A-Fa-f]+|#\d+|amp|apos|quot|lt|gt);/gu, (entity, name: string) => {
    if (name === 'amp') return '&';
    if (name === 'apos') return "'";
    if (name === 'quot') return '"';
    if (name === 'lt') return '<';
    if (name === 'gt') return '>';
    const radix = name.toLowerCase().startsWith('#x') ? 16 : 10;
    const rawNumber = name.slice(radix === 16 ? 2 : 1);
    const codePoint = Number.parseInt(rawNumber, radix);
    if (!Number.isFinite(codePoint) || !isValidXmlCodePoint(codePoint)) {
      return '\u0000';
    }
    return String.fromCodePoint(codePoint);
  });
  if (decoded.includes('\u0000')) return null;
  return decoded;
}

function isValidXmlCodePoint(codePoint: number): boolean {
  return codePoint === 0x09
    || codePoint === 0x0a
    || codePoint === 0x0d
    || (codePoint >= 0x20 && codePoint <= 0xd7ff)
    || (codePoint >= 0xe000 && codePoint <= 0xfffd)
    || (codePoint >= 0x10000 && codePoint <= 0x10ffff);
}

function directChildren(element: XmlElement, childName: string): XmlElement[] {
  return element.children.filter(child =>
    child.namespace === SITEMAP_NAMESPACE && localName(child.name) === childName,
  );
}

function textContent(element: XmlElement): string {
  return element.text + element.children.map(textContent).join('');
}

function localName(name: string): string {
  return name.includes(':') ? name.slice(name.lastIndexOf(':') + 1) : name;
}

function elementPrefix(name: string): string {
  const separator = name.indexOf(':');
  return separator < 0 ? '' : name.slice(0, separator);
}

function rootNamespace(root: XmlElement): string | null {
  return root.namespace;
}

function parseHttpOrigin(value: string): string | null {
  try {
    const trimmed = value.trim();
    const candidate = /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname ? parsed.origin : null;
  } catch {
    return null;
  }
}

function parseAbsoluteHttpUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeLocation(value: string, siteOrigin: string | null): string | null {
  try {
    const parsed = siteOrigin ? new URL(value, `${siteOrigin}/`) : new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
}

function sitemapDirectory(pathname: string): string {
  const lastSlash = pathname.lastIndexOf('/');
  return pathname.slice(0, Math.max(0, lastSlash) + 1) || '/';
}

function isValidW3cDate(value: string): boolean {
  if (!W3C_DATE_PATTERN.test(value)) return false;
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return false;
  return !value.includes('T') || Number.isFinite(Date.parse(value));
}

function isFutureDate(value: string, todayIso: string): boolean {
  const today = Date.parse(`${todayIso.slice(0, 10)}T23:59:59.999Z`);
  const candidate = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isFinite(today) && Number.isFinite(candidate) && candidate > today;
}

function isValidPriority(value: string): boolean {
  if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/u.test(value)) return false;
  const parsed = Number(value);
  return parsed >= 0 && parsed <= 1;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}
