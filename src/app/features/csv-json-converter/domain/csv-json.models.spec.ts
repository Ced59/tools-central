import { describe, expect, it } from 'vitest';

import {
  CSV_JSON_MAX_SOURCE_CHARACTERS,
  convertCsvJson,
  type CsvJsonConversionOptions,
} from './csv-json.models';

const CSV_DEFAULTS: CsvJsonConversionOptions = {
  direction: 'csv-to-json',
  delimiter: 'auto',
  firstRowHeaders: true,
  trimCells: false,
  inferTypes: true,
  mapping: '',
  protectSpreadsheetFormulas: true,
  includeBom: false,
};

describe('convertCsvJson', () => {
  it('parse un CSV RFC 4180 avec séparateur détecté, guillemets et retours intégrés', () => {
    const result = convertCsvJson(
      'nom;note;actif\r\n"Ada; Lovelace";"ligne 1\nligne 2";true\r\n',
      CSV_DEFAULTS,
    );

    expect(result.ok).toBe(true);
    expect(result.detectedDelimiter).toBe('semicolon');
    expect(JSON.parse(result.output)).toEqual([
      { nom: 'Ada; Lovelace', note: 'ligne 1\nligne 2', actif: true },
    ]);
    expect(result.stats).toMatchObject({ inputRows: 2, outputRows: 1, columns: 3 });
  });

  it('infère seulement les types sûrs et conserve les identifiants à zéro initial', () => {
    const result = convertCsvJson(
      'code,count,ratio,precise,tiny,empty,nil,yes,no\n00123,42,1.25,0.1234567890123456789,1e-400,,null,true,false',
      CSV_DEFAULTS,
    );

    expect(JSON.parse(result.output)).toEqual([{
      code: '00123',
      count: 42,
      ratio: 1.25,
      precise: '0.1234567890123456789',
      tiny: '1e-400',
      empty: '',
      nil: null,
      yes: true,
      no: false,
    }]);
  });

  it('renomme, filtre et réordonne les colonnes via le mapping explicite', () => {
    const result = convertCsvJson(
      'first,last,email\nAda,Lovelace,ada@example.test',
      { ...CSV_DEFAULTS, mapping: 'email => contact\nfirst => prenom' },
    );

    expect(result.previewHeaders).toEqual(['contact', 'prenom']);
    expect(JSON.parse(result.output)).toEqual([
      { contact: 'ada@example.test', prenom: 'Ada' },
    ]);
  });

  it('signale les en-têtes ambigus et stabilise leurs noms sans écraser de valeur', () => {
    const result = convertCsvJson('nom,,nom\nAda,Math,Ada', CSV_DEFAULTS);

    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'empty-header',
      'duplicate-header',
    ]));
    expect(JSON.parse(result.output)).toEqual([
      { nom: 'Ada', colonne_2: 'Math', nom_2: 'Ada' },
    ]);
  });

  it('désambiguïse aussi les suffixes qui existent déjà dans la source', () => {
    const result = convertCsvJson('a,a,a_2\n1,2,3', CSV_DEFAULTS);

    expect(result.ok).toBe(true);
    expect(JSON.parse(result.output)).toEqual([{ a: 1, a_2: 2, a_2_2: 3 }]);
  });

  it('aplatit les objets JSON, sérialise les tableaux et protège les formules de tableur', () => {
    const result = convertCsvJson(JSON.stringify([
      { id: 1, profile: { name: 'Ada' }, tags: ['math', 'code'], note: '=2+2' },
      { id: 2, profile: { name: 'Grace' }, tags: [], note: 'ok' },
    ]), {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
      delimiter: 'semicolon',
      mapping: 'profile.name => personne\nid => identifiant\ntags => etiquettes\nnote => note',
      includeBom: true,
    });

    expect(result.ok).toBe(true);
    expect(result.output.startsWith('\ufeffpersonne;identifiant;etiquettes;note\r\n')).toBe(true);
    expect(result.output).toContain('Ada;1;"[""math"",""code""]";\'=2+2');
    expect(result.issues.some(issue => issue.code === 'spreadsheet-formula-protected')).toBe(true);
  });

  it('préserve les objets vides comme des cellules JSON explicites', () => {
    const result = convertCsvJson('[{"id":1,"profile":{},"nested":{"settings":{}}}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });

    expect(result.ok).toBe(true);
    expect(result.previewHeaders).toEqual(['id', 'profile', 'nested.settings']);
    expect(result.output).toBe('id,profile,nested.settings\r\n1,{},{}');
  });

  it('protège aussi les en-têtes CSV issus des clés ou du mapping', () => {
    const keyResult = convertCsvJson('[{"=2+2":"value"}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });
    const mappingResult = convertCsvJson('[{"safe":"value"}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
      mapping: 'safe => @commande',
    });

    expect(keyResult.output).toBe("'=2+2\r\nvalue");
    expect(mappingResult.output).toBe("'@commande\r\nvalue");
    expect(keyResult.issues[0]?.code).toBe('spreadsheet-formula-protected');
  });

  it('rejette un JSON invalide, une racine non tabulaire et un mapping incohérent', () => {
    const invalidJson = convertCsvJson('{', { ...CSV_DEFAULTS, direction: 'json-to-csv' });
    const invalidRoot = convertCsvJson('{"name":"Ada"}', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });
    const invalidMapping = convertCsvJson('a,b\n1,2', {
      ...CSV_DEFAULTS,
      mapping: 'missing => value\na => value',
    });

    expect(invalidJson.ok).toBe(false);
    expect(invalidJson.issues[0]?.code).toBe('json-invalid');
    expect(invalidRoot.issues[0]?.code).toBe('json-root-not-array');
    expect(invalidMapping.ok).toBe(false);
    expect(invalidMapping.issues.map(issue => issue.code)).toEqual(expect.arrayContaining([
      'mapping-source-missing',
      'mapping-output-duplicate',
    ]));
  });

  it('rejette les nombres que JavaScript arrondirait ou rendrait infinis', () => {
    const unsafeInteger = convertCsvJson('[{"x":9007199254740993}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });
    const overflowingExponent = convertCsvJson('[{"x":1e400}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });
    const preciseDecimal = convertCsvJson('[{"x":0.1234567890123456789}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });

    expect(unsafeInteger.issues[0]?.code).toBe('json-number-unsafe');
    expect(overflowingExponent.issues[0]?.code).toBe('json-number-unsafe');
    expect(preciseDecimal.issues[0]?.code).toBe('json-number-unsafe');
  });

  it('rejette une collision entre une clé pointée et un chemin imbriqué', () => {
    const result = convertCsvJson('[{"a.b":1,"a":{"b":2}}]', {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe('json-path-collision');
  });

  it('arrête proprement une source vide, trop grande ou un champ CSV non fermé', () => {
    const empty = convertCsvJson('   ', CSV_DEFAULTS);
    const oversized = convertCsvJson('x'.repeat(CSV_JSON_MAX_SOURCE_CHARACTERS + 1), CSV_DEFAULTS);
    const malformed = convertCsvJson('name\n"Ada', CSV_DEFAULTS);

    expect(empty.issues[0]?.code).toBe('empty-source');
    expect(oversized.issues[0]?.code).toBe('source-too-large');
    expect(malformed.issues.some(issue => issue.code === 'unclosed-quote')).toBe(true);
    expect(malformed.ok).toBe(false);
  });

  it('tolère des largeurs irrégulières en les signalant et complète les cellules absentes', () => {
    const result = convertCsvJson('a,b,c\n1,2\n3,4,5,6', CSV_DEFAULTS);

    expect(result.issues.filter(issue => issue.code === 'inconsistent-columns')).toHaveLength(2);
    expect(JSON.parse(result.output)).toEqual([
      { a: 1, b: 2, c: '', colonne_4: '' },
      { a: 3, b: 4, c: 5, colonne_4: 6 },
    ]);
  });

  it('ne masque pas une erreur de mapping après le plafond de diagnostics', () => {
    const headers = Array.from({ length: 101 }, () => '').join(',');
    const result = convertCsvJson(`${headers}\n${headers}`, {
      ...CSV_DEFAULTS,
      mapping: 'absente => valeur',
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(100);
    expect(result.issues.some(issue => issue.code === 'mapping-source-missing')).toBe(true);
  });

  it('applique aussi la limite de cellule aux valeurs JSON sérialisées', () => {
    const result = convertCsvJson(JSON.stringify([{ valeur: 'x'.repeat(100_001) }]), {
      ...CSV_DEFAULTS,
      direction: 'json-to-csv',
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ code: 'cell-limit', row: 1, column: 1 });
  });
});
