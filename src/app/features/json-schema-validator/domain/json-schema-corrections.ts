import {
  JSON_SCHEMA_MAX_OUTPUT_CHARACTERS,
  type JsonObject,
  type JsonSchemaCorrection,
  type JsonSchemaValidationError,
} from './json-schema-validator.models';
import type { JsonValue } from './strict-json-parser';

const MAX_AUTOMATIC_ARRAY_ITEMS = 10_000;

interface CorrectionBudget {
  remainingCharacters: number;
}

export function applySafeJsonSchemaCorrections(
  schema: JsonObject | boolean,
  instance: JsonValue,
  errors: readonly JsonSchemaValidationError[],
): { value: JsonValue; corrections: JsonSchemaCorrection[] } {
  let value = cloneJson(instance);
  const corrections: JsonSchemaCorrection[] = [];
  const budget: CorrectionBudget = {
    remainingCharacters: Math.max(0, JSON_SCHEMA_MAX_OUTPUT_CHARACTERS - JSON.stringify(instance).length),
  };
  for (const error of errors) {
    if (corrections.length >= 100) break;
    const correction = applyCorrection(schema, value, error, budget);
    if (correction === null) continue;
    value = correction.value;
    corrections.push(correction.correction);
  }
  return { value, corrections };
}

function applyCorrection(
  schema: JsonObject | boolean,
  root: JsonValue,
  error: JsonSchemaValidationError,
  budget: CorrectionBudget,
): { value: JsonValue; correction: JsonSchemaCorrection } | null {
  if (typeof schema === 'boolean') return null;
  const path = error.instancePath;
  if (error.keyword === 'required' && error.property) {
    const parent = getPointer(root, path);
    const schemaNode = getSchemaNode(schema, stripSchemaKeyword(error.schemaPath));
    if (!isObject(parent) || !isObject(schemaNode)) return null;
    const properties = schemaNode['properties'];
    const propertySchema = isObject(properties) ? properties[error.property] : undefined;
    const replacement = exampleForSchema(propertySchema);
    if (replacement === undefined) return null;
    const addedCharacters = JSON.stringify(error.property).length
      + 1
      + JSON.stringify(replacement).length
      + (Object.keys(parent).length > 0 ? 1 : 0);
    if (!reserveCharacters(budget, addedCharacters)) return null;
    parent[error.property] = cloneJson(replacement);
    return {
      value: root,
      correction: { action: 'add', path: appendPointer(path, error.property), keyword: error.keyword },
    };
  }
  if (error.keyword === 'additionalProperties' && error.property) {
    const parent = getPointer(root, path);
    if (!isObject(parent) || !Object.hasOwn(parent, error.property)) return null;
    Reflect.deleteProperty(parent, error.property);
    return {
      value: root,
      correction: { action: 'remove', path: appendPointer(path, error.property), keyword: error.keyword },
    };
  }

  const current = getPointer(root, path);
  const schemaValue = getSchemaNode(schema, stripSchemaKeyword(error.schemaPath));
  if (current === undefined || !isObject(schemaValue)) return null;

  let replacement: JsonValue | undefined;
  let action: JsonSchemaCorrection['action'] = 'replace';
  if (error.keyword === 'type' || error.keyword === 'enum' || error.keyword === 'const') {
    replacement = exampleForSchema(schemaValue);
  } else if (error.keyword === 'minimum' || error.keyword === 'exclusiveMinimum') {
    const limit = error.limit;
    if (typeof current === 'number' && limit !== null) {
      replacement = error.keyword === 'minimum' ? limit : nextRepresentable(limit, 1);
    }
  } else if (error.keyword === 'maximum' || error.keyword === 'exclusiveMaximum') {
    const limit = error.limit;
    if (typeof current === 'number' && limit !== null) {
      replacement = error.keyword === 'maximum' ? limit : nextRepresentable(limit, -1);
    }
  } else if (error.keyword === 'minLength' && typeof current === 'string' && error.limit !== null) {
    replacement = extendStringWithinBudget(current, error.limit, budget.remainingCharacters);
    if (replacement !== undefined) action = 'extend';
  } else if (error.keyword === 'maxLength' && typeof current === 'string' && error.limit !== null) {
    replacement = Array.from(current).slice(0, error.limit).join('');
    action = 'truncate';
  } else if (error.keyword === 'minItems' && Array.isArray(current) && error.limit !== null) {
    replacement = extendArrayWithinBudget(
      current,
      schemaValue['items'],
      error.limit,
      budget.remainingCharacters,
    );
    if (replacement !== undefined) action = 'extend';
  } else if (error.keyword === 'maxItems' && Array.isArray(current) && error.limit !== null) {
    replacement = current.slice(0, error.limit).map(cloneJson);
    action = 'truncate';
  } else if (error.keyword === 'format' && typeof current === 'string') {
    replacement = formatExample(error.expected);
  }

  if (replacement === undefined) return null;
  const addedCharacters = Math.max(0, JSON.stringify(replacement).length - JSON.stringify(current).length);
  if (!reserveCharacters(budget, addedCharacters)) return null;
  const value = setPointer(root, path, replacement);
  if (value === null) {
    budget.remainingCharacters += addedCharacters;
    return null;
  }
  return { value, correction: { action, path, keyword: error.keyword } };
}

function extendStringWithinBudget(
  current: string,
  targetLength: number,
  remainingCharacters: number,
): string | undefined {
  const currentCodePoints = Array.from(current).length;
  const missingCodePoints = targetLength - currentCodePoints;
  if (!Number.isSafeInteger(targetLength)
    || missingCodePoints < 0
    || missingCodePoints > remainingCharacters) return undefined;
  return `${current}${'a'.repeat(missingCodePoints)}`;
}

function extendArrayWithinBudget(
  current: readonly JsonValue[],
  itemSchema: JsonValue | undefined,
  targetLength: number,
  remainingCharacters: number,
): JsonValue[] | undefined {
  if (!Number.isSafeInteger(targetLength)
    || targetLength < current.length
    || targetLength > MAX_AUTOMATIC_ARRAY_ITEMS) return undefined;
  const missingItems = targetLength - current.length;
  const example = exampleForSchema(itemSchema) ?? null;
  const itemCharacters = JSON.stringify(example).length;
  const separatorCharacters = missingItems === 0 ? 0 : current.length > 0 ? missingItems : missingItems - 1;
  const addedCharacters = missingItems * itemCharacters + separatorCharacters;
  if (!Number.isSafeInteger(addedCharacters) || addedCharacters > remainingCharacters) return undefined;
  const next = current.map(cloneJson);
  for (let index = 0; index < missingItems; index += 1) next.push(cloneJson(example));
  return next;
}

function reserveCharacters(budget: CorrectionBudget, characters: number): boolean {
  if (!Number.isSafeInteger(characters) || characters < 0 || characters > budget.remainingCharacters) return false;
  budget.remainingCharacters -= characters;
  return true;
}

function exampleForSchema(schema: JsonValue | undefined): JsonValue | undefined {
  if (typeof schema === 'boolean') return schema ? null : undefined;
  if (!isObject(schema)) return undefined;
  if (Object.hasOwn(schema, 'default')) return cloneJson(schema['default']);
  if (Object.hasOwn(schema, 'const')) return cloneJson(schema['const']);
  const examples = schema['examples'];
  if (Array.isArray(examples) && examples.length > 0) return cloneJson(examples[0]);
  const values = schema['enum'];
  if (Array.isArray(values) && values.length > 0) return cloneJson(values[0]);
  const typeValue = schema['type'];
  const type = typeof typeValue === 'string'
    ? typeValue
    : Array.isArray(typeValue) && typeof typeValue[0] === 'string'
      ? typeValue[0]
      : null;
  if (type === 'string') return formatExample(typeof schema['format'] === 'string' ? schema['format'] : '') ?? '';
  if (type === 'number' || type === 'integer') {
    const minimum = schema['minimum'];
    return typeof minimum === 'number' ? minimum : 0;
  }
  if (type === 'boolean') return false;
  if (type === 'null') return null;
  if (type === 'array') return [];
  if (type === 'object') {
    const value: JsonObject = Object.create(null) as JsonObject;
    const required = schema['required'];
    const properties = schema['properties'];
    if (Array.isArray(required) && isObject(properties)) {
      for (const property of required) {
        if (typeof property !== 'string') continue;
        const child = exampleForSchema(properties[property]);
        if (child !== undefined) value[property] = child;
      }
    }
    return value;
  }
  return undefined;
}

function formatExample(format: string): string | undefined {
  const values: Readonly<Record<string, string>> = {
    date: '2026-01-31',
    time: '12:00:00Z',
    'date-time': '2026-01-31T12:00:00Z',
    duration: 'P1D',
    email: 'utilisateur@example.com',
    hostname: 'example.com',
    ipv4: '192.0.2.1',
    ipv6: '2001:db8::1',
    uri: 'https://example.com/ressource',
    url: 'https://example.com/ressource',
    uuid: '123e4567-e89b-42d3-a456-426614174000',
  };
  return values[format];
}

function getSchemaNode(schema: JsonObject, fragment: string): JsonValue | undefined {
  if (fragment === '#' || fragment === '') return schema;
  if (!fragment.startsWith('#/')) return undefined;
  return getPointer(schema, fragment.slice(1));
}

function stripSchemaKeyword(schemaPath: string): string {
  const index = schemaPath.lastIndexOf('/');
  return index < 1 ? '#' : schemaPath.slice(0, index);
}

function getPointer(root: JsonValue, pointer: string): JsonValue | undefined {
  if (pointer === '') return root;
  if (!pointer.startsWith('/')) return undefined;
  let current: JsonValue | undefined = root;
  for (const rawSegment of pointer.slice(1).split('/')) {
    const segment = unescapePointer(rawSegment);
    if (Array.isArray(current)) {
      if (!/^\d+$/u.test(segment)) return undefined;
      current = current[Number(segment)];
    } else if (isObject(current)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function setPointer(root: JsonValue, pointer: string, replacement: JsonValue): JsonValue | null {
  if (pointer === '') return cloneJson(replacement);
  const split = splitParentPointer(pointer);
  if (split === null) return null;
  const parent = getPointer(root, split.parent);
  if (Array.isArray(parent) && /^\d+$/u.test(split.segment)) {
    const index = Number(split.segment);
    if (index >= parent.length) return null;
    parent[index] = cloneJson(replacement);
    return root;
  }
  if (isObject(parent) && Object.hasOwn(parent, split.segment)) {
    parent[split.segment] = cloneJson(replacement);
    return root;
  }
  return null;
}

function splitParentPointer(pointer: string): { parent: string; segment: string } | null {
  if (!pointer.startsWith('/')) return null;
  const index = pointer.lastIndexOf('/');
  return { parent: pointer.slice(0, index), segment: unescapePointer(pointer.slice(index + 1)) };
}

function cloneJson<T extends JsonValue>(value: T): T {
  if (Array.isArray(value)) return value.map(item => cloneJson(item)) as T;
  if (!isObject(value)) return value;
  const clone = Object.create(null) as JsonObject;
  for (const [key, child] of Object.entries(value)) clone[key] = cloneJson(child);
  return clone as T;
}

function nextRepresentable(value: number, direction: 1 | -1): number | undefined {
  if (Number.isInteger(value) && Number.isSafeInteger(value + direction)) return value + direction;
  const delta = Math.max(Math.abs(value) * Number.EPSILON, Number.MIN_VALUE);
  const candidate = value + direction * delta;
  return Number.isFinite(candidate) && candidate !== value ? candidate : undefined;
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
