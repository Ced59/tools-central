import { decodeHTML, decodeHTMLAttribute } from 'entities/decode';

import type { HtmlHeadParserPort } from '../application/html-head-audit.use-cases';
import {
  HTML_HEAD_MAX_ISSUES,
  HTML_HEAD_MAX_TAGS,
  type ExtractedHeadSnapshot,
  type HeadAuditIssue,
  type HeadAuditIssueCode,
} from '../domain/html-head-audit';

interface ParsedStartTag {
  name: string;
  attributes: Record<string, string>;
}

const HEAD_CONTENT_TAGS = new Set([
  'base', 'basefont', 'bgsound', 'link', 'meta', 'noframes', 'noscript', 'script', 'style', 'template', 'title',
]);
const RAW_TEXT_ELEMENTS = new Set(['iframe', 'noembed', 'noframes', 'noscript', 'script', 'style', 'xmp']);
const RCDATA_ELEMENTS = new Set(['textarea', 'title']);

export class LocalHtmlHeadParserAdapter implements HtmlHeadParserPort {
  extract(source: string): ExtractedHeadSnapshot {
    const result = emptySnapshot(source.length);
    const scope = findHeadScope(source);
    const input = scope.source;
    if (scope.unclosed) appendParserIssue(result, 'parser-unclosed-head', null);
    let cursor = 0;

    while (cursor < input.length) {
      const opening = input.indexOf('<', cursor);
      if (opening < 0) break;
      if (input.startsWith('<!--', opening)) {
        const endComment = input.indexOf('-->', opening + 4);
        if (endComment < 0) {
          appendParserIssue(result, 'parser-unclosed-comment', result.scannedTagCount + 1);
          break;
        }
        cursor = endComment + 3;
        continue;
      }

      const end = findTagEnd(input, opening + 1);
      if (end < 0) {
        appendParserIssue(result, 'parser-unclosed-tag', result.scannedTagCount + 1);
        break;
      }
      const raw = input.slice(opening + 1, end).trim();
      cursor = end + 1;
      if (!raw || raw.startsWith('/') || raw.startsWith('!') || raw.startsWith('?')) continue;

      const position = result.scannedTagCount + 1;
      if (position > HTML_HEAD_MAX_TAGS) {
        result.tagLimitReached = true;
        break;
      }
      result.scannedTagCount = position;
      const tag = parseStartTag(raw);
      if (!tag) {
        appendParserIssue(result, 'parser-malformed-tag', position);
        continue;
      }

      if (tag.name === 'title') {
        const closing = findClosingTag(input, 'title', cursor);
        if (closing === null) {
          appendParserIssue(result, 'parser-unclosed-title', position);
          result.titles.push({ value: decodeHTML(input.slice(cursor)).trim(), position });
          break;
        }
        result.titles.push({ value: decodeHTML(input.slice(cursor, closing.start)).trim(), position });
        cursor = closing.end;
        continue;
      }

      if (tag.name === 'plaintext') break;

      if (RAW_TEXT_ELEMENTS.has(tag.name) || RCDATA_ELEMENTS.has(tag.name)) {
        if (tag.name === 'script' && (tag.attributes['type'] ?? '').trim().toLowerCase() === 'application/ld+json') {
          result.jsonLdCount += 1;
        }
        const closing = findClosingTag(input, tag.name, cursor);
        if (closing) cursor = closing.end;
        else if (tag.name === 'script') {
          appendParserIssue(result, 'parser-unclosed-script', position);
          break;
        } else break;
        continue;
      }

      if (tag.name === 'template') {
        const closing = findTemplateEnd(input, cursor);
        if (closing) cursor = closing.end;
        else break;
        continue;
      }

      if (tag.name === 'meta') appendMeta(result, tag.attributes, position);
      else if (tag.name === 'link') appendLink(result, tag.attributes, position);
      else if (tag.name === 'base') result.baseHrefs.push({ value: tag.attributes['href'] ?? '', position });
    }

    return result;
  }
}

function findHeadScope(source: string): { source: string; unclosed: boolean } {
  let cursor = 0;
  let documentStart: number | null = null;
  let htmlContentStart: number | null = null;
  while (cursor < source.length) {
    const opening = source.indexOf('<', cursor);
    if (opening < 0) break;
    if (source.startsWith('<!--', opening)) {
      const endComment = source.indexOf('-->', opening + 4);
      if (endComment < 0) break;
      cursor = endComment + 3;
      continue;
    }
    const end = findTagEnd(source, opening + 1);
    if (end < 0) break;
    const raw = source.slice(opening + 1, end).trim();
    cursor = end + 1;
    if (!raw || raw.startsWith('/') || raw.startsWith('?')) continue;
    if (raw.startsWith('!')) {
      if (/^!doctype(?:\s|$)/iu.test(raw)) documentStart = cursor;
      continue;
    }
    const tag = parseStartTag(raw);
    if (!tag) continue;
    if (tag.name === 'html') {
      htmlContentStart = cursor;
      continue;
    }
    if (tag.name === 'head') {
      const closing = findHeadEnd(source, cursor);
      return closing
        ? { source: source.slice(cursor, closing.start), unclosed: false }
        : { source: source.slice(cursor), unclosed: true };
    }
    const implicitStart = htmlContentStart ?? documentStart;
    if (implicitStart !== null) {
      const closing = findHeadEnd(source, implicitStart);
      return closing
        ? { source: source.slice(implicitStart, closing.start), unclosed: false }
        : { source: source.slice(implicitStart), unclosed: false };
    }
    if (tag.name === 'template') {
      const closing = findTemplateEnd(source, cursor);
      if (closing) cursor = closing.end;
      continue;
    }
    if (RAW_TEXT_ELEMENTS.has(tag.name) || RCDATA_ELEMENTS.has(tag.name)) {
      const closing = findClosingTag(source, tag.name, cursor);
      if (closing) cursor = closing.end;
    }
  }
  return { source, unclosed: false };
}

function findHeadEnd(source: string, from: number): { start: number; end: number } | null {
  let cursor = from;
  while (cursor < source.length) {
    const opening = source.indexOf('<', cursor);
    if (opening < 0) return null;
    if (source.startsWith('<!--', opening)) {
      const endComment = source.indexOf('-->', opening + 4);
      if (endComment < 0) return null;
      cursor = endComment + 3;
      continue;
    }
    const end = findTagEnd(source, opening + 1);
    if (end < 0) return null;
    const raw = source.slice(opening + 1, end).trim();
    cursor = end + 1;
    const closingName = /^\/\s*([a-z][\w:-]*)\s*$/iu.exec(raw)?.[1]?.toLowerCase();
    if (closingName === 'head') return { start: opening, end: cursor };
    if (!raw || closingName || raw.startsWith('!') || raw.startsWith('?')) continue;
    const tag = parseStartTag(raw);
    if (!tag) continue;
    if (!HEAD_CONTENT_TAGS.has(tag.name)) return { start: opening, end: opening };
    if (tag.name === 'template') {
      const closing = findTemplateEnd(source, cursor);
      if (!closing) return null;
      cursor = closing.end;
      continue;
    }
    if (RAW_TEXT_ELEMENTS.has(tag.name) || RCDATA_ELEMENTS.has(tag.name)) {
      const closing = findClosingTag(source, tag.name, cursor);
      if (!closing) return null;
      cursor = closing.end;
    }
  }
  return null;
}

function findTemplateEnd(source: string, from: number): { start: number; end: number } | null {
  let cursor = from;
  let depth = 1;
  while (cursor < source.length) {
    const opening = source.indexOf('<', cursor);
    if (opening < 0) return null;
    if (source.startsWith('<!--', opening)) {
      const endComment = source.indexOf('-->', opening + 4);
      if (endComment < 0) return null;
      cursor = endComment + 3;
      continue;
    }
    const end = findTagEnd(source, opening + 1);
    if (end < 0) return null;
    const raw = source.slice(opening + 1, end).trim();
    cursor = end + 1;
    const closingName = /^\/\s*([a-z][\w:-]*)\s*$/iu.exec(raw)?.[1]?.toLowerCase();
    if (closingName === 'template') {
      depth -= 1;
      if (depth === 0) return { start: opening, end: cursor };
      continue;
    }
    if (!raw || closingName || raw.startsWith('!') || raw.startsWith('?')) continue;
    const tag = parseStartTag(raw);
    if (!tag) continue;
    if (tag.name === 'template') {
      depth += 1;
      continue;
    }
    if (tag.name === 'plaintext') return null;
    if (RAW_TEXT_ELEMENTS.has(tag.name) || RCDATA_ELEMENTS.has(tag.name)) {
      const closing = findClosingTag(source, tag.name, cursor);
      if (!closing) return null;
      cursor = closing.end;
    }
  }
  return null;
}

function appendMeta(result: ExtractedHeadSnapshot, attributes: Record<string, string>, position: number): void {
  const name = (attributes['name'] ?? '').trim().toLowerCase();
  const property = (attributes['property'] ?? '').trim().toLowerCase();
  const httpEquiv = (attributes['http-equiv'] ?? '').trim().toLowerCase();
  const content = (attributes['content'] ?? '').trim();
  result.metas.push({ name, property, httpEquiv, content, position });

  const charset = (attributes['charset'] ?? '').trim();
  if (charset) result.charsets.push({ value: charset, position });
  else if (httpEquiv === 'content-type') {
    const match = /(?:^|;)\s*charset\s*=\s*([\w-]+)/iu.exec(content);
    if (match?.[1]) result.charsets.push({ value: match[1], position });
  }
}

function appendLink(result: ExtractedHeadSnapshot, attributes: Record<string, string>, position: number): void {
  result.links.push({
    rel: tokens(attributes['rel']),
    href: (attributes['href'] ?? '').trim(),
    hreflang: (attributes['hreflang'] ?? '').trim(),
    media: (attributes['media'] ?? '').trim(),
    type: (attributes['type'] ?? '').trim(),
    position,
  });
}

function parseStartTag(raw: string): ParsedStartTag | null {
  const nameMatch = /^([a-z][\w:-]*)/iu.exec(raw);
  if (!nameMatch) return null;
  const attributes: Record<string, string> = {};
  let cursor = nameMatch[0].length;

  while (cursor < raw.length) {
    while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
    if (cursor >= raw.length || raw[cursor] === '/') break;
    const nameStart = cursor;
    while (cursor < raw.length && !/[\s=/>]/u.test(raw[cursor] ?? '')) cursor += 1;
    const name = raw.slice(nameStart, cursor).toLowerCase();
    if (!name) {
      cursor += 1;
      continue;
    }
    while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
    let value = '';
    if (raw[cursor] === '=') {
      cursor += 1;
      while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
      const quote = raw[cursor];
      if (quote === '"' || quote === "'") {
        cursor += 1;
        const valueStart = cursor;
        while (cursor < raw.length && raw[cursor] !== quote) cursor += 1;
        value = raw.slice(valueStart, cursor);
        if (cursor < raw.length) cursor += 1;
      } else {
        const valueStart = cursor;
        while (cursor < raw.length && !/[\s>]/u.test(raw[cursor] ?? '')) cursor += 1;
        value = raw.slice(valueStart, cursor);
      }
    }
    attributes[name] ??= decodeHTMLAttribute(value).trim();
  }
  return { name: nameMatch[1].toLowerCase(), attributes };
}

function findTagEnd(source: string, from: number): number {
  let quote = '';
  for (let index = from; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '>') return index;
  }
  return -1;
}

function findClosingTag(source: string, name: string, from: number): { start: number; end: number } | null {
  const expression = new RegExp(`<\\/\\s*${name}\\s*>`, 'giu');
  expression.lastIndex = from;
  const match = expression.exec(source);
  return match ? { start: match.index, end: expression.lastIndex } : null;
}

function tokens(value: string | undefined): string[] {
  return [...new Set((value ?? '').trim().toLowerCase().split(/\s+/u).filter(Boolean))];
}

function appendParserIssue(
  result: ExtractedHeadSnapshot,
  code: Extract<HeadAuditIssueCode, `parser-${string}`>,
  position: number | null,
): void {
  if (result.parserIssues.length >= HTML_HEAD_MAX_ISSUES) return;
  result.parserIssues.push(parserIssue(code, position));
}

function parserIssue(code: Extract<HeadAuditIssueCode, `parser-${string}`>, position: number | null): HeadAuditIssue {
  return { code, severity: 'info', detail: '', position };
}

function emptySnapshot(sourceLength: number): ExtractedHeadSnapshot {
  return {
    sourceLength,
    truncated: false,
    tagLimitReached: false,
    scannedTagCount: 0,
    titles: [],
    metas: [],
    links: [],
    charsets: [],
    baseHrefs: [],
    jsonLdCount: 0,
    parserIssues: [],
  };
}
