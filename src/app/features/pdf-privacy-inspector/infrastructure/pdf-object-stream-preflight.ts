import { Inflate } from 'pako';

export const PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS = 100_000;

const DICTIONARY_SEARCH_WINDOW_BYTES = 1 * 1_024 * 1_024;
const INFLATE_CHUNK_BYTES = 64 * 1_024;
const MAX_CRITICAL_STREAMS = 10_000;
const MAX_INDIRECT_LENGTH_OBJECTS = 100_000;
const MAX_NAME_BYTES = 256;

const PDF_NAME = 0x2f;
const LESS_THAN = 0x3c;
const GREATER_THAN = 0x3e;
const LEFT_PARENTHESIS = 0x28;
const RIGHT_PARENTHESIS = 0x29;
const LEFT_BRACKET = 0x5b;
const RIGHT_BRACKET = 0x5d;
const PERCENT = 0x25;
const BACKSLASH = 0x5c;

interface RawPdfName {
  value: string;
  end: number;
}

interface RawPdfReference {
  objectNumber: number;
  generationNumber: number;
}

interface ParsedDictionary {
  type?: string;
  length?: number | RawPdfReference;
  filters?: readonly string[];
  objectCount?: number;
  xrefSize?: number;
  hasEncryptionDictionary: boolean;
}

interface CriticalStreamDescriptor {
  type: 'ObjStm' | 'XRef';
  contents: Uint8Array;
  filters: readonly string[] | undefined;
}

export interface PdfObjectStreamPreflightResult {
  encrypted: boolean;
  skippedEncryptedObjectStreams: number;
}

/**
 * Bounds compressed object and xref streams before pdf-lib eagerly expands
 * them. The scan never decodes arbitrary document strings or ordinary streams.
 */
export function validatePdfObjectStreamBudgets(data: Uint8Array): PdfObjectStreamPreflightResult {
  const indirectLengths = collectIndirectLengths(data);
  const criticalStreams: CriticalStreamDescriptor[] = [];
  let encrypted = false;
  let expectTrailerDictionary = false;
  let validatedStreams = 0;
  let classicIndirectObjects = 0;
  let compressedIndirectObjects = 0;
  let offset = 0;

  while (offset < data.byteLength) {
    const byte = data[offset];
    if (byte === PERCENT) {
      offset = skipComment(data, offset);
      continue;
    }
    if (byte === LEFT_PARENTHESIS) {
      offset = skipLiteralString(data, offset);
      continue;
    }
    if (matchesBareKeyword(data, offset, 'trailer')) {
      expectTrailerDictionary = true;
      offset += 'trailer'.length;
      continue;
    }
    if (byte === LESS_THAN && data[offset + 1] !== LESS_THAN) {
      offset = skipHexString(data, offset);
      continue;
    }
    const objectHeaderEnd = readIndirectObjectHeaderEnd(data, offset);
    if (objectHeaderEnd !== undefined) {
      classicIndirectObjects += 1;
      if (
        classicIndirectObjects + compressedIndirectObjects
          > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS
      ) {
        throw new Error('PDF classic indirect object limit');
      }
      offset = objectHeaderEnd;
      continue;
    }
    if (byte !== LESS_THAN || data[offset + 1] !== LESS_THAN) {
      offset += 1;
      continue;
    }

    const dictionaryStart = offset;
    const dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
    if (dictionaryEnd === undefined) throw new Error('PDF dictionary limit');
    const dictionary = parseCriticalDictionary(data, dictionaryStart, dictionaryEnd);
    if (expectTrailerDictionary) {
      encrypted ||= dictionary.hasEncryptionDictionary;
      validateXrefSize(dictionary.xrefSize);
      expectTrailerDictionary = false;
    }
    const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
    if (!matchesKeyword(data, streamKeyword, 'stream')) {
      offset = dictionaryEnd;
      continue;
    }

    const length = resolveStreamLength(dictionary.length, indirectLengths);
    if (length === undefined) throw new Error('Missing PDF stream length');
    const streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
    const streamEnd = streamStart + length;
    if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) {
      throw new Error('Invalid PDF stream length');
    }
    const endstream = skipWhitespace(data, streamEnd);
    if (!matchesKeyword(data, endstream, 'endstream')) {
      throw new Error('Invalid PDF stream boundary');
    }
    offset = endstream + 'endstream'.length;

    if (dictionary.type !== 'ObjStm' && dictionary.type !== 'XRef') continue;
    if (dictionary.type === 'XRef') {
      encrypted ||= dictionary.hasEncryptionDictionary;
      validateXrefSize(dictionary.xrefSize);
    } else {
      if (dictionary.objectCount === undefined) throw new Error('Missing PDF object count');
      compressedIndirectObjects += dictionary.objectCount;
      if (
        !Number.isSafeInteger(compressedIndirectObjects)
        || classicIndirectObjects + compressedIndirectObjects
          > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS
      ) {
        throw new Error('PDF compressed indirect object limit');
      }
    }
    validatedStreams += 1;
    if (validatedStreams > MAX_CRITICAL_STREAMS) throw new Error('PDF stream limit');
    criticalStreams.push({
      type: dictionary.type,
      contents: data.subarray(streamStart, streamEnd),
      filters: dictionary.filters,
    });
  }

  let expandedBytes = 0;
  let skippedEncryptedObjectStreams = 0;
  for (const stream of criticalStreams) {
    if (encrypted && stream.type === 'ObjStm') {
      skippedEncryptedObjectStreams += 1;
      continue;
    }
    if (!stream.filters) throw new Error('Unsupported PDF object stream filter');
    const remaining = PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES - expandedBytes;
    if (remaining < 0) throw new Error('PDF object stream expansion limit');

    let decodedBytes: number;
    if (stream.filters.length === 0) {
      decodedBytes = stream.contents.byteLength;
    } else if (
      stream.filters.length === 1
      && ['FlateDecode', 'Fl'].includes(stream.filters[0] ?? '')
    ) {
      decodedBytes = boundedInflatedSize(stream.contents, remaining);
    } else {
      throw new Error('Unsupported PDF object stream filter');
    }

    expandedBytes += decodedBytes;
    if (
      !Number.isSafeInteger(expandedBytes)
      || expandedBytes > PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES
    ) {
      throw new Error('PDF object stream expansion limit');
    }
  }
  return { encrypted, skippedEncryptedObjectStreams };
}

function validateXrefSize(size: number | undefined): void {
  if (size !== undefined && size > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1) {
    throw new Error('PDF xref size limit');
  }
}

function readIndirectObjectHeaderEnd(data: Uint8Array, start: number): number | undefined {
  const previous = start === 0 ? undefined : data[start - 1];
  if (previous !== undefined && !isWhitespace(previous) && !isDelimiter(previous)) return undefined;
  const objectNumber = tryReadUnsignedInteger(data, start);
  if (!objectNumber) return undefined;
  const generationStart = skipWhitespaceAndComments(data, objectNumber.end);
  if (generationStart === objectNumber.end) return undefined;
  const generation = tryReadUnsignedInteger(data, generationStart);
  if (!generation) return undefined;
  const objectKeyword = skipWhitespaceAndComments(data, generation.end);
  if (objectKeyword === generation.end || !matchesKeyword(data, objectKeyword, 'obj')) {
    return undefined;
  }
  return objectKeyword + 'obj'.length;
}

function collectIndirectLengths(data: Uint8Array): Map<string, number | undefined> {
  const lengths = new Map<string, number | undefined>();
  for (let offset = 0; offset < data.byteLength; offset += 1) {
    const previous = offset === 0 ? undefined : data[offset - 1];
    if (previous !== undefined && !isWhitespace(previous) && !isDelimiter(previous)) continue;
    const objectNumber = tryReadUnsignedInteger(data, offset);
    if (!objectNumber) continue;
    const generationStart = skipWhitespaceAndComments(data, objectNumber.end);
    if (generationStart === objectNumber.end) continue;
    const generation = tryReadUnsignedInteger(data, generationStart);
    if (!generation) continue;
    const objectKeyword = skipWhitespaceAndComments(data, generation.end);
    if (!matchesKeyword(data, objectKeyword, 'obj')) continue;
    const valueStart = skipWhitespaceAndComments(data, objectKeyword + 'obj'.length);
    const value = tryReadUnsignedInteger(data, valueStart);
    if (!value) continue;
    const objectEnd = skipWhitespaceAndComments(data, value.end);
    if (!matchesKeyword(data, objectEnd, 'endobj')) continue;

    const key = referenceKey(objectNumber.value, generation.value);
    const current = lengths.get(key);
    if (!lengths.has(key)) {
      if (lengths.size >= MAX_INDIRECT_LENGTH_OBJECTS) {
        throw new Error('PDF indirect length object limit');
      }
      lengths.set(key, value.value);
    } else if (current === value.value) {
      lengths.set(key, value.value);
    } else {
      lengths.set(key, undefined);
    }
    offset = objectEnd + 'endobj'.length - 1;
  }
  return lengths;
}

function resolveStreamLength(
  length: number | RawPdfReference | undefined,
  indirectLengths: ReadonlyMap<string, number | undefined>,
): number | undefined {
  if (typeof length === 'number') return length;
  if (!length) return undefined;
  return indirectLengths.get(referenceKey(length.objectNumber, length.generationNumber));
}

function referenceKey(objectNumber: number, generationNumber: number): string {
  return `${String(objectNumber)}:${String(generationNumber)}`;
}

function parseCriticalDictionary(
  data: Uint8Array,
  dictionaryStart: number,
  dictionaryEnd: number,
): ParsedDictionary {
  let type: string | undefined;
  let length: number | RawPdfReference | undefined;
  let filters: readonly string[] | undefined = [];
  let objectCount: number | undefined;
  let xrefSize: number | undefined;
  let hasFilter = false;
  let hasEncryptionDictionary = false;
  let dictionaryDepth = 0;
  let arrayDepth = 0;
  let offset = dictionaryStart;

  while (offset < dictionaryEnd) {
    const byte = data[offset];
    if (byte === PERCENT) {
      offset = skipComment(data, offset);
      continue;
    }
    if (byte === LEFT_PARENTHESIS) {
      offset = skipLiteralString(data, offset);
      continue;
    }
    if (byte === LESS_THAN && data[offset + 1] === LESS_THAN) {
      dictionaryDepth += 1;
      offset += 2;
      continue;
    }
    if (byte === GREATER_THAN && data[offset + 1] === GREATER_THAN) {
      dictionaryDepth -= 1;
      offset += 2;
      continue;
    }
    if (byte === LESS_THAN) {
      offset = skipHexString(data, offset);
      continue;
    }
    if (dictionaryDepth === 1 && byte === LEFT_BRACKET) {
      arrayDepth += 1;
      offset += 1;
      continue;
    }
    if (dictionaryDepth === 1 && byte === RIGHT_BRACKET) {
      arrayDepth = Math.max(0, arrayDepth - 1);
      offset += 1;
      continue;
    }
    if (dictionaryDepth !== 1 || arrayDepth !== 0 || byte !== PDF_NAME) {
      offset += 1;
      continue;
    }

    const key = readPdfName(data, offset);
    if (!key) throw new Error('Invalid PDF dictionary name');
    offset = key.end;
    const valueStart = skipWhitespaceAndComments(data, offset);
    if (key.value === 'Type') {
      if (type !== undefined) throw new Error('Duplicate PDF stream type');
      const value = readPdfName(data, valueStart);
      if (!value) throw new Error('Invalid PDF stream type');
      type = value.value;
      offset = value.end;
    } else if (key.value === 'Length') {
      if (length !== undefined) throw new Error('Duplicate PDF stream length');
      const value = readUnsignedInteger(data, valueStart);
      if (!value) throw new Error('Indirect PDF stream length');
      const following = skipWhitespaceAndComments(data, value.end);
      const generation = readUnsignedInteger(data, following);
      if (generation) {
        const referenceMarker = skipWhitespaceAndComments(data, generation.end);
        if (matchesKeyword(data, referenceMarker, 'R')) {
          length = {
            objectNumber: value.value,
            generationNumber: generation.value,
          };
          offset = referenceMarker + 1;
          continue;
        }
      }
      length = value.value;
      offset = value.end;
    } else if (key.value === 'Filter') {
      if (hasFilter) throw new Error('Duplicate PDF stream filter');
      hasFilter = true;
      try {
        const value = readFilters(data, valueStart);
        filters = value.filters;
        offset = value.end;
      } catch {
        filters = undefined;
        offset = valueStart + 1;
      }
    } else if (key.value === 'N' || key.value === 'Size') {
      const value = readUnsignedInteger(data, valueStart);
      if (!value) throw new Error('Invalid PDF object count');
      if (key.value === 'N') {
        if (objectCount !== undefined) throw new Error('Duplicate PDF object count');
        objectCount = value.value;
      } else {
        if (xrefSize !== undefined) throw new Error('Duplicate PDF xref size');
        xrefSize = value.value;
      }
      offset = value.end;
    } else if (key.value === 'Encrypt') {
      hasEncryptionDictionary = true;
    }
  }
  return { type, length, filters, objectCount, xrefSize, hasEncryptionDictionary };
}

function findDictionaryEnd(data: Uint8Array, start: number): number | undefined {
  const limit = Math.min(data.byteLength, start + DICTIONARY_SEARCH_WINDOW_BYTES);
  let depth = 0;
  let offset = start;
  while (offset < limit) {
    const byte = data[offset];
    if (byte === PERCENT) {
      offset = skipComment(data, offset);
    } else if (byte === LEFT_PARENTHESIS) {
      offset = skipLiteralString(data, offset);
    } else if (byte === LESS_THAN && data[offset + 1] === LESS_THAN) {
      depth += 1;
      offset += 2;
    } else if (byte === GREATER_THAN && data[offset + 1] === GREATER_THAN) {
      depth -= 1;
      offset += 2;
      if (depth === 0) return offset;
      if (depth < 0) return undefined;
    } else if (byte === LESS_THAN) {
      offset = skipHexString(data, offset);
    } else {
      offset += 1;
    }
  }
  return undefined;
}

function readFilters(
  data: Uint8Array,
  start: number,
): { filters: readonly string[]; end: number } {
  if (data[start] === PDF_NAME) {
    const filter = readPdfName(data, start);
    if (!filter) throw new Error('Invalid PDF stream filter');
    return { filters: [filter.value], end: filter.end };
  }
  if (data[start] !== LEFT_BRACKET) throw new Error('Indirect PDF stream filter');
  const filters: string[] = [];
  let offset = start + 1;
  while (offset < data.byteLength) {
    offset = skipWhitespaceAndComments(data, offset);
    if (data[offset] === RIGHT_BRACKET) return { filters, end: offset + 1 };
    const filter = readPdfName(data, offset);
    if (!filter) throw new Error('Invalid PDF stream filter array');
    filters.push(filter.value);
    offset = filter.end;
  }
  throw new Error('Unterminated PDF stream filter array');
}

function readPdfName(data: Uint8Array, start: number): RawPdfName | undefined {
  if (data[start] !== PDF_NAME) return undefined;
  const characters: number[] = [];
  let offset = start + 1;
  while (offset < data.byteLength && !isWhitespace(data[offset]) && !isDelimiter(data[offset])) {
    if (characters.length >= MAX_NAME_BYTES) return undefined;
    if (data[offset] === 0x23) {
      const high = hexValue(data[offset + 1]);
      const low = hexValue(data[offset + 2]);
      if (high === undefined || low === undefined) {
        characters.push(data[offset] ?? 0);
        offset += 1;
      } else {
        characters.push(high * 16 + low);
        offset += 3;
      }
    } else {
      characters.push(data[offset] ?? 0);
      offset += 1;
    }
  }
  return { value: String.fromCharCode(...characters), end: offset };
}

function readUnsignedInteger(
  data: Uint8Array,
  start: number,
): { value: number; end: number } | undefined {
  let offset = start;
  let value = 0;
  let digits = 0;
  while (offset < data.byteLength) {
    const byte = data[offset] ?? 0;
    if (byte < 0x30 || byte > 0x39) break;
    value = value * 10 + byte - 0x30;
    if (!Number.isSafeInteger(value)) throw new Error('PDF integer limit');
    digits += 1;
    offset += 1;
  }
  return digits === 0 ? undefined : { value, end: offset };
}

function tryReadUnsignedInteger(
  data: Uint8Array,
  start: number,
): { value: number; end: number } | undefined {
  try {
    return readUnsignedInteger(data, start);
  } catch {
    return undefined;
  }
}

function readStreamStart(data: Uint8Array, start: number): number {
  if (data[start] === 0x0d) return data[start + 1] === 0x0a ? start + 2 : start + 1;
  if (data[start] === 0x0a) return start + 1;
  throw new Error('Invalid PDF stream header');
}

function skipWhitespaceAndComments(data: Uint8Array, start: number): number {
  let offset = start;
  while (offset < data.byteLength) {
    const next = skipWhitespace(data, offset);
    if (data[next] !== PERCENT) return next;
    offset = skipComment(data, next);
  }
  return offset;
}

function skipWhitespace(data: Uint8Array, start: number): number {
  let offset = start;
  while (offset < data.byteLength && isWhitespace(data[offset])) offset += 1;
  return offset;
}

function skipComment(data: Uint8Array, start: number): number {
  let offset = start + 1;
  while (offset < data.byteLength && data[offset] !== 0x0a && data[offset] !== 0x0d) offset += 1;
  return offset;
}

function skipLiteralString(data: Uint8Array, start: number): number {
  let depth = 1;
  let offset = start + 1;
  while (offset < data.byteLength) {
    const byte = data[offset];
    if (byte === BACKSLASH) {
      offset += data[offset + 1] === 0x0d && data[offset + 2] === 0x0a ? 3 : 2;
    } else if (byte === LEFT_PARENTHESIS) {
      depth += 1;
      offset += 1;
    } else if (byte === RIGHT_PARENTHESIS) {
      depth -= 1;
      offset += 1;
      if (depth === 0) return offset;
    } else {
      offset += 1;
    }
  }
  throw new Error('Unterminated PDF string');
}

function skipHexString(data: Uint8Array, start: number): number {
  let offset = start + 1;
  while (offset < data.byteLength && data[offset] !== GREATER_THAN) offset += 1;
  if (offset >= data.byteLength) throw new Error('Unterminated PDF hex string');
  return offset + 1;
}

function matchesKeyword(data: Uint8Array, start: number, keyword: string): boolean {
  if (start < 0 || start + keyword.length > data.byteLength) return false;
  for (let index = 0; index < keyword.length; index += 1) {
    if (data[start + index] !== keyword.charCodeAt(index)) return false;
  }
  const before = start === 0 ? undefined : data[start - 1];
  const hasAfter = start + keyword.length < data.byteLength;
  return (before === undefined || isWhitespace(before) || isDelimiter(before))
    && (!hasAfter || isWhitespace(data[start + keyword.length])
      || isDelimiter(data[start + keyword.length]));
}

function matchesBareKeyword(data: Uint8Array, start: number, keyword: string): boolean {
  if (!matchesKeyword(data, start, keyword)) return false;
  return start === 0 || isWhitespace(data[start - 1]);
}

function isWhitespace(byte: number | undefined): boolean {
  return byte === 0x00 || byte === 0x09 || byte === 0x0a
    || byte === 0x0c || byte === 0x0d || byte === 0x20;
}

function isDelimiter(byte: number | undefined): boolean {
  return byte === LEFT_PARENTHESIS || byte === RIGHT_PARENTHESIS
    || byte === LESS_THAN || byte === GREATER_THAN
    || byte === LEFT_BRACKET || byte === RIGHT_BRACKET
    || byte === 0x7b || byte === 0x7d || byte === PDF_NAME || byte === PERCENT;
}

function hexValue(byte: number | undefined): number | undefined {
  if (byte !== undefined && byte >= 0x30 && byte <= 0x39) return byte - 0x30;
  if (byte !== undefined && byte >= 0x41 && byte <= 0x46) return byte - 0x41 + 10;
  if (byte !== undefined && byte >= 0x61 && byte <= 0x66) return byte - 0x61 + 10;
  return undefined;
}

function boundedInflatedSize(contents: Uint8Array, maxDecodedBytes: number): number {
  const inflater = new Inflate({ chunkSize: INFLATE_CHUNK_BYTES });
  let decodedBytes = 0;
  inflater.onData = chunk => {
    decodedBytes += chunk.byteLength;
    if (decodedBytes > maxDecodedBytes) throw new Error('PDF object stream expansion limit');
  };
  const succeeded = inflater.push(contents, true);
  if (!succeeded || inflater.err !== 0) throw new Error('Invalid PDF object stream');
  return decodedBytes;
}
