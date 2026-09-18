export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface ParsedStrictJson {
  value: JsonValue;
  nodes: number;
}

export type StrictJsonParserIssueCode =
  | 'invalid-json'
  | 'duplicate-key'
  | 'unsafe-number'
  | 'invalid-unicode'
  | 'depth-limit'
  | 'node-limit';

export class StrictJsonParserError extends Error {
  constructor(
    readonly code: StrictJsonParserIssueCode,
    readonly position: number,
    readonly detail = '',
  ) {
    super(code);
    this.name = 'StrictJsonParserError';
  }
}

export function parseStrictJson(
  source: string,
  limits: { maxDepth: number; maxNodes: number },
): ParsedStrictJson {
  return new StrictJsonParser(source, limits).parse();
}

class StrictJsonParser {
  private index = 0;
  private nodes = 0;

  constructor(
    private readonly source: string,
    private readonly limits: { maxDepth: number; maxNodes: number },
  ) {}

  parse(): ParsedStrictJson {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.index !== this.source.length) this.fail('invalid-json');
    return { value, nodes: this.nodes };
  }

  private parseValue(depth: number): JsonValue {
    if (depth > this.limits.maxDepth) this.fail('depth-limit');
    this.nodes += 1;
    if (this.nodes > this.limits.maxNodes) this.fail('node-limit');
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

  private parseObject(depth: number): JsonObject {
    const result = Object.create(null) as JsonObject;
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

  private fail(code: StrictJsonParserIssueCode, detail = ''): never {
    throw new StrictJsonParserError(code, this.index, detail);
  }
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
