import { Inflate } from 'pako';

export const PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS = 100_000;
export const PDF_PRIVACY_MAX_RAW_TOKENS = 1_000_000;
export const PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH = 256;

const DICTIONARY_SEARCH_WINDOW_BYTES = 1 * 1_024 * 1_024;
const INFLATE_CHUNK_BYTES = 64 * 1_024;
const MAX_CRITICAL_STREAMS = 10_000;
const MAX_INDIRECT_LENGTH_OBJECTS = 100_000;
const MAX_INDIRECT_LENGTH_DECLARATIONS = 100_000;
const MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT = 64;
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

interface IndirectLengthCandidateIndex {
  values: Map<string, Set<number>>;
  declarationOffsets: Map<string, Map<number, Set<number>>>;
  compressedValues: Map<string, Set<number>>;
  authoritativeOffsets: ReadonlyMap<string, number>;
  encryptedFromCrossReference: boolean;
}

interface ParsedDictionary {
  type?: string;
  length?: number | RawPdfReference;
  filters?: readonly string[];
  objectCount?: number;
  firstObjectOffset?: number;
  xrefSize?: number;
  xrefWidths?: readonly number[];
  xrefIndex?: readonly number[];
  previousXrefOffset?: number;
  hasEncryptionDictionary: boolean;
}

interface CriticalStreamDescriptor {
  type: 'ObjStm' | 'XRef';
  contents: Uint8Array;
  filters: readonly string[] | undefined;
}

interface RawSyntaxBudget {
  tokens: number;
  containerDepth: number;
}

interface ByteRange {
  start: number;
  end: number;
}

interface CrossReferenceMetadata {
  objectOffsets: Map<string, number>;
  encrypted: boolean;
}

interface CrossReferenceSection {
  objectOffsets: Map<string, number>;
  definedObjectNumbers: Set<number>;
  encrypted: boolean;
  previousOffset?: number;
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
  const {
    lengths: indirectLengths,
    encryptedBeforeObjectStreamDiscovery,
  } = collectIndirectLengths(data);
  const criticalStreams: CriticalStreamDescriptor[] = [];
  const rawSyntaxBudget: RawSyntaxBudget = { tokens: 0, containerDepth: 0 };
  let encrypted = encryptedBeforeObjectStreamDiscovery;
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
      consumeRawTokens(rawSyntaxBudget);
      offset = skipLiteralString(data, offset);
      continue;
    }
    if (matchesBareKeyword(data, offset, 'trailer')) {
      consumeRawTokens(rawSyntaxBudget);
      expectTrailerDictionary = true;
      offset += 'trailer'.length;
      continue;
    }
    if (byte === LESS_THAN && data[offset + 1] !== LESS_THAN) {
      consumeRawTokens(rawSyntaxBudget);
      offset = skipHexString(data, offset);
      continue;
    }
    const objectHeaderEnd = readIndirectObjectHeaderEnd(data, offset);
    if (objectHeaderEnd !== undefined) {
      consumeRawTokens(rawSyntaxBudget, 3);
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
      offset = consumeRawSyntax(data, offset, data.byteLength, rawSyntaxBudget);
      continue;
    }

    const dictionaryStart = offset;
    const dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
    if (dictionaryEnd === undefined) throw new Error('PDF dictionary limit');
    const initialContainerDepth = rawSyntaxBudget.containerDepth;
    consumeRawSyntaxRange(data, dictionaryStart, dictionaryEnd, rawSyntaxBudget);
    if (rawSyntaxBudget.containerDepth !== initialContainerDepth) {
      throw new Error('Invalid PDF container nesting');
    }
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
    consumeRawTokens(rawSyntaxBudget, 2);
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

function consumeRawSyntaxRange(
  data: Uint8Array,
  start: number,
  end: number,
  budget: RawSyntaxBudget,
): void {
  let offset = start;
  while (offset < end) offset = consumeRawSyntax(data, offset, end, budget);
}

function consumeRawSyntax(
  data: Uint8Array,
  start: number,
  end: number,
  budget: RawSyntaxBudget,
): number {
  const byte = data[start];
  if (isWhitespace(byte)) return skipWhitespace(data, start);
  if (byte === PERCENT) return skipComment(data, start);
  if (byte === LEFT_PARENTHESIS) {
    consumeRawTokens(budget);
    return skipLiteralString(data, start);
  }
  if (byte === LESS_THAN && data[start + 1] !== LESS_THAN) {
    consumeRawTokens(budget);
    return skipHexString(data, start);
  }
  if (byte === LESS_THAN && data[start + 1] === LESS_THAN) {
    consumeRawTokens(budget);
    enterRawContainer(budget);
    return start + 2;
  }
  if (byte === GREATER_THAN && data[start + 1] === GREATER_THAN) {
    consumeRawTokens(budget);
    leaveRawContainer(budget);
    return start + 2;
  }
  if (byte === LEFT_BRACKET || byte === 0x7b) {
    consumeRawTokens(budget);
    enterRawContainer(budget);
    return start + 1;
  }
  if (byte === RIGHT_BRACKET || byte === 0x7d) {
    consumeRawTokens(budget);
    leaveRawContainer(budget);
    return start + 1;
  }
  if (byte === PDF_NAME) {
    consumeRawTokens(budget);
    const name = readPdfName(data, start);
    if (!name || name.end > end) throw new Error('PDF raw name limit');
    return name.end;
  }

  consumeRawTokens(budget);
  if (isDelimiter(byte)) return start + 1;
  let offset = start + 1;
  while (offset < end && !isWhitespace(data[offset]) && !isDelimiter(data[offset])) {
    offset += 1;
  }
  return offset;
}

function consumeRawTokens(budget: RawSyntaxBudget, count = 1): void {
  budget.tokens += count;
  if (!Number.isSafeInteger(budget.tokens) || budget.tokens > PDF_PRIVACY_MAX_RAW_TOKENS) {
    throw new Error('PDF raw token limit');
  }
}

function enterRawContainer(budget: RawSyntaxBudget): void {
  budget.containerDepth += 1;
  if (budget.containerDepth > PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH) {
    throw new Error('PDF raw container depth limit');
  }
}

function leaveRawContainer(budget: RawSyntaxBudget): void {
  budget.containerDepth = Math.max(0, budget.containerDepth - 1);
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

function collectIndirectLengths(data: Uint8Array): {
  lengths: Map<string, number | undefined>;
  encryptedBeforeObjectStreamDiscovery: boolean;
} {
  const candidates = collectIndirectLengthCandidates(data);
  const encryptedBeforeObjectStreamDiscovery = detectEncryptionBeforeObjectStreamDiscovery(
    data,
    candidates,
  );
  const compressedCandidates = encryptedBeforeObjectStreamDiscovery
    ? new Map<string, Set<number>>()
    : collectCompressedIndirectLengthCandidates(data, candidates);
  const lengths = new Map<string, number | undefined>();
  for (const [key, values] of compressedCandidates) {
    lengths.set(key, values.size === 1 ? values.values().next().value : undefined);
  }
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
    if (byte === LESS_THAN && data[offset + 1] !== LESS_THAN) {
      offset = skipHexString(data, offset);
      continue;
    }
    if (byte === LESS_THAN && data[offset + 1] === LESS_THAN) {
      const dictionaryEnd = findDictionaryEnd(data, offset);
      if (dictionaryEnd === undefined) throw new Error('PDF dictionary limit');
      const dictionary = parseCriticalDictionary(data, offset, dictionaryEnd);
      const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
      if (matchesKeyword(data, streamKeyword, 'stream')) {
        const streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
        const length = resolveCandidateStreamLength(
          dictionary.length,
          candidates,
          data,
          streamStart,
        );
        if (length === undefined) throw new Error('Missing PDF stream length');
        const streamEnd = streamStart + length;
        if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) {
          throw new Error('Invalid PDF stream length');
        }
        const endstream = skipWhitespace(data, streamEnd);
        if (!matchesKeyword(data, endstream, 'endstream')) {
          throw new Error('Invalid PDF stream boundary');
        }
        offset = endstream + 'endstream'.length;
        continue;
      }
      offset = dictionaryEnd;
      continue;
    }

    const previous = offset === 0 ? undefined : data[offset - 1];
    if (previous !== undefined && !isWhitespace(previous) && !isDelimiter(previous)) {
      offset += 1;
      continue;
    }
    const objectNumber = tryReadUnsignedInteger(data, offset);
    if (!objectNumber) {
      offset += 1;
      continue;
    }
    const generationStart = skipWhitespaceAndComments(data, objectNumber.end);
    if (generationStart === objectNumber.end) {
      offset = objectNumber.end;
      continue;
    }
    const generation = tryReadUnsignedInteger(data, generationStart);
    if (!generation) {
      offset = objectNumber.end;
      continue;
    }
    const objectKeyword = skipWhitespaceAndComments(data, generation.end);
    if (!matchesKeyword(data, objectKeyword, 'obj')) {
      offset = generation.end;
      continue;
    }
    const valueStart = skipWhitespaceAndComments(data, objectKeyword + 'obj'.length);
    const value = tryReadUnsignedInteger(data, valueStart);
    if (!value) {
      offset = objectKeyword + 'obj'.length;
      continue;
    }
    const objectEnd = skipWhitespaceAndComments(data, value.end);
    if (!matchesKeyword(data, objectEnd, 'endobj')) {
      offset = value.end;
      continue;
    }

    const key = referenceKey(objectNumber.value, generation.value);
    const authoritativeOffset = candidates.authoritativeOffsets.get(key);
    if (authoritativeOffset !== undefined && authoritativeOffset !== offset) {
      offset = objectEnd + 'endobj'.length;
      continue;
    }
    if (authoritativeOffset !== undefined) {
      if (!lengths.has(key) && lengths.size >= MAX_INDIRECT_LENGTH_OBJECTS) {
        throw new Error('PDF indirect length object limit');
      }
      lengths.set(key, value.value);
      offset = objectEnd + 'endobj'.length;
      continue;
    }
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
    offset = objectEnd + 'endobj'.length;
  }
  return { lengths, encryptedBeforeObjectStreamDiscovery };
}

function collectIndirectLengthCandidates(data: Uint8Array): IndirectLengthCandidateIndex {
  const crossReference = collectCrossReferenceMetadata(data);
  const candidates: IndirectLengthCandidateIndex = {
    values: new Map<string, Set<number>>(),
    declarationOffsets: new Map<string, Map<number, Set<number>>>(),
    compressedValues: new Map<string, Set<number>>(),
    authoritativeOffsets: crossReference.objectOffsets,
    encryptedFromCrossReference: crossReference.encrypted,
  };
  let candidateValues = 0;
  let candidateDeclarations = 0;
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
    let values = candidates.values.get(key);
    if (!values) {
      values = new Set<number>();
      candidates.values.set(key, values);
    }
    if (!values.has(value.value)) {
      candidateValues += 1;
      if (candidateValues > MAX_INDIRECT_LENGTH_OBJECTS) {
        throw new Error('PDF indirect length object limit');
      }
      if (values.size >= MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
        throw new Error('PDF indirect length candidate limit');
      }
      values.add(value.value);
    }
    let offsetsByValue = candidates.declarationOffsets.get(key);
    if (!offsetsByValue) {
      offsetsByValue = new Map<number, Set<number>>();
      candidates.declarationOffsets.set(key, offsetsByValue);
    }
    let declarationOffsets = offsetsByValue.get(value.value);
    if (!declarationOffsets) {
      declarationOffsets = new Set<number>();
      offsetsByValue.set(value.value, declarationOffsets);
    }
    if (!declarationOffsets.has(offset)) {
      candidateDeclarations += 1;
      if (candidateDeclarations > MAX_INDIRECT_LENGTH_DECLARATIONS) {
        throw new Error('PDF indirect length declaration limit');
      }
      declarationOffsets.add(offset);
    }
    offset = objectEnd + 'endobj'.length - 1;
  }
  removeCandidatesDeclaredInsideStreams(data, candidates);
  return candidates;
}

function removeCandidatesDeclaredInsideStreams(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): void {
  const streamRanges = collectKnownStreamRanges(data, candidates);
  for (const [key, offsetsByValue] of candidates.declarationOffsets) {
    const values = candidates.values.get(key);
    for (const [value, offsets] of offsetsByValue) {
      for (const offset of offsets) {
        if (isOffsetInsideRanges(offset, streamRanges)) offsets.delete(offset);
      }
      if (offsets.size === 0) {
        offsetsByValue.delete(value);
        values?.delete(value);
      }
    }
    if (offsetsByValue.size === 0) candidates.declarationOffsets.delete(key);
    if (values?.size === 0) candidates.values.delete(key);
  }
}

function collectKnownStreamRanges(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): ByteRange[] {
  const ranges: ByteRange[] = [];
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
    if (byte === LESS_THAN && data[offset + 1] !== LESS_THAN) {
      offset = skipHexString(data, offset);
      continue;
    }
    if (byte !== LESS_THAN || data[offset + 1] !== LESS_THAN) {
      offset += 1;
      continue;
    }

    const dictionaryEnd = findDictionaryEnd(data, offset);
    if (dictionaryEnd === undefined) {
      offset += 2;
      continue;
    }
    let dictionary: ParsedDictionary;
    try {
      dictionary = parseCriticalDictionary(data, offset, dictionaryEnd);
    } catch {
      offset = dictionaryEnd;
      continue;
    }
    const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
    if (!matchesKeyword(data, streamKeyword, 'stream')) {
      offset = dictionaryEnd;
      continue;
    }
    let streamStart: number;
    try {
      streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
    } catch {
      offset = dictionaryEnd;
      continue;
    }
    const length = resolveCandidateStreamLength(
      dictionary.length,
      candidates,
      data,
      streamStart,
    );
    if (length === undefined) {
      offset = dictionaryEnd;
      continue;
    }
    const streamEnd = streamStart + length;
    if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) {
      offset = dictionaryEnd;
      continue;
    }
    const endstream = skipWhitespace(data, streamEnd);
    if (!matchesKeyword(data, endstream, 'endstream')) {
      offset = dictionaryEnd;
      continue;
    }
    ranges.push({ start: streamStart, end: streamEnd });
    if (ranges.length > MAX_CRITICAL_STREAMS) throw new Error('PDF stream limit');
    offset = endstream + 'endstream'.length;
  }
  return ranges;
}

function isOffsetInsideRanges(offset: number, ranges: readonly ByteRange[]): boolean {
  let lower = 0;
  let upper = ranges.length - 1;
  while (lower <= upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    const range = ranges[middle];
    if (offset < range.start) {
      upper = middle - 1;
    } else if (offset >= range.end) {
      lower = middle + 1;
    } else {
      return true;
    }
  }
  return false;
}

function detectEncryptionBeforeObjectStreamDiscovery(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): boolean {
  if (candidates.encryptedFromCrossReference) return true;
  let expectTrailerDictionary = false;
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
    if (byte === LESS_THAN && data[offset + 1] !== LESS_THAN) {
      offset = skipHexString(data, offset);
      continue;
    }
    if (matchesBareKeyword(data, offset, 'trailer')) {
      expectTrailerDictionary = true;
      offset += 'trailer'.length;
      continue;
    }
    if (byte !== LESS_THAN || data[offset + 1] !== LESS_THAN) {
      offset += 1;
      continue;
    }

    const dictionaryEnd = findDictionaryEnd(data, offset);
    if (dictionaryEnd === undefined) {
      offset += 2;
      continue;
    }
    let dictionary: ParsedDictionary;
    try {
      dictionary = parseCriticalDictionary(data, offset, dictionaryEnd);
    } catch {
      offset = dictionaryEnd;
      continue;
    }
    if (
      dictionary.hasEncryptionDictionary
      && (expectTrailerDictionary || dictionary.type === 'XRef')
    ) return true;
    expectTrailerDictionary = false;

    const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
    if (!matchesKeyword(data, streamKeyword, 'stream')) {
      offset = dictionaryEnd;
      continue;
    }
    let streamStart: number;
    try {
      streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
    } catch {
      offset = dictionaryEnd;
      continue;
    }
    const length = resolveCandidateStreamLength(
      dictionary.length,
      candidates,
      data,
      streamStart,
    );
    if (length === undefined) return false;
    const streamEnd = streamStart + length;
    if (
      !Number.isSafeInteger(streamEnd)
      || streamEnd > data.byteLength
      || !matchesKeyword(data, skipWhitespace(data, streamEnd), 'endstream')
    ) {
      offset = dictionaryEnd;
      continue;
    }
    offset = skipWhitespace(data, streamEnd) + 'endstream'.length;
  }
  return false;
}

function collectCrossReferenceMetadata(data: Uint8Array): CrossReferenceMetadata {
  const objectOffsets = new Map<string, number>();
  const startXrefOffset = findLastBareKeyword(data, 'startxref');
  if (startXrefOffset === undefined) return { objectOffsets, encrypted: false };
  const valueStart = skipWhitespaceAndComments(data, startXrefOffset + 'startxref'.length);
  const xrefPosition = tryReadUnsignedInteger(data, valueStart);
  if (!xrefPosition || xrefPosition.value >= data.byteLength) {
    return { objectOffsets, encrypted: false };
  }

  const visitedOffsets = new Set<number>();
  const definedObjectNumbers = new Set<number>();
  let encrypted = false;
  let currentOffset: number | undefined = xrefPosition.value;
  while (currentOffset !== undefined) {
    if (visitedOffsets.has(currentOffset) || visitedOffsets.size >= 128) break;
    visitedOffsets.add(currentOffset);
    const section = readCrossReferenceSection(data, currentOffset, startXrefOffset);
    if (!section) break;
    encrypted ||= section.encrypted;
    for (const [key, objectOffset] of section.objectOffsets) {
      const objectNumber = referenceObjectNumber(key);
      if (!definedObjectNumbers.has(objectNumber)) objectOffsets.set(key, objectOffset);
    }
    for (const objectNumber of section.definedObjectNumbers) {
      definedObjectNumbers.add(objectNumber);
    }
    currentOffset = section.previousOffset;
  }
  return { objectOffsets, encrypted };
}

function readCrossReferenceSection(
  data: Uint8Array,
  sectionOffset: number,
  lastStartXrefOffset: number,
): CrossReferenceSection | undefined {
  const xrefOffset = skipWhitespaceAndComments(data, sectionOffset);
  if (matchesKeyword(data, xrefOffset, 'xref')) {
    return readClassicCrossReferenceSection(data, xrefOffset, lastStartXrefOffset);
  }

  const objectHeaderEnd = readIndirectObjectHeaderEnd(data, xrefOffset);
  if (objectHeaderEnd === undefined) return undefined;
  const dictionaryStart = skipWhitespaceAndComments(data, objectHeaderEnd);
  if (data[dictionaryStart] !== LESS_THAN || data[dictionaryStart + 1] !== LESS_THAN) {
    return undefined;
  }
  const dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
  if (dictionaryEnd === undefined) return undefined;
  let dictionary: ParsedDictionary;
  try {
    dictionary = parseCriticalDictionary(data, dictionaryStart, dictionaryEnd);
  } catch {
    return undefined;
  }
  if (dictionary.type !== 'XRef') return undefined;
  return readXrefStreamSection(data, dictionaryEnd, dictionary);
}

function readXrefStreamSection(
  data: Uint8Array,
  dictionaryEnd: number,
  dictionary: ParsedDictionary,
): CrossReferenceSection | undefined {
  const ranges = readXrefRanges(dictionary);
  if (!ranges) return undefined;
  const definedObjectNumbers = new Set<number>();
  let entryCount = 0;
  for (const [firstObject, count] of ranges) {
    entryCount += count;
    if (
      !Number.isSafeInteger(entryCount)
      || entryCount > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1
    ) throw new Error('PDF xref size limit');
    for (let index = 0; index < count; index += 1) {
      definedObjectNumbers.add(firstObject + index);
    }
  }

  const section: CrossReferenceSection = {
    objectOffsets: new Map<string, number>(),
    definedObjectNumbers,
    encrypted: dictionary.hasEncryptionDictionary,
    previousOffset: dictionary.previousXrefOffset,
  };
  const widths = dictionary.xrefWidths;
  if (!widths || widths.length !== 3 || widths.some(width => width > 8)) return section;
  const rowWidth = widths.reduce((total, width) => total + width, 0);
  const expectedBytes = entryCount * rowWidth;
  if (
    rowWidth === 0
    || !Number.isSafeInteger(expectedBytes)
    || expectedBytes > PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES
  ) return section;
  if (typeof dictionary.length !== 'number') return section;

  const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
  if (!matchesKeyword(data, streamKeyword, 'stream')) return section;
  let streamStart: number;
  try {
    streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
  } catch {
    return section;
  }
  const streamEnd = streamStart + dictionary.length;
  if (
    !Number.isSafeInteger(streamEnd)
    || streamEnd > data.byteLength
    || !matchesKeyword(data, skipWhitespace(data, streamEnd), 'endstream')
  ) return section;
  const decoded = decodeObjectStreamContents(
    data.subarray(streamStart, streamEnd),
    dictionary.filters,
    expectedBytes,
  );
  if (!decoded || decoded.byteLength !== expectedBytes) return section;

  let decodedOffset = 0;
  for (const [firstObject, count] of ranges) {
    for (let index = 0; index < count; index += 1) {
      const type = widths[0] === 0
        ? 1
        : readBigEndianUnsignedInteger(decoded, decodedOffset, widths[0] ?? 0);
      decodedOffset += widths[0] ?? 0;
      const fieldOne = readBigEndianUnsignedInteger(decoded, decodedOffset, widths[1] ?? 0);
      decodedOffset += widths[1] ?? 0;
      const fieldTwo = readBigEndianUnsignedInteger(decoded, decodedOffset, widths[2] ?? 0);
      decodedOffset += widths[2] ?? 0;
      if (type === undefined || fieldOne === undefined || fieldTwo === undefined) {
        return section;
      }
      if (type === 1 && fieldOne < data.byteLength) {
        section.objectOffsets.set(
          referenceKey(firstObject + index, fieldTwo),
          fieldOne,
        );
      }
    }
  }
  return section;
}

function readXrefRanges(
  dictionary: ParsedDictionary,
): readonly (readonly [number, number])[] | undefined {
  if (dictionary.xrefSize === undefined) return undefined;
  validateXrefSize(dictionary.xrefSize);
  const values = dictionary.xrefIndex ?? [0, dictionary.xrefSize];
  if (values.length === 0 || values.length % 2 !== 0) return undefined;
  const ranges: Array<readonly [number, number]> = [];
  let entryCount = 0;
  for (let index = 0; index < values.length; index += 2) {
    const firstObject = values[index] ?? 0;
    const count = values[index + 1] ?? 0;
    const rangeEnd = firstObject + count;
    entryCount += count;
    if (
      !Number.isSafeInteger(rangeEnd)
      || rangeEnd > dictionary.xrefSize
      || !Number.isSafeInteger(entryCount)
      || entryCount > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1
    ) return undefined;
    ranges.push([firstObject, count]);
  }
  return ranges;
}

function readBigEndianUnsignedInteger(
  data: Uint8Array,
  start: number,
  width: number,
): number | undefined {
  if (start < 0 || start + width > data.byteLength) return undefined;
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const byte = data[start + index] ?? 0;
    value = value * 256 + byte;
    if (!Number.isSafeInteger(value)) return undefined;
  }
  return value;
}

function readClassicCrossReferenceSection(
  data: Uint8Array,
  xrefOffset: number,
  lastStartXrefOffset: number,
): CrossReferenceSection | undefined {
  const objectOffsets = new Map<string, number>();
  const definedObjectNumbers = new Set<number>();
  let entriesRead = 0;
  let offset = xrefOffset + 'xref'.length;
  while (offset < lastStartXrefOffset) {
    offset = skipWhitespaceAndComments(data, offset);
    if (matchesKeyword(data, offset, 'trailer')) {
      const dictionaryStart = skipWhitespaceAndComments(data, offset + 'trailer'.length);
      if (data[dictionaryStart] !== LESS_THAN || data[dictionaryStart + 1] !== LESS_THAN) {
        return undefined;
      }
      const dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
      if (dictionaryEnd === undefined || dictionaryEnd > lastStartXrefOffset) return undefined;
      try {
        const dictionary = parseCriticalDictionary(data, dictionaryStart, dictionaryEnd);
        return {
          objectOffsets,
          definedObjectNumbers,
          encrypted: dictionary.hasEncryptionDictionary,
          previousOffset: dictionary.previousXrefOffset,
        };
      } catch {
        return undefined;
      }
    }

    const firstObject = tryReadUnsignedInteger(data, offset);
    if (!firstObject) return undefined;
    offset = skipWhitespaceAndComments(data, firstObject.end);
    const count = tryReadUnsignedInteger(data, offset);
    if (!count) return undefined;
    offset = count.end;
    entriesRead += count.value;
    if (
      !Number.isSafeInteger(entriesRead)
      || entriesRead > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1
    ) throw new Error('PDF xref size limit');

    for (let index = 0; index < count.value; index += 1) {
      offset = skipWhitespaceAndComments(data, offset);
      const objectOffset = tryReadUnsignedInteger(data, offset);
      if (!objectOffset) return undefined;
      offset = skipWhitespaceAndComments(data, objectOffset.end);
      const generation = tryReadUnsignedInteger(data, offset);
      if (!generation) return undefined;
      offset = skipWhitespaceAndComments(data, generation.end);
      const marker = data[offset];
      if (marker !== 0x6e && marker !== 0x66) return undefined;
      const objectNumber = firstObject.value + index;
      if (!Number.isSafeInteger(objectNumber)) return undefined;
      definedObjectNumbers.add(objectNumber);
      if (marker === 0x6e) {
        objectOffsets.set(
          referenceKey(objectNumber, generation.value),
          objectOffset.value,
        );
      }
      offset += 1;
    }
  }
  return undefined;
}

function findLastBareKeyword(data: Uint8Array, keyword: string): number | undefined {
  for (let offset = data.byteLength - keyword.length; offset >= 0; offset -= 1) {
    if (matchesBareKeyword(data, offset, keyword) && !isInsideLineComment(data, offset)) {
      return offset;
    }
  }
  return undefined;
}

function isInsideLineComment(data: Uint8Array, offset: number): boolean {
  for (let index = offset - 1; index >= 0; index -= 1) {
    const byte = data[index];
    if (byte === 0x0a || byte === 0x0d) return false;
    if (byte === PERCENT) return true;
  }
  return false;
}

function collectCompressedIndirectLengthCandidates(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): Map<string, Set<number>> {
  const compressedCandidates = new Map<string, Set<number>>();
  const processedStreams = new Set<number>();
  let candidateValues = countCandidateValues(candidates.values);
  let expandedBytes = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let offset = 0; offset < data.byteLength; offset += 1) {
      const objectHeaderEnd = readIndirectObjectHeaderEnd(data, offset);
      if (objectHeaderEnd === undefined) continue;
      const dictionaryStart = skipWhitespaceAndComments(data, objectHeaderEnd);
      if (data[dictionaryStart] !== LESS_THAN || data[dictionaryStart + 1] !== LESS_THAN) {
        offset = objectHeaderEnd - 1;
        continue;
      }
      let dictionaryEnd: number | undefined;
      let dictionary: ParsedDictionary;
      try {
        dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
        if (dictionaryEnd === undefined) continue;
        dictionary = parseCriticalDictionary(data, dictionaryStart, dictionaryEnd);
      } catch {
        continue;
      }
      if (
        dictionary.type !== 'ObjStm'
        || dictionary.objectCount === undefined
        || dictionary.firstObjectOffset === undefined
      ) continue;
      const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
      if (!matchesKeyword(data, streamKeyword, 'stream')) continue;
      let streamStart: number;
      try {
        streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
      } catch {
        continue;
      }
      if (processedStreams.has(streamStart)) continue;
      const length = resolveCandidateStreamLength(
        dictionary.length,
        candidates,
        data,
        streamStart,
      );
      if (length === undefined) continue;
      const streamEnd = streamStart + length;
      if (
        !Number.isSafeInteger(streamEnd)
        || streamEnd > data.byteLength
        || !matchesKeyword(data, skipWhitespace(data, streamEnd), 'endstream')
      ) continue;
      processedStreams.add(streamStart);
      if (processedStreams.size > MAX_CRITICAL_STREAMS) {
        throw new Error('PDF stream limit');
      }

      const remaining = PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES - expandedBytes;
      const decoded = decodeObjectStreamContents(
        data.subarray(streamStart, streamEnd),
        dictionary.filters,
        remaining,
      );
      if (!decoded) continue;
      expandedBytes += decoded.byteLength;
      if (expandedBytes > PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES) {
        throw new Error('PDF object stream expansion limit');
      }
      const values = readCompressedIntegerObjects(
        decoded,
        dictionary.objectCount,
        dictionary.firstObjectOffset,
      );
      for (const value of values) {
        const key = referenceKey(value.objectNumber, 0);
        let allValues = candidates.values.get(key);
        if (!allValues) {
          allValues = new Set<number>();
          candidates.values.set(key, allValues);
        }
        if (!allValues.has(value.value)) {
          candidateValues += 1;
          if (candidateValues > MAX_INDIRECT_LENGTH_OBJECTS) {
            throw new Error('PDF indirect length object limit');
          }
          if (allValues.size >= MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
            throw new Error('PDF indirect length candidate limit');
          }
          allValues.add(value.value);
          changed = true;
        }
        let trustedValues = candidates.compressedValues.get(key);
        if (!trustedValues) {
          trustedValues = new Set<number>();
          candidates.compressedValues.set(key, trustedValues);
        }
        trustedValues.add(value.value);
        let compressedValues = compressedCandidates.get(key);
        if (!compressedValues) {
          compressedValues = new Set<number>();
          compressedCandidates.set(key, compressedValues);
        }
        compressedValues.add(value.value);
      }
    }
  }
  return compressedCandidates;
}

function countCandidateValues(candidates: ReadonlyMap<string, ReadonlySet<number>>): number {
  let count = 0;
  for (const values of candidates.values()) count += values.size;
  return count;
}

function decodeObjectStreamContents(
  contents: Uint8Array,
  filters: readonly string[] | undefined,
  maxDecodedBytes: number,
): Uint8Array | undefined {
  if (!filters) return undefined;
  if (filters.length === 0) {
    if (contents.byteLength > maxDecodedBytes) {
      throw new Error('PDF object stream expansion limit');
    }
    return contents;
  }
  if (filters.length !== 1 || !['FlateDecode', 'Fl'].includes(filters[0] ?? '')) {
    return undefined;
  }
  try {
    return boundedInflatedContents(contents, maxDecodedBytes);
  } catch {
    return undefined;
  }
}

function readCompressedIntegerObjects(
  data: Uint8Array,
  objectCount: number,
  firstObjectOffset: number,
): Array<{ objectNumber: number; value: number }> {
  if (
    !Number.isSafeInteger(objectCount)
    || objectCount < 0
    || objectCount > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS
    || !Number.isSafeInteger(firstObjectOffset)
    || firstObjectOffset < 0
    || firstObjectOffset > data.byteLength
  ) return [];
  const objectNumbers: number[] = [];
  const objectOffsets: number[] = [];
  let headerOffset = 0;
  for (let index = 0; index < objectCount; index += 1) {
    headerOffset = skipWhitespaceAndComments(data, headerOffset);
    const objectNumber = tryReadUnsignedInteger(data, headerOffset);
    if (!objectNumber || objectNumber.end > firstObjectOffset) return [];
    headerOffset = skipWhitespaceAndComments(data, objectNumber.end);
    const objectOffset = tryReadUnsignedInteger(data, headerOffset);
    if (!objectOffset || objectOffset.end > firstObjectOffset) return [];
    objectNumbers.push(objectNumber.value);
    objectOffsets.push(objectOffset.value);
    headerOffset = objectOffset.end;
  }
  if (skipWhitespaceAndComments(data, headerOffset) > firstObjectOffset) return [];

  const values: Array<{ objectNumber: number; value: number }> = [];
  for (let index = 0; index < objectCount; index += 1) {
    const start = firstObjectOffset + (objectOffsets[index] ?? 0);
    const end = index + 1 < objectCount
      ? firstObjectOffset + (objectOffsets[index + 1] ?? 0)
      : data.byteLength;
    if (
      !Number.isSafeInteger(start)
      || !Number.isSafeInteger(end)
      || start < firstObjectOffset
      || end < start
      || end > data.byteLength
    ) return [];
    const valueStart = skipWhitespaceAndComments(data, start);
    const value = tryReadUnsignedInteger(data, valueStart);
    if (!value || value.end > end || !containsOnlyWhitespaceAndComments(data, value.end, end)) {
      continue;
    }
    values.push({ objectNumber: objectNumbers[index] ?? 0, value: value.value });
  }
  return values;
}

function containsOnlyWhitespaceAndComments(
  data: Uint8Array,
  start: number,
  end: number,
): boolean {
  let offset = start;
  while (offset < end) {
    if (isWhitespace(data[offset])) {
      offset += 1;
      continue;
    }
    if (data[offset] !== PERCENT) return false;
    offset += 1;
    while (offset < end && data[offset] !== 0x0a && data[offset] !== 0x0d) offset += 1;
  }
  return true;
}

function resolveCandidateStreamLength(
  length: number | RawPdfReference | undefined,
  candidates: IndirectLengthCandidateIndex,
  data: Uint8Array,
  streamStart: number,
): number | undefined {
  if (typeof length === 'number') return length;
  if (!length) return undefined;
  const key = referenceKey(length.objectNumber, length.generationNumber);
  const values = candidates.values.get(key);
  if (!values) return undefined;
  const boundaryValues: number[] = [];
  for (const value of values) {
    const streamEnd = streamStart + value;
    if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) continue;
    if (matchesKeyword(data, skipWhitespace(data, streamEnd), 'endstream')) {
      boundaryValues.push(value);
    }
  }

  const authoritativeOffset = candidates.authoritativeOffsets.get(key);
  if (authoritativeOffset !== undefined) {
    const authoritativeValues = boundaryValues.filter(value => (
      candidates.declarationOffsets.get(key)?.get(value)?.has(authoritativeOffset) ?? false
    ));
    return authoritativeValues.length === 1 ? authoritativeValues[0] : undefined;
  }

  const plausibleValues = boundaryValues.filter(value => hasCandidateSourceOutsideRange(
    candidates,
    key,
    value,
    streamStart,
    streamStart + value,
  ));
  return plausibleValues.length === 1 ? plausibleValues[0] : undefined;
}

function hasCandidateSourceOutsideRange(
  candidates: IndirectLengthCandidateIndex,
  key: string,
  value: number,
  rangeStart: number,
  rangeEnd: number,
): boolean {
  if (candidates.compressedValues.get(key)?.has(value)) return true;
  const declarations = candidates.declarationOffsets.get(key)?.get(value);
  if (!declarations || declarations.size === 0) return false;
  return [...declarations].some(offset => offset < rangeStart || offset >= rangeEnd);
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

function referenceObjectNumber(key: string): number {
  return Number(key.slice(0, key.indexOf(':')));
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
  let firstObjectOffset: number | undefined;
  let xrefSize: number | undefined;
  let xrefWidths: readonly number[] | undefined;
  let xrefIndex: readonly number[] | undefined;
  let previousXrefOffset: number | undefined;
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
    } else if (key.value === 'W' || key.value === 'Index') {
      const value = readUnsignedIntegerArray(
        data,
        valueStart,
        key.value === 'W' ? 3 : 2 * (PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1),
      );
      if (key.value === 'W') {
        if (xrefWidths !== undefined || value.values.length !== 3) {
          throw new Error('Invalid PDF xref widths');
        }
        xrefWidths = value.values;
      } else {
        if (xrefIndex !== undefined || value.values.length % 2 !== 0) {
          throw new Error('Invalid PDF xref index');
        }
        xrefIndex = value.values;
      }
      offset = value.end;
    } else if (
      key.value === 'N'
      || key.value === 'First'
      || key.value === 'Size'
      || key.value === 'Prev'
    ) {
      const value = readUnsignedInteger(data, valueStart);
      if (!value) throw new Error('Invalid PDF object count');
      if (key.value === 'N') {
        if (objectCount !== undefined) throw new Error('Duplicate PDF object count');
        objectCount = value.value;
      } else if (key.value === 'First') {
        if (firstObjectOffset !== undefined) throw new Error('Duplicate PDF first offset');
        firstObjectOffset = value.value;
      } else if (key.value === 'Size') {
        if (xrefSize !== undefined) throw new Error('Duplicate PDF xref size');
        xrefSize = value.value;
      } else {
        if (previousXrefOffset !== undefined) throw new Error('Duplicate PDF previous xref');
        previousXrefOffset = value.value;
      }
      offset = value.end;
    } else if (key.value === 'Encrypt') {
      hasEncryptionDictionary = true;
    }
  }
  return {
    type,
    length,
    filters,
    objectCount,
    firstObjectOffset,
    xrefSize,
    xrefWidths,
    xrefIndex,
    previousXrefOffset,
    hasEncryptionDictionary,
  };
}

function readUnsignedIntegerArray(
  data: Uint8Array,
  start: number,
  maxValues: number,
): { values: readonly number[]; end: number } {
  if (data[start] !== LEFT_BRACKET) throw new Error('Invalid PDF integer array');
  const values: number[] = [];
  let offset = start + 1;
  while (offset < data.byteLength) {
    offset = skipWhitespaceAndComments(data, offset);
    if (data[offset] === RIGHT_BRACKET) return { values, end: offset + 1 };
    if (values.length >= maxValues) throw new Error('PDF integer array limit');
    const value = readUnsignedInteger(data, offset);
    if (!value) throw new Error('Invalid PDF integer array');
    values.push(value.value);
    offset = value.end;
  }
  throw new Error('Unterminated PDF integer array');
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

function boundedInflatedContents(contents: Uint8Array, maxDecodedBytes: number): Uint8Array {
  const inflater = new Inflate({ chunkSize: INFLATE_CHUNK_BYTES });
  const chunks: Uint8Array[] = [];
  let decodedBytes = 0;
  inflater.onData = chunk => {
    decodedBytes += chunk.byteLength;
    if (decodedBytes > maxDecodedBytes) throw new Error('PDF object stream expansion limit');
    chunks.push(chunk.slice());
  };
  const succeeded = inflater.push(contents, true);
  if (!succeeded || inflater.err !== 0) throw new Error('Invalid PDF object stream');
  const result = new Uint8Array(decodedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
