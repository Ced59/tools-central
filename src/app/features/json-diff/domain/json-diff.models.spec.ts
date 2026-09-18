import { describe, expect, it } from 'vitest';

import {
  compareJsonDocuments,
  JSON_DIFF_MAX_CHANGES,
  JSON_DIFF_MAX_DEPTH,
  JSON_DIFF_MAX_NODES,
  JSON_DIFF_MAX_SOURCE_CHARACTERS,
  type JsonDiffOptions,
  type JsonValue,
} from './json-diff.models';

const DEFAULTS: JsonDiffOptions = {
  arrayMode: 'index',
  arrayKey: '/id',
  ignoredPaths: '',
};

describe('compareJsonDocuments', () => {
  it('compare les objets sans dépendre de l’ordre ni du formatage des clés', () => {
    const result = compareJsonDocuments(
      '{"name":"Ada","active":true,"profile":{"score":98}}',
      '{\n  "profile": {"score": 99}, "active": true, "name": "Ada", "city": "Londres"\n}',
      DEFAULTS,
    );

    expect(result.ok).toBe(true);
    expect(result.equivalent).toBe(false);
    expect(result.summary).toMatchObject({ added: 1, changed: 1, total: 2 });
    expect(result.changes.map(change => [change.kind, change.path])).toEqual([
      ['changed', '/profile/score'],
      ['added', '/city'],
    ]);
  });

  it('déclare équivalents deux documents qui ne diffèrent que par leur mise en forme', () => {
    const result = compareJsonDocuments('{"b":[1,2],"a":null}', '{ "a": null, "b": [1, 2] }', DEFAULTS);

    expect(result.ok).toBe(true);
    expect(result.equivalent).toBe(true);
    expect(result.summary.total).toBe(0);
    expect(result.patch).toBe('[]');
  });

  it('distingue un changement de type d’un changement de valeur', () => {
    const result = compareJsonDocuments('{"value":"1","enabled":true}', '{"value":1,"enabled":false}', DEFAULTS);

    expect(result.summary).toMatchObject({ changed: 1, typeChanged: 1, total: 2 });
    expect(result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'changed', path: '/enabled', before: 'true', after: 'false' }),
      expect.objectContaining({ kind: 'type-changed', path: '/value', before: '"1"', after: '1' }),
    ]));
  });

  it('échappe les segments de JSON Pointer dans les changements et le patch', () => {
    const result = compareJsonDocuments('{"a/b":{"x~y":1}}', '{"a/b":{"x~y":2}}', DEFAULTS);

    expect(result.changes[0]?.path).toBe('/a~1b/x~0y');
    expect(JSON.parse(result.patch)).toEqual([{ op: 'replace', path: '/a~1b/x~0y', value: 2 }]);
  });

  it('produit un patch applicable avec ajouts et suppressions de tableaux', () => {
    const left = { items: ['a', 'b', 'c'], meta: { keep: true, old: 1 } };
    const right = { items: ['a', 'x'], meta: { keep: true, next: 2 } };
    const result = compareJsonDocuments(JSON.stringify(left), JSON.stringify(right), DEFAULTS);

    expect(result.ok).toBe(true);
    expect(applyPatch(left, JSON.parse(result.patch) as PatchOperation[])).toEqual(right);
  });

  it('remplace la racine avec un chemin vide conforme à RFC 6902', () => {
    const result = compareJsonDocuments('1', '{"value":1}', DEFAULTS);

    expect(JSON.parse(result.patch)).toEqual([{ op: 'replace', path: '', value: { value: 1 } }]);
    expect(result.changes[0]).toMatchObject({ kind: 'type-changed', path: '/' });
  });

  it('associe les objets d’un tableau par une clé JSON Pointer et signale les déplacements', () => {
    const result = compareJsonDocuments(
      '[{"id":"a","score":1},{"id":"b","score":2}]',
      '[{"id":"b","score":3},{"id":"a","score":1},{"id":"c","score":4}]',
      { ...DEFAULTS, arrayMode: 'key' },
    );

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({ added: 1, changed: 1, moved: 2, total: 4 });
    expect(result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'changed', path: '/@~1id="b"/score', before: '2', after: '3' }),
      expect.objectContaining({ kind: 'added', path: '/@~1id="c"', afterIndex: 2 }),
    ]));
  });

  it('résout une clé imbriquée pour l’association des tableaux', () => {
    const result = compareJsonDocuments(
      '[{"meta":{"key":1},"value":"a"}]',
      '[{"meta":{"key":1},"value":"b"}]',
      { ...DEFAULTS, arrayMode: 'key', arrayKey: '/meta/key' },
    );

    expect(result.ok).toBe(true);
    expect(result.changes[0]).toMatchObject({ kind: 'changed', path: '/@~1meta~1key=1/value' });
  });

  it('compare les tableaux de scalaires par index même en mode clé', () => {
    const result = compareJsonDocuments('["a","b"]', '["a","c"]', {
      ...DEFAULTS,
      arrayMode: 'key',
    });

    expect(result.ok).toBe(true);
    expect(result.changes[0]).toMatchObject({ kind: 'changed', path: '/1' });
  });

  it('rejette une clé d’association absente ou dupliquée', () => {
    const missing = compareJsonDocuments('[{"id":1}]', '[{"name":"Ada"}]', {
      ...DEFAULTS,
      arrayMode: 'key',
    });
    const duplicate = compareJsonDocuments('[{"id":1},{"id":1}]', '[]', {
      ...DEFAULTS,
      arrayMode: 'key',
    });

    expect(missing.issues[0]).toMatchObject({ code: 'array-key-invalid', path: '/0' });
    expect(duplicate.issues[0]?.code).toBe('array-key-duplicate');
  });

  it('exige un JSON Pointer non vide pour la clé d’association', () => {
    const result = compareJsonDocuments('[]', '[]', { ...DEFAULTS, arrayMode: 'key', arrayKey: '' });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe('array-key-required');
  });

  it('ignore des sous-arbres déclarés par JSON Pointer', () => {
    const result = compareJsonDocuments(
      '{"meta":{"updated":"a","keep":1},"items":[1,2]}',
      '{"meta":{"updated":"b","keep":1},"items":[1,3]}',
      { ...DEFAULTS, ignoredPaths: '/meta/updated\n/items' },
    );

    expect(result.ok).toBe(true);
    expect(result.equivalent).toBe(true);
    expect(result.stats.ignoredPaths).toBe(2);
    expect(result.patch).toBe('[]');
  });

  it('retire les descendants ignorés des objets ajoutés dans le rapport et le patch', () => {
    const result = compareJsonDocuments(
      '{}',
      '{"account":{"name":"Ada","secret":"secret-token"}}',
      { ...DEFAULTS, ignoredPaths: '/account/secret' },
    );

    expect(result.ok).toBe(true);
    expect(result.changes[0]).toMatchObject({
      kind: 'added',
      path: '/account',
      after: '{"name":"Ada"}',
    });
    expect(JSON.parse(result.patch)).toEqual([
      { op: 'add', path: '/account', value: { name: 'Ada' } },
    ]);
    expect(result.report).not.toContain('secret-token');
    expect(result.patch).not.toContain('secret-token');
  });

  it('applique les chemins ignorés aux index réels avant de construire un chemin par clé', () => {
    const result = compareJsonDocuments(
      '[{"id":"a","secret":"avant","keep":1}]',
      '[{"id":"a","secret":"après","keep":1}]',
      { ...DEFAULTS, arrayMode: 'key', ignoredPaths: '/0/secret' },
    );

    expect(result.ok).toBe(true);
    expect(result.equivalent).toBe(true);
    expect(result.changes).toEqual([]);
    expect(result.patch).toBe('[]');
  });

  it('conserve les identifiants complets et distincts dans les chemins des tableaux par clé', () => {
    const prefix = 'x'.repeat(260);
    const first = `${prefix}a`;
    const second = `${prefix}b`;
    const result = compareJsonDocuments(
      JSON.stringify([{ id: first, value: 1 }, { id: second, value: 1 }]),
      JSON.stringify([{ id: first, value: 2 }, { id: second, value: 2 }]),
      { ...DEFAULTS, arrayMode: 'key' },
    );
    const report = JSON.parse(result.report) as { changes: Array<{ path: string }> };
    const paths = report.changes.map(change => change.path);

    expect(result.ok).toBe(true);
    expect(paths).toHaveLength(2);
    expect(new Set(paths).size).toBe(2);
    expect(paths[0]).toContain(`${first}"/value`);
    expect(paths[1]).toContain(`${second}"/value`);
  });

  it('masque une clé d’association ignorée dans les chemins du rapport', () => {
    const result = compareJsonDocuments(
      '[{"id":"customer-secret","value":1}]',
      '[{"id":"customer-secret","value":2}]',
      { ...DEFAULTS, arrayMode: 'key', ignoredPaths: '/0/id' },
    );

    expect(result.ok).toBe(true);
    expect(result.changes[0]?.path).toBe('/@~1id=#1/value');
    expect(result.report).not.toContain('customer-secret');
    expect(result.patch).not.toContain('customer-secret');
  });

  it('exclut les éléments ignorés avant de valider leur clé d’association', () => {
    const missingKey = compareJsonDocuments(
      '[{"ignored":true},{"id":"a","value":1}]',
      '[{"ignored":false},{"id":"a","value":2}]',
      { ...DEFAULTS, arrayMode: 'key', ignoredPaths: '/0' },
    );
    const duplicateKey = compareJsonDocuments(
      '[{"id":"a","ignored":true},{"id":"a","value":1}]',
      '[{"id":"a","ignored":false},{"id":"a","value":2}]',
      { ...DEFAULTS, arrayMode: 'key', ignoredPaths: '/0' },
    );

    expect(missingKey.ok).toBe(true);
    expect(missingKey.changes).toEqual([
      expect.objectContaining({ kind: 'changed', path: '/@~1id="a"/value' }),
    ]);
    expect(duplicateKey.ok).toBe(true);
    expect(duplicateKey.issues).toEqual([]);
  });

  it('préserve les espaces significatifs des segments JSON Pointer', () => {
    const ignored = compareJsonDocuments('{" key ":1}', '{" key ":2}', {
      ...DEFAULTS,
      ignoredPaths: '/ key ',
    });
    const keyed = compareJsonDocuments(
      '[{"id ":"a","value":1}]',
      '[{"id ":"a","value":2}]',
      { ...DEFAULTS, arrayMode: 'key', arrayKey: '/id ' },
    );

    expect(ignored.equivalent).toBe(true);
    expect(keyed.ok).toBe(true);
    expect(keyed.changes[0]?.path).toBe('/@~1id ="a"/value');
  });

  it('n’ajoute ni ne retire un élément de tableau dont le chemin est ignoré', () => {
    const added = compareJsonDocuments('["a"]', '["a","volatile"]', {
      ...DEFAULTS,
      ignoredPaths: '/1',
    });
    const removed = compareJsonDocuments('["a","volatile"]', '["a"]', {
      ...DEFAULTS,
      ignoredPaths: '/1',
    });

    expect(added.equivalent).toBe(true);
    expect(removed.equivalent).toBe(true);
    expect(added.patch).toBe('[]');
    expect(removed.patch).toBe('[]');
  });

  it('normalise les échappements des chemins ignorés', () => {
    const result = compareJsonDocuments('{"a/b":{"x~y":1}}', '{"a/b":{"x~y":2}}', {
      ...DEFAULTS,
      ignoredPaths: '/a~1b/x~0y',
    });

    expect(result.equivalent).toBe(true);
  });

  it('rejette un chemin ignoré qui n’est pas un JSON Pointer valide', () => {
    const result = compareJsonDocuments('{}', '{}', { ...DEFAULTS, ignoredPaths: 'meta.date\n/a~2b' });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe('invalid-ignore-path');
  });

  it('rejette les sources vides ou trop longues avant le parsing', () => {
    const empty = compareJsonDocuments(' ', '{}', DEFAULTS);
    const oversized = compareJsonDocuments('{}', 'x'.repeat(JSON_DIFF_MAX_SOURCE_CHARACTERS + 1), DEFAULTS);

    expect(empty.issues[0]).toMatchObject({ code: 'empty-source', side: 'left' });
    expect(oversized.issues[0]).toMatchObject({ code: 'source-too-large', side: 'right' });
  });

  it('attribue les erreurs de syntaxe au bon document', () => {
    const left = compareJsonDocuments('{"x":}', '{}', DEFAULTS);
    const right = compareJsonDocuments('{}', '[1,]', DEFAULTS);

    expect(left.issues[0]).toMatchObject({ code: 'invalid-json', side: 'left' });
    expect(right.issues[0]).toMatchObject({ code: 'invalid-json', side: 'right' });
    expect(left.issues[0]?.position).toBeTypeOf('number');
  });

  it('rejette les membres dupliqués même lorsqu’ils utilisent un échappement différent', () => {
    const result = compareJsonDocuments('{"a":1,"\\u0061":2}', '{}', DEFAULTS);

    expect(result.issues[0]).toMatchObject({ code: 'duplicate-key', side: 'left', detail: 'a' });
  });

  it('accepte seulement les nombres représentables sans perte', () => {
    const safe = compareJsonDocuments('{"x":1e3,"y":1.25}', '{"x":1000,"y":1.25}', DEFAULTS);
    const unsafeInteger = compareJsonDocuments('{"x":9007199254740993}', '{}', DEFAULTS);
    const negativeZero = compareJsonDocuments('{}', '{"x":-0}', DEFAULTS);

    expect(safe.equivalent).toBe(true);
    expect(unsafeInteger.issues[0]).toMatchObject({ code: 'unsafe-number', side: 'left' });
    expect(negativeZero.issues[0]).toMatchObject({ code: 'unsafe-number', side: 'right' });
  });

  it('rejette les surrogates UTF-16 non appariés dans les valeurs et les clés', () => {
    const value = compareJsonDocuments('{"x":"\\ud800"}', '{}', DEFAULTS);
    const key = compareJsonDocuments('{}', '{"\\udc00":1}', DEFAULTS);

    expect(value.issues[0]).toMatchObject({ code: 'invalid-unicode', side: 'left' });
    expect(key.issues[0]).toMatchObject({ code: 'invalid-unicode', side: 'right' });
  });

  it('borne la profondeur avant de construire des structures excessives', () => {
    const deep = `${'['.repeat(JSON_DIFF_MAX_DEPTH + 2)}0${']'.repeat(JSON_DIFF_MAX_DEPTH + 2)}`;
    const result = compareJsonDocuments(deep, '[]', DEFAULTS);

    expect(result.issues[0]).toMatchObject({ code: 'depth-limit', side: 'left' });
  });

  it('borne le nombre de nœuds par document', () => {
    const many = `[${Array.from({ length: JSON_DIFF_MAX_NODES }, () => '0').join(',')}]`;
    const result = compareJsonDocuments(many, '[]', DEFAULTS);

    expect(result.issues[0]).toMatchObject({ code: 'node-limit', side: 'left' });
  });

  it('borne le nombre de différences et ne renvoie pas de résultat partiel', () => {
    const left = JSON.stringify(Array.from({ length: JSON_DIFF_MAX_CHANGES + 1 }, () => 0));
    const right = JSON.stringify(Array.from({ length: JSON_DIFF_MAX_CHANGES + 1 }, () => 1));
    const result = compareJsonDocuments(left, right, DEFAULTS);

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe('change-limit');
    expect(result.changes).toEqual([]);
    expect(result.patch).toBe('');
  });

  it('tronque uniquement l’aperçu et conserve le rapport complet', () => {
    const left = JSON.stringify(Array.from({ length: 501 }, () => 0));
    const right = JSON.stringify(Array.from({ length: 501 }, () => 1));
    const result = compareJsonDocuments(left, right, DEFAULTS);

    expect(result.ok).toBe(true);
    expect(result.changes).toHaveLength(500);
    expect(result.changesTruncated).toBe(true);
    expect((JSON.parse(result.report) as { changes: unknown[] }).changes).toHaveLength(501);
  });

  it('traite les noms spéciaux comme des propriétés de données ordinaires', () => {
    const result = compareJsonDocuments(
      '{"__proto__":{"polluted":false},"constructor":1}',
      '{"__proto__":{"polluted":true},"constructor":2}',
      DEFAULTS,
    );

    expect(result.ok).toBe(true);
    expect(result.summary.changed).toBe(2);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});

interface PatchOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: JsonValue;
}

function applyPatch(source: JsonValue, operations: readonly PatchOperation[]): JsonValue {
  let result = JSON.parse(JSON.stringify(source)) as JsonValue;
  for (const operation of operations) {
    if (operation.path === '') {
      if (operation.op === 'remove') throw new Error('Root removal is not used by this tool.');
      result = clone(operation.value as JsonValue);
      continue;
    }
    const segments = operation.path.slice(1).split('/').map(decodePointerSegment);
    const key = segments.pop();
    if (key === undefined) throw new Error('Invalid patch path.');
    let parent = result;
    for (const segment of segments) {
      parent = Array.isArray(parent)
        ? parent[Number(segment)]
        : (parent as Record<string, JsonValue>)[segment];
    }
    if (Array.isArray(parent)) {
      const index = key === '-' ? parent.length : Number(key);
      if (operation.op === 'remove') parent.splice(index, 1);
      else if (operation.op === 'add') parent.splice(index, 0, clone(operation.value as JsonValue));
      else parent[index] = clone(operation.value as JsonValue);
    } else {
      const record = parent as Record<string, JsonValue>;
      if (operation.op === 'remove') Reflect.deleteProperty(record, key);
      else record[key] = clone(operation.value as JsonValue);
    }
  }
  return result;
}

function decodePointerSegment(value: string): string {
  return value.replace(/~1/gu, '/').replace(/~0/gu, '~');
}

function clone<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
