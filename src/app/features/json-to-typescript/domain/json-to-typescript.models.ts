import {
  parseStrictJson,
  StrictJsonParserError,
  type JsonValue,
} from './strict-json-parser';

export const JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS = 2_000_000;
export const JSON_TO_TYPESCRIPT_MAX_NODES = 100_000;
export const JSON_TO_TYPESCRIPT_MAX_DEPTH = 64;
export const JSON_TO_TYPESCRIPT_MAX_OUTPUT_CHARACTERS = 2_000_000;
export const JSON_TO_TYPESCRIPT_MAX_DECLARATIONS = 5_000;
export const JSON_TO_TYPESCRIPT_MAX_PROPERTIES = 50_000;

const RENDERER_RESERVED_TYPE_NAMES = new Set(['Array', 'Date']);

export type TypeScriptDeclarationKind = 'interface' | 'type';
export type TypeScriptArrayObjectMode = 'merge' | 'union';

export interface JsonToTypeScriptOptions {
  rootName: string;
  declarationKind: TypeScriptDeclarationKind;
  arrayObjectMode: TypeScriptArrayObjectMode;
  inferDates: boolean;
  readonlyProperties: boolean;
}

export type JsonToTypeScriptIssueCode =
  | 'empty-source'
  | 'source-too-large'
  | 'invalid-json'
  | 'duplicate-key'
  | 'unsafe-number'
  | 'invalid-unicode'
  | 'depth-limit'
  | 'node-limit'
  | 'complexity-limit'
  | 'output-too-large';

export type JsonToTypeScriptWarningCode =
  | 'root-name-normalized'
  | 'date-inference'
  | 'empty-array'
  | 'empty-object'
  | 'optional-properties'
  | 'heterogeneous-array';

export interface JsonToTypeScriptIssue {
  code: JsonToTypeScriptIssueCode;
  position: number | null;
  detail: string;
}

export interface JsonToTypeScriptWarning {
  code: JsonToTypeScriptWarningCode;
  count: number;
  detail: string;
}

export interface JsonToTypeScriptStats {
  inputCharacters: number;
  nodes: number;
  declarations: number;
  properties: number;
  optionalProperties: number;
  unions: number;
  inferredDates: number;
  outputCharacters: number;
}

export interface JsonToTypeScriptResult {
  ok: boolean;
  output: string;
  report: string;
  normalizedRootName: string;
  issues: JsonToTypeScriptIssue[];
  warnings: JsonToTypeScriptWarning[];
  stats: JsonToTypeScriptStats;
}

type PrimitiveTypeKind = 'unknown' | 'null' | 'boolean' | 'number' | 'string' | 'date';

interface PrimitiveTypeNode {
  kind: PrimitiveTypeKind;
}

interface ArrayTypeNode {
  kind: 'array';
  element: TypeNode;
}

interface ObjectPropertyNode {
  name: string;
  optional: boolean;
  value: TypeNode;
}

interface ObjectTypeNode {
  kind: 'object';
  properties: ObjectPropertyNode[];
}

interface UnionTypeNode {
  kind: 'union';
  variants: TypeNode[];
}

type TypeNode = PrimitiveTypeNode | ArrayTypeNode | ObjectTypeNode | UnionTypeNode;

interface InferenceCounters {
  emptyArrays: number;
  emptyObjects: number;
  heterogeneousArrays: number;
}

interface RenderContext {
  options: JsonToTypeScriptOptions;
  declarations: ObjectDeclaration[];
  objectNames: Map<ObjectTypeNode, string>;
  usedNames: Set<string>;
  properties: number;
  optionalProperties: number;
}

interface ObjectDeclaration {
  name: string;
  node: ObjectTypeNode;
}

class JsonToTypeScriptError extends Error {
  constructor(
    readonly code: Extract<JsonToTypeScriptIssueCode, 'complexity-limit' | 'output-too-large'>,
    readonly detail = '',
  ) {
    super(code);
    this.name = 'JsonToTypeScriptError';
  }
}

export function generateTypeScriptFromJson(
  rawSource: string,
  options: JsonToTypeScriptOptions,
): JsonToTypeScriptResult {
  const source = rawSource.replace(/^\ufeff/u, '');
  const baseStats = emptyStats(source.length);
  if (!source.trim()) return failure(issue('empty-source'), baseStats);
  if (source.length > JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS) {
    return failure(issue('source-too-large'), baseStats);
  }

  let parsed: { value: JsonValue; nodes: number };
  try {
    parsed = parseStrictJson(source, {
      maxDepth: JSON_TO_TYPESCRIPT_MAX_DEPTH,
      maxNodes: JSON_TO_TYPESCRIPT_MAX_NODES,
    });
  } catch (error) {
    if (error instanceof StrictJsonParserError) {
      return failure(issue(error.code, error.position, error.detail), baseStats);
    }
    throw error;
  }

  const counters: InferenceCounters = {
    emptyArrays: 0,
    emptyObjects: 0,
    heterogeneousArrays: 0,
  };
  const normalizedRootName = normalizeTypeName(options.rootName, 'Root');

  try {
    const root = inferType(parsed.value, options, counters);
    const generated = renderDocument(root, normalizedRootName, options);
    if (generated.output.length > JSON_TO_TYPESCRIPT_MAX_OUTPUT_CHARACTERS) {
      throw new JsonToTypeScriptError('output-too-large');
    }
    const stats: JsonToTypeScriptStats = {
      inputCharacters: source.length,
      nodes: parsed.nodes,
      declarations: generated.declarations,
      properties: generated.properties,
      optionalProperties: generated.optionalProperties,
      unions: countUnions(root),
      inferredDates: countNodeKind(root, 'date'),
      outputCharacters: generated.output.length,
    };
    const warnings = buildWarnings(options.rootName, normalizedRootName, counters, stats);
    const report = JSON.stringify({
      rootName: normalizedRootName,
      options: {
        declarationKind: options.declarationKind,
        arrayObjectMode: options.arrayObjectMode,
        inferDates: options.inferDates,
        readonlyProperties: options.readonlyProperties,
      },
      warnings,
      stats,
    }, null, 2);
    return {
      ok: true,
      output: generated.output,
      report,
      normalizedRootName,
      issues: [],
      warnings,
      stats,
    };
  } catch (error) {
    if (error instanceof JsonToTypeScriptError) {
      return failure(issue(error.code, null, error.detail), {
        ...baseStats,
        nodes: parsed.nodes,
      }, normalizedRootName);
    }
    throw error;
  }
}

function inferType(
  value: JsonValue,
  options: JsonToTypeScriptOptions,
  counters: InferenceCounters,
): TypeNode {
  if (value === null) return { kind: 'null' };
  if (typeof value === 'boolean') return { kind: 'boolean' };
  if (typeof value === 'number') return { kind: 'number' };
  if (typeof value === 'string') {
    if (options.inferDates && isIsoDate(value)) {
      return { kind: 'date' };
    }
    return { kind: 'string' };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      counters.emptyArrays += 1;
      return { kind: 'array', element: { kind: 'unknown' } };
    }
    const members = value.map(item => inferType(item, options, counters));
    const signatures = new Set(members.map(nodeSignature));
    if (signatures.size > 1) counters.heterogeneousArrays += 1;
    const element = options.arrayObjectMode === 'merge'
      ? mergeMany(members, true)
      : makeUnion(members);
    return { kind: 'array', element };
  }

  const entries = Object.entries(value);
  if (entries.length === 0) counters.emptyObjects += 1;
  return {
    kind: 'object',
    properties: entries.map(([name, child]) => ({
      name,
      optional: false,
      value: inferType(child, options, counters),
    })),
  };
}

function mergeMany(nodes: TypeNode[], mergeObjects: boolean): TypeNode {
  const first = nodes[0];
  return nodes.slice(1).reduce<TypeNode>(
    (merged, node) => mergeTypes(merged, node, mergeObjects),
    first,
  );
}

function mergeTypes(left: TypeNode, right: TypeNode, mergeObjects: boolean): TypeNode {
  if (nodeSignature(left) === nodeSignature(right)) return left;

  let variants: TypeNode[] = [left, right]
    .flatMap(node => node.kind === 'union' ? node.variants : [node]);
  if (variants.some(node => node.kind === 'unknown') && variants.length > 1) {
    variants = variants.filter(node => node.kind !== 'unknown');
  }
  if (variants.some(node => node.kind === 'date') && variants.some(node => node.kind === 'string')) {
    variants = variants.filter(node => node.kind !== 'date');
  }

  const arrayVariants = variants.filter((node): node is ArrayTypeNode => node.kind === 'array');
  if (arrayVariants.length > 1) {
    const mergedElement = arrayVariants
      .slice(1)
      .reduce((element, node) => mergeTypes(element, node.element, mergeObjects), arrayVariants[0].element);
    variants = [
      { kind: 'array', element: mergedElement },
      ...variants.filter(node => node.kind !== 'array'),
    ];
  }

  if (mergeObjects) {
    const objectVariants = variants.filter((node): node is ObjectTypeNode => node.kind === 'object');
    if (objectVariants.length > 1) {
      const mergedObject = objectVariants.slice(1).reduce(mergeObjectTypes, objectVariants[0]);
      variants = [
        mergedObject,
        ...variants.filter(node => node.kind !== 'object'),
      ];
    }
  }
  return makeUnion(variants);
}

function mergeObjectTypes(left: ObjectTypeNode, right: ObjectTypeNode): ObjectTypeNode {
  const rightByName = new Map(right.properties.map(property => [property.name, property]));
  const leftNames = new Set(left.properties.map(property => property.name));
  const properties = left.properties.map(property => {
    const other = rightByName.get(property.name);
    if (!other) return { ...property, optional: true };
    return {
      name: property.name,
      optional: property.optional || other.optional,
      value: mergeTypes(property.value, other.value, true),
    };
  });
  for (const property of right.properties) {
    if (!leftNames.has(property.name)) properties.push({ ...property, optional: true });
  }
  return { kind: 'object', properties };
}

function makeUnion(nodes: TypeNode[]): TypeNode {
  const flattened = nodes.flatMap(node => node.kind === 'union' ? node.variants : [node]);
  const unique = new Map<string, TypeNode>();
  for (const node of flattened) unique.set(nodeSignature(node), node);
  const variants = [...unique.values()].sort(compareUnionNodes);
  return variants.length === 1 ? variants[0] : { kind: 'union', variants };
}

function compareUnionNodes(left: TypeNode, right: TypeNode): number {
  const order: Record<TypeNode['kind'], number> = {
    object: 0,
    array: 1,
    date: 2,
    string: 3,
    number: 4,
    boolean: 5,
    unknown: 6,
    null: 7,
    union: 8,
  };
  return order[left.kind] - order[right.kind] || nodeSignature(left).localeCompare(nodeSignature(right));
}

function renderDocument(
  root: TypeNode,
  rootName: string,
  options: JsonToTypeScriptOptions,
): { output: string; declarations: number; properties: number; optionalProperties: number } {
  const context: RenderContext = {
    options,
    declarations: [],
    objectNames: new Map(),
    usedNames: new Set(),
    properties: 0,
    optionalProperties: 0,
  };

  let rootAlias = '';
  if (root.kind === 'object') {
    registerObject(root, rootName, context, true);
  } else {
    context.usedNames.add(rootName);
    const rootType = renderType(root, singularize(rootName), context);
    rootAlias = `export type ${rootName} = ${rootType};`;
  }

  const renderedDeclarations: string[] = [];
  for (let index = 0; index < context.declarations.length; index += 1) {
    const declaration = context.declarations[index];
    renderedDeclarations.push(renderObjectDeclaration(declaration, context));
  }
  const sections = rootAlias
    ? [rootAlias, ...renderedDeclarations]
    : renderedDeclarations;
  return {
    output: `${sections.join('\n\n')}\n`,
    declarations: context.declarations.length + (rootAlias ? 1 : 0),
    properties: context.properties,
    optionalProperties: context.optionalProperties,
  };
}

function renderObjectDeclaration(declaration: ObjectDeclaration, context: RenderContext): string {
  const propertyLines = declaration.node.properties.map(property => {
    context.properties += 1;
    if (context.properties > JSON_TO_TYPESCRIPT_MAX_PROPERTIES) {
      throw new JsonToTypeScriptError('complexity-limit', 'properties');
    }
    if (property.optional) context.optionalProperties += 1;
    const readonlyPrefix = context.options.readonlyProperties ? 'readonly ' : '';
    const optional = property.optional ? '?' : '';
    const propertyName = renderPropertyName(property.name);
    const propertyType = renderType(property.value, property.name, context);
    return `  ${readonlyPrefix}${propertyName}${optional}: ${propertyType};`;
  });
  if (context.options.declarationKind === 'interface') {
    return [
      `export interface ${declaration.name} {`,
      ...propertyLines,
      '}',
    ].join('\n');
  }
  return [
    `export type ${declaration.name} = {`,
    ...propertyLines,
    '};',
  ].join('\n');
}

function renderType(node: TypeNode, hint: string, context: RenderContext): string {
  switch (node.kind) {
    case 'unknown': return 'unknown';
    case 'null': return 'null';
    case 'boolean': return 'boolean';
    case 'number': return 'number';
    case 'string': return 'string';
    case 'date': return 'Date';
    case 'object': return registerObject(node, normalizeTypeName(hint, 'Value'), context);
    case 'array': return `Array<${renderType(node.element, singularize(hint), context)}>`;
    case 'union': return node.variants
      .map((variant, index) => renderType(variant, `${hint}${String(index + 1)}`, context))
      .join(' | ');
  }
}

function registerObject(
  node: ObjectTypeNode,
  preferredName: string,
  context: RenderContext,
  forceName = false,
): string {
  const existing = context.objectNames.get(node);
  if (existing) return existing;
  let name = normalizeTypeName(preferredName, 'Value');
  if (!forceName || context.usedNames.has(name)) {
    const base = name;
    let suffix = 2;
    while (context.usedNames.has(name)) {
      name = `${base}${String(suffix)}`;
      suffix += 1;
    }
  }
  context.usedNames.add(name);
  context.objectNames.set(node, name);
  context.declarations.push({ name, node });
  if (context.declarations.length > JSON_TO_TYPESCRIPT_MAX_DECLARATIONS) {
    throw new JsonToTypeScriptError('complexity-limit', 'declarations');
  }
  return name;
}

function renderPropertyName(name: string): string {
  return /^[$A-Z_a-z][$\w]*$/u.test(name) ? name : JSON.stringify(name);
}

export function normalizeTypeName(value: string, fallback = 'Root'): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^A-Za-z0-9_$]+/gu, ' ')
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
    .slice(0, 80);
  const safe = normalized || fallback;
  const identifier = /^[A-Za-z_$]/u.test(safe) ? safe : `Type${safe}`;
  return RENDERER_RESERVED_TYPE_NAMES.has(identifier) ? `${identifier}Type` : identifier;
}

function singularize(value: string): string {
  const normalized = normalizeTypeName(value, 'Item');
  if (/ies$/u.test(normalized) && normalized.length > 3) return `${normalized.slice(0, -3)}y`;
  if (/sses$/u.test(normalized) && normalized.length > 4) return normalized.slice(0, -2);
  if (/s$/u.test(normalized) && !/(?:ss|us|is)$/u.test(normalized) && normalized.length > 3) {
    return normalized.slice(0, -1);
  }
  return normalized === 'Root' ? 'Item' : normalized;
}

function nodeSignature(node: TypeNode): string {
  switch (node.kind) {
    case 'unknown':
    case 'null':
    case 'boolean':
    case 'number':
    case 'string':
    case 'date':
      return node.kind;
    case 'array':
      return `array<${nodeSignature(node.element)}>`;
    case 'union':
      return `union<${node.variants.map(nodeSignature).sort().join('|')}>`;
    case 'object':
      return `object<{${node.properties
        .map(property => `${JSON.stringify(property.name)}${property.optional ? '?' : ''}:${nodeSignature(property.value)}`)
        .sort()
        .join(',')}}>`;
  }
}

function countUnions(root: TypeNode): number {
  const seen = new Set<TypeNode>();
  const visit = (node: TypeNode): number => {
    if (seen.has(node)) return 0;
    seen.add(node);
    if (node.kind === 'union') return 1 + node.variants.reduce((sum, child) => sum + visit(child), 0);
    if (node.kind === 'array') return visit(node.element);
    if (node.kind === 'object') {
      return node.properties.reduce((sum, property) => sum + visit(property.value), 0);
    }
    return 0;
  };
  return visit(root);
}

function countNodeKind(root: TypeNode, kind: TypeNode['kind']): number {
  const seen = new Set<TypeNode>();
  const visit = (node: TypeNode): number => {
    if (seen.has(node)) return 0;
    seen.add(node);
    const own = node.kind === kind ? 1 : 0;
    if (node.kind === 'union') return own + node.variants.reduce((sum, child) => sum + visit(child), 0);
    if (node.kind === 'array') return own + visit(node.element);
    if (node.kind === 'object') {
      return own + node.properties.reduce((sum, property) => sum + visit(property.value), 0);
    }
    return own;
  };
  return visit(root);
}

function isIsoDate(value: string): boolean {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (dateOnly) {
    return isValidCalendarDate(Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3]));
  }

  const dateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-](\d{2}):(\d{2}))$/u.exec(value);
  if (!dateTime) {
    return false;
  }
  const [, year, month, day, hour, minute, second = '0', offsetHour = '0', offsetMinute = '0'] = dateTime;
  if (!isValidCalendarDate(Number(year), Number(month), Number(day))
    || Number(hour) > 23
    || Number(minute) > 59
    || Number(second) > 59
    || Number(offsetHour) > 23
    || Number(offsetMinute) > 59) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function buildWarnings(
  requestedRootName: string,
  normalizedRootName: string,
  counters: InferenceCounters,
  stats: JsonToTypeScriptStats,
): JsonToTypeScriptWarning[] {
  const warnings: JsonToTypeScriptWarning[] = [];
  if (requestedRootName.trim() !== normalizedRootName) {
    warnings.push({ code: 'root-name-normalized', count: 1, detail: normalizedRootName });
  }
  if (stats.inferredDates > 0) {
    warnings.push({ code: 'date-inference', count: stats.inferredDates, detail: '' });
  }
  if (counters.emptyArrays > 0) {
    warnings.push({ code: 'empty-array', count: counters.emptyArrays, detail: '' });
  }
  if (counters.emptyObjects > 0) {
    warnings.push({ code: 'empty-object', count: counters.emptyObjects, detail: '' });
  }
  if (stats.optionalProperties > 0) {
    warnings.push({ code: 'optional-properties', count: stats.optionalProperties, detail: '' });
  }
  if (counters.heterogeneousArrays > 0) {
    warnings.push({ code: 'heterogeneous-array', count: counters.heterogeneousArrays, detail: '' });
  }
  return warnings;
}

function issue(
  code: JsonToTypeScriptIssueCode,
  position: number | null = null,
  detail = '',
): JsonToTypeScriptIssue {
  return { code, position, detail };
}

function emptyStats(inputCharacters: number): JsonToTypeScriptStats {
  return {
    inputCharacters,
    nodes: 0,
    declarations: 0,
    properties: 0,
    optionalProperties: 0,
    unions: 0,
    inferredDates: 0,
    outputCharacters: 0,
  };
}

function failure(
  problem: JsonToTypeScriptIssue,
  stats: JsonToTypeScriptStats,
  normalizedRootName = '',
): JsonToTypeScriptResult {
  return {
    ok: false,
    output: '',
    report: JSON.stringify({ issues: [problem], stats }, null, 2),
    normalizedRootName,
    issues: [problem],
    warnings: [],
    stats,
  };
}

export type { JsonObject, JsonValue } from './strict-json-parser';
