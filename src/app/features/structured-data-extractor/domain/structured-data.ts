export const STRUCTURED_DATA_MAX_SOURCE_CHARACTERS = 1_000_000;
export const STRUCTURED_DATA_MAX_NODES = 500;
export const STRUCTURED_DATA_MAX_PROPERTIES = 5_000;
export const STRUCTURED_DATA_MAX_DEPTH = 32;
export const STRUCTURED_DATA_MAX_ISSUES = 200;

export type StructuredDataFormat = 'json-ld' | 'microdata' | 'rdfa';
export type StructuredDataIssueSeverity = 'error' | 'warning' | 'info';
export type StructuredDataIssueCode =
  | 'source-too-large'
  | 'empty-source'
  | 'invalid-json'
  | 'invalid-json-root'
  | 'missing-jsonld-context'
  | 'non-schema-context'
  | 'missing-type'
  | 'depth-limit'
  | 'node-limit'
  | 'property-limit'
  | 'parser-warning'
  | 'no-structured-data'
  | 'issues-truncated';

export interface StructuredDataIssue {
  code: StructuredDataIssueCode;
  severity: StructuredDataIssueSeverity;
  detail: string;
  sourceIndex: number | null;
  nodeId: string | null;
}

export interface StructuredDataProperty {
  name: string;
  value: string;
  targetId: string | null;
}

export interface StructuredDataNode {
  id: string;
  format: StructuredDataFormat;
  types: string[];
  properties: StructuredDataProperty[];
  sourceIndex: number;
}

export interface JsonLdSourceBlock {
  content: string;
  sourceIndex: number;
}

export interface StructuredMarkupExtraction {
  sourceLength: number;
  truncated: boolean;
  jsonLdBlocks: JsonLdSourceBlock[];
  markupNodes: StructuredDataNode[];
  issues: StructuredDataIssue[];
}

export interface StructuredDataFormatCounts {
  jsonLd: number;
  microdata: number;
  rdfa: number;
}

export interface StructuredDataTypeCount {
  type: string;
  count: number;
}

export interface StructuredDataAnalysis {
  sourceLength: number;
  nodes: StructuredDataNode[];
  issues: StructuredDataIssue[];
  formatCounts: StructuredDataFormatCounts;
  typeCounts: StructuredDataTypeCount[];
  propertyCount: number;
  edgeCount: number;
}

interface AnalysisState {
  nodes: StructuredDataNode[];
  issues: StructuredDataIssue[];
  nodeSequence: number;
  propertyCount: number;
  nodeLimitReported: boolean;
  propertyLimitReported: boolean;
}

export function analyzeStructuredData(extraction: StructuredMarkupExtraction): StructuredDataAnalysis {
  const state: AnalysisState = {
    nodes: [],
    issues: [],
    nodeSequence: 0,
    propertyCount: 0,
    nodeLimitReported: false,
    propertyLimitReported: false,
  };

  if (extraction.truncated) {
    addIssue(state, issue('source-too-large', 'error', '', null, null));
  }
  if (extraction.sourceLength === 0) {
    addIssue(state, issue('empty-source', 'error', '', null, null));
  }

  for (const parserIssue of extraction.issues) addIssue(state, parserIssue);
  for (const node of extraction.markupNodes) addMarkupNode(state, node);
  for (const block of extraction.jsonLdBlocks) analyzeJsonLdBlock(block, state);

  state.nodes = mergeNodes(state.nodes);
  if (extraction.sourceLength > 0 && state.nodes.length === 0 && !state.issues.some(item => item.severity === 'error')) {
    addIssue(state, issue('no-structured-data', 'warning', '', null, null));
  }

  if (state.issues.length >= STRUCTURED_DATA_MAX_ISSUES && !state.issues.some(item => item.code === 'issues-truncated')) {
    state.issues[STRUCTURED_DATA_MAX_ISSUES - 1] = issue('issues-truncated', 'warning', '', null, null);
  }

  const formatCounts: StructuredDataFormatCounts = { jsonLd: 0, microdata: 0, rdfa: 0 };
  const types = new Map<string, number>();
  let propertyCount = 0;
  let edgeCount = 0;
  for (const node of state.nodes) {
    if (node.format === 'json-ld') formatCounts.jsonLd += 1;
    if (node.format === 'microdata') formatCounts.microdata += 1;
    if (node.format === 'rdfa') formatCounts.rdfa += 1;
    propertyCount += node.properties.length;
    edgeCount += node.properties.filter(property => property.targetId !== null).length;
    for (const type of node.types) types.set(type, (types.get(type) ?? 0) + 1);
  }

  return {
    sourceLength: extraction.sourceLength,
    nodes: state.nodes,
    issues: state.issues,
    formatCounts,
    typeCounts: [...types.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type)),
    propertyCount,
    edgeCount,
  };
}

export function serializeStructuredDataAnalysis(analysis: StructuredDataAnalysis): string {
  return JSON.stringify({
    summary: {
      nodes: analysis.nodes.length,
      properties: analysis.propertyCount,
      edges: analysis.edgeCount,
      formats: analysis.formatCounts,
      types: analysis.typeCounts,
      errors: analysis.issues.filter(item => item.severity === 'error').length,
      warnings: analysis.issues.filter(item => item.severity === 'warning').length,
    },
    nodes: analysis.nodes,
    issues: analysis.issues,
  }, null, 2);
}

function analyzeJsonLdBlock(block: JsonLdSourceBlock, state: AnalysisState): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(block.content);
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 240) : '';
    addIssue(state, issue('invalid-json', 'error', detail, block.sourceIndex, null));
    return;
  }

  if (!isRecord(parsed) && !Array.isArray(parsed)) {
    addIssue(state, issue('invalid-json-root', 'error', '', block.sourceIndex, null));
    return;
  }

  const roots = Array.isArray(parsed) ? parsed : [parsed];
  for (const root of roots) {
    if (!isRecord(root)) {
      addIssue(state, issue('invalid-json-root', 'error', '', block.sourceIndex, null));
      continue;
    }
    const context = root['@context'];
    if (context === undefined) {
      addIssue(state, issue('missing-jsonld-context', 'warning', '', block.sourceIndex, null));
    } else if (!containsSchemaContext(context)) {
      addIssue(state, issue('non-schema-context', 'info', contextPreview(context), block.sourceIndex, null));
    }

    const graph = root['@graph'];
    if (Array.isArray(graph)) {
      for (const graphNode of graph) {
        if (isRecord(graphNode)) visitJsonLdNode(graphNode, block.sourceIndex, state, 0, context);
        else addIssue(state, issue('invalid-json-root', 'error', '', block.sourceIndex, null));
      }
      const otherKeys = Object.keys(root).filter(key => key !== '@context' && key !== '@graph');
      if (otherKeys.length > 0) visitJsonLdNode(root, block.sourceIndex, state, 0, context, new Set(['@graph']));
    } else {
      visitJsonLdNode(root, block.sourceIndex, state, 0, context);
    }
  }
}

function visitJsonLdNode(
  value: Record<string, unknown>,
  sourceIndex: number,
  state: AnalysisState,
  depth: number,
  inheritedContext: unknown,
  ignoredKeys = new Set<string>(),
): string | null {
  if (depth > STRUCTURED_DATA_MAX_DEPTH) {
    addIssue(state, issue('depth-limit', 'error', '', sourceIndex, null));
    return null;
  }
  if (state.nodes.length >= STRUCTURED_DATA_MAX_NODES) {
    reportNodeLimit(state, sourceIndex);
    return null;
  }

  const explicitId = typeof value['@id'] === 'string' ? cleanValue(value['@id']) : '';
  const nodeId = explicitId || `jsonld-${String(sourceIndex)}-${String(++state.nodeSequence)}`;
  const types = normalizeTypes(value['@type']);
  const node: StructuredDataNode = { id: nodeId, format: 'json-ld', types, properties: [], sourceIndex };
  state.nodes.push(node);

  if (types.length === 0) addIssue(state, issue('missing-type', 'warning', '', sourceIndex, nodeId));
  const activeContext = value['@context'] ?? inheritedContext;

  for (const [name, propertyValue] of Object.entries(value)) {
    if (ignoredKeys.has(name) || name === '@context' || name === '@id' || name === '@type') continue;
    if (name.startsWith('@') && name !== '@reverse') continue;
    appendJsonLdProperty(node, name, propertyValue, sourceIndex, state, depth + 1, activeContext);
  }
  return nodeId;
}

function appendJsonLdProperty(
  node: StructuredDataNode,
  name: string,
  value: unknown,
  sourceIndex: number,
  state: AnalysisState,
  depth: number,
  context: unknown,
): void {
  if (Array.isArray(value)) {
    for (const item of value) appendJsonLdProperty(node, name, item, sourceIndex, state, depth, context);
    return;
  }
  if (isRecord(value)) {
    if ('@value' in value) {
      const suffix = typeof value['@language'] === 'string'
        ? ` @${value['@language']}`
        : typeof value['@type'] === 'string' ? ` ^^${value['@type']}` : '';
      addProperty(node, name, `${cleanValue(value['@value'])}${suffix}`, null, state, sourceIndex);
      return;
    }
    if (Array.isArray(value['@list'])) {
      for (const item of value['@list']) appendJsonLdProperty(node, name, item, sourceIndex, state, depth, context);
      return;
    }
    const keys = Object.keys(value).filter(key => key !== '@context' && key !== '@id');
    if (typeof value['@id'] === 'string' && keys.length === 0) {
      const targetId = cleanValue(value['@id']);
      addProperty(node, name, targetId, targetId || null, state, sourceIndex);
      return;
    }
    const targetId = visitJsonLdNode(value, sourceIndex, state, depth, context);
    if (targetId) addProperty(node, name, targetId, targetId, state, sourceIndex);
    return;
  }
  addProperty(node, name, cleanValue(value), null, state, sourceIndex);
}

function addMarkupNode(state: AnalysisState, node: StructuredDataNode): void {
  if (state.nodes.length >= STRUCTURED_DATA_MAX_NODES) {
    reportNodeLimit(state, node.sourceIndex);
    return;
  }
  const safeNode: StructuredDataNode = {
    ...node,
    id: cleanValue(node.id) || `${node.format}-${String(node.sourceIndex)}-${String(++state.nodeSequence)}`,
    types: [...new Set(node.types.map(cleanValue).filter(Boolean))],
    properties: [],
  };
  state.nodes.push(safeNode);
  if (safeNode.types.length === 0) addIssue(state, issue('missing-type', 'warning', '', safeNode.sourceIndex, safeNode.id));
  for (const property of node.properties) {
    addProperty(safeNode, cleanValue(property.name), cleanValue(property.value), property.targetId ? cleanValue(property.targetId) : null, state, node.sourceIndex);
  }
}

function addProperty(
  node: StructuredDataNode,
  name: string,
  value: string,
  targetId: string | null,
  state: AnalysisState,
  sourceIndex: number,
): void {
  if (state.propertyCount >= STRUCTURED_DATA_MAX_PROPERTIES) {
    if (!state.propertyLimitReported) {
      state.propertyLimitReported = true;
      addIssue(state, issue('property-limit', 'error', '', sourceIndex, node.id));
    }
    return;
  }
  state.propertyCount += 1;
  node.properties.push({ name: name || '(unnamed)', value: value.slice(0, 2_000), targetId });
}

function mergeNodes(nodes: StructuredDataNode[]): StructuredDataNode[] {
  const merged = new Map<string, StructuredDataNode>();
  for (const node of nodes) {
    const key = `${node.format}:${node.id}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...node, types: [...node.types], properties: [...node.properties] });
      continue;
    }
    existing.types = [...new Set([...existing.types, ...node.types])];
    const properties = [...existing.properties, ...node.properties];
    existing.properties = properties.filter((property, index) =>
      properties.findIndex(candidate => candidate.name === property.name && candidate.value === property.value && candidate.targetId === property.targetId) === index,
    );
  }
  return [...merged.values()];
}

function normalizeTypes(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return [...new Set(values.filter(item => typeof item === 'string').map(item => cleanValue(item)).filter(Boolean))];
}

function containsSchemaContext(context: unknown): boolean {
  try {
    return JSON.stringify(context).toLowerCase().includes('schema.org');
  } catch {
    return false;
  }
}

function contextPreview(context: unknown): string {
  try {
    return JSON.stringify(context).slice(0, 240);
  } catch {
    return '';
  }
}

function reportNodeLimit(state: AnalysisState, sourceIndex: number): void {
  if (state.nodeLimitReported) return;
  state.nodeLimitReported = true;
  addIssue(state, issue('node-limit', 'error', '', sourceIndex, null));
}

function addIssue(state: AnalysisState, value: StructuredDataIssue): void {
  if (state.issues.length < STRUCTURED_DATA_MAX_ISSUES) state.issues.push(value);
}

function issue(
  code: StructuredDataIssueCode,
  severity: StructuredDataIssueSeverity,
  detail: string,
  sourceIndex: number | null,
  nodeId: string | null,
): StructuredDataIssue {
  return { code, severity, detail, sourceIndex, nodeId };
}

function cleanValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value).slice(0, 2_000);
  } catch {
    return '[unserializable]';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
