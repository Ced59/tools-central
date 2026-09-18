export const JSON_DIFF_MAX_SOURCE_CHARACTERS = 2_000_000;
export const JSON_DIFF_MAX_NODES = 100_000;
export const JSON_DIFF_MAX_DEPTH = 64;
export const JSON_DIFF_MAX_CHANGES = 20_000;
export const JSON_DIFF_MAX_OUTPUT_CHARACTERS = 16_000_000;
export const JSON_DIFF_PREVIEW_CHANGES = 500;
export const JSON_DIFF_PREVIEW_VALUE_CHARACTERS = 240;

export type JsonDiffArrayMode = 'index' | 'key';
export type JsonDiffSide = 'left' | 'right' | null;
export type JsonDiffChangeKind = 'added' | 'removed' | 'changed' | 'type-changed' | 'moved';
export type JsonDiffIssueCode =
  | 'empty-source'
  | 'source-too-large'
  | 'invalid-json'
  | 'duplicate-key'
  | 'unsafe-number'
  | 'invalid-unicode'
  | 'depth-limit'
  | 'node-limit'
  | 'invalid-ignore-path'
  | 'array-key-required'
  | 'array-key-invalid'
  | 'array-key-duplicate'
  | 'change-limit'
  | 'output-too-large';

export interface JsonDiffOptions {
  arrayMode: JsonDiffArrayMode;
  arrayKey: string;
  ignoredPaths: string;
}

export interface JsonDiffIssue {
  code: JsonDiffIssueCode;
  side: JsonDiffSide;
  path: string;
  detail: string;
  position: number | null;
}

export interface JsonDiffChangePreview {
  kind: JsonDiffChangeKind;
  path: string;
  before: string;
  after: string;
  beforeIndex: number | null;
  afterIndex: number | null;
}

export interface JsonDiffSummary {
  added: number;
  removed: number;
  changed: number;
  typeChanged: number;
  moved: number;
  total: number;
}

export interface JsonDiffResult {
  ok: boolean;
  equivalent: boolean;
  issues: JsonDiffIssue[];
  summary: JsonDiffSummary;
  changes: JsonDiffChangePreview[];
  changesTruncated: boolean;
  patch: string;
  report: string;
  stats: {
    leftCharacters: number;
    rightCharacters: number;
    leftNodes: number;
    rightNodes: number;
    ignoredPaths: number;
  };
}

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface ParsedJson {
  value: JsonValue;
  nodes: number;
}

interface FullChange {
  kind: JsonDiffChangeKind;
  path: string;
  before?: JsonValue;
  after?: JsonValue;
  beforeIndex?: number;
  afterIndex?: number;
}

interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: JsonValue;
}

interface ComparisonState {
  options: JsonDiffOptions;
  ignoredPaths: ReadonlySet<string>;
  keySegments: readonly string[];
  changes: FullChange[];
  patch: JsonPatchOperation[];
}

interface KeyedArrayItem {
  stableKey: string;
  displayKey: string;
  keyPath: string;
  value: JsonValue;
  index: number;
}

type ParserIssueCode = Extract<
  JsonDiffIssueCode,
  'invalid-json' | 'duplicate-key' | 'unsafe-number' | 'invalid-unicode' | 'depth-limit' | 'node-limit'
>;

class StrictJsonParserError extends Error {
  constructor(
    readonly code: ParserIssueCode,
    readonly position: number,
    readonly detail = '',
  ) {
    super(code);
    this.name = 'StrictJsonParserError';
  }
}

class JsonDiffError extends Error {
  constructor(
    readonly code: JsonDiffIssueCode,
    readonly path = '',
    readonly detail = '',
  ) {
    super(code);
    this.name = 'JsonDiffError';
  }
}

export function compareJsonDocuments(
  rawLeft: string,
  rawRight: string,
  options: JsonDiffOptions,
): JsonDiffResult {
  const left = rawLeft.replace(/^\ufeff/u, '');
  const right = rawRight.replace(/^\ufeff/u, '');
  const baseStats = {
    leftCharacters: left.length,
    rightCharacters: right.length,
    leftNodes: 0,
    rightNodes: 0,
    ignoredPaths: 0,
  };

  if (!left.trim()) return failedResult(issue('empty-source', 'left'), baseStats);
  if (!right.trim()) return failedResult(issue('empty-source', 'right'), baseStats);
  if (left.length > JSON_DIFF_MAX_SOURCE_CHARACTERS) {
    return failedResult(issue('source-too-large', 'left'), baseStats);
  }
  if (right.length > JSON_DIFF_MAX_SOURCE_CHARACTERS) {
    return failedResult(issue('source-too-large', 'right'), baseStats);
  }

  const leftParsed = parseDocument(left, 'left');
  if ('issue' in leftParsed) return failedResult(leftParsed.issue, baseStats);
  const rightParsed = parseDocument(right, 'right');
  if ('issue' in rightParsed) {
    return failedResult(rightParsed.issue, { ...baseStats, leftNodes: leftParsed.parsed.nodes });
  }

  const stats = {
    ...baseStats,
    leftNodes: leftParsed.parsed.nodes,
    rightNodes: rightParsed.parsed.nodes,
    ignoredPaths: 0,
  };

  try {
    const ignoredPaths = parsePointerList(options.ignoredPaths);
    const keySegments = options.arrayMode === 'key'
      ? parseArrayKey(options.arrayKey)
      : [];
    stats.ignoredPaths = ignoredPaths.size;
    const state: ComparisonState = {
      options,
      ignoredPaths,
      keySegments,
      changes: [],
      patch: [],
    };
    compareValues(leftParsed.parsed.value, rightParsed.parsed.value, '', state);
    buildPatch(leftParsed.parsed.value, rightParsed.parsed.value, '', state);

    const summary = summarize(state.changes);
    const report = JSON.stringify({
      equivalent: summary.total === 0,
      summary,
      options: {
        arrayMode: options.arrayMode,
        arrayKey: options.arrayMode === 'key' ? options.arrayKey : '',
        ignoredPaths: [...ignoredPaths],
      },
      changes: state.changes,
    }, null, 2);
    const patch = JSON.stringify(state.patch, null, 2);
    if (report.length + patch.length > JSON_DIFF_MAX_OUTPUT_CHARACTERS) {
      throw new JsonDiffError('output-too-large');
    }
    return {
      ok: true,
      equivalent: summary.total === 0,
      issues: [],
      summary,
      changes: state.changes.slice(0, JSON_DIFF_PREVIEW_CHANGES).map(previewChange),
      changesTruncated: state.changes.length > JSON_DIFF_PREVIEW_CHANGES,
      patch,
      report,
      stats,
    };
  } catch (error) {
    if (error instanceof JsonDiffError) {
      return failedResult(issue(error.code, null, error.path, error.detail), stats);
    }
    throw error;
  }
}

function parseDocument(
  source: string,
  side: Exclude<JsonDiffSide, null>,
): { parsed: ParsedJson } | { issue: JsonDiffIssue } {
  try {
    return { parsed: new StrictJsonParser(source).parse() };
  } catch (error) {
    if (error instanceof StrictJsonParserError) {
      return { issue: issue(error.code, side, '', error.detail, error.position) };
    }
    throw error;
  }
}

class StrictJsonParser {
  private index = 0;
  private nodes = 0;

  constructor(private readonly source: string) {}

  parse(): ParsedJson {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.index !== this.source.length) this.fail('invalid-json');
    return { value, nodes: this.nodes };
  }

  private parseValue(depth: number): JsonValue {
    if (depth > JSON_DIFF_MAX_DEPTH) this.fail('depth-limit');
    this.nodes += 1;
    if (this.nodes > JSON_DIFF_MAX_NODES) this.fail('node-limit');
    const character = this.source[this.index];
    if (character === '{') return this.parseObject(depth);
    if (character === '[') return this.parseArray(depth);
    if (character === '"') return this.parseString();
    if (character === 't') return this.parseLiteral('true', true);
    if (character === 'f') return this.parseLiteral('false', false);
    if (character === 'n') return this.parseLiteral('null', null);
    if (character === '-' || isDigit(character)) return this.parseNumber();
    this.fail('invalid-json');
  }

  private parseObject(depth: number): { [key: string]: JsonValue } {
    const result = Object.create(null) as { [key: string]: JsonValue };
    const keys = new Set<string>();
    this.index += 1;
    this.skipWhitespace();
    if (this.consume('}')) return result;
    while (this.index < this.source.length) {
      if (this.source[this.index] !== '"') this.fail('invalid-json');
      const key = this.parseString();
      if (keys.has(key)) this.fail('duplicate-key', key.slice(0, 160));
      keys.add(key);
      this.skipWhitespace();
      if (!this.consume(':')) this.fail('invalid-json');
      this.skipWhitespace();
      result[key] = this.parseValue(depth + 1);
      this.skipWhitespace();
      if (this.consume('}')) return result;
      if (!this.consume(',')) this.fail('invalid-json');
      this.skipWhitespace();
    }
    this.fail('invalid-json');
  }

  private parseArray(depth: number): JsonValue[] {
    const result: JsonValue[] = [];
    this.index += 1;
    this.skipWhitespace();
    if (this.consume(']')) return result;
    while (this.index < this.source.length) {
      result.push(this.parseValue(depth + 1));
      this.skipWhitespace();
      if (this.consume(']')) return result;
      if (!this.consume(',')) this.fail('invalid-json');
      this.skipWhitespace();
    }
    this.fail('invalid-json');
  }

  private parseString(): string {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.source.length) {
      const character = this.source[this.index];
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        this.index += 1;
        try {
          const value = JSON.parse(this.source.slice(start, this.index)) as unknown;
          if (typeof value !== 'string') this.fail('invalid-json');
          if (!hasWellFormedUtf16(value)) this.fail('invalid-unicode');
          return value;
        } catch (error) {
          if (error instanceof StrictJsonParserError) throw error;
          this.fail('invalid-json');
        }
      }
      this.index += 1;
    }
    this.fail('invalid-json');
  }

  private parseNumber(): number {
    const pattern = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?/iy;
    pattern.lastIndex = this.index;
    const match = pattern.exec(this.source);
    if (!match) this.fail('invalid-json');
    const token = match[0];
    const end = this.index + token.length;
    if (!isJsonValueBoundary(this.source[end])) this.fail('invalid-json');
    if (!isLosslessJsonNumber(token)) this.fail('unsafe-number', token.slice(0, 160));
    this.index = end;
    return Number(token);
  }

  private parseLiteral<T extends JsonPrimitive>(token: string, value: T): T {
    if (this.source.slice(this.index, this.index + token.length) !== token) {
      this.fail('invalid-json');
    }
    const end = this.index + token.length;
    if (!isJsonValueBoundary(this.source[end])) this.fail('invalid-json');
    this.index = end;
    return value;
  }

  private consume(character: string): boolean {
    if (this.source[this.index] !== character) return false;
    this.index += 1;
    return true;
  }

  private skipWhitespace(): void {
    while (/[\t\n\r ]/u.test(this.source[this.index] ?? '')) this.index += 1;
  }

  private fail(code: ParserIssueCode, detail = ''): never {
    throw new StrictJsonParserError(code, this.index, detail);
  }
}

function compareValues(
  left: JsonValue,
  right: JsonValue,
  path: string,
  state: ComparisonState,
  leftPath = path,
  rightPath = path,
): void {
  if (isIgnored(leftPath, state.ignoredPaths) || isIgnored(rightPath, state.ignoredPaths)) return;
  const leftType = jsonType(left);
  const rightType = jsonType(right);
  if (leftType !== rightType) {
    addChange(state, { kind: 'type-changed', path, before: left, after: right }, leftPath, rightPath);
    return;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (state.options.arrayMode === 'key' && shouldUseKeyMode(left, right)) {
      compareArraysByKey(left, right, path, leftPath, rightPath, state);
    } else {
      compareArraysByIndex(left, right, path, leftPath, rightPath, state);
    }
    return;
  }
  if (isRecord(left) && isRecord(right)) {
    compareObjects(left, right, path, leftPath, rightPath, state);
    return;
  }
  if (!Object.is(left, right)) {
    addChange(state, { kind: 'changed', path, before: left, after: right }, leftPath, rightPath);
  }
}

function compareObjects(
  left: Readonly<Record<string, JsonValue>>,
  right: Readonly<Record<string, JsonValue>>,
  path: string,
  leftPath: string,
  rightPath: string,
  state: ComparisonState,
): void {
  const leftKeys = Object.keys(left).sort(compareText);
  const rightKeys = Object.keys(right).sort(compareText);
  const rightSet = new Set(rightKeys);
  const leftSet = new Set(leftKeys);
  for (const key of leftKeys) {
    const childPath = appendPointer(path, key);
    const leftChildPath = appendPointer(leftPath, key);
    const rightChildPath = appendPointer(rightPath, key);
    if (isIgnored(leftChildPath, state.ignoredPaths)) continue;
    if (!rightSet.has(key)) {
      addChange(state, { kind: 'removed', path: childPath, before: left[key] }, leftChildPath);
    } else {
      compareValues(left[key], right[key], childPath, state, leftChildPath, rightChildPath);
    }
  }
  for (const key of rightKeys) {
    const childPath = appendPointer(path, key);
    const rightChildPath = appendPointer(rightPath, key);
    if (!leftSet.has(key) && !isIgnored(rightChildPath, state.ignoredPaths)) {
      addChange(state, { kind: 'added', path: childPath, after: right[key] }, undefined, rightChildPath);
    }
  }
}

function compareArraysByIndex(
  left: readonly JsonValue[],
  right: readonly JsonValue[],
  path: string,
  leftPath: string,
  rightPath: string,
  state: ComparisonState,
): void {
  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    compareValues(
      left[index],
      right[index],
      appendPointer(path, String(index)),
      state,
      appendPointer(leftPath, String(index)),
      appendPointer(rightPath, String(index)),
    );
  }
  for (let index = left.length - 1; index >= right.length; index -= 1) {
    const childPath = appendPointer(path, String(index));
    const leftChildPath = appendPointer(leftPath, String(index));
    if (!isIgnored(leftChildPath, state.ignoredPaths)) {
      addChange(state, { kind: 'removed', path: childPath, before: left[index] }, leftChildPath);
    }
  }
  for (let index = left.length; index < right.length; index += 1) {
    const childPath = appendPointer(path, String(index));
    const rightChildPath = appendPointer(rightPath, String(index));
    if (!isIgnored(rightChildPath, state.ignoredPaths)) {
      addChange(state, { kind: 'added', path: childPath, after: right[index] }, undefined, rightChildPath);
    }
  }
}

function compareArraysByKey(
  left: readonly JsonValue[],
  right: readonly JsonValue[],
  path: string,
  leftPath: string,
  rightPath: string,
  state: ComparisonState,
): void {
  const leftItems = indexArrayByKey(left, leftPath, state.keySegments, state.ignoredPaths);
  const rightItems = indexArrayByKey(right, rightPath, state.keySegments, state.ignoredPaths);
  const redactedLabels = createRedactedKeyLabels(leftItems.ordered, rightItems.ordered);
  for (const item of leftItems.ordered) {
    const counterpart = rightItems.byKey.get(item.stableKey);
    const logicalPath = appendLogicalKey(
      path,
      state.options.arrayKey,
      reportKey(item, counterpart, redactedLabels, state.ignoredPaths),
    );
    const leftItemPath = appendPointer(leftPath, String(item.index));
    const rightItemPath = counterpart
      ? appendPointer(rightPath, String(counterpart.index))
      : leftItemPath;
    if (isIgnored(leftItemPath, state.ignoredPaths) || isIgnored(rightItemPath, state.ignoredPaths)) continue;
    if (!counterpart) {
      addChange(state, {
        kind: 'removed',
        path: logicalPath,
        before: item.value,
        beforeIndex: item.index,
      }, leftItemPath);
      continue;
    }
    if (item.index !== counterpart.index) {
      addChange(state, {
        kind: 'moved',
        path: logicalPath,
        beforeIndex: item.index,
        afterIndex: counterpart.index,
      });
    }
    compareValues(item.value, counterpart.value, logicalPath, state, leftItemPath, rightItemPath);
  }
  for (const item of rightItems.ordered) {
    if (leftItems.byKey.has(item.stableKey)) continue;
    const rightItemPath = appendPointer(rightPath, String(item.index));
    if (isIgnored(rightItemPath, state.ignoredPaths)) continue;
    addChange(state, {
      kind: 'added',
      path: appendLogicalKey(
        path,
        state.options.arrayKey,
        reportKey(item, undefined, redactedLabels, state.ignoredPaths),
      ),
      after: item.value,
      afterIndex: item.index,
    }, undefined, rightItemPath);
  }
}

function indexArrayByKey(
  values: readonly JsonValue[],
  path: string,
  keySegments: readonly string[],
  ignoredPaths: ReadonlySet<string>,
): {
  ordered: KeyedArrayItem[];
  byKey: Map<string, KeyedArrayItem>;
} {
  const ordered: KeyedArrayItem[] = [];
  const byKey = new Map<string, KeyedArrayItem>();
  for (let index = 0; index < values.length; index += 1) {
    const itemPath = appendPointer(path, String(index));
    if (isIgnored(itemPath, ignoredPaths)) continue;
    const value = values[index];
    const key = resolveKey(value, keySegments);
    if (!isKeyPrimitive(key)) {
      throw new JsonDiffError('array-key-invalid', itemPath);
    }
    const stableKey = `${typeof key}:${JSON.stringify(key)}`;
    if (byKey.has(stableKey)) {
      throw new JsonDiffError('array-key-duplicate', path, previewValue(key));
    }
    const item = {
      stableKey,
      displayKey: JSON.stringify(key),
      keyPath: appendPointerSegments(itemPath, keySegments),
      value,
      index,
    };
    ordered.push(item);
    byKey.set(stableKey, item);
  }
  return { ordered, byKey };
}

function createRedactedKeyLabels(
  left: readonly KeyedArrayItem[],
  right: readonly KeyedArrayItem[],
): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const items of [left, right]) {
    for (const item of items) {
      if (!labels.has(item.stableKey)) labels.set(item.stableKey, `#${String(labels.size + 1)}`);
    }
  }
  return labels;
}

function reportKey(
  item: KeyedArrayItem,
  counterpart: KeyedArrayItem | undefined,
  redactedLabels: ReadonlyMap<string, string>,
  ignoredPaths: ReadonlySet<string>,
): string {
  if (!isIgnored(item.keyPath, ignoredPaths)
    && (counterpart === undefined || !isIgnored(counterpart.keyPath, ignoredPaths))) {
    return item.displayKey;
  }
  return redactedLabels.get(item.stableKey) ?? '#';
}

function buildPatch(left: JsonValue, right: JsonValue, path: string, state: ComparisonState): void {
  if (isIgnored(path, state.ignoredPaths)) return;
  if (Array.isArray(left) && Array.isArray(right)) {
    const sharedLength = Math.min(left.length, right.length);
    for (let index = 0; index < sharedLength; index += 1) {
      buildPatch(left[index], right[index], appendPointer(path, String(index)), state);
    }
    for (let index = left.length - 1; index >= right.length; index -= 1) {
      const childPath = appendPointer(path, String(index));
      if (!isIgnored(childPath, state.ignoredPaths)) {
        addPatch(state, { op: 'remove', path: childPath });
      }
    }
    for (let index = left.length; index < right.length; index += 1) {
      const childPath = appendPointer(path, String(index));
      if (!isIgnored(childPath, state.ignoredPaths)) {
        addPatch(state, { op: 'add', path: appendPointer(path, '-'), value: right[index] }, childPath);
      }
    }
    return;
  }
  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort(compareText);
    const rightKeys = Object.keys(right).sort(compareText);
    const rightSet = new Set(rightKeys);
    const leftSet = new Set(leftKeys);
    for (const key of leftKeys) {
      const childPath = appendPointer(path, key);
      if (!rightSet.has(key) && !isIgnored(childPath, state.ignoredPaths)) {
        addPatch(state, { op: 'remove', path: childPath });
      }
    }
    for (const key of leftKeys) {
      if (rightSet.has(key)) buildPatch(left[key], right[key], appendPointer(path, key), state);
    }
    for (const key of rightKeys) {
      const childPath = appendPointer(path, key);
      if (!leftSet.has(key) && !isIgnored(childPath, state.ignoredPaths)) {
        addPatch(state, { op: 'add', path: childPath, value: right[key] });
      }
    }
    return;
  }
  if (!deepEqual(left, right)) addPatch(state, { op: 'replace', path, value: right });
}

function addChange(
  state: ComparisonState,
  change: FullChange,
  beforePath = change.path,
  afterPath = change.path,
): void {
  if (state.changes.length >= JSON_DIFF_MAX_CHANGES) throw new JsonDiffError('change-limit');
  state.changes.push({
    ...change,
    ...(change.before === undefined
      ? {}
      : { before: sanitizeForExport(change.before, beforePath, state.ignoredPaths) }),
    ...(change.after === undefined
      ? {}
      : { after: sanitizeForExport(change.after, afterPath, state.ignoredPaths) }),
  });
}

function addPatch(
  state: ComparisonState,
  operation: JsonPatchOperation,
  valuePath = operation.path,
): void {
  if (state.patch.length >= JSON_DIFF_MAX_CHANGES) throw new JsonDiffError('change-limit');
  state.patch.push(operation.value === undefined
    ? operation
    : { ...operation, value: sanitizeForExport(operation.value, valuePath, state.ignoredPaths) });
}

function sanitizeForExport(
  value: JsonValue,
  path: string,
  ignoredPaths: ReadonlySet<string>,
): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const childPath = appendPointer(path, String(index));
      return isIgnored(childPath, ignoredPaths)
        ? null
        : sanitizeForExport(item, childPath, ignoredPaths);
    });
  }
  if (!isRecord(value)) return value;
  const sanitized = Object.create(null) as Record<string, JsonValue>;
  for (const key of Object.keys(value)) {
    const childPath = appendPointer(path, key);
    if (!isIgnored(childPath, ignoredPaths)) {
      sanitized[key] = sanitizeForExport(value[key], childPath, ignoredPaths);
    }
  }
  return sanitized;
}

function parsePointerList(source: string): ReadonlySet<string> {
  const paths = new Set<string>();
  for (const rawLine of source.split(/\r?\n/gu)) {
    if (!rawLine.trim()) continue;
    try {
      paths.add(normalizePointer(rawLine));
    } catch {
      throw new JsonDiffError('invalid-ignore-path', rawLine.slice(0, 160));
    }
  }
  return paths;
}

function parseArrayKey(source: string): readonly string[] {
  if (!source.trim()) throw new JsonDiffError('array-key-required');
  try {
    const normalized = normalizePointer(source);
    const segments = decodePointer(normalized);
    if (segments.length === 0) throw new Error('empty');
    return segments;
  } catch {
    throw new JsonDiffError('array-key-required');
  }
}

function normalizePointer(pointer: string): string {
  if (!pointer.startsWith('/')) throw new Error('pointer');
  return `/${decodePointer(pointer).map(escapePointer).join('/')}`;
}

function decodePointer(pointer: string): string[] {
  if (!pointer.startsWith('/')) throw new Error('pointer');
  return pointer.slice(1).split('/').map(segment => {
    if (/~(?:[^01]|$)/u.test(segment)) throw new Error('escape');
    return segment.replace(/~1/gu, '/').replace(/~0/gu, '~');
  });
}

function resolveKey(value: JsonValue, segments: readonly string[]): JsonValue | undefined {
  let current: JsonValue | undefined = value;
  for (const segment of segments) {
    if (!isRecord(current) || !Object.hasOwn(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function shouldUseKeyMode(left: readonly JsonValue[], right: readonly JsonValue[]): boolean {
  return left.length + right.length > 0 && left.every(isRecord) && right.every(isRecord);
}

function isIgnored(path: string, ignoredPaths: ReadonlySet<string>): boolean {
  for (const ignored of ignoredPaths) {
    if (path === ignored || path.startsWith(`${ignored}/`)) return true;
  }
  return false;
}

function deepEqual(left: JsonValue, right: JsonValue): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
      && leftKeys.every(key => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
  }
  return false;
}

function summarize(changes: readonly FullChange[]): JsonDiffSummary {
  const summary: JsonDiffSummary = {
    added: 0,
    removed: 0,
    changed: 0,
    typeChanged: 0,
    moved: 0,
    total: changes.length,
  };
  for (const change of changes) {
    if (change.kind === 'added') summary.added += 1;
    else if (change.kind === 'removed') summary.removed += 1;
    else if (change.kind === 'changed') summary.changed += 1;
    else if (change.kind === 'type-changed') summary.typeChanged += 1;
    else summary.moved += 1;
  }
  return summary;
}

function previewChange(change: FullChange): JsonDiffChangePreview {
  return {
    kind: change.kind,
    path: change.path || '/',
    before: change.before === undefined ? '' : previewValue(change.before),
    after: change.after === undefined ? '' : previewValue(change.after),
    beforeIndex: change.beforeIndex ?? null,
    afterIndex: change.afterIndex ?? null,
  };
}

function previewValue(value: JsonValue): string {
  const serialized = JSON.stringify(value);
  if (serialized.length <= JSON_DIFF_PREVIEW_VALUE_CHARACTERS) return serialized;
  return `${serialized.slice(0, JSON_DIFF_PREVIEW_VALUE_CHARACTERS - 1)}…`;
}

function failedResult(
  error: JsonDiffIssue,
  stats: JsonDiffResult['stats'],
): JsonDiffResult {
  return {
    ok: false,
    equivalent: false,
    issues: [error],
    summary: { added: 0, removed: 0, changed: 0, typeChanged: 0, moved: 0, total: 0 },
    changes: [],
    changesTruncated: false,
    patch: '',
    report: '',
    stats,
  };
}

function issue(
  code: JsonDiffIssueCode,
  side: JsonDiffSide,
  path = '',
  detail = '',
  position: number | null = null,
): JsonDiffIssue {
  return { code, side, path, detail, position };
}

function appendPointer(path: string, segment: string): string {
  return `${path}/${escapePointer(segment)}`;
}

function appendPointerSegments(path: string, segments: readonly string[]): string {
  return segments.reduce((current, segment) => appendPointer(current, segment), path);
}

function appendLogicalKey(path: string, keyPath: string, key: string): string {
  return `${path}/@${escapePointer(keyPath)}=${escapePointer(key)}`;
}

function escapePointer(value: string): string {
  return value.replace(/~/gu, '~0').replace(/\//gu, '~1');
}

function jsonType(value: JsonValue): 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object' {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

function isKeyPrimitive(value: JsonValue | undefined): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isDigit(value: string | undefined): boolean {
  return value !== undefined && value >= '0' && value <= '9';
}

function isJsonValueBoundary(value: string | undefined): boolean {
  return value === undefined || /[\t\n\r ,\]}]/u.test(value);
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

function isLosslessJsonNumber(token: string): boolean {
  if (token.length > 128) return false;
  const numeric = Number(token);
  if (!Number.isFinite(numeric)) return false;
  if (numeric === 0 && token.startsWith('-')) return false;
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
