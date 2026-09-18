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

  it.each(['-0', '-0.0'])('accepts the valid signed-zero token %s without losing its sign', instance => {
    const result = prepareJsonSchemaValidation('true', instance, OPTIONS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.is(result.prepared.instance, -0)).toBe(true);
  });

  it('still rejects a negative number that underflows to signed zero', () => {
    const result = prepareJsonSchemaValidation('true', '-1e-999', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('unsafe-number');
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

  it('ignores legacy subschema keywords that are annotations in Draft 2020-12', () => {
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalItems: { $ref: 'https://example.com/ignored' },
    }), '[]', OPTIONS);
    expect(result.ok).toBe(true);
  });

  it('checks the same legacy subschema keyword in Draft 2019-09', () => {
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      additionalItems: { $ref: 'https://example.com/rejected' },
    }), '[]', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0].code).toBe('external-reference');
  });

  it.each([
    'https://json-schema.org/draft/2019-09/schema',
    'https://json-schema.org/draft/2020-12/schema',
  ])('inspects local-reference targets in retained legacy containers for %s', declaration => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: declaration,
      $ref: '#/definitions/value',
      definitions: { value: { pattern } },
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/definitions/value/pattern',
    });
  });

  it('ignores Draft 7 reference siblings while inspecting the referenced target', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const accepted = prepareJsonSchemaValidation(JSON.stringify({
      $ref: '#/definitions/value',
      pattern,
      properties: { ignored: { $ref: 'https://example.com/ignored' } },
      definitions: { value: { type: 'string' } },
    }), '"value"', OPTIONS);
    expect(accepted.ok).toBe(true);

    const rejected = prepareJsonSchemaValidation(JSON.stringify({
      $ref: '#/definitions/value',
      definitions: { value: { pattern } },
    }), '"value"', OPTIONS);
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/definitions/value/pattern',
    });
  });

  it('inspects a Draft 7 local anchor target without scanning ignored siblings', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $ref: '#value',
      pattern,
      definitions: {
        value: { $id: '#value', pattern },
      },
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/definitions/value/pattern',
    });
  });

  it('resolves local pointers against the current embedded resource', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $ref: '#/$defs/embedded',
      $defs: {
        embedded: {
          $id: 'embedded-resource',
          $ref: '#/definitions/value',
          definitions: { value: { pattern } },
        },
      },
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/$defs/embedded/definitions/value/pattern',
    });
  });

  it('preserves an embedded resource when a root pointer jumps directly to its descendant', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $ref: '#/$defs/embedded/definitions/value',
      $defs: {
        embedded: {
          $id: 'embedded-resource',
          definitions: { value: { $ref: '#/hidden/x' } },
          hidden: { x: { pattern } },
        },
      },
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/$defs/embedded/hidden/x/pattern',
    });
  });

  it('does not index anchors from opaque annotation values', () => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $ref: '#real',
      $defs: { target: { $anchor: 'real', type: 'string' } },
      default: { $anchor: 'real', pattern },
      examples: [{ $dynamicAnchor: 'real', pattern }],
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(true);
  });

  it.each([
    'https://json-schema.org/draft/2019-09/schema',
    'https://json-schema.org/draft/2020-12/schema',
  ])('inspects schema-valued legacy dependencies retained by Ajv for %s', declaration => {
    const pattern = 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1);
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: declaration,
      dependencies: {
        trigger: { properties: { value: { pattern } } },
      },
    }), '{"trigger":true,"value":"value"}', OPTIONS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.result.issues[0]).toMatchObject({
      code: 'pattern-limit',
      path: '/dependencies/trigger/properties/value/pattern',
    });
  });

  it.each([
    'https://json-schema.org/draft/2019-09/schema',
    'https://json-schema.org/draft/2020-12/schema',
  ])('treats contentSchema as annotation-only metadata for %s', declaration => {
    const result = prepareJsonSchemaValidation(JSON.stringify({
      $schema: declaration,
      type: 'string',
      contentSchema: {
        $ref: 'https://example.com/annotation-only',
        pattern: 'a'.repeat(JSON_SCHEMA_MAX_PATTERN_CHARACTERS + 1),
      },
    }), '"value"', OPTIONS);
    expect(result.ok).toBe(true);
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

  it('extends strings by Unicode code points', () => {
    const corrected = applySafeJsonSchemaCorrections(
      { type: 'string', minLength: 2 },
      '😀',
      [error('minLength', '', '#/minLength', '', '', 2)],
    );
    expect(corrected.value).toBe('😀a');
    expect(corrected.corrections).toHaveLength(1);
  });

  it.each([
    ['exclusiveMinimum', Number.MAX_VALUE, 0],
    ['exclusiveMaximum', -Number.MAX_VALUE, 0],
  ] as const)('skips non-finite %s corrections', (keyword, limit, value) => {
    const corrected = applySafeJsonSchemaCorrections(
      { type: 'number', [keyword]: limit },
      value,
      [error(keyword, '', `#/${keyword}`, '', '', limit)],
    );
    expect(corrected.corrections).toEqual([]);
    expect(corrected.value).toBe(value);
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
