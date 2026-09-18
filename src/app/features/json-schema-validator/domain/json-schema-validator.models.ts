import {
  parseStrictJson,
  StrictJsonParserError,
  type JsonObject,
  type JsonValue,
  type ParsedStrictJson,
} from './strict-json-parser';

export type { JsonObject, JsonPrimitive, JsonValue } from './strict-json-parser';

export const JSON_SCHEMA_MAX_SCHEMA_CHARACTERS = 500_000;
export const JSON_SCHEMA_MAX_INSTANCE_CHARACTERS = 2_000_000;
export const JSON_SCHEMA_MAX_NODES = 100_000;
export const JSON_SCHEMA_MAX_DEPTH = 64;
export const JSON_SCHEMA_MAX_ERRORS = 500;
export const JSON_SCHEMA_MAX_PATTERN_CHARACTERS = 500;
export const JSON_SCHEMA_MAX_PATTERNS = 200;
export const JSON_SCHEMA_MAX_OUTPUT_CHARACTERS = 4_000_000;
export const JSON_SCHEMA_MAX_VALIDATION_OPERATIONS = 50_000;

export type JsonSchemaDraftMode = 'auto' | JsonSchemaDraft;
export type JsonSchemaDraft = 'draft-07' | 'draft-2019-09' | 'draft-2020-12';
export type JsonSchemaDocumentSide = 'schema' | 'instance' | 'engine';

export type JsonSchemaIssueCode =
  | 'empty-source'
  | 'source-too-large'
  | 'invalid-json'
  | 'duplicate-key'
  | 'unsafe-number'
  | 'invalid-unicode'
  | 'depth-limit'
  | 'node-limit'
  | 'schema-root-invalid'
  | 'unsupported-draft'
  | 'external-reference'
  | 'pattern-limit'
  | 'schema-invalid'
  | 'validation-limit'
  | 'validation-failed'
  | 'output-too-large';

export interface JsonSchemaValidationOptions {
  draft: JsonSchemaDraftMode;
  validateFormats: boolean;
}

export interface JsonSchemaIssue {
  code: JsonSchemaIssueCode;
  side: JsonSchemaDocumentSide;
  path: string;
  detail: string;
  position: number | null;
}

export interface JsonSchemaValidationError {
  keyword: string;
  instancePath: string;
  schemaPath: string;
  property: string;
  expected: string;
  limit: number | null;
}

export interface JsonSchemaCorrection {
  action: 'add' | 'remove' | 'replace' | 'truncate' | 'extend';
  path: string;
  keyword: string;
}

export interface JsonSchemaCorrectionCandidate {
  source: string;
  corrections: JsonSchemaCorrection[];
  valid: boolean;
  remainingErrors: number;
}

export interface JsonSchemaValidationResult {
  ok: boolean;
  valid: boolean;
  draft: JsonSchemaDraft | null;
  issues: JsonSchemaIssue[];
  errors: JsonSchemaValidationError[];
  errorsTruncated: boolean;
  totalErrors: number;
  correction: JsonSchemaCorrectionCandidate | null;
  report: string;
  stats: {
    schemaCharacters: number;
    instanceCharacters: number;
    schemaNodes: number;
    instanceNodes: number;
    patterns: number;
  };
}

export interface PreparedJsonSchemaValidation {
  schema: JsonObject | boolean;
  instance: JsonValue;
  draft: JsonSchemaDraft;
  stats: JsonSchemaValidationResult['stats'];
}

export type JsonSchemaPreparationResult =
  | { ok: true; prepared: PreparedJsonSchemaValidation }
  | { ok: false; result: JsonSchemaValidationResult };

class SchemaSafetyError extends Error {
  constructor(
    readonly code: Extract<JsonSchemaIssueCode, 'external-reference' | 'pattern-limit'>,
    readonly path: string,
    readonly detail = '',
  ) {
    super(code);
    this.name = 'SchemaSafetyError';
  }
}

export function prepareJsonSchemaValidation(
  rawSchema: string,
  rawInstance: string,
  options: JsonSchemaValidationOptions,
): JsonSchemaPreparationResult {
  const schemaSource = rawSchema.replace(/^\ufeff/u, '');
  const instanceSource = rawInstance.replace(/^\ufeff/u, '');
  const stats: JsonSchemaValidationResult['stats'] = {
    schemaCharacters: schemaSource.length,
    instanceCharacters: instanceSource.length,
    schemaNodes: 0,
    instanceNodes: 0,
    patterns: 0,
  };

  if (!schemaSource.trim()) return failure(issue('empty-source', 'schema'), stats);
  if (!instanceSource.trim()) return failure(issue('empty-source', 'instance'), stats);
  if (schemaSource.length > JSON_SCHEMA_MAX_SCHEMA_CHARACTERS) {
    return failure(issue('source-too-large', 'schema'), stats);
  }
  if (instanceSource.length > JSON_SCHEMA_MAX_INSTANCE_CHARACTERS) {
    return failure(issue('source-too-large', 'instance'), stats);
  }

  const parsedSchema = parseDocument(schemaSource, 'schema');
  if ('issue' in parsedSchema) return failure(parsedSchema.issue, stats);
  stats.schemaNodes = parsedSchema.parsed.nodes;
  const parsedInstance = parseDocument(instanceSource, 'instance');
  if ('issue' in parsedInstance) return failure(parsedInstance.issue, stats);
  stats.instanceNodes = parsedInstance.parsed.nodes;

  if (typeof parsedSchema.parsed.value !== 'boolean' && !isObject(parsedSchema.parsed.value)) {
    return failure(issue('schema-root-invalid', 'schema'), stats);
  }

  const schema = parsedSchema.parsed.value;
  const draft = resolveDraft(schema, options.draft);
  if (draft === null) {
    const declared = isObject(schema) && typeof schema['$schema'] === 'string'
      ? schema['$schema'].slice(0, 240)
      : '';
    return failure(issue('unsupported-draft', 'schema', '/$schema', declared), stats);
  }

  try {
    stats.patterns = inspectSchemaSafety(schema, draft);
  } catch (error) {
    if (error instanceof SchemaSafetyError) {
      return failure(issue(error.code, 'schema', error.path, error.detail), stats);
    }
    throw error;
  }

  return {
    ok: true,
    prepared: {
      schema: withoutDeclaredDraft(schema),
      instance: parsedInstance.parsed.value,
      draft,
      stats,
    },
  };
}

export function serializeJsonSchemaReport(
  result: Omit<JsonSchemaValidationResult, 'report'>,
): string | null {
  const report = JSON.stringify({
    valid: result.valid,
    draft: result.draft,
    issues: result.issues,
    totalErrors: result.totalErrors,
    errorsTruncated: result.errorsTruncated,
    errors: result.errors,
    correction: result.correction,
    stats: result.stats,
  }, null, 2);
  return report.length <= JSON_SCHEMA_MAX_OUTPUT_CHARACTERS ? report : null;
}

export function emptyJsonSchemaResult(
  issueValue: JsonSchemaIssue,
  stats: JsonSchemaValidationResult['stats'],
): JsonSchemaValidationResult {
  return {
    ok: false,
    valid: false,
    draft: null,
    issues: [issueValue],
    errors: [],
    errorsTruncated: false,
    totalErrors: 0,
    correction: null,
    report: '',
    stats,
  };
}

function failure(
  issueValue: JsonSchemaIssue,
  stats: JsonSchemaValidationResult['stats'],
): JsonSchemaPreparationResult {
  return { ok: false, result: emptyJsonSchemaResult(issueValue, stats) };
}

function parseDocument(
  source: string,
  side: Exclude<JsonSchemaDocumentSide, 'engine'>,
): { parsed: ParsedStrictJson } | { issue: JsonSchemaIssue } {
  try {
    return {
      parsed: parseStrictJson(source, {
        maxDepth: JSON_SCHEMA_MAX_DEPTH,
        maxNodes: JSON_SCHEMA_MAX_NODES,
      }),
    };
  } catch (error) {
    if (error instanceof StrictJsonParserError) {
      return { issue: issue(error.code, side, '', error.detail, error.position) };
    }
    throw error;
  }
}

function resolveDraft(schema: JsonObject | boolean, selected: JsonSchemaDraftMode): JsonSchemaDraft | null {
  if (selected !== 'auto') return selected;
  if (!isObject(schema) || !Object.hasOwn(schema, '$schema')) return 'draft-07';
  const declaration = schema['$schema'];
  if (typeof declaration !== 'string') return null;
  const normalized = declaration.toLowerCase().replace(/#$/u, '');
  if (normalized === 'http://json-schema.org/draft-07/schema'
    || normalized === 'https://json-schema.org/draft-07/schema') return 'draft-07';
  if (normalized === 'https://json-schema.org/draft/2019-09/schema'
    || normalized === 'http://json-schema.org/draft/2019-09/schema') return 'draft-2019-09';
  if (normalized === 'https://json-schema.org/draft/2020-12/schema'
    || normalized === 'http://json-schema.org/draft/2020-12/schema') return 'draft-2020-12';
  return null;
}

function withoutDeclaredDraft(schema: JsonObject | boolean): JsonObject | boolean {
  if (!isObject(schema) || !Object.hasOwn(schema, '$schema')) return schema;
  const clone = Object.create(null) as JsonObject;
  for (const [key, value] of Object.entries(schema)) {
    if (key !== '$schema') clone[key] = value;
  }
  return clone;
}

interface SchemaResource {
  root: JsonObject;
  path: string;
}

interface SchemaTraversalEntry {
  value: JsonValue;
  path: string;
  resource: SchemaResource;
}

interface SchemaAnchorTarget {
  value: JsonValue;
  path: string;
}

function inspectSchemaSafety(schema: JsonObject | boolean, draft: JsonSchemaDraft): number {
  if (typeof schema === 'boolean') return 0;
  let patterns = 0;
  const visited = new Set<JsonObject>();
  const anchorIndexes = new WeakMap<JsonObject, ReadonlyMap<string, readonly SchemaAnchorTarget[]>>();
  const initialResource: SchemaResource = { root: schema, path: '' };
  const stack: SchemaTraversalEntry[] = [{ value: schema, path: '', resource: initialResource }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    if (!isObject(current.value)) continue;
    if (visited.has(current.value)) continue;
    visited.add(current.value);
    const resource = current.value !== current.resource.root && typeof current.value['$id'] === 'string'
      ? { root: current.value, path: current.path }
      : current.resource;
    inspectReferences(current.value, current.path, draft);
    pushLocalReferenceTargets(resource, current.value, draft, anchorIndexes, stack);
    if (draft === 'draft-07' && typeof current.value['$ref'] === 'string') continue;
    patterns = inspectPatterns(current.value, current.path, patterns);
    pushSubschemas(current.value, current.path, draft, resource, stack);
  }
  return patterns;
}

function inspectReferences(schema: JsonObject, path: string, draft: JsonSchemaDraft): void {
  for (const keyword of referenceKeywords(draft)) {
    const reference = schema[keyword];
    if (typeof reference === 'string' && !reference.startsWith('#')) {
      throw new SchemaSafetyError('external-reference', appendPointer(path, keyword), reference.slice(0, 240));
    }
  }
}

function pushLocalReferenceTargets(
  resource: SchemaResource,
  schema: JsonObject,
  draft: JsonSchemaDraft,
  anchorIndexes: WeakMap<JsonObject, ReadonlyMap<string, readonly SchemaAnchorTarget[]>>,
  stack: SchemaTraversalEntry[],
): void {
  for (const keyword of referenceKeywords(draft)) {
    const reference = schema[keyword];
    if (typeof reference !== 'string') continue;
    const target = resolveLocalReference(resource.root, reference);
    if (target !== null) {
      pushSchema(target.value, resourcePath(resource.path, target.path), resource, stack);
      continue;
    }
    const anchors = getLocalAnchorIndex(resource, draft, anchorIndexes);
    for (const anchorTarget of anchors.get(reference) ?? []) {
      pushSchema(anchorTarget.value, anchorTarget.path, resource, stack);
    }
  }
}

function getLocalAnchorIndex(
  resource: SchemaResource,
  draft: JsonSchemaDraft,
  cache: WeakMap<JsonObject, ReadonlyMap<string, readonly SchemaAnchorTarget[]>>,
): ReadonlyMap<string, readonly SchemaAnchorTarget[]> {
  const cached = cache.get(resource.root);
  if (cached) return cached;
  const anchors = indexLocalAnchors(resource, draft);
  cache.set(resource.root, anchors);
  return anchors;
}

function indexLocalAnchors(
  resource: SchemaResource,
  draft: JsonSchemaDraft,
): Map<string, SchemaAnchorTarget[]> {
  const anchors = new Map<string, SchemaAnchorTarget[]>();
  const visited = new Set<JsonObject>();
  const stack: SchemaAnchorTarget[] = [{ value: resource.root, path: resource.path }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    if (!isObject(current.value)) continue;
    if (visited.has(current.value)) continue;
    visited.add(current.value);
    const identifier = current.value['$id'];
    if (current.value !== resource.root && typeof identifier === 'string') {
      if (draft === 'draft-07' && /^#[a-z_][-a-z0-9._]*$/iu.test(identifier)) {
        addAnchorTarget(anchors, identifier, current);
      }
      continue;
    }
    addLocalAnchor(anchors, current.value['$anchor'], current);
    addLocalAnchor(anchors, current.value['$dynamicAnchor'], current);
    if (typeof identifier === 'string' && /^#[a-z_][-a-z0-9._]*$/iu.test(identifier)) {
      addAnchorTarget(anchors, identifier, current);
    }
    pushAnchorSubschemas(current.value, current.path, draft, stack);
  }
  return anchors;
}

function addLocalAnchor(
  anchors: Map<string, SchemaAnchorTarget[]>,
  anchor: JsonValue | undefined,
  target: SchemaAnchorTarget,
): void {
  if (typeof anchor === 'string' && /^[a-z_][-a-z0-9._]*$/iu.test(anchor)) {
    addAnchorTarget(anchors, `#${anchor}`, target);
  }
}

function addAnchorTarget(
  anchors: Map<string, SchemaAnchorTarget[]>,
  reference: string,
  target: SchemaAnchorTarget,
): void {
  const targets = anchors.get(reference) ?? [];
  targets.push(target);
  anchors.set(reference, targets);
}

function resolveLocalReference(root: JsonObject, reference: string): { value: JsonValue; path: string } | null {
  if (reference === '#') return { value: root, path: '' };
  if (!reference.startsWith('#/')) return null;
  let pointer: string;
  try {
    pointer = decodeURIComponent(reference.slice(1));
  } catch {
    return null;
  }
  let value: JsonValue = root;
  for (const rawSegment of pointer.slice(1).split('/')) {
    const segment = unescapePointer(rawSegment);
    if (Array.isArray(value)) {
      if (!/^\d+$/u.test(segment)) return null;
      const index = Number(segment);
      if (index >= value.length) return null;
      value = value[index];
    } else if (isObject(value)) {
      if (!Object.hasOwn(value, segment)) return null;
      value = value[segment];
    } else {
      return null;
    }
  }
  return { value, path: pointer };
}

function resourcePath(resourcePathValue: string, pointer: string): string {
  return pointer ? `${resourcePathValue}${pointer}` : resourcePathValue;
}

function referenceKeywords(draft: JsonSchemaDraft): readonly string[] {
  if (draft === 'draft-2020-12') return ['$ref', '$dynamicRef'];
  if (draft === 'draft-2019-09') return ['$ref', '$recursiveRef'];
  return ['$ref'];
}

function inspectPatterns(schema: JsonObject, path: string, initialCount: number): number {
  let count = initialCount;
  const pattern = schema['pattern'];
  if (typeof pattern === 'string') count = countPattern(pattern, appendPointer(path, 'pattern'), count);
  const patternProperties = schema['patternProperties'];
  if (isObject(patternProperties)) {
    const containerPath = appendPointer(path, 'patternProperties');
    for (const propertyPattern of Object.keys(patternProperties)) {
      count = countPattern(propertyPattern, appendPointer(containerPath, propertyPattern), count);
    }
  }
  return count;
}

function countPattern(pattern: string, path: string, currentCount: number): number {
  const nextCount = currentCount + 1;
  if (pattern.length > JSON_SCHEMA_MAX_PATTERN_CHARACTERS || nextCount > JSON_SCHEMA_MAX_PATTERNS) {
    throw new SchemaSafetyError('pattern-limit', path, String(pattern.length));
  }
  return nextCount;
}

function pushSubschemas(
  schema: JsonObject,
  path: string,
  draft: JsonSchemaDraft,
  resource: SchemaResource,
  stack: SchemaTraversalEntry[],
): void {
  for (const keyword of singleSubschemaKeywords(draft)) {
    const value = schema[keyword];
    const keywordPath = appendPointer(path, keyword);
    if (keyword === 'items' && draft !== 'draft-2020-12' && Array.isArray(value)) {
      pushSchemaArray(value, keywordPath, resource, stack);
    }
    else pushSchema(value, keywordPath, resource, stack);
  }
  for (const keyword of schemaArrayKeywords(draft)) {
    const value = schema[keyword];
    if (Array.isArray(value)) pushSchemaArray(value, appendPointer(path, keyword), resource, stack);
  }
  for (const keyword of schemaMapKeywords(draft)) {
    const value = schema[keyword];
    if (isObject(value)) pushSchemaMap(value, appendPointer(path, keyword), resource, stack);
  }
  const dependencies = schema['dependencies'];
  if (isObject(dependencies)) pushSchemaMap(dependencies, appendPointer(path, 'dependencies'), resource, stack);
}

function pushSchemaArray(
  values: readonly JsonValue[],
  path: string,
  resource: SchemaResource,
  stack: SchemaTraversalEntry[],
): void {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    pushSchema(values[index], appendPointer(path, String(index)), resource, stack);
  }
}

function pushSchemaMap(
  values: JsonObject,
  path: string,
  resource: SchemaResource,
  stack: SchemaTraversalEntry[],
): void {
  for (const [key, value] of Object.entries(values)) {
    pushSchema(value, appendPointer(path, key), resource, stack);
  }
}

function pushSchema(
  value: JsonValue | undefined,
  path: string,
  resource: SchemaResource,
  stack: SchemaTraversalEntry[],
): void {
  if (typeof value === 'boolean' || isObject(value)) stack.push({ value, path, resource });
}

function pushAnchorSubschemas(
  schema: JsonObject,
  path: string,
  draft: JsonSchemaDraft,
  stack: SchemaAnchorTarget[],
): void {
  for (const keyword of singleSubschemaKeywords(draft)) {
    const value = schema[keyword];
    const keywordPath = appendPointer(path, keyword);
    if (keyword === 'items' && draft !== 'draft-2020-12' && Array.isArray(value)) {
      pushAnchorSchemaArray(value, keywordPath, stack);
    } else {
      pushAnchorSchema(value, keywordPath, stack);
    }
  }
  for (const keyword of schemaArrayKeywords(draft)) {
    const value = schema[keyword];
    if (Array.isArray(value)) pushAnchorSchemaArray(value, appendPointer(path, keyword), stack);
  }
  for (const keyword of anchorSchemaMapKeywords(draft)) {
    const value = schema[keyword];
    if (isObject(value)) pushAnchorSchemaMap(value, appendPointer(path, keyword), stack);
  }
  const dependencies = schema['dependencies'];
  if (isObject(dependencies)) pushAnchorSchemaMap(dependencies, appendPointer(path, 'dependencies'), stack);
}

function pushAnchorSchemaArray(
  values: readonly JsonValue[],
  path: string,
  stack: SchemaAnchorTarget[],
): void {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    pushAnchorSchema(values[index], appendPointer(path, String(index)), stack);
  }
}

function pushAnchorSchemaMap(values: JsonObject, path: string, stack: SchemaAnchorTarget[]): void {
  for (const [key, value] of Object.entries(values)) {
    pushAnchorSchema(value, appendPointer(path, key), stack);
  }
}

function pushAnchorSchema(value: JsonValue | undefined, path: string, stack: SchemaAnchorTarget[]): void {
  if (typeof value === 'boolean' || isObject(value)) stack.push({ value, path });
}

const COMMON_SINGLE_SUBSCHEMA_KEYWORDS = [
  'additionalProperties',
  'contains',
  'else',
  'if',
  'items',
  'not',
  'propertyNames',
  'then',
] as const;

function singleSubschemaKeywords(draft: JsonSchemaDraft): readonly string[] {
  if (draft === 'draft-07') return ['additionalItems', ...COMMON_SINGLE_SUBSCHEMA_KEYWORDS];
  if (draft === 'draft-2019-09') {
    return [
      'additionalItems',
      ...COMMON_SINGLE_SUBSCHEMA_KEYWORDS,
      'contentSchema',
      'unevaluatedItems',
      'unevaluatedProperties',
    ];
  }
  return [
    ...COMMON_SINGLE_SUBSCHEMA_KEYWORDS,
    'contentSchema',
    'unevaluatedItems',
    'unevaluatedProperties',
  ];
}

function schemaArrayKeywords(draft: JsonSchemaDraft): readonly string[] {
  return draft === 'draft-2020-12'
    ? ['allOf', 'anyOf', 'oneOf', 'prefixItems']
    : ['allOf', 'anyOf', 'oneOf'];
}

function schemaMapKeywords(draft: JsonSchemaDraft): readonly string[] {
  return draft === 'draft-07'
    ? ['definitions', 'patternProperties', 'properties']
    : ['$defs', 'dependentSchemas', 'patternProperties', 'properties'];
}

function anchorSchemaMapKeywords(draft: JsonSchemaDraft): readonly string[] {
  return draft === 'draft-07'
    ? schemaMapKeywords(draft)
    : ['$defs', 'definitions', 'dependentSchemas', 'patternProperties', 'properties'];
}

function issue(
  code: JsonSchemaIssueCode,
  side: JsonSchemaDocumentSide,
  path = '',
  detail = '',
  position: number | null = null,
): JsonSchemaIssue {
  return { code, side, path, detail, position };
}

function appendPointer(path: string, segment: string): string {
  return `${path}/${segment.replace(/~/gu, '~0').replace(/\//gu, '~1')}`;
}

function unescapePointer(segment: string): string {
  return segment.replace(/~1/gu, '/').replace(/~0/gu, '~');
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}
