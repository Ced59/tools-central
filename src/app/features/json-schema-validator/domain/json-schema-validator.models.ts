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
    stats.patterns = inspectSchemaSafety(schema);
  } catch (error) {
    if (error instanceof SchemaSafetyError) {
      return failure(issue(error.code, 'schema', error.path, error.detail), stats);
    }
    throw error;
  }

  return {
    ok: true,
    prepared: {
      schema: options.draft === 'auto' ? schema : withoutDeclaredDraft(schema),
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

function inspectSchemaSafety(schema: JsonObject | boolean): number {
  if (typeof schema === 'boolean') return 0;
  let patterns = 0;
  const stack: Array<{ value: JsonValue; path: string }> = [{ value: schema, path: '' }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: current.value[index], path: appendPointer(current.path, String(index)) });
      }
      continue;
    }
    if (!isObject(current.value)) continue;
    for (const [key, child] of Object.entries(current.value)) {
      const path = appendPointer(current.path, key);
      if ((key === '$ref' || key === '$dynamicRef' || key === '$recursiveRef')
        && typeof child === 'string'
        && !child.startsWith('#')) {
        throw new SchemaSafetyError('external-reference', path, child.slice(0, 240));
      }
      if ((key === 'pattern' || key === 'patternProperties') && typeof child === 'string') {
        patterns += 1;
        if (child.length > JSON_SCHEMA_MAX_PATTERN_CHARACTERS || patterns > JSON_SCHEMA_MAX_PATTERNS) {
          throw new SchemaSafetyError('pattern-limit', path, String(child.length));
        }
      } else if (key === 'patternProperties' && isObject(child)) {
        for (const pattern of Object.keys(child)) {
          patterns += 1;
          if (pattern.length > JSON_SCHEMA_MAX_PATTERN_CHARACTERS || patterns > JSON_SCHEMA_MAX_PATTERNS) {
            throw new SchemaSafetyError('pattern-limit', appendPointer(path, pattern), String(pattern.length));
          }
        }
      }
      stack.push({ value: child, path });
    }
  }
  return patterns;
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

function isObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}
