import { describe, expect, it } from 'vitest';

import { JSON_SCHEMA_MAX_ERRORS } from '../domain/json-schema-validator.models';
import { validateJsonSchemaDocuments } from './json-schema-validator.engine';

describe('validateJsonSchemaDocuments', () => {
  it('validates Draft 7 data without coercing strings into numbers', () => {
    const schema = JSON.stringify({ type: 'object', properties: { age: { type: 'integer' } } });
    const result = validateJsonSchemaDocuments(schema, '{"age":"42"}', {
      draft: 'auto',
      validateFormats: true,
    });

    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.draft).toBe('draft-07');
    expect(result.errors[0]).toMatchObject({ keyword: 'type', instancePath: '/age', expected: 'integer' });
  });

  it('supports dependentRequired from Draft 2019-09', () => {
    const schema = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      type: 'object',
      dependentRequired: { carte: ['adresse'] },
    });
    const result = validateJsonSchemaDocuments(schema, '{"carte":"1234"}', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors.some(errorValue => errorValue.keyword === 'dependentRequired')).toBe(true);
  });

  it('supports prefixItems from Draft 2020-12', () => {
    const schema = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
    });
    const result = validateJsonSchemaDocuments(schema, '["ok","not-a-number"]', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors[0].instancePath).toBe('/1');
  });

  it('validates standard formats only when requested', () => {
    const schema = '{"type":"string","format":"email"}';
    const enabled = validateJsonSchemaDocuments(schema, '"invalid"', { draft: 'auto', validateFormats: true });
    const disabled = validateJsonSchemaDocuments(schema, '"invalid"', { draft: 'auto', validateFormats: false });
    expect(enabled.valid).toBe(false);
    expect(enabled.errors[0]).toMatchObject({ keyword: 'format', expected: 'email' });
    expect(disabled.valid).toBe(true);
  });

  it('resolves local references', () => {
    const schema = JSON.stringify({
      definitions: { positive: { type: 'integer', minimum: 1 } },
      $ref: '#/definitions/positive',
    });
    const result = validateJsonSchemaDocuments(schema, '0', { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.errors[0].keyword).toBe('minimum');
  });

  it('ignores reference siblings in Draft 7', () => {
    const schema = JSON.stringify({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/value',
      maxLength: 1,
      definitions: { value: { type: 'string' } },
    });
    const result = validateJsonSchemaDocuments(schema, '"xx"', { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('evaluates reference siblings in Draft 2019-09', () => {
    const schema = JSON.stringify({
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      $ref: '#/$defs/value',
      maxLength: 1,
      $defs: { value: { type: 'string' } },
    });
    const result = validateJsonSchemaDocuments(schema, '"xx"', { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors.some(errorValue => errorValue.keyword === 'maxLength')).toBe(true);
  });

  it('normalizes the accepted HTTPS Draft 7 meta-schema alias', () => {
    const schema = '{"$schema":"https://json-schema.org/draft-07/schema","type":"string"}';
    const result = validateJsonSchemaDocuments(schema, '"value"', { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.draft).toBe('draft-07');
  });

  it('accepts standards-valid constraints without redundant type keywords', () => {
    const result = validateJsonSchemaDocuments('{"properties":{"score":{"minimum":0}}}', '{"score":-1}', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors[0].keyword).toBe('minimum');
  });

  it('preserves union types in normalized diagnostics', () => {
    const result = validateJsonSchemaDocuments('{"type":["string","null"]}', '42', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.errors[0]).toMatchObject({ keyword: 'type', expected: '["string","null"]' });
  });

  it('accepts decimal multiples despite binary floating-point representation', () => {
    const result = validateJsonSchemaDocuments('{"type":"number","multipleOf":0.1}', '0.3', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('preserves the multipleOf divisor in normalized diagnostics', () => {
    const result = validateJsonSchemaDocuments('{"type":"number","multipleOf":0.1}', '0.35', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatchObject({ keyword: 'multipleOf', expected: '', limit: 0.1 });
  });

  it('reports invalid schemas instead of throwing', () => {
    const result = validateJsonSchemaDocuments('{"type":"unknown"}', '{}', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe('schema-invalid');
  });

  it('reports false schemas as ordinary validation failures', () => {
    const result = validateJsonSchemaDocuments('false', '{}', { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('creates and verifies a conservative corrected example', () => {
    const schema = JSON.stringify({
      type: 'object',
      required: ['name', 'email', 'age'],
      properties: {
        name: { type: 'string', examples: ['Ada'] },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 18 },
      },
      additionalProperties: false,
    });
    const result = validateJsonSchemaDocuments(schema, '{"email":"x","age":12,"extra":true}', {
      draft: 'auto',
      validateFormats: true,
    });

    expect(result.valid).toBe(false);
    expect(result.correction?.valid).toBe(true);
    expect(JSON.parse(result.correction?.source ?? '{}')).toEqual({
      email: 'utilisateur@example.com',
      age: 18,
      name: 'Ada',
    });
  });

  it('creates a valid minLength correction for astral Unicode characters', () => {
    const result = validateJsonSchemaDocuments('{"type":"string","minLength":2}', '"😀"', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.correction).toMatchObject({ valid: true, source: '"😀a"' });
  });

  it('does not advertise a non-finite exclusive-bound correction', () => {
    const schema = JSON.stringify({ type: 'number', exclusiveMinimum: Number.MAX_VALUE });
    const result = validateJsonSchemaDocuments(schema, '0', { draft: 'auto', validateFormats: true });
    expect(result.valid).toBe(false);
    expect(result.correction).toBeNull();
  });

  it('caps the exposed error collection while preserving the bounded total', () => {
    const properties = Object.fromEntries(
      Array.from({ length: JSON_SCHEMA_MAX_ERRORS + 1 }, (_, index) => [`field${String(index)}`, { type: 'string' }]),
    );
    const schema = JSON.stringify({
      type: 'object',
      required: Object.keys(properties),
      properties,
    });
    const result = validateJsonSchemaDocuments(schema, '{}', { draft: 'auto', validateFormats: true });
    expect(result.errors).toHaveLength(JSON_SCHEMA_MAX_ERRORS);
    expect(result.totalErrors).toBe(JSON_SCHEMA_MAX_ERRORS + 1);
    expect(result.errorsTruncated).toBe(true);
  });

  it('bounds multiplicative array and allOf failures before Ajv materializes them all', () => {
    const schema = JSON.stringify({
      type: 'array',
      items: {
        allOf: Array.from({ length: 20 }, () => ({ type: 'string' })),
      },
    });
    const instance = JSON.stringify(Array.from({ length: 2_000 }, () => 42));
    const result = validateJsonSchemaDocuments(schema, instance, { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe('validation-limit');
    expect(result.totalErrors).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('accepts a large valid instance with fail-fast validation', () => {
    const schema = '{"type":"array","items":{"type":"number"}}';
    const instance = JSON.stringify(Array.from({ length: 10_000 }, () => 42));
    const result = validateJsonSchemaDocuments(schema, instance, { draft: 'auto', validateFormats: true });
    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('includes only normalized diagnostics in the report', () => {
    const result = validateJsonSchemaDocuments('{"type":"number"}', '"secret-value"', {
      draft: 'auto',
      validateFormats: true,
    });
    expect(result.report).toContain('"keyword": "type"');
    expect(result.report).not.toContain('secret-value');
  });
});
