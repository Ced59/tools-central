import Ajv, { type ErrorObject, type Options, type ValidateFunction } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import {
  JSON_SCHEMA_MAX_ERRORS,
  JSON_SCHEMA_MAX_OUTPUT_CHARACTERS,
  JSON_SCHEMA_MAX_VALIDATION_OPERATIONS,
  prepareJsonSchemaValidation,
  serializeJsonSchemaReport,
  type JsonObject,
  type JsonSchemaCorrection,
  type JsonSchemaCorrectionCandidate,
  type JsonSchemaDraft,
  type JsonSchemaIssue,
  type JsonSchemaValidationError,
  type JsonSchemaValidationOptions,
  type JsonSchemaValidationResult,
  type JsonValue,
  type PreparedJsonSchemaValidation,
} from '../domain/json-schema-validator.models';
import { applySafeJsonSchemaCorrections } from '../domain/json-schema-corrections';

const AJV_OPTIONS: Options = {
  coerceTypes: false,
  logger: false,
  messages: false,
  removeAdditional: false,
  strict: false,
  strictTuples: false,
  unicodeRegExp: true,
  useDefaults: false,
  validateFormats: true,
};

export function validateJsonSchemaDocuments(
  schemaSource: string,
  instanceSource: string,
  options: JsonSchemaValidationOptions,
): JsonSchemaValidationResult {
  const preparation = prepareJsonSchemaValidation(schemaSource, instanceSource, options);
  if (!preparation.ok) return preparation.result;
  const prepared = preparation.prepared;

  try {
    const collectAllErrors = prepared.stats.schemaNodes * prepared.stats.instanceNodes
      <= JSON_SCHEMA_MAX_VALIDATION_OPERATIONS;
    const validator = compileValidator(prepared, options.validateFormats, collectAllErrors);
    const valid = validator(prepared.instance);
    if (!valid && !collectAllErrors) return engineFailure(prepared, 'validation-limit');
    const rawErrors = valid ? [] : validator.errors ?? [];
    const totalErrors = rawErrors.length;
    const errors = normalizeErrors(rawErrors.slice(0, JSON_SCHEMA_MAX_ERRORS));
    const correction = valid
      ? null
      : createCorrectionCandidate(prepared.schema, prepared.instance, validator, errors);
    const withoutReport: Omit<JsonSchemaValidationResult, 'report'> = {
      ok: true,
      valid,
      draft: prepared.draft,
      issues: [],
      errors,
      errorsTruncated: totalErrors > JSON_SCHEMA_MAX_ERRORS,
      totalErrors,
      correction,
      stats: prepared.stats,
    };
    const report = serializeJsonSchemaReport(withoutReport);
    if (report === null) return engineFailure(prepared, 'output-too-large');
    return { ...withoutReport, report };
  } catch (error) {
    return engineFailure(prepared, isValidationRuntimeError(error) ? 'validation-failed' : 'schema-invalid', error);
  }
}

function compileValidator(
  prepared: PreparedJsonSchemaValidation,
  validateFormats: boolean,
  allErrors: boolean,
): ValidateFunction<JsonValue> {
  const ajv = createAjv(prepared.draft, validateFormats, allErrors);
  return ajv.compile<JsonValue>(prepared.schema);
}

function createAjv(
  draft: JsonSchemaDraft,
  validateFormats: boolean,
  allErrors: boolean,
): Ajv | Ajv2019 | Ajv2020 {
  const options = {
    ...AJV_OPTIONS,
    allErrors,
    ignoreKeywordsWithRef: draft === 'draft-07',
    validateFormats,
  };
  const ajv = draft === 'draft-2020-12'
    ? new Ajv2020(options)
    : draft === 'draft-2019-09'
      ? new Ajv2019(options)
      : new Ajv(options);
  addFormats(ajv, { mode: 'full' });
  return ajv;
}

function normalizeErrors(errors: readonly ErrorObject[]): JsonSchemaValidationError[] {
  return errors.map(error => {
    const params = error.params as Record<string, unknown>;
    return {
      keyword: error.keyword,
      instancePath: error.instancePath,
      schemaPath: error.schemaPath,
      property: readString(params['missingProperty']) || readString(params['additionalProperty']),
      expected: expectedValue(error.keyword, params),
      limit: readNumber(params['limit']),
    };
  });
}

function expectedValue(keyword: string, params: Readonly<Record<string, unknown>>): string {
  if (keyword === 'type') return readExpectedTypes(params['type']);
  if (keyword === 'format') return readString(params['format']);
  if (keyword === 'pattern') return readString(params['pattern']);
  if (keyword === 'required') return readString(params['missingProperty']);
  if (keyword === 'additionalProperties') return readString(params['additionalProperty']);
  const values = params['allowedValues'];
  if (Array.isArray(values)) return boundedJson(values);
  const comparison = readString(params['comparison']);
  if (comparison) return comparison;
  const limit = readNumber(params['limit']);
  return limit === null ? '' : String(limit);
}

function readExpectedTypes(value: unknown): string {
  if (typeof value === 'string') return readString(value);
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return boundedJson(value);
  return '';
}

function createCorrectionCandidate(
  schema: JsonObject | boolean,
  original: JsonValue,
  validator: ValidateFunction<JsonValue>,
  initialErrors: readonly JsonSchemaValidationError[],
): JsonSchemaCorrectionCandidate | null {
  let candidate = original;
  let currentErrors = [...initialErrors];
  const corrections: JsonSchemaCorrection[] = [];
  let valid = false;
  let remainingErrors = currentErrors.length;

  for (let pass = 0; pass < 3 && currentErrors.length > 0; pass += 1) {
    const applied = applySafeJsonSchemaCorrections(schema, candidate, currentErrors);
    if (applied.corrections.length === 0) break;
    candidate = applied.value;
    corrections.push(...applied.corrections);
    valid = validator(candidate);
    const rawErrors = valid ? [] : validator.errors ?? [];
    remainingErrors = rawErrors.length;
    currentErrors = normalizeErrors(rawErrors.slice(0, JSON_SCHEMA_MAX_ERRORS));
    if (valid) break;
  }

  if (corrections.length === 0) return null;
  const source = JSON.stringify(candidate, null, 2);
  if (source.length > JSON_SCHEMA_MAX_OUTPUT_CHARACTERS) return null;
  return {
    source,
    corrections,
    valid,
    remainingErrors,
  };
}

function engineFailure(
  prepared: PreparedJsonSchemaValidation,
  code: 'schema-invalid' | 'validation-limit' | 'validation-failed' | 'output-too-large',
  error?: unknown,
): JsonSchemaValidationResult {
  const issue: JsonSchemaIssue = {
    code,
    side: 'engine',
    path: '',
    detail: error instanceof Error ? error.message.slice(0, 500) : '',
    position: null,
  };
  return {
    ok: false,
    valid: false,
    draft: prepared.draft,
    issues: [issue],
    errors: [],
    errorsTruncated: false,
    totalErrors: 0,
    correction: null,
    report: '',
    stats: prepared.stats,
  };
}

function isValidationRuntimeError(error: unknown): boolean {
  return error instanceof Error && /validation|stack|maximum call/i.test(error.message);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 500) : '';
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function boundedJson(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized.length > 500 ? `${serialized.slice(0, 497)}...` : serialized;
}
