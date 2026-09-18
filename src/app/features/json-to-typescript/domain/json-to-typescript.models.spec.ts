import { describe, expect, it } from 'vitest';

import {
  generateTypeScriptFromJson,
  JSON_TO_TYPESCRIPT_MAX_NODES,
  JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS,
  normalizeTypeName,
  type JsonToTypeScriptOptions,
} from './json-to-typescript.models';

const DEFAULT_OPTIONS: JsonToTypeScriptOptions = {
  rootName: 'Commande',
  declarationKind: 'interface',
  arrayObjectMode: 'merge',
  inferDates: false,
  readonlyProperties: false,
};

describe('generateTypeScriptFromJson', () => {
  it('generates named interfaces for a nested JSON object', () => {
    const result = generateTypeScriptFromJson(`{
      "id": 42,
      "customer": { "name": "Ada", "active": true },
      "tags": ["vip", "beta"]
    }`, DEFAULT_OPTIONS);

    expect(result.ok).toBe(true);
    expect(result.output).toContain('export interface Commande {');
    expect(result.output).toContain('id: number;');
    expect(result.output).toContain('customer: Customer;');
    expect(result.output).toContain('tags: Array<string>;');
    expect(result.output).toContain('export interface Customer {');
    expect(result.stats).toMatchObject({ declarations: 2, properties: 5, unions: 0 });
  });

  it('merges object samples and marks missing properties as optional', () => {
    const result = generateTypeScriptFromJson(`[
      { "id": 1, "name": "Ada" },
      { "id": 2, "email": "ada@example.test" }
    ]`, { ...DEFAULT_OPTIONS, rootName: 'Users' });

    expect(result.ok).toBe(true);
    expect(result.output).toContain('export type Users = Array<User>;');
    expect(result.output).toContain('name?: string;');
    expect(result.output).toContain('email?: string;');
    expect(result.stats.optionalProperties).toBe(2);
    expect(result.warnings.map(warning => warning.code)).toContain('optional-properties');
  });

  it('merges object samples separated by another union member', () => {
    const result = generateTypeScriptFromJson('[{"a":1},null,{"b":2}]', {
      ...DEFAULT_OPTIONS,
      rootName: 'Users',
    });

    expect(result.ok).toBe(true);
    expect(result.output).toContain('export type Users = Array<User1 | null>;');
    expect(result.output).toContain('a?: number;');
    expect(result.output).toContain('b?: number;');
    expect(result.output).not.toContain('User2');
  });

  it('keeps heterogeneous object samples as a union when requested', () => {
    const result = generateTypeScriptFromJson(`[
      { "kind": "circle", "radius": 4 },
      { "kind": "square", "size": 5 }
    ]`, {
      ...DEFAULT_OPTIONS,
      rootName: 'Shapes',
      declarationKind: 'type',
      arrayObjectMode: 'union',
    });

    expect(result.ok).toBe(true);
    expect(result.output).toMatch(/export type Shapes = Array<Shape1 \| Shape2>;/u);
    expect(result.output).toContain('export type Shape1 = {');
    expect(result.output).toContain('export type Shape2 = {');
    expect(result.stats.unions).toBe(1);
  });

  it('infers primitive unions, nullability, and nested arrays', () => {
    const result = generateTypeScriptFromJson('[1, "two", null, [true, false]]', {
      ...DEFAULT_OPTIONS,
      rootName: 'Values',
    });

    expect(result.ok).toBe(true);
    expect(result.output).toBe('export type Values = Array<Array<boolean> | string | number | null>;\n');
  });

  it('merges array evidence across intervening union members', () => {
    const result = generateTypeScriptFromJson('[[1],null,["two"]]', {
      ...DEFAULT_OPTIONS,
      rootName: 'Values',
    });

    expect(result.output).toBe('export type Values = Array<Array<string | number> | null>;\n');
  });

  it('emits readonly properties and type aliases', () => {
    const result = generateTypeScriptFromJson('{"value":1}', {
      ...DEFAULT_OPTIONS,
      declarationKind: 'type',
      readonlyProperties: true,
    });

    expect(result.output).toContain('export type Commande = {');
    expect(result.output).toContain('readonly value: number;');
  });

  it('quotes property names that are not TypeScript identifiers', () => {
    const result = generateTypeScriptFromJson('{"first-name":"Ada","data value":1,"$ok":true}', DEFAULT_OPTIONS);

    expect(result.output).toContain('"first-name": string;');
    expect(result.output).toContain('"data value": number;');
    expect(result.output).toContain('$ok: boolean;');
  });

  it('normalizes declaration names and resolves collisions deterministically', () => {
    const result = generateTypeScriptFromJson(`{
      "user-profile": { "id": 1 },
      "user profile": { "name": "Ada" }
    }`, { ...DEFAULT_OPTIONS, rootName: '123 résultat' });

    expect(result.normalizedRootName).toBe('Type123Resultat');
    expect(result.output).toContain('user-profile": UserProfile;');
    expect(result.output).toContain('user profile": UserProfile2;');
    expect(result.warnings[0]).toEqual({
      code: 'root-name-normalized',
      count: 1,
      detail: 'Type123Resultat',
    });
  });

  it('does not shadow renderer built-ins with generated declarations', () => {
    const result = generateTypeScriptFromJson(`{
      "array": {},
      "date": {},
      "values": [1],
      "createdAt": "2026-09-18T14:30:00Z"
    }`, { ...DEFAULT_OPTIONS, rootName: 'Array', inferDates: true });

    expect(result.normalizedRootName).toBe('ArrayType');
    expect(result.output).toContain('export interface ArrayType {');
    expect(result.output).toContain('array: ArrayType2;');
    expect(result.output).toContain('date: DateType;');
    expect(result.output).toContain('values: Array<number>;');
    expect(result.output).toContain('createdAt: Date;');
    expect(result.output).not.toContain('export interface Array {');
    expect(result.output).not.toContain('export interface Date {');
  });

  it('infers only valid ISO dates when enabled', () => {
    const result = generateTypeScriptFromJson(`{
      "createdAt": "2026-09-18T14:30:00Z",
      "birthday": "1815-12-10",
      "invalid": "2026-02-30",
      "invalidDateTime": "2026-02-30T12:00:00Z",
      "withoutZone": "2026-09-18T14:30:00"
    }`, { ...DEFAULT_OPTIONS, inferDates: true });

    expect(result.output).toContain('createdAt: Date;');
    expect(result.output).toContain('birthday: Date;');
    expect(result.output).toContain('invalid: string;');
    expect(result.output).toContain('invalidDateTime: string;');
    expect(result.output).toContain('withoutZone: string;');
    expect(result.stats.inferredDates).toBe(2);
    expect(result.warnings).toContainEqual({ code: 'date-inference', count: 2, detail: '' });
  });

  it('enforces the ISO timezone offset boundary', () => {
    const result = generateTypeScriptFromJson(`{
      "maximumOffset": "2026-01-01T00:00:00+14:00",
      "minutesPastMaximum": "2026-01-01T00:00:00+14:01",
      "hoursPastMaximum": "2026-01-01T00:00:00+23:00"
    }`, { ...DEFAULT_OPTIONS, inferDates: true });

    expect(result.output).toContain('maximumOffset: Date;');
    expect(result.output).toContain('minutesPastMaximum: string;');
    expect(result.output).toContain('hoursPastMaximum: string;');
    expect(result.stats.inferredDates).toBe(1);
  });

  it('widens mixed date and ordinary strings without claiming a Date output', () => {
    const result = generateTypeScriptFromJson('[{"value":"2026-09-18"},{"value":"pending"}]', {
      ...DEFAULT_OPTIONS,
      inferDates: true,
    });

    expect(result.output).toContain('value: string;');
    expect(result.output).not.toContain('Date');
    expect(result.stats.inferredDates).toBe(0);
    expect(result.warnings.map(warning => warning.code)).not.toContain('date-inference');
  });

  it('widens dates separated from strings by another union member', () => {
    const result = generateTypeScriptFromJson(`[
      {"value":"2026-09-18"},
      {"value":null},
      {"value":"pending"}
    ]`, { ...DEFAULT_OPTIONS, inferDates: true });

    expect(result.output).toContain('value: string | null;');
    expect(result.output).not.toContain('Date');
    expect(result.stats.inferredDates).toBe(0);
    expect(result.warnings.map(warning => warning.code)).not.toContain('date-inference');
  });

  it('uses populated arrays as evidence when another sample is empty', () => {
    const result = generateTypeScriptFromJson('[{"items":[]},{"items":[1]}]', DEFAULT_OPTIONS);

    expect(result.output).toContain('items: Array<number>;');
    expect(result.output).not.toContain('number | unknown');
    expect(result.warnings).toContainEqual({ code: 'empty-array', count: 1, detail: '' });
  });

  it('falls back to unknown for empty arrays and reports empty shapes', () => {
    const result = generateTypeScriptFromJson('{"items":[],"metadata":{}}', DEFAULT_OPTIONS);

    expect(result.output).toContain('items: Array<unknown>;');
    expect(result.warnings).toContainEqual({ code: 'empty-array', count: 1, detail: '' });
    expect(result.warnings).toContainEqual({ code: 'empty-object', count: 1, detail: '' });
  });

  it('does not corrupt singular names that naturally end with s', () => {
    const result = generateTypeScriptFromJson('{"status":[{"code":200}]}', DEFAULT_OPTIONS);

    expect(result.output).toContain('status: Array<Status>;');
    expect(result.output).toContain('export interface Status {');
  });

  it('does not include source values in the generated report', () => {
    const result = generateTypeScriptFromJson('{"secret":"private-token-123"}', DEFAULT_OPTIONS);

    expect(result.report).not.toContain('private-token-123');
    expect(result.report).not.toContain('secret');
    expect(JSON.parse(result.report)).toMatchObject({ rootName: 'Commande' });
  });

  it.each([
    ['', 'empty-source'],
    ['{"id":1,"id":2}', 'duplicate-key'],
    ['{"id":9007199254740993}', 'unsafe-number'],
    ['{"id":1,}', 'invalid-json'],
    ['{"text":"\\ud800"}', 'invalid-unicode'],
  ] as const)('rejects unsafe input %#', (source, code) => {
    const result = generateTypeScriptFromJson(source, DEFAULT_OPTIONS);

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe(code);
    expect(result.output).toBe('');
  });

  it('accepts exact decimal and signed-zero numbers', () => {
    const result = generateTypeScriptFromJson('{"decimal":0.125,"zero":-0.0}', DEFAULT_OPTIONS);

    expect(result.ok).toBe(true);
    expect(result.output).toContain('decimal: number;');
    expect(result.output).toContain('zero: number;');
  });

  it('compares large integer tokens with the represented IEEE-754 value', () => {
    const lossy = generateTypeScriptFromJson('{"value":1000000000000000100}', DEFAULT_OPTIONS);
    const exact = generateTypeScriptFromJson('{"value":1000000000000000128}', DEFAULT_OPTIONS);

    expect(lossy.issues[0].code).toBe('unsafe-number');
    expect(exact.ok).toBe(true);
    expect(exact.output).toContain('value: number;');
  });

  it('rejects a source above the character limit without parsing it', () => {
    const result = generateTypeScriptFromJson(
      `"${'x'.repeat(JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS)}"`,
      DEFAULT_OPTIONS,
    );

    expect(result.issues[0].code).toBe('source-too-large');
    expect(result.stats.nodes).toBe(0);
  });

  it('enforces the node limit', () => {
    const values = Array.from({ length: JSON_TO_TYPESCRIPT_MAX_NODES + 1 }, () => '0').join(',');
    const result = generateTypeScriptFromJson(`[${values}]`, DEFAULT_OPTIONS);

    expect(result.issues[0].code).toBe('node-limit');
  });

  it('enforces the nesting limit', () => {
    const source = `${'['.repeat(66)}0${']'.repeat(66)}`;
    const result = generateTypeScriptFromJson(source, DEFAULT_OPTIONS);

    expect(result.issues[0].code).toBe('depth-limit');
  });
});

describe('normalizeTypeName', () => {
  it.each([
    ['order item', 'OrderItem'],
    ['résultat-api', 'ResultatApi'],
    ['42 answers', 'Type42Answers'],
    ['Array', 'ArrayType'],
    ['Date', 'DateType'],
    ['', 'Root'],
    ['___', '___'],
  ])('normalizes %s', (value, expected) => {
    expect(normalizeTypeName(value)).toBe(expected);
  });
});
