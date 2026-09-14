import type { StructuredDataMarkupParserPort } from '../application/structured-data.use-cases';
import type {
  JsonLdSourceBlock,
  StructuredDataIssue,
  StructuredDataNode,
  StructuredDataProperty,
  StructuredMarkupExtraction,
} from '../domain/structured-data';

export class BrowserStructuredDataParserAdapter implements StructuredDataMarkupParserPort {
  extract(source: string, baseUrl: string): StructuredMarkupExtraction {
    if (!source) return emptyExtraction();
    if (looksLikeJson(source)) {
      return {
        ...emptyExtraction(),
        sourceLength: source.length,
        jsonLdBlocks: [{ content: source, sourceIndex: 1 }],
      };
    }
    if (typeof DOMParser === 'undefined') {
      return {
        ...emptyExtraction(),
        sourceLength: source.length,
        issues: [{
          code: 'parser-warning',
          severity: 'info',
          detail: 'L’extraction HTML nécessite un navigateur et démarrera après l’hydratation de la page.',
          sourceIndex: null,
          nodeId: null,
        }],
      };
    }

    const document = new DOMParser().parseFromString(source, 'text/html');
    const elements = [...document.querySelectorAll('*')];
    const positions = new Map<Element, number>(elements.map((element, index) => [element, index + 1]));
    const resolvedBase = validBaseUrl(baseUrl) ?? validBaseUrl(document.querySelector('base[href]')?.getAttribute('href') ?? '');
    const jsonLdBlocks = extractJsonLdBlocks(document, positions);
    const microdata = extractMicrodata(document, positions, resolvedBase);
    const rdfa = extractRdfa(document, positions, resolvedBase);
    const issues: StructuredDataIssue[] = [];

    const itemReference = document.querySelector('[itemscope][itemref]');
    if (itemReference) {
      issues.push({
        code: 'parser-warning',
        severity: 'info',
        detail: 'Microdata itemref est détecté mais les propriétés externes référencées ne sont pas développées.',
        sourceIndex: positions.get(itemReference) ?? null,
        nodeId: null,
      });
    }

    return {
      sourceLength: source.length,
      truncated: false,
      jsonLdBlocks,
      markupNodes: [...microdata, ...rdfa],
      issues,
    };
  }
}

function extractJsonLdBlocks(document: Document, positions: Map<Element, number>): JsonLdSourceBlock[] {
  return [...document.querySelectorAll('script[type]')]
    .filter(script => script.getAttribute('type')?.trim().toLowerCase() === 'application/ld+json')
    .map(script => ({
      content: script.textContent.trim(),
      sourceIndex: positions.get(script) ?? 1,
    }));
}

function extractMicrodata(document: Document, positions: Map<Element, number>, baseUrl: string | null): StructuredDataNode[] {
  const items = [...document.querySelectorAll('[itemscope]')];
  const ids = new Map<Element, string>();
  items.forEach((element, index) => {
    ids.set(element, element.getAttribute('itemid')?.trim() || `microdata-${String(index + 1)}`);
  });

  return items.map(element => {
    const properties: StructuredDataProperty[] = [];
    for (const candidate of element.querySelectorAll('[itemprop]')) {
      const owner = nearestScopeOwner(candidate);
      if (owner !== element) continue;
      const names = tokens(candidate.getAttribute('itemprop'));
      const nestedId = candidate.hasAttribute('itemscope') ? ids.get(candidate) ?? null : null;
      const value = nestedId ?? readElementValue(candidate, baseUrl);
      for (const name of names) properties.push({ name, value, targetId: nestedId });
    }
    return {
      id: ids.get(element) ?? `microdata-${String(positions.get(element) ?? 1)}`,
      format: 'microdata' as const,
      types: tokens(element.getAttribute('itemtype')),
      properties,
      sourceIndex: positions.get(element) ?? 1,
    };
  });
}

function extractRdfa(document: Document, positions: Map<Element, number>, baseUrl: string | null): StructuredDataNode[] {
  const resources = [...document.querySelectorAll('[typeof]')];
  const ids = new Map<Element, string>();
  resources.forEach((element, index) => {
    ids.set(
      element,
      element.getAttribute('about')?.trim()
        || element.getAttribute('resource')?.trim()
        || element.id
        || `rdfa-${String(index + 1)}`,
    );
  });

  const nodes = resources.map(element => {
    const properties: StructuredDataProperty[] = [];
    for (const candidate of element.querySelectorAll('[property], [rel], [rev]')) {
      const owner = nearestRdfaOwner(candidate);
      if (owner !== element) continue;
      appendRdfaProperties(properties, candidate, ids, baseUrl);
    }
    return {
      id: ids.get(element) ?? `rdfa-${String(positions.get(element) ?? 1)}`,
      format: 'rdfa' as const,
      types: tokens(element.getAttribute('typeof')),
      properties,
      sourceIndex: positions.get(element) ?? 1,
    };
  });

  return nodes;
}

function appendRdfaProperties(
  properties: StructuredDataProperty[],
  element: Element,
  ids: Map<Element, string>,
  baseUrl: string | null,
): void {
  const nestedId = element.hasAttribute('typeof') ? ids.get(element) ?? null : null;
  const value = nestedId ?? readElementValue(element, baseUrl);
  for (const name of tokens(element.getAttribute('property'))) properties.push({ name, value, targetId: nestedId });
  for (const name of tokens(element.getAttribute('rel'))) properties.push({ name, value, targetId: nestedId });
  for (const name of tokens(element.getAttribute('rev'))) properties.push({ name: `reverse:${name}`, value, targetId: nestedId });
}

function nearestScopeOwner(element: Element): Element | null {
  if (element.hasAttribute('itemscope')) return element.parentElement?.closest('[itemscope]') ?? null;
  return element.closest('[itemscope]');
}

function nearestRdfaOwner(element: Element): Element | null {
  if (element.hasAttribute('typeof')) return element.parentElement?.closest('[typeof]') ?? null;
  return element.closest('[typeof]');
}

function readElementValue(element: Element, baseUrl: string | null): string {
  const tag = element.tagName.toLowerCase();
  if (tag === 'meta') return element.getAttribute('content')?.trim() ?? '';
  if (tag === 'time') return element.getAttribute('datetime')?.trim() || element.textContent.trim();
  if (tag === 'data' || tag === 'meter') return element.getAttribute('value')?.trim() ?? '';
  if (tag === 'object') return resolveUrl(element.getAttribute('data') ?? '', baseUrl);
  if (['a', 'area', 'link'].includes(tag)) return resolveUrl(element.getAttribute('href') ?? '', baseUrl);
  if (['audio', 'embed', 'iframe', 'img', 'source', 'track', 'video'].includes(tag)) {
    return resolveUrl(element.getAttribute('src') ?? '', baseUrl);
  }
  return element.getAttribute('content')?.trim()
    || element.getAttribute('resource')?.trim()
    || element.getAttribute('about')?.trim()
    || element.textContent.trim()
    || '';
}

function resolveUrl(value: string, baseUrl: string | null): string {
  const trimmed = value.trim();
  if (!trimmed || !baseUrl) return trimmed;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

function validBaseUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function looksLikeJson(source: string): boolean {
  return source.startsWith('{') || source.startsWith('[');
}

function tokens(value: string | null): string[] {
  return [...new Set((value ?? '').trim().split(/\s+/u).filter(Boolean))];
}

function emptyExtraction(): StructuredMarkupExtraction {
  return {
    sourceLength: 0,
    truncated: false,
    jsonLdBlocks: [],
    markupNodes: [],
    issues: [],
  };
}
