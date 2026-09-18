import { describe, expect, it } from 'vitest';

import { applySafeJsonSchemaCorrections } from './json-schema-corrections';
import {
  JSON_SCHEMA_MAX_PATTERN_CHARACTERS,
  JSON_SCHEMA_MAX_SCHEMA_CHARACTERS,
  prepareJsonSchemaValidation,
  serializeJsonSchemaReport,
  type JsonObject,
  type JsonSchemaValidationError,
} from './json-schema-validator.models';

const OPTIONS = { draft: 'auto', validateFormats: true } as const;

describe('prepareJsonSchemaValidation', () => {
  it('detects Draft 2020-12 and preserves local references', () => {
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: { name: { type: 'string' } },
      properties: { name: { $ref: '#/$defs/name' } },
    }), '{"name":"Ada"}', OPTIONS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prepared.draft).toBe('draft-2020-12');
    expect(result.prepared.stats.schemaNodes).toBeGreaterThan(1);
  });

  it.each([
    ['http://json-schema.org/draft-07/schema#', 'draft-07'],
    ['https://json-schema.org/draft/2019-09/schema', 'draft-2019-09'],
    ['https://json-schema.org/draft/2020-12/schema#', 'draft-2020-12'],
  ] as const)('detects %s', (declaration, expected) => {
    const result = prepareJsonSchemaValidation(JSON.stringify({ $schema: declaration }), '{}', OPTIONS);
    expect(result.ok && result.prepared.draft).toBe(expected);
  });

  it('defaults to Draft 7 when no declaration exists', () => {
    const result = prepareJsonSchemaValidation('{"type":"object"}', '{}', OPTIONS);
    expect(result.ok && result.prepared.draft).toBe('draft-07');
  });

  it('allows an explicit draft to replace an unsupported declaration', () => {
    const result = prepareJsonSchemaValidation(
      '{"$schema":"https://example.com/private-meta","type":"object"}',
      '{}',
      { draft: 'draft-07', validateFormats: true },
    );

    expect(result.ok).toBe(true);
    if (!result.ok || typeof result.prepared.schema === 'boolean') return;
    expect(result.prepared.schema['$schema']).toBeUndefined();
  });

  it('rejects an unsupported automatically detected draft', () => {
    const result = prepareJsonSchemaValidation(
      '{"$schema":"http://json-schema.org/draft-04/schema#"}',
      '{}',
      OPTIONS,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('unsupported-draft');
  });

  it.each([
    ['', '{}', 'empty-source'],
    ['{}', '', 'empty-source'],
    ['{"a":1,"a":2}', '{}', 'duplicate-key'],
    ['{}', '{"n":9007199254740993}', 'unsafe-number'],
    ['{}', '"\\ud800"', 'invalid-unicode'],
    ['{}', '{]', 'invalid-json'],
  ] as const)('rejects unsafe input %#', (schema, instance, expected) => {
    const result = prepareJsonSchemaValidation(schema, instance, OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe(expected);
  });

  it('rejects a scalar schema root', () => {
    const result = prepareJsonSchemaValidation('42', '{}', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('schema-root-invalid');
  });

  it('rejects remote references without performing network access', () => {
    const result = prepareJsonSchemaValidation(
      '{"$ref":"https://example.com/schema.json"}',
      '{}',
      OPTIONS,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({ code: 'external-reference', path: '/$ref' });
  });

  it('ignores reference-shaped annotation data that is not a subschema', () => {
    const result = prepareJsonSchemaValidation(
      '{"default":{"$ref":"https://example.com/value"},"examples":[{"$ref":"relative.json"}]}',
      '{}',
      OPTIONS,
    );
    expect(result.ok).toBe(true);
  });

  it('still rejects remote references in nested schema positions', () => {
    const result = prepareJsonSchemaValidation(
      '{"properties":{"value":{"$ref":"relative.json"}}}',
      '{}',
      OPTIONS,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'external-reference',
      path: '/properties/value/$ref',
    });
  });

  it('rejects patterns beyond the explicit safety limit', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({ pattern }), '"a"', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('pattern-limit');
  });

  it('rejects a schema source that exceeds its limit before parsing', () => {
    const result = prepareJsonSchemaValidation(
      `{"description":"${'a'.repeat(JSON_SCHEMA_MAX_SCHEMA_CHARACTERS)}"}`,
      '{}',
      OPTIONS,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('source-too-large');
  });
});

describe('applySafeJsonSchemaCorrections', () => {
  const schema: JsonObject = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', examples: ['Ada'] },
      age: { type: 'integer', minimum: 18 },
      email: { type: 'string', format: 'email' },
      tags: { type: 'array', minItems: 2, items: { type: 'string' } },
    },
  };

  it('adds required examples, removes extra properties and adjusts safe limits', () => {
    const errors: JsonSchemaValidationError[] = [
      error('required', '', '#/required', 'name'),
      error('additionalProperties', '', '#/additionalProperties', 'extra'),
      error('minimum', '/age', '#/properties/age/minimum', '', '', 18),
      error('format', '/email', '#/properties/email/format', '', 'email'),
      error('minItems', '/tags', '#/properties/tags/minItems', '', '', 2),
    ];
    const corrected = applySafeJsonSchemaCorrections(schema, {
      age: 12,
      email: 'invalid',
      tags: [],
      extra: true,
    }, errors);

    expect(corrected.value).toEqual({
      name: 'Ada',
      age: 18,
      email: 'utilisateur@example.com',
      tags: ['', ''],
    });
    expect(corrected.corrections).toHaveLength(5);
  });

  it('does not invent a required value without a usable property schema', () => {
    const corrected = applySafeJsonSchemaCorrections(
      { required: ['unknown'] },
      {},
      [error('required', '', '#/required', 'unknown')],
    );
    expect(corrected.corrections).toEqual([]);
    expect(corrected.value).toEqual({});
  });

  it('can replace the root value from a typed schema', () => {
    const corrected = applySafeJsonSchemaCorrections(
      { type: 'string', default: 'corrigé' },
      42,
      [error('type', '', '#/type', '', 'string')],
    );
    expect(corrected.value).toBe('corrigé');
  });

  it('does not allocate corrections for unbounded array or string limits', () => {
    const corrected = applySafeJsonSchemaCorrections(
      { properties: { values: { type: 'array', items: { type: 'string' } }, label: { type: 'string' } } },
      { values: [], label: '' },
      [
        error('minItems', '/values', '#/properties/values/minItems', '', '', 1_000_000_000),
        error('minLength', '/label', '#/properties/label/minLength', '', '', 1_000_000_000),
      ],
    );
    expect(corrected.corrections).toEqual([]);
    expect(corrected.value).toEqual({ values: [], label: '' });
  });
});

describe('serializeJsonSchemaReport', () => {
  it('serializes a bounded report without source documents', () => {
    const report = serializeJsonSchemaReport({
      ok: true,
      valid: true,
      draft: 'draft-07',
      issues: [],
      errors: [],
      errorsTruncated: false,
      totalErrors: 0,
      correction: null,
      stats: { schemaCharacters: 10, instanceCharacters: 2, schemaNodes: 1, instanceNodes: 1, patterns: 0 },
    });
    expect(report).toContain('"valid": true');
    expect(report).not.toContain('sourceDocuments');
  });
});

function error(
  keyword: string,
  instancePath: string,
  schemaPath: string,
  property = '',
  expected = '',
  limit: number | null = null,
): JsonSchemaValidationError {
  return { keyword, instancePath, schemaPath, property, expected, limit };
}
