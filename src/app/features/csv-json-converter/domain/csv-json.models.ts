export const CSV_JSON_MAX_SOURCE_CHARACTERS = 4_000_000;
export const CSV_JSON_MAX_OUTPUT_CHARACTERS = 16_000_000;
export const CSV_JSON_MAX_ROWS = 100_000;
export const CSV_JSON_MAX_COLUMNS = 250;
export const CSV_JSON_MAX_CELL_CHARACTERS = 100_000;
export const CSV_JSON_MAX_ISSUES = 100;
export const CSV_JSON_PREVIEW_ROWS = 12;

export type CsvJsonDirection = 'csv-to-json' | 'json-to-csv';
export type CsvJsonDelimiter = 'auto' | 'comma' | 'semicolon' | 'tab' | 'pipe';
export type CsvJsonIssueSeverity = 'error' | 'warning' | 'info';
export type CsvJsonIssueCode =
  | 'empty-source'
  | 'source-too-large'
  | 'output-too-large'
  | 'row-limit'
  | 'column-limit'
  | 'cell-limit'
  | 'unclosed-quote'
  | 'unexpected-after-quote'
  | 'inconsistent-columns'
  | 'empty-header'
  | 'duplicate-header'
  | 'delimiter-fallback'
  | 'mapping-invalid'
  | 'mapping-source-missing'
  | 'mapping-output-duplicate'
  | 'csv-header-collision'
  | 'json-invalid'
  | 'json-number-unsafe'
  | 'json-root-not-array'
  | 'json-row-not-object'
  | 'json-no-columns'
  | 'json-unicode-invalid'
  | 'json-depth-limit'
  | 'json-path-collision'
  | 'spreadsheet-formula-protected';

export interface CsvJsonConversionOptions {
  direction: CsvJsonDirection;
  delimiter: CsvJsonDelimiter;
  firstRowHeaders: boolean;
  trimCells: boolean;
  inferTypes: boolean;
  mapping: string;
  protectSpreadsheetFormulas: boolean;
  includeBom: boolean;
}

export interface CsvJsonIssue {
  code: CsvJsonIssueCode;
  severity: CsvJsonIssueSeverity;
  row: number | null;
  column: number | null;
  detail: string;
}

export interface CsvJsonConversionStats {
  inputRows: number;
  outputRows: number;
  columns: number;
  inputCharacters: number;
  outputCharacters: number;
}

export interface CsvJsonConversionResult {
  ok: boolean;
  direction: CsvJsonDirection;
  output: string;
  outputMediaType: 'application/json;charset=utf-8' | 'text/csv;charset=utf-8';
  outputExtension: 'json' | 'csv';
  detectedDelimiter: Exclude<CsvJsonDelimiter, 'auto'>;
  previewHeaders: string[];
  previewRows: string[][];
  issues: CsvJsonIssue[];
  stats: CsvJsonConversionStats;
}

interface MutableConversionState {
  issues: CsvJsonIssue[];
  hasError: boolean;
}

interface CsvParseResult {
  rows: string[][];
  delimiter: Exclude<CsvJsonDelimiter, 'auto'>;
}

interface ColumnMapping {
  source: string;
  output: string;
}

const DELIMITERS: Readonly<Record<Exclude<CsvJsonDelimiter, 'auto'>, string>> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
};

export function convertCsvJson(
  rawSource: string,
  options: CsvJsonConversionOptions,
): CsvJsonConversionResult {
  const state: MutableConversionState = { issues: [], hasError: false };
  const source = rawSource.replace(/^\ufeff/u, '');
  const fallbackDelimiter = options.delimiter === 'auto' ? 'comma' : options.delimiter;
  if (!source.trim()) {
    addIssue(state, 'empty-source', 'error');
    return emptyResult(options.direction, fallbackDelimiter, source.length, state.issues);
  }
  if (source.length > CSV_JSON_MAX_SOURCE_CHARACTERS) {
    addIssue(state, 'source-too-large', 'error');
    return emptyResult(options.direction, fallbackDelimiter, source.length, state.issues);
  }

  return options.direction === 'csv-to-json'
    ? convertCsvToJson(source, options, state)
    : convertJsonToCsv(source, options, state);
}

function convertCsvToJson(
  source: string,
  options: CsvJsonConversionOptions,
  state: MutableConversionState,
): CsvJsonConversionResult {
  const parsed = parseCsv(
    source,
    options.delimiter,
    state,
    CSV_JSON_MAX_ROWS + (options.firstRowHeaders ? 1 : 0),
  );
  if (hasErrors(state)) return emptyResult('csv-to-json', parsed.delimiter, source.length, state.issues);
  const widestRow = parsed.rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const sourceHeaders = createHeaders(
    options.firstRowHeaders ? (parsed.rows[0] ?? []) : [],
    widestRow,
    options.firstRowHeaders,
    state,
  );
  const dataRows = options.firstRowHeaders ? parsed.rows.slice(1) : parsed.rows;
  const mapping = parseMapping(options.mapping, sourceHeaders, state);
  if (hasErrors(state)) return emptyResult('csv-to-json', parsed.delimiter, source.length, state.issues);
  const sourceIndexes = new Map(sourceHeaders.map((header, index) => [header, index]));
  const outputChunks = ['['];
  let outputCharacters = 1;
  const previewRows: string[][] = [];
  const appendOutput = (chunk: string): boolean => {
    if (outputCharacters + chunk.length > CSV_JSON_MAX_OUTPUT_CHARACTERS) {
      addIssue(state, 'output-too-large', 'error');
      return false;
    }
    outputChunks.push(chunk);
    outputCharacters += chunk.length;
    return true;
  };

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex];
    if (row.length !== sourceHeaders.length) {
      addIssue(
        state,
        'inconsistent-columns',
        'warning',
        rowIndex + (options.firstRowHeaders ? 2 : 1),
        null,
        `${String(row.length)}/${String(sourceHeaders.length)}`,
      );
    }
    if (!appendOutput(rowIndex === 0 ? '\n  {\n' : ',\n  {\n')) break;
    const preview: string[] = [];
    for (let mappingIndex = 0; mappingIndex < mapping.length; mappingIndex += 1) {
      const entry = mapping[mappingIndex];
      const columnIndex = sourceIndexes.get(entry.source) ?? -1;
      const rawValue = columnIndex >= 0 ? (row[columnIndex] ?? '') : '';
      const normalized = options.trimCells ? rawValue.trim() : rawValue;
      const value = options.inferTypes ? inferCsvValue(normalized) : normalized;
      const serializedKey = JSON.stringify(entry.output);
      const serializedValue = JSON.stringify(value);
      const propertySuffix = mappingIndex === mapping.length - 1 ? '\n' : ',\n';
      if (!appendOutput(`    ${serializedKey}: ${serializedValue}${propertySuffix}`)) break;
      preview.push(previewValue(value));
    }
    if (hasErrors(state) || !appendOutput('  }')) break;
    if (previewRows.length < CSV_JSON_PREVIEW_ROWS) previewRows.push(preview);
  }

  if (hasErrors(state)) {
    return emptyResult('csv-to-json', parsed.delimiter, source.length, state.issues);
  }
  if (!appendOutput(dataRows.length > 0 ? '\n]' : ']')) {
    return emptyResult('csv-to-json', parsed.delimiter, source.length, state.issues);
  }
  const output = outputChunks.join('');
  return result({
    direction: 'csv-to-json',
    output,
    delimiter: parsed.delimiter,
    headers: mapping.map(entry => entry.output),
    previewRows,
    issues: state.issues,
    inputRows: parsed.rows.length,
    outputRows: dataRows.length,
    inputCharacters: source.length,
  });
}

function convertJsonToCsv(
  source: string,
  options: CsvJsonConversionOptions,
  state: MutableConversionState,
): CsvJsonConversionResult {
  validateJsonNumbers(source, state);
  if (hasErrors(state)) {
    return emptyResult('json-to-csv', selectedOutputDelimiter(options.delimiter), source.length, state.issues);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error: unknown) {
    addIssue(state, 'json-invalid', 'error', null, null, errorDetail(error));
    return emptyResult('json-to-csv', selectedOutputDelimiter(options.delimiter), source.length, state.issues);
  }
  if (!Array.isArray(parsed)) {
    addIssue(state, 'json-root-not-array', 'error');
    return emptyResult('json-to-csv', selectedOutputDelimiter(options.delimiter), source.length, state.issues);
  }
  const parsedRows = parsed as unknown[];
  if (parsedRows.length > CSV_JSON_MAX_ROWS) {
    addIssue(state, 'row-limit', 'error');
    return emptyResult('json-to-csv', selectedOutputDelimiter(options.delimiter), source.length, state.issues);
  }

  const flattenedRows: Record<string, unknown>[] = [];
  const headers: string[] = [];
  const knownHeaders = new Set<string>();
  for (let rowIndex = 0; rowIndex < parsedRows.length; rowIndex += 1) {
    const row = parsedRows[rowIndex];
    if (!isRecord(row)) {
      addIssue(state, 'json-row-not-object', 'error', rowIndex + 1);
      continue;
    }
    if (!validateJsonRowStructure(row, state, rowIndex + 1)) break;
    const flattened = Object.create(null) as Record<string, unknown>;
    flattenRecord(row, '', flattened, state, rowIndex + 1, 0);
    flattenedRows.push(flattened);
    for (const key of Object.keys(flattened)) {
      if (!knownHeaders.has(key)) {
        knownHeaders.add(key);
        headers.push(key);
      }
      if (headers.length > CSV_JSON_MAX_COLUMNS) {
        addIssue(state, 'column-limit', 'error');
        break;
      }
    }
    if (hasErrors(state)) break;
  }
  if (!hasErrors(state) && parsedRows.length > 0 && headers.length === 0) {
    addIssue(state, 'json-no-columns', 'error');
  }
  const mapping = parseMapping(options.mapping, headers, state);
  if (hasErrors(state)) {
    return emptyResult('json-to-csv', selectedOutputDelimiter(options.delimiter), source.length, state.issues);
  }

  const delimiter = selectedOutputDelimiter(options.delimiter);
  const delimiterCharacter = DELIMITERS[delimiter];
  const outputLines: string[] = [];
  const previewRows: string[][] = [];
  let protectedFormulaCount = 0;
  const knownOutputHeaders = new Set<string>();
  const outputHeaders = mapping.map((entry, columnIndex) => {
    let outputHeader = entry.output;
    if (options.protectSpreadsheetFormulas && isSpreadsheetFormula(outputHeader, outputHeader)) {
      protectedFormulaCount += 1;
      outputHeader = `'${outputHeader}`;
    }
    if (outputHeader.length > CSV_JSON_MAX_CELL_CHARACTERS) {
      addIssue(state, 'cell-limit', 'error', 1, columnIndex + 1);
    }
    if (knownOutputHeaders.has(outputHeader)) {
      addIssue(state, 'csv-header-collision', 'error', 1, columnIndex + 1, outputHeader.slice(0, 160));
    }
    knownOutputHeaders.add(outputHeader);
    return outputHeader;
  });
  if (hasErrors(state)) {
    return emptyResult('json-to-csv', delimiter, source.length, state.issues);
  }
  const bom = options.includeBom ? '\ufeff' : '';
  const headerLine = encodeCsvRowWithinLimit(
    outputHeaders,
    delimiterCharacter,
    bom.length,
    false,
    state,
  );
  if (headerLine === null) {
    return emptyResult('json-to-csv', delimiter, source.length, state.issues);
  }
  outputLines.push(headerLine);
  let outputCharacters = bom.length + headerLine.length;
  for (const [rowIndex, row] of flattenedRows.entries()) {
    const serializedValues = new Map<string, string>();
    const visibleValues: string[] = [];
    for (let columnIndex = 0; columnIndex < mapping.length; columnIndex += 1) {
      const entry = mapping[columnIndex];
      const value = row[entry.source];
      let cell = serializedValues.get(entry.source);
      if (cell === undefined) {
        cell = csvScalar(value);
        serializedValues.set(entry.source, cell);
      }
      const protectedCell = options.protectSpreadsheetFormulas && isSpreadsheetFormula(cell, value)
        ? `'${cell}`
        : cell;
      if (protectedCell.length > CSV_JSON_MAX_CELL_CHARACTERS) {
        addIssue(state, 'cell-limit', 'error', rowIndex + 1, columnIndex + 1);
        break;
      }
      if (protectedCell !== cell) protectedFormulaCount += 1;
      visibleValues.push(protectedCell);
    }
    if (hasErrors(state)) break;
    const outputLine = encodeCsvRowWithinLimit(
      visibleValues,
      delimiterCharacter,
      outputCharacters,
      true,
      state,
    );
    if (outputLine === null) break;
    if (previewRows.length < CSV_JSON_PREVIEW_ROWS) previewRows.push(visibleValues);
    outputLines.push(outputLine);
    outputCharacters += 2 + outputLine.length;
  }
  if (hasErrors(state)) {
    return emptyResult('json-to-csv', delimiter, source.length, state.issues);
  }
  if (protectedFormulaCount > 0) {
    addIssue(state, 'spreadsheet-formula-protected', 'info', null, null, String(protectedFormulaCount));
  }
  const output = `${bom}${outputLines.join('\r\n')}`;
  if (output.length > CSV_JSON_MAX_OUTPUT_CHARACTERS) {
    addIssue(state, 'output-too-large', 'error');
    return emptyResult('json-to-csv', delimiter, source.length, state.issues);
  }
  return result({
    direction: 'json-to-csv',
    output,
    delimiter,
    headers: mapping.map(entry => entry.output),
    previewRows,
    issues: state.issues,
    inputRows: parsedRows.length,
    outputRows: flattenedRows.length,
    inputCharacters: source.length,
  });
}

function parseCsv(
  source: string,
  requestedDelimiter: CsvJsonDelimiter,
  state: MutableConversionState,
  maximumRows: number,
): CsvParseResult {
  const delimiter = requestedDelimiter === 'auto' ? detectDelimiter(source, state) : requestedDelimiter;
  const delimiterCharacter = DELIMITERS[delimiter];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;
  let line = 1;

  const pushField = (): boolean => {
    if (field.length > CSV_JSON_MAX_CELL_CHARACTERS) {
      addIssue(state, 'cell-limit', 'error', line, row.length + 1);
      return false;
    }
    row.push(field);
    field = '';
    afterQuote = false;
    if (row.length > CSV_JSON_MAX_COLUMNS) {
      addIssue(state, 'column-limit', 'error', line, row.length);
      return false;
    }
    return true;
  };
  const pushRow = (): boolean => {
    rows.push(row);
    row = [];
    if (rows.length > maximumRows) {
      addIssue(state, 'row-limit', 'error', line);
      return false;
    }
    return true;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += character;
        if (character === '\n') line += 1;
      }
      continue;
    }
    if (afterQuote) {
      if (character === delimiterCharacter) {
        if (!pushField()) break;
      } else if (character === '\r' || character === '\n') {
        if (!pushField() || !pushRow()) break;
        if (character === '\r' && source[index + 1] === '\n') index += 1;
        line += 1;
      } else if (character === ' ' || character === '\t') {
        continue;
      } else {
        addIssue(state, 'unexpected-after-quote', 'error', line, row.length + 1, character);
        break;
      }
      continue;
    }
    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === delimiterCharacter) {
      if (!pushField()) break;
    } else if (character === '\r' || character === '\n') {
      if (!pushField() || !pushRow()) break;
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      line += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) addIssue(state, 'unclosed-quote', 'error', line, row.length + 1);
  if (!hasErrors(state) && (field.length > 0 || row.length > 0 || !endsWithLineBreak(source))) {
    if (pushField()) pushRow();
  }
  return { rows, delimiter };
}

function detectDelimiter(
  source: string,
  state: MutableConversionState,
): Exclude<CsvJsonDelimiter, 'auto'> {
  let best: Exclude<CsvJsonDelimiter, 'auto'> = 'comma';
  let bestScore = 0;
  for (const candidate of Object.keys(DELIMITERS) as Exclude<CsvJsonDelimiter, 'auto'>[]) {
    const counts = delimiterCounts(source, DELIMITERS[candidate]);
    const nonZero = counts.filter(count => count > 0);
    if (!nonZero.length) continue;
    const frequencies = new Map<number, number>();
    for (const count of nonZero) frequencies.set(count, (frequencies.get(count) ?? 0) + 1);
    const [mode, frequency] = [...frequencies.entries()]
      .sort((left, right) => right[1] - left[1] || right[0] - left[0])[0];
    const score = frequency * 100 + mode * 5 - Math.abs(nonZero.length - frequency) * 10;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  if (bestScore === 0) addIssue(state, 'delimiter-fallback', 'warning');
  return best;
}

function delimiterCounts(source: string, delimiter: string): number[] {
  const counts: number[] = [];
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < source.length && counts.length < 20; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (inQuotes && source[index + 1] === '"') index += 1;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && character === delimiter) {
      count += 1;
    } else if (!inQuotes && (character === '\n' || character === '\r')) {
      counts.push(count);
      count = 0;
      if (character === '\r' && source[index + 1] === '\n') index += 1;
    }
  }
  if (counts.length < 20 && count > 0) counts.push(count);
  return counts;
}

function createHeaders(
  provided: readonly string[],
  width: number,
  hasHeaderRow: boolean,
  state: MutableConversionState,
): string[] {
  const headers: string[] = [];
  const usedHeaders = new Set<string>();
  if (hasHeaderRow && provided.length !== width) {
    addIssue(
      state,
      'inconsistent-columns',
      'warning',
      1,
      null,
      `${String(provided.length)}/${String(width)}`,
    );
  }
  for (let index = 0; index < width; index += 1) {
    const raw = hasHeaderRow ? (provided[index] ?? '') : '';
    let header = raw.trim();
    if (!header) {
      header = `colonne_${String(index + 1)}`;
      if (hasHeaderRow) addIssue(state, 'empty-header', 'warning', 1, index + 1, header);
    }
    if (usedHeaders.has(header)) {
      const original = header;
      let suffix = 2;
      while (usedHeaders.has(`${original}_${String(suffix)}`)) suffix += 1;
      header = `${original}_${String(suffix)}`;
      addIssue(state, 'duplicate-header', 'warning', 1, index + 1, `${original}=>${header}`);
    }
    usedHeaders.add(header);
    headers.push(header);
  }
  return headers;
}

function parseMapping(
  rawMapping: string,
  sourceHeaders: readonly string[],
  state: MutableConversionState,
): ColumnMapping[] {
  if (!rawMapping.trim()) return sourceHeaders.map(header => ({ source: header, output: header }));
  const sourceSet = new Set(sourceHeaders);
  const outputs = new Set<string>();
  const mapping: ColumnMapping[] = [];
  for (const [index, line] of rawMapping.split(/\r?\n/u).entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf('=>');
    if (separator < 0) {
      addIssue(state, 'mapping-invalid', 'error', index + 1, null, line.slice(0, 160));
      continue;
    }
    const source = line.slice(0, separator).trim();
    const output = line.slice(separator + 2).trim();
    if (!source || !output) {
      addIssue(state, 'mapping-invalid', 'error', index + 1, null, line.slice(0, 160));
      continue;
    }
    if (!sourceSet.has(source)) addIssue(state, 'mapping-source-missing', 'error', index + 1, null, source);
    if (outputs.has(output)) addIssue(state, 'mapping-output-duplicate', 'error', index + 1, null, output);
    if (mapping.length >= CSV_JSON_MAX_COLUMNS) {
      addIssue(state, 'column-limit', 'error', index + 1);
      break;
    }
    outputs.add(output);
    mapping.push({ source, output });
  }
  if (!mapping.length) addIssue(state, 'mapping-invalid', 'error');
  return mapping;
}

function flattenRecord(
  record: Readonly<Record<string, unknown>>,
  prefix: string,
  target: Record<string, unknown>,
  state: MutableConversionState,
  row: number,
  depth: number,
): void {
  if (depth > 12) {
    addIssue(state, 'json-depth-limit', 'error', row);
    return;
  }
  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(value) && Object.keys(value).length > 0) {
      flattenRecord(value, path, target, state, row, depth + 1);
    } else if (Object.hasOwn(target, path)) {
      addIssue(state, 'json-path-collision', 'error', row, null, path.slice(0, 160));
    } else {
      target[path] = value;
    }
  }
}

function validateJsonRowStructure(
  rowValue: Readonly<Record<string, unknown>>,
  state: MutableConversionState,
  row: number,
): boolean {
  const pending: Array<{ value: unknown; depth: number }> = [{ value: rowValue, depth: 0 }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;
    if (typeof current.value === 'string') {
      if (!hasWellFormedUtf16(current.value)) {
        addIssue(state, 'json-unicode-invalid', 'error', row);
        return false;
      }
      continue;
    }
    if (!Array.isArray(current.value) && !isRecord(current.value)) continue;
    if (current.depth > 12) {
      addIssue(state, 'json-depth-limit', 'error', row);
      return false;
    }
    if (Array.isArray(current.value)) {
      for (const value of current.value) pending.push({ value, depth: current.depth + 1 });
      continue;
    }
    for (const [key, value] of Object.entries(current.value)) {
      if (!hasWellFormedUtf16(key)) {
        addIssue(state, 'json-unicode-invalid', 'error', row);
        return false;
      }
      pending.push({ value, depth: current.depth + 1 });
    }
  }
  return true;
}

function hasWellFormedUtf16(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function validateJsonNumbers(source: string, state: MutableConversionState): void {
  let inString = false;
  let escaped = false;
  const numberPattern = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?/iy;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character !== '-' && (character < '0' || character > '9')) continue;
    numberPattern.lastIndex = index;
    const token = numberPattern.exec(source)?.[0];
    if (!token) continue;
    if (!isLosslessJsonNumber(token)) {
      addIssue(state, 'json-number-unsafe', 'error', null, null, token.slice(0, 160));
      return;
    }
    index += token.length - 1;
  }
}

function isLosslessJsonNumber(token: string): boolean {
  if (token.length > 128) return false;
  const numeric = Number(token);
  if (!Number.isFinite(numeric)) return false;
  const sourceDecimal = canonicalDecimal(token);
  const numericDecimal = canonicalDecimal(String(numeric));
  return sourceDecimal !== null
    && numericDecimal !== null
    && sourceDecimal.coefficient === numericDecimal.coefficient
    && sourceDecimal.scale === numericDecimal.scale;
}

function canonicalDecimal(value: string): { coefficient: bigint; scale: number } | null {
  if (!/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/iu.test(value)) return null;
  const exponentIndex = value.search(/[eE]/u);
  const mantissa = exponentIndex < 0 ? value : value.slice(0, exponentIndex);
  const exponent = exponentIndex < 0 ? 0 : Number(value.slice(exponentIndex + 1));
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1_000) return null;
  const negative = mantissa.startsWith('-');
  const unsignedMantissa = negative ? mantissa.slice(1) : mantissa;
  const dotIndex = unsignedMantissa.indexOf('.');
  const integer = dotIndex < 0 ? unsignedMantissa : unsignedMantissa.slice(0, dotIndex);
  const fraction = dotIndex < 0 ? '' : unsignedMantissa.slice(dotIndex + 1);
  let coefficient = BigInt(`${negative ? '-' : ''}${integer}${fraction}`);
  let scale = fraction.length - exponent;
  if (coefficient === 0n) return { coefficient: 0n, scale: 0 };
  while (coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale -= 1;
  }
  return { coefficient, scale };
}

function inferCsvValue(value: string): string | number | boolean | null {
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu.test(value)) {
    const numeric = Number(value);
    if (isLosslessJsonNumber(value)) return numeric;
  }
  return value;
}

function csvScalar(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function encodeCsvCell(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes('\r') || value.includes('\n') || value.includes(delimiter)
    || value !== value.trim()) {
    return `"${value.replace(/"/gu, '""')}"`;
  }
  return value;
}

function encodeCsvRowWithinLimit(
  values: readonly string[],
  delimiter: string,
  existingOutputCharacters: number,
  includeLeadingLineBreak: boolean,
  state: MutableConversionState,
): string | null {
  const chunks: string[] = [];
  const lineBreakCharacters = includeLeadingLineBreak ? 2 : 0;
  let rowCharacters = 0;
  for (let index = 0; index < values.length; index += 1) {
    const encoded = encodeCsvCell(values[index], delimiter);
    const separatorCharacters = index === 0 ? 0 : delimiter.length;
    const nextRowCharacters = rowCharacters + separatorCharacters + encoded.length;
    if (existingOutputCharacters + lineBreakCharacters + nextRowCharacters > CSV_JSON_MAX_OUTPUT_CHARACTERS) {
      addIssue(state, 'output-too-large', 'error');
      return null;
    }
    if (index > 0) chunks.push(delimiter);
    chunks.push(encoded);
    rowCharacters = nextRowCharacters;
  }
  return chunks.join('');
}

function isSpreadsheetFormula(cell: string, value: unknown): boolean {
  return typeof value === 'string' && /^[\t\r ]*[=+\-@]/u.test(cell);
}

function previewValue(value: unknown): string {
  if (value === null) return 'null';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function selectedOutputDelimiter(
  delimiter: CsvJsonDelimiter,
): Exclude<CsvJsonDelimiter, 'auto'> {
  return delimiter === 'auto' ? 'comma' : delimiter;
}

function result(input: {
  direction: CsvJsonDirection;
  output: string;
  delimiter: Exclude<CsvJsonDelimiter, 'auto'>;
  headers: string[];
  previewRows: string[][];
  issues: CsvJsonIssue[];
  inputRows: number;
  outputRows: number;
  inputCharacters: number;
}): CsvJsonConversionResult {
  return {
    ok: !input.issues.some(issue => issue.severity === 'error'),
    direction: input.direction,
    output: input.output,
    outputMediaType: input.direction === 'csv-to-json'
      ? 'application/json;charset=utf-8'
      : 'text/csv;charset=utf-8',
    outputExtension: input.direction === 'csv-to-json' ? 'json' : 'csv',
    detectedDelimiter: input.delimiter,
    previewHeaders: input.headers,
    previewRows: input.previewRows,
    issues: input.issues,
    stats: {
      inputRows: input.inputRows,
      outputRows: input.outputRows,
      columns: input.headers.length,
      inputCharacters: input.inputCharacters,
      outputCharacters: input.output.length,
    },
  };
}

function emptyResult(
  direction: CsvJsonDirection,
  delimiter: Exclude<CsvJsonDelimiter, 'auto'>,
  inputCharacters: number,
  issues: CsvJsonIssue[],
): CsvJsonConversionResult {
  return result({
    direction,
    output: '',
    delimiter,
    headers: [],
    previewRows: [],
    issues,
    inputRows: 0,
    outputRows: 0,
    inputCharacters,
  });
}

function addIssue(
  state: MutableConversionState,
  code: CsvJsonIssueCode,
  severity: CsvJsonIssueSeverity,
  row: number | null = null,
  column: number | null = null,
  detail = '',
): void {
  const issue = { code, severity, row, column, detail };
  if (severity === 'error') state.hasError = true;
  if (state.issues.length >= CSV_JSON_MAX_ISSUES) {
    if (severity === 'error' && !state.issues.some(existing => existing.severity === 'error')) {
      state.issues[state.issues.length - 1] = issue;
    }
    return;
  }
  state.issues.push(issue);
}

function hasErrors(state: MutableConversionState): boolean {
  return state.hasError;
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : '';
}

function endsWithLineBreak(value: string): boolean {
  return value.endsWith('\n') || value.endsWith('\r');
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
