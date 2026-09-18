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

interface RawPdfFilterDecodeParameters {
  predictor: number | RawPdfReference;
  colors: number | RawPdfReference;
  bitsPerComponent: number | RawPdfReference;
  columns: number | RawPdfReference;
  earlyChange: number | RawPdfReference;
}

type PdfFilterDecodeParameter = RawPdfFilterDecodeParameters | RawPdfReference | undefined;

interface IndirectPdfDecodeParameters {
  reference: RawPdfReference;
}

type PdfDecodeParameters = readonly PdfFilterDecodeParameter[]
  | IndirectPdfDecodeParameters
  | null;

interface IndirectPdfFilters {
  reference: RawPdfReference;
}

type PdfFilter = string | RawPdfReference;
type PdfFilters = readonly PdfFilter[] | IndirectPdfFilters;

interface IndirectObjectHeader extends RawPdfReference {
  start: number;
  end: number;
}

interface IndirectLengthCandidateIndex {
  values: Map<string, Set<number>>;
  declarationOffsets: Map<string, Map<number, Set<number>>>;
  compressedValues: Map<string, Set<number>>;
  compressedScalarValues: Map<string, Set<number>>;
  compressedNames: Map<string, Set<string>>;
  compressedNullObjects: Set<string>;
  authoritativeOffsets: ReadonlyMap<string, number>;
  authoritativeCompressedEntries: ReadonlyMap<string, CompressedCrossReferenceEntry>;
  authoritativeNullObjects: ReadonlySet<string>;
  activeObjectStreamNumbers: ReadonlySet<number>;
  compressedEntriesComplete: boolean;
  encryptedFromCrossReference: boolean;
}

type CompressedReferenceCandidates = Pick<
  IndirectLengthCandidateIndex,
  'authoritativeOffsets'
> & Partial<Pick<
  IndirectLengthCandidateIndex,
  | 'authoritativeCompressedEntries'
  | 'compressedNames'
  | 'compressedNullObjects'
  | 'compressedScalarValues'
>>;

type CompressedScalarObject = {
  objectNumber: number;
  objectIndex: number;
} & (
  | { kind: 'integer'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'null' }
);

interface CompressedCrossReferenceEntry {
  objectStreamNumber: number;
  objectIndex: number;
}

interface ParsedDictionary {
  type?: string | RawPdfReference;
  length?: number | RawPdfReference;
  filters?: PdfFilters;
  decodeParameters?: PdfDecodeParameters;
  objectCount?: number;
  firstObjectOffset?: number;
  xrefSize?: number;
  xrefWidths?: readonly number[];
  xrefIndex?: readonly number[];
  previousXrefOffset?: number;
  supplementalXrefOffset?: number;
  hasEncryptionDictionary: boolean;
  encryptionReference?: RawPdfReference;
}

interface CriticalStreamDescriptor {
  type: 'ObjStm' | 'XRef';
  contents: Uint8Array;
  filters: PdfFilters | undefined;
  decodeParameters: PdfDecodeParameters | undefined;
}

export interface PdfFilterDecodeParameters {
  predictor: number;
  colors: number;
  bitsPerComponent: number;
  columns: number;
  earlyChange: number;
}

interface RawSyntaxBudget {
  tokens: number;
  containerDepth: number;
}

interface ByteRange {
  start: number;
  end: number;
}

interface XrefStreamLengthCandidate {
  value: number;
  offset?: number;
}

interface CrossReferenceMetadata {
  objectOffsets: Map<string, number>;
  compressedEntries: Map<string, CompressedCrossReferenceEntry>;
  authoritativeNullObjects: Set<string>;
  compressedEntriesComplete: boolean;
  encrypted: boolean;
}

interface CrossReferenceSection {
  kind: 'classic' | 'stream';
  objectOffsets: Map<string, number>;
  compressedEntries: Map<string, CompressedCrossReferenceEntry>;
  definedObjectNumbers: Set<number>;
  encrypted: boolean;
  encryptionReference?: RawPdfReference;
  previousOffset?: number;
  supplementalOffset?: number;
  entriesDecoded: boolean;
  bootstrapOffsets: ReadonlyMap<string, number>;
}

export interface PdfStreamExpansionBudget {
  expandedBytes: number;
  maxBytes: number;
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
    objectStreamSelection,
  } = collectIndirectLengths(data);
  const criticalStreams: CriticalStreamDescriptor[] = [];
  const rawSyntaxBudget: RawSyntaxBudget = { tokens: 0, containerDepth: 0 };
  let encrypted = encryptedBeforeObjectStreamDiscovery;
  let expectTrailerDictionary = false;
  let validatedStreams = 0;
  let classicIndirectObjects = 0;
  let compressedIndirectObjects = 0;
  let offset = 0;
  let currentObjectHeader: IndirectObjectHeader | undefined;

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
    const objectHeader = readIndirectObjectHeader(data, offset);
    if (objectHeader) {
      consumeRawTokens(rawSyntaxBudget, 3);
      classicIndirectObjects += 1;
      if (
        classicIndirectObjects + compressedIndirectObjects
          > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS
      ) {
        throw new Error('PDF classic indirect object limit');
      }
      currentObjectHeader = objectHeader;
      offset = objectHeader.end;
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
      encrypted ||= dictionaryDeclaresEncryption(
        data,
        dictionary,
        objectStreamSelection,
      );
      validateXrefSize(dictionary.xrefSize);
      expectTrailerDictionary = false;
    }
    const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
    if (!matchesKeyword(data, streamKeyword, 'stream')) {
      currentObjectHeader = undefined;
      offset = dictionaryEnd;
      continue;
    }

    const streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
    const streamObjectHeader = currentObjectHeader;
    const knownInactiveStream = streamObjectHeader
      ? isKnownInactiveStreamObject(objectStreamSelection, streamObjectHeader)
      : false;
    const length = knownInactiveStream
      ? resolveCandidateStreamLength(
        dictionary.length,
        objectStreamSelection,
        data,
        streamStart,
        true,
      )
      : resolveStreamLength(dictionary.length, indirectLengths);
    if (length === undefined) throw new Error('Missing PDF stream length');
    const streamEnd = streamStart + length;
    if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) {
      throw new Error('Invalid PDF stream length');
    }
    const endstream = skipWhitespaceAndComments(data, streamEnd);
    if (!matchesKeyword(data, endstream, 'endstream')) {
      throw new Error('Invalid PDF stream boundary');
    }
    consumeRawTokens(rawSyntaxBudget, 2);
    offset = endstream + 'endstream'.length;
    currentObjectHeader = undefined;

    if (knownInactiveStream) continue;
    const streamType = resolveCriticalStreamType(data, dictionary.type, objectStreamSelection);
    if (streamType === null) throw new Error('Invalid PDF stream type');
    if (streamType !== 'ObjStm' && streamType !== 'XRef') continue;
    if (
      streamType === 'ObjStm'
      && streamObjectHeader
      && shouldSkipInactiveObjectStream(objectStreamSelection, streamObjectHeader)
    ) continue;
    if (streamType === 'XRef') {
      encrypted ||= dictionaryDeclaresEncryption(
        data,
        dictionary,
        objectStreamSelection,
      );
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
      type: streamType,
      contents: data.subarray(streamStart, streamEnd),
      filters: dictionary.filters,
      decodeParameters: dictionary.decodeParameters,
    });
  }

  const expansionBudget: PdfStreamExpansionBudget = {
    expandedBytes: 0,
    maxBytes: PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES,
  };
  let skippedEncryptedObjectStreams = 0;
  for (const stream of criticalStreams) {
    if (encrypted && stream.type === 'ObjStm') {
      skippedEncryptedObjectStreams += 1;
      continue;
    }
    const decoded = decodeObjectStreamContents(
      stream.contents,
      resolveFilters(data, stream.filters, objectStreamSelection),
      resolveDecodeParameters(data, stream.decodeParameters, objectStreamSelection),
      expansionBudget,
    );
    if (!decoded) throw new Error('Unsupported or invalid PDF object stream filter');
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
  return readIndirectObjectHeader(data, start)?.end;
}

function readIndirectObjectHeader(
  data: Uint8Array,
  start: number,
): IndirectObjectHeader | undefined {
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
  return {
    start,
    objectNumber: objectNumber.value,
    generationNumber: generation.value,
    end: objectKeyword + 'obj'.length,
  };
}

function collectIndirectLengths(data: Uint8Array): {
  lengths: Map<string, number | undefined>;
  encryptedBeforeObjectStreamDiscovery: boolean;
  objectStreamSelection: IndirectLengthCandidateIndex;
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
  let currentObjectHeader: IndirectObjectHeader | undefined;
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
      const streamObjectHeader = currentObjectHeader;
      currentObjectHeader = undefined;
      const dictionaryEnd = findDictionaryEnd(data, offset);
      if (dictionaryEnd === undefined) throw new Error('PDF dictionary limit');
      const dictionary = parseCriticalDictionary(data, offset, dictionaryEnd);
      const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
      if (matchesKeyword(data, streamKeyword, 'stream')) {
        const streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
        const knownInactiveStream = streamObjectHeader
          ? isKnownInactiveStreamObject(candidates, streamObjectHeader)
          : false;
        const length = resolveCandidateStreamLength(
          dictionary.length,
          candidates,
          data,
          streamStart,
          knownInactiveStream,
        );
        if (length === undefined) throw new Error('Missing PDF stream length');
        const streamEnd = streamStart + length;
        if (!Number.isSafeInteger(streamEnd) || streamEnd > data.byteLength) {
          throw new Error('Invalid PDF stream length');
        }
        const endstream = skipWhitespaceAndComments(data, streamEnd);
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
      offset = objectNumber.end;
      continue;
    }
    const valueStart = skipWhitespaceAndComments(data, objectKeyword + 'obj'.length);
    const value = tryReadUnsignedInteger(data, valueStart);
    if (!value) {
      if (data[valueStart] === LESS_THAN && data[valueStart + 1] === LESS_THAN) {
        currentObjectHeader = {
          start: offset,
          objectNumber: objectNumber.value,
          generationNumber: generation.value,
          end: objectKeyword + 'obj'.length,
        };
        offset = valueStart;
      } else {
        currentObjectHeader = undefined;
        offset = objectKeyword + 'obj'.length;
      }
      continue;
    }
    currentObjectHeader = undefined;
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
    if (candidates.authoritativeCompressedEntries.has(key)) {
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
  return { lengths, encryptedBeforeObjectStreamDiscovery, objectStreamSelection: candidates };
}

function collectIndirectLengthCandidates(data: Uint8Array): IndirectLengthCandidateIndex {
  const crossReference = collectCrossReferenceMetadata(data);
  const activeObjectStreamNumbers = new Set<number>();
  for (const entry of crossReference.compressedEntries.values()) {
    activeObjectStreamNumbers.add(entry.objectStreamNumber);
  }
  const candidates: IndirectLengthCandidateIndex = {
    values: new Map<string, Set<number>>(),
    declarationOffsets: new Map<string, Map<number, Set<number>>>(),
    compressedValues: new Map<string, Set<number>>(),
    compressedScalarValues: new Map<string, Set<number>>(),
    compressedNames: new Map<string, Set<string>>(),
    compressedNullObjects: new Set<string>(),
    authoritativeOffsets: crossReference.objectOffsets,
    authoritativeCompressedEntries: crossReference.compressedEntries,
    authoritativeNullObjects: crossReference.authoritativeNullObjects,
    activeObjectStreamNumbers,
    compressedEntriesComplete: crossReference.compressedEntriesComplete,
    encryptedFromCrossReference: crossReference.encrypted,
  };
  collectRawIndirectLengthCandidates(data, candidates);
  removeCandidatesDeclaredInsideStreams(data, candidates);
  return candidates;
}

function collectRawIndirectLengthCandidates(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): void {
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
    const endstream = skipWhitespaceAndComments(data, streamEnd);
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
      dictionaryDeclaresEncryption(data, dictionary, candidates)
      && (
        expectTrailerDictionary
        || resolveCriticalStreamType(data, dictionary.type, candidates) === 'XRef'
      )
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
      || !matchesKeyword(data, skipWhitespaceAndComments(data, streamEnd), 'endstream')
    ) {
      offset = dictionaryEnd;
      continue;
    }
    offset = skipWhitespaceAndComments(data, streamEnd) + 'endstream'.length;
  }
  return false;
}

function collectCrossReferenceMetadata(data: Uint8Array): CrossReferenceMetadata {
  const objectOffsets = new Map<string, number>();
  const compressedEntries = new Map<string, CompressedCrossReferenceEntry>();
  const authoritativeNullObjects = new Set<string>();
  const startXrefOffset = findLastBareKeyword(data, 'startxref');
  if (startXrefOffset === undefined) {
    return {
      objectOffsets,
      compressedEntries,
      authoritativeNullObjects,
      compressedEntriesComplete: false,
      encrypted: false,
    };
  }
  const valueStart = skipWhitespaceAndComments(data, startXrefOffset + 'startxref'.length);
  const xrefPosition = tryReadUnsignedInteger(data, valueStart);
  if (!xrefPosition || xrefPosition.value >= data.byteLength) {
    return {
      objectOffsets,
      compressedEntries,
      authoritativeNullObjects,
      compressedEntriesComplete: false,
      encrypted: false,
    };
  }

  const visitedOffsets = new Set<number>();
  const definedObjectNumbers = new Set<number>();
  let encrypted = false;
  const encryptionReferences: RawPdfReference[] = [];
  let compressedEntriesComplete = true;
  let parsedSection = false;
  const bootstrapOffsets: Array<readonly [string, number]> = [];
  const expansionBudget: PdfStreamExpansionBudget = {
    expandedBytes: 0,
    maxBytes: PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES,
  };
  let currentOffset: number | undefined = xrefPosition.value;
  while (currentOffset !== undefined) {
    if (visitedOffsets.has(currentOffset) || visitedOffsets.size >= 128) {
      compressedEntriesComplete = false;
      break;
    }
    visitedOffsets.add(currentOffset);
    const primarySection = readCrossReferenceSection(
      data,
      currentOffset,
      startXrefOffset,
      expansionBudget,
    );
    if (!primarySection) {
      compressedEntriesComplete = false;
      break;
    }
    parsedSection = true;
    let supplementalSection: CrossReferenceSection | undefined;
    if (primarySection.supplementalOffset !== undefined) {
      const supplementalOffset = primarySection.supplementalOffset;
      if (
        supplementalOffset >= data.byteLength
        || visitedOffsets.has(supplementalOffset)
        || visitedOffsets.size >= 128
      ) {
        compressedEntriesComplete = false;
        break;
      }
      visitedOffsets.add(supplementalOffset);
      supplementalSection = readCrossReferenceSection(
        data,
        supplementalOffset,
        startXrefOffset,
        expansionBudget,
      );
      if (!supplementalSection || supplementalSection.kind !== 'stream') {
        compressedEntriesComplete = false;
        break;
      }
    }
    const revisionDefinedObjectNumbers = new Set<number>();
    for (const section of [supplementalSection, primarySection]) {
      if (!section) continue;
      encrypted ||= section.encrypted;
      if (section.encryptionReference) encryptionReferences.push(section.encryptionReference);
      compressedEntriesComplete &&= section.entriesDecoded;
      bootstrapOffsets.push(...section.bootstrapOffsets);
      for (const [key, objectOffset] of section.objectOffsets) {
        const objectNumber = referenceObjectNumber(key);
        if (
          !definedObjectNumbers.has(objectNumber)
          && !revisionDefinedObjectNumbers.has(objectNumber)
        ) objectOffsets.set(key, objectOffset);
      }
      for (const [key, entry] of section.compressedEntries) {
        const objectNumber = referenceObjectNumber(key);
        if (
          !definedObjectNumbers.has(objectNumber)
          && !revisionDefinedObjectNumbers.has(objectNumber)
        ) compressedEntries.set(key, entry);
      }
      for (const objectNumber of section.definedObjectNumbers) {
        revisionDefinedObjectNumbers.add(objectNumber);
      }
    }
    for (const objectNumber of revisionDefinedObjectNumbers) {
      definedObjectNumbers.add(objectNumber);
    }
    currentOffset = primarySection.previousOffset ?? supplementalSection?.previousOffset;
  }
  for (const [key, offset] of bootstrapOffsets) {
    if (objectOffsets.get(key) !== offset) compressedEntriesComplete = false;
  }
  for (const reference of encryptionReferences) {
    const key = referenceKey(reference.objectNumber, reference.generationNumber);
    if (authoritativeNullObjects.has(key)) continue;
    if (
      isAuthoritativeNullObject(data, reference, objectOffsets)
      || isAuthoritativeCompressedNullObject(
        data,
        reference,
        objectOffsets,
        compressedEntries,
        expansionBudget,
      )
    ) authoritativeNullObjects.add(key);
  }
  encrypted ||= encryptionReferences.some(reference => (
    !authoritativeNullObjects.has(referenceKey(
      reference.objectNumber,
      reference.generationNumber,
    ))
  ));
  return {
    objectOffsets,
    compressedEntries,
    authoritativeNullObjects,
    compressedEntriesComplete: parsedSection && compressedEntriesComplete,
    encrypted,
  };
}

function readCrossReferenceSection(
  data: Uint8Array,
  sectionOffset: number,
  lastStartXrefOffset: number,
  expansionBudget: PdfStreamExpansionBudget,
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
  return readXrefStreamSection(data, dictionaryEnd, dictionary, expansionBudget);
}

function readXrefStreamSection(
  data: Uint8Array,
  dictionaryEnd: number,
  dictionary: ParsedDictionary,
  expansionBudget: PdfStreamExpansionBudget,
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
      const objectNumber = firstObject + index;
      if (definedObjectNumbers.has(objectNumber)) return undefined;
      definedObjectNumbers.add(objectNumber);
    }
  }

  const section: CrossReferenceSection = {
    kind: 'stream',
    objectOffsets: new Map<string, number>(),
    compressedEntries: new Map<string, CompressedCrossReferenceEntry>(),
    definedObjectNumbers,
    encrypted: dictionary.hasEncryptionDictionary,
    encryptionReference: dictionary.encryptionReference,
    previousOffset: dictionary.previousXrefOffset,
    entriesDecoded: false,
    bootstrapOffsets: new Map<string, number>(),
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
  const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
  if (!matchesKeyword(data, streamKeyword, 'stream')) return section;
  let streamStart: number;
  try {
    streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
  } catch {
    return section;
  }
  const streamLength = dictionary.length;
  if (streamLength === undefined) return section;
  const streamRanges = typeof streamLength === 'number'
    ? undefined
    : collectBootstrapStreamRanges(data);
  const sharedBootstrapOffsets = collectXrefBootstrapOffsets(data, dictionary, streamRanges);
  const lengthCandidates = collectXrefStreamLengthCandidates(
    data,
    streamLength,
    streamRanges ?? [],
  );
  let acceptedSection: CrossReferenceSection | undefined;
  for (const lengthCandidate of lengthCandidates) {
    const streamEnd = streamStart + lengthCandidate.value;
    if (
      !Number.isSafeInteger(streamEnd)
      || streamEnd > data.byteLength
      || !matchesKeyword(data, skipWhitespaceAndComments(data, streamEnd), 'endstream')
    ) continue;
    const bootstrapOffsets = new Map(sharedBootstrapOffsets);
    if (typeof streamLength !== 'number') {
      const lengthKey = referenceKey(
        streamLength.objectNumber,
        streamLength.generationNumber,
      );
      if (lengthCandidate.offset === undefined) continue;
      const existingOffset = bootstrapOffsets.get(lengthKey);
      if (existingOffset !== undefined && existingOffset !== lengthCandidate.offset) continue;
      bootstrapOffsets.set(lengthKey, lengthCandidate.offset);
    }
    const bootstrapCandidates = { authoritativeOffsets: bootstrapOffsets };
    const decoded = decodeObjectStreamContents(
      data.subarray(streamStart, streamEnd),
      resolveFilters(data, dictionary.filters, bootstrapCandidates),
      resolveDecodeParameters(data, dictionary.decodeParameters, bootstrapCandidates),
      expansionBudget,
    );
    if (!decoded || decoded.byteLength !== expectedBytes) continue;

    const objectOffsets = new Map<string, number>();
    const compressedEntries = new Map<string, CompressedCrossReferenceEntry>();
    let decodedOffset = 0;
    let entriesValid = true;
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
        if (
          type === undefined
          || fieldOne === undefined
          || fieldTwo === undefined
          || (type !== 0 && type !== 1 && type !== 2)
          || (type === 1 && fieldOne >= data.byteLength)
        ) {
          entriesValid = false;
          break;
        }
        if (type === 1) {
          objectOffsets.set(referenceKey(firstObject + index, fieldTwo), fieldOne);
        } else if (type === 2) {
          compressedEntries.set(
            referenceKey(firstObject + index, 0),
            { objectStreamNumber: fieldOne, objectIndex: fieldTwo },
          );
        }
      }
      if (!entriesValid) break;
    }
    if (!entriesValid) continue;
    if (typeof streamLength !== 'number') {
      const lengthKey = referenceKey(
        streamLength.objectNumber,
        streamLength.generationNumber,
      );
      if (objectOffsets.get(lengthKey) !== lengthCandidate.offset) continue;
    }
    if (acceptedSection) return section;
    acceptedSection = {
      ...section,
      objectOffsets,
      compressedEntries,
      entriesDecoded: true,
      bootstrapOffsets,
    };
  }
  return acceptedSection ?? section;
}

function collectXrefBootstrapOffsets(
  data: Uint8Array,
  dictionary: ParsedDictionary,
  knownStreamRanges?: readonly ByteRange[],
): ReadonlyMap<string, number> {
  const references = new Set<string>();
  const outerFilterReferences: RawPdfReference[] = [];
  const filters = dictionary.filters;
  if (filters && 'reference' in filters) {
    outerFilterReferences.push(filters.reference);
    references.add(referenceKey(
      filters.reference.objectNumber,
      filters.reference.generationNumber,
    ));
  } else {
    for (const filter of filters ?? []) {
      if (typeof filter !== 'string') {
        references.add(referenceKey(filter.objectNumber, filter.generationNumber));
      }
    }
  }
  const decodeParameters = dictionary.decodeParameters;
  const outerDecodeParameterReferences: RawPdfReference[] = [];
  if (decodeParameters && 'reference' in decodeParameters) {
    outerDecodeParameterReferences.push(decodeParameters.reference);
    references.add(referenceKey(
      decodeParameters.reference.objectNumber,
      decodeParameters.reference.generationNumber,
    ));
  } else {
    for (const parameter of decodeParameters ?? []) {
      if (!parameter) continue;
      if ('predictor' in parameter) {
        addDecodeParameterScalarReferences(parameter, references);
      } else {
        references.add(referenceKey(parameter.objectNumber, parameter.generationNumber));
      }
    }
  }
  if (references.size === 0) return new Map<string, number>();

  const streamRanges = knownStreamRanges ?? collectBootstrapStreamRanges(data);
  const offsets = collectBootstrapOffsetsForReferences(data, references, streamRanges);
  const nestedReferences = new Set<string>();
  for (const reference of outerFilterReferences) {
    const offset = offsets.get(referenceKey(reference.objectNumber, reference.generationNumber));
    if (offset === undefined) continue;
    const header = readIndirectObjectHeader(data, offset);
    if (!header) continue;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    try {
      const value = readFilters(data, valueStart);
      const objectEnd = skipWhitespaceAndComments(data, value.end);
      if (!matchesKeyword(data, objectEnd, 'endobj') || 'reference' in value.filters) continue;
      for (const filter of value.filters) {
        if (typeof filter !== 'string') {
          nestedReferences.add(referenceKey(filter.objectNumber, filter.generationNumber));
        }
      }
    } catch {
      // The actual resolver will reject the malformed value after xref selection.
    }
  }
  for (const reference of outerDecodeParameterReferences) {
    const offset = offsets.get(referenceKey(reference.objectNumber, reference.generationNumber));
    if (offset === undefined) continue;
    const header = readIndirectObjectHeader(data, offset);
    if (!header) continue;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    try {
      const value = readDecodeParameters(data, valueStart);
      const objectEnd = skipWhitespaceAndComments(data, value.end);
      if (!matchesKeyword(data, objectEnd, 'endobj') || 'reference' in value.parameters) continue;
      for (const parameter of value.parameters) {
        if (!parameter) continue;
        if ('predictor' in parameter) {
          addDecodeParameterScalarReferences(parameter, nestedReferences);
        } else {
          nestedReferences.add(referenceKey(parameter.objectNumber, parameter.generationNumber));
        }
      }
    } catch {
      // The actual resolver will reject the malformed value after xref selection.
    }
  }
  for (const key of offsets.keys()) nestedReferences.delete(key);
  if (nestedReferences.size > 0) {
    const nestedOffsets = collectBootstrapOffsetsForReferences(data, nestedReferences, streamRanges);
    for (const [key, offset] of nestedOffsets) offsets.set(key, offset);
  }
  return offsets;
}

function addDecodeParameterScalarReferences(
  parameters: RawPdfFilterDecodeParameters,
  references: Set<string>,
): void {
  for (const value of [
    parameters.predictor,
    parameters.colors,
    parameters.bitsPerComponent,
    parameters.columns,
    parameters.earlyChange,
  ]) {
    if (typeof value !== 'number') {
      references.add(referenceKey(value.objectNumber, value.generationNumber));
    }
  }
}

function collectXrefStreamLengthCandidates(
  data: Uint8Array,
  length: number | RawPdfReference | undefined,
  streamRanges: readonly ByteRange[],
): readonly XrefStreamLengthCandidate[] {
  if (typeof length === 'number') return [{ value: length }];
  if (!length) return [];
  const key = referenceKey(length.objectNumber, length.generationNumber);
  const candidates: XrefStreamLengthCandidate[] = [];
  let declarations = 0;
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
    const header = readIndirectObjectHeader(data, offset);
    if (!header) {
      offset += 1;
      continue;
    }
    if (
      referenceKey(header.objectNumber, header.generationNumber) === key
      && !isOffsetInsideRanges(offset, streamRanges)
    ) {
      declarations += 1;
      if (declarations > MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
        throw new Error('PDF indirect length candidate limit');
      }
      const valueStart = skipWhitespaceAndComments(data, header.end);
      const value = tryReadUnsignedInteger(data, valueStart);
      if (value) {
        const objectEnd = skipWhitespaceAndComments(data, value.end);
        if (matchesKeyword(data, objectEnd, 'endobj')) {
          candidates.push({ value: value.value, offset });
        }
      }
    }
    offset = header.end;
  }
  return candidates;
}

function collectBootstrapOffsetsForReferences(
  data: Uint8Array,
  references: ReadonlySet<string>,
  streamRanges: readonly ByteRange[],
): Map<string, number> {
  const offsets = new Map<string, number>();
  const ambiguous = new Set<string>();
  const declarationCounts = new Map<string, number>();
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
    const header = readIndirectObjectHeader(data, offset);
    if (!header) {
      offset += 1;
      continue;
    }
    const key = referenceKey(header.objectNumber, header.generationNumber);
    if (references.has(key) && !isOffsetInsideRanges(offset, streamRanges)) {
      const count = (declarationCounts.get(key) ?? 0) + 1;
      declarationCounts.set(key, count);
      if (count > MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
        throw new Error('PDF indirect length candidate limit');
      }
      const previous = offsets.get(key);
      if (previous === undefined) offsets.set(key, offset);
      else if (previous !== offset) ambiguous.add(key);
    }
    offset = header.end;
  }
  for (const key of ambiguous) offsets.delete(key);
  return offsets;
}

function collectBootstrapStreamRanges(data: Uint8Array): readonly ByteRange[] {
  const candidates: IndirectLengthCandidateIndex = {
    values: new Map<string, Set<number>>(),
    declarationOffsets: new Map<string, Map<number, Set<number>>>(),
    compressedValues: new Map<string, Set<number>>(),
    compressedScalarValues: new Map<string, Set<number>>(),
    compressedNames: new Map<string, Set<string>>(),
    compressedNullObjects: new Set<string>(),
    authoritativeOffsets: new Map<string, number>(),
    authoritativeCompressedEntries: new Map<string, CompressedCrossReferenceEntry>(),
    authoritativeNullObjects: new Set<string>(),
    activeObjectStreamNumbers: new Set<number>(),
    compressedEntriesComplete: false,
    encryptedFromCrossReference: false,
  };
  collectRawIndirectLengthCandidates(data, candidates);
  removeCandidatesDeclaredInsideStreams(data, candidates);
  return collectKnownStreamRanges(data, candidates);
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
  const compressedEntries = new Map<string, CompressedCrossReferenceEntry>();
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
          kind: 'classic',
          objectOffsets,
          compressedEntries,
          definedObjectNumbers,
          encrypted: dictionary.hasEncryptionDictionary,
          encryptionReference: dictionary.encryptionReference,
          previousOffset: dictionary.previousXrefOffset,
          supplementalOffset: dictionary.supplementalXrefOffset,
          entriesDecoded: true,
          bootstrapOffsets: new Map<string, number>(),
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

function shouldSkipInactiveObjectStream(
  candidates: IndirectLengthCandidateIndex,
  header: IndirectObjectHeader,
): boolean {
  const declaredOffset = candidates.authoritativeOffsets.get(
    referenceKey(header.objectNumber, header.generationNumber),
  );
  if (declaredOffset !== undefined && declaredOffset !== header.start) return true;
  if (!candidates.compressedEntriesComplete) return false;
  if (!candidates.activeObjectStreamNumbers.has(header.objectNumber)) return true;
  if (header.generationNumber !== 0) return true;
  const activeOffset = candidates.authoritativeOffsets.get(referenceKey(header.objectNumber, 0));
  return activeOffset !== undefined && activeOffset !== header.start;
}

function isKnownInactiveStreamObject(
  candidates: IndirectLengthCandidateIndex,
  header: IndirectObjectHeader,
): boolean {
  const key = referenceKey(header.objectNumber, header.generationNumber);
  const activeOffset = candidates.authoritativeOffsets.get(key);
  if (activeOffset !== undefined) return activeOffset !== header.start;
  return candidates.authoritativeCompressedEntries.has(key);
}

function collectCompressedIndirectLengthCandidates(
  data: Uint8Array,
  candidates: IndirectLengthCandidateIndex,
): Map<string, Set<number>> {
  const compressedCandidates = new Map<string, Set<number>>();
  const processedStreams = new Set<number>();
  let candidateValues = countCandidateValues(candidates.values);
  const expansionBudget: PdfStreamExpansionBudget = {
    expandedBytes: 0,
    maxBytes: PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES,
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (let offset = 0; offset < data.byteLength; offset += 1) {
      const objectHeader = readIndirectObjectHeader(data, offset);
      if (!objectHeader) continue;
      const dictionaryStart = skipWhitespaceAndComments(data, objectHeader.end);
      if (data[dictionaryStart] !== LESS_THAN || data[dictionaryStart + 1] !== LESS_THAN) {
        offset = objectHeader.end - 1;
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
        resolveCriticalStreamType(data, dictionary.type, candidates) !== 'ObjStm'
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
      const knownInactiveStream = isKnownInactiveStreamObject(candidates, objectHeader);
      const length = resolveCandidateStreamLength(
        dictionary.length,
        candidates,
        data,
        streamStart,
        knownInactiveStream,
      );
      if (length === undefined) continue;
      const streamEnd = streamStart + length;
      if (
        !Number.isSafeInteger(streamEnd)
        || streamEnd > data.byteLength
        || !matchesKeyword(data, skipWhitespaceAndComments(data, streamEnd), 'endstream')
      ) continue;
      if (knownInactiveStream || shouldSkipInactiveObjectStream(candidates, objectHeader)) {
        offset = skipWhitespaceAndComments(data, streamEnd) + 'endstream'.length - 1;
        continue;
      }
      processedStreams.add(streamStart);
      if (processedStreams.size > MAX_CRITICAL_STREAMS) {
        throw new Error('PDF stream limit');
      }

      const decoded = decodeObjectStreamContents(
        data.subarray(streamStart, streamEnd),
        resolveFilters(data, dictionary.filters, candidates),
        resolveDecodeParameters(data, dictionary.decodeParameters, candidates),
        expansionBudget,
      );
      if (!decoded) continue;
      const values = readCompressedScalarObjects(
        decoded,
        dictionary.objectCount,
        dictionary.firstObjectOffset,
      );
      for (const value of values) {
        const key = referenceKey(value.objectNumber, 0);
        const authoritativeEntry = candidates.authoritativeCompressedEntries.get(key);
        let isAuthoritative = false;
        if (authoritativeEntry) {
          const authoritativeStreamOffset = candidates.authoritativeOffsets.get(
            referenceKey(authoritativeEntry.objectStreamNumber, 0),
          );
          if (
            objectHeader.objectNumber !== authoritativeEntry.objectStreamNumber
            || objectHeader.generationNumber !== 0
            || value.objectIndex !== authoritativeEntry.objectIndex
            || (authoritativeStreamOffset !== undefined && authoritativeStreamOffset !== offset)
          ) continue;
          isAuthoritative = true;
        }
        if (isAuthoritative) {
          if (value.kind === 'integer') {
            let scalarValues = candidates.compressedScalarValues.get(key);
            if (!scalarValues) {
              scalarValues = new Set<number>();
              candidates.compressedScalarValues.set(key, scalarValues);
            }
            if (!scalarValues.has(value.value)) {
              scalarValues.add(value.value);
              changed = true;
            }
          } else if (value.kind === 'name') {
            let names = candidates.compressedNames.get(key);
            if (!names) {
              names = new Set<string>();
              candidates.compressedNames.set(key, names);
            }
            if (!names.has(value.value)) {
              names.add(value.value);
              changed = true;
            }
          } else if (!candidates.compressedNullObjects.has(key)) {
            candidates.compressedNullObjects.add(key);
            changed = true;
          }
        }
        if (value.kind !== 'integer' || value.value < 0) continue;
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
  decodeParameters: readonly (PdfFilterDecodeParameters | undefined)[] | null | undefined,
  expansionBudget: PdfStreamExpansionBudget,
): Uint8Array | undefined {
  if (
    !filters
    || decodeParameters === null
    || (
      decodeParameters !== undefined
      && decodeParameters.length > 0
      && decodeParameters.length !== filters.length
    )
  ) return undefined;
  let decoded = contents;
  if (filters.length === 0) {
    chargeExpandedBytes(expansionBudget, decoded.byteLength);
    return decoded;
  }
  for (let index = 0; index < filters.length; index += 1) {
    const filter = filters[index];
    const parameters = decodeParameters?.[index];
    const usesPredictor = filter === 'FlateDecode'
      || filter === 'Fl'
      || filter === 'LZWDecode'
      || filter === 'LZW';
    if (usesPredictor && !hasValidPredictorParameters(parameters)) return undefined;
    let stage: Uint8Array;
    if (filter === 'FlateDecode' || filter === 'Fl') {
      stage = boundedInflatedContents(decoded, remainingExpansionBytes(expansionBudget));
    } else if (filter === 'LZWDecode' || filter === 'LZW') {
      const earlyChange = parameters?.earlyChange ?? 1;
      if (earlyChange !== 0 && earlyChange !== 1) return undefined;
      stage = decodeLzwContents(
        decoded,
        remainingExpansionBytes(expansionBudget),
        earlyChange,
      );
    } else if (filter === 'ASCII85Decode' || filter === 'A85') {
      stage = decodeAscii85Contents(decoded, remainingExpansionBytes(expansionBudget));
    } else if (filter === 'ASCIIHexDecode' || filter === 'AHx') {
      stage = decodeAsciiHexContents(decoded, remainingExpansionBytes(expansionBudget));
    } else if (filter === 'RunLengthDecode' || filter === 'RL') {
      stage = decodeRunLengthContents(decoded, remainingExpansionBytes(expansionBudget));
    } else {
      return undefined;
    }
    chargeExpandedBytes(expansionBudget, stage.byteLength);
    if ((filter === 'FlateDecode' || filter === 'Fl' || filter === 'LZWDecode' || filter === 'LZW')) {
      const predicted = applyPdfPredictor(
        stage,
        parameters,
        remainingExpansionBytes(expansionBudget),
      );
      if (predicted !== stage) chargeExpandedBytes(expansionBudget, predicted.byteLength);
      decoded = predicted;
    } else {
      decoded = stage;
    }
  }
  return decoded;
}

function hasValidPredictorParameters(
  parameters: PdfFilterDecodeParameters | undefined,
): boolean {
  if (!parameters) return true;
  if (![1, 2, 10, 11, 12, 13, 14, 15].includes(parameters.predictor)) return false;
  if (parameters.predictor === 1) return true;
  return parameters.colors >= 1
    && parameters.colors <= 32
    && [1, 2, 4, 8, 16].includes(parameters.bitsPerComponent)
    && parameters.columns >= 1
    && parameters.columns <= PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES;
}

export function decodePdfStreamContentsBounded(
  contents: Uint8Array,
  filters: readonly string[] | undefined,
  decodeParameters: readonly (PdfFilterDecodeParameters | undefined)[] | null | undefined,
  maxDecodedBytes: number,
  aggregateBudget?: PdfStreamExpansionBudget,
): Uint8Array | undefined {
  const localBudget: PdfStreamExpansionBudget = {
    expandedBytes: 0,
    maxBytes: aggregateBudget
      ? Math.min(maxDecodedBytes, remainingExpansionBytes(aggregateBudget))
      : maxDecodedBytes,
  };
  const decoded = decodeObjectStreamContents(contents, filters, decodeParameters, localBudget);
  if (decoded && aggregateBudget) {
    chargeExpandedBytes(aggregateBudget, localBudget.expandedBytes);
  }
  return decoded;
}

function remainingExpansionBytes(budget: PdfStreamExpansionBudget): number {
  const remaining = budget.maxBytes - budget.expandedBytes;
  if (!Number.isSafeInteger(remaining) || remaining < 0) {
    throw new Error('PDF object stream expansion limit');
  }
  return remaining;
}

function chargeExpandedBytes(budget: PdfStreamExpansionBudget, byteLength: number): void {
  budget.expandedBytes += byteLength;
  if (
    !Number.isSafeInteger(budget.expandedBytes)
    || budget.expandedBytes > budget.maxBytes
  ) throw new Error('PDF object stream expansion limit');
}

class BoundedByteAccumulator {
  private readonly chunks: Uint8Array[] = [];
  private current: Uint8Array | undefined;
  private currentLength = 0;
  private totalLength = 0;

  constructor(private readonly maxBytes: number) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new Error('PDF object stream expansion limit');
    }
  }

  pushByte(value: number): void {
    if (this.totalLength >= this.maxBytes) {
      throw new Error('PDF object stream expansion limit');
    }
    if (!this.current || this.currentLength === this.current.byteLength) this.flushAndAllocate();
    const current = this.current;
    if (!current) throw new Error('PDF object stream expansion limit');
    current[this.currentLength] = value & 0xff;
    this.currentLength += 1;
    this.totalLength += 1;
  }

  pushBytes(values: Uint8Array, start = 0, end = values.byteLength): void {
    const byteLength = end - start;
    if (
      start < 0
      || end < start
      || end > values.byteLength
      || this.totalLength + byteLength > this.maxBytes
    ) throw new Error('PDF object stream expansion limit');
    let sourceOffset = start;
    while (sourceOffset < end) {
      if (!this.current || this.currentLength === this.current.byteLength) {
        this.flushAndAllocate();
      }
      const current = this.current;
      if (!current) throw new Error('PDF object stream expansion limit');
      const writable = Math.min(current.byteLength - this.currentLength, end - sourceOffset);
      current.set(values.subarray(sourceOffset, sourceOffset + writable), this.currentLength);
      this.currentLength += writable;
      this.totalLength += writable;
      sourceOffset += writable;
    }
  }

  finish(): Uint8Array {
    if (this.currentLength > 0 && this.current) {
      this.chunks.push(this.current.slice(0, this.currentLength));
      this.current = undefined;
      this.currentLength = 0;
    }
    if (this.chunks.length === 0) return new Uint8Array();
    if (this.chunks.length === 1) return this.chunks[0];
    const result = new Uint8Array(this.totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  private flushAndAllocate(): void {
    if (this.current && this.currentLength > 0) this.chunks.push(this.current);
    const remaining = this.maxBytes - this.totalLength;
    this.current = new Uint8Array(Math.min(INFLATE_CHUNK_BYTES, Math.max(remaining, 1)));
    this.currentLength = 0;
  }
}

function decodeAsciiHexContents(contents: Uint8Array, maxDecodedBytes: number): Uint8Array {
  const output = new BoundedByteAccumulator(maxDecodedBytes);
  let highNibble: number | undefined;
  for (const byte of contents) {
    if (isWhitespace(byte)) continue;
    if (byte === GREATER_THAN) break;
    const nibble = hexValue(byte);
    if (nibble === undefined) throw new Error('Invalid ASCIIHex stream');
    if (highNibble === undefined) {
      highNibble = nibble;
    } else {
      output.pushByte(highNibble * 16 + nibble);
      highNibble = undefined;
    }
  }
  if (highNibble !== undefined) output.pushByte(highNibble * 16);
  return output.finish();
}

function decodeAscii85Contents(contents: Uint8Array, maxDecodedBytes: number): Uint8Array {
  const output = new BoundedByteAccumulator(maxDecodedBytes);
  const group: number[] = [];
  let offset = skipWhitespace(contents, 0);
  if (contents[offset] === LESS_THAN && contents[offset + 1] === 0x7e) offset += 2;
  for (; offset < contents.byteLength; offset += 1) {
    const byte = contents[offset];
    if (isWhitespace(byte)) continue;
    if (byte === 0x7e) {
      if (contents[skipWhitespace(contents, offset + 1)] !== GREATER_THAN) {
        throw new Error('Invalid ASCII85 stream');
      }
      break;
    }
    if (byte === 0x7a) {
      if (group.length !== 0) throw new Error('Invalid ASCII85 stream');
      output.pushBytes(Uint8Array.of(0, 0, 0, 0));
      continue;
    }
    if (byte < 0x21 || byte > 0x75) throw new Error('Invalid ASCII85 stream');
    group.push(byte - 0x21);
    if (group.length === 5) {
      writeAscii85Group(output, group, 4);
      group.length = 0;
    }
  }
  if (group.length === 1) throw new Error('Invalid ASCII85 stream');
  if (group.length > 1) {
    const outputBytes = group.length - 1;
    while (group.length < 5) group.push(84);
    writeAscii85Group(output, group, outputBytes);
  }
  return output.finish();
}

function writeAscii85Group(
  output: BoundedByteAccumulator,
  group: readonly number[],
  outputBytes: number,
): void {
  let value = 0;
  for (const digit of group) value = value * 85 + digit;
  if (value > 0xffff_ffff) throw new Error('Invalid ASCII85 stream');
  const decoded = Uint8Array.of(
    Math.floor(value / 0x1_00_00_00),
    Math.floor(value / 0x1_00_00) % 256,
    Math.floor(value / 0x1_00) % 256,
    value % 256,
  );
  output.pushBytes(decoded, 0, outputBytes);
}

function decodeRunLengthContents(contents: Uint8Array, maxDecodedBytes: number): Uint8Array {
  const output = new BoundedByteAccumulator(maxDecodedBytes);
  let offset = 0;
  while (offset < contents.byteLength) {
    const length = contents[offset++];
    if (length === 128) return output.finish();
    if (length <= 127) {
      const end = offset + length + 1;
      if (end > contents.byteLength) throw new Error('Invalid RunLength stream');
      output.pushBytes(contents, offset, end);
      offset = end;
    } else {
      if (offset >= contents.byteLength) throw new Error('Invalid RunLength stream');
      const value = contents[offset++];
      for (let count = 0; count < 257 - length; count += 1) output.pushByte(value);
    }
  }
  throw new Error('Invalid RunLength stream');
}

function decodeLzwContents(
  contents: Uint8Array,
  maxDecodedBytes: number,
  earlyChange: 0 | 1,
): Uint8Array {
  const output = new BoundedByteAccumulator(maxDecodedBytes);
  const prefixes = new Int16Array(4_096);
  const suffixes = new Uint8Array(4_096);
  const stack = new Uint8Array(4_096);
  let bitOffset = 0;
  let codeWidth = 9;
  let nextCode = 258;
  let previousCode = -1;

  const emitCode = (code: number): number => {
    let stackLength = 0;
    let cursor = code;
    while (cursor >= 258) {
      if (cursor >= nextCode || stackLength >= stack.byteLength) {
        throw new Error('Invalid LZW stream');
      }
      stack[stackLength++] = suffixes[cursor];
      cursor = prefixes[cursor];
    }
    if (cursor < 0 || cursor > 255) throw new Error('Invalid LZW stream');
    output.pushByte(cursor);
    for (let index = stackLength - 1; index >= 0; index -= 1) output.pushByte(stack[index]);
    return cursor;
  };

  for (;;) {
    const code = readLzwCode(contents, bitOffset, codeWidth);
    if (!code) throw new Error('Invalid LZW stream');
    bitOffset = code.nextBitOffset;
    if (code.value === 256) {
      codeWidth = 9;
      nextCode = 258;
      previousCode = -1;
      continue;
    }
    if (code.value === 257) return output.finish();
    if (previousCode < 0) {
      if (code.value > 255) throw new Error('Invalid LZW stream');
      emitCode(code.value);
      previousCode = code.value;
      continue;
    }

    let firstByte: number;
    if (code.value < nextCode) {
      firstByte = emitCode(code.value);
    } else if (code.value === nextCode) {
      firstByte = emitCode(previousCode);
      output.pushByte(firstByte);
    } else {
      throw new Error('Invalid LZW stream');
    }
    if (nextCode < 4_096) {
      prefixes[nextCode] = previousCode;
      suffixes[nextCode] = firstByte;
      nextCode += 1;
      if (codeWidth < 12 && nextCode + earlyChange === 2 ** codeWidth) codeWidth += 1;
    }
    previousCode = code.value;
  }
}

function readLzwCode(
  contents: Uint8Array,
  bitOffset: number,
  width: number,
): { value: number; nextBitOffset: number } | undefined {
  if (bitOffset + width > contents.byteLength * 8) return undefined;
  let value = 0;
  for (let index = 0; index < width; index += 1) {
    const absoluteBit = bitOffset + index;
    const byte = contents[Math.floor(absoluteBit / 8)];
    value = value * 2 + ((byte >> (7 - (absoluteBit % 8))) & 1);
  }
  return { value, nextBitOffset: bitOffset + width };
}

function applyPdfPredictor(
  contents: Uint8Array,
  parameters: PdfFilterDecodeParameters | undefined,
  maxDecodedBytes: number,
): Uint8Array {
  if (!parameters || parameters.predictor === 1) return contents;
  const samplesPerRow = parameters.colors * parameters.columns;
  const bitsPerRow = samplesPerRow * parameters.bitsPerComponent;
  const rowBytes = Math.ceil(bitsPerRow / 8);
  if (
    !Number.isSafeInteger(samplesPerRow)
    || !Number.isSafeInteger(bitsPerRow)
    || rowBytes <= 0
    || rowBytes > maxDecodedBytes
  ) throw new Error('Invalid PDF predictor');
  if (parameters.predictor === 2) {
    return decodeTiffPredictor(contents, parameters, rowBytes);
  }
  return decodePngPredictor(contents, parameters, rowBytes, maxDecodedBytes);
}

function decodeTiffPredictor(
  contents: Uint8Array,
  parameters: PdfFilterDecodeParameters,
  rowBytes: number,
): Uint8Array {
  if (contents.byteLength % rowBytes !== 0) throw new Error('Invalid TIFF predictor');
  const decoded = contents.slice();
  if (parameters.bitsPerComponent === 8) {
    for (let rowStart = 0; rowStart < decoded.byteLength; rowStart += rowBytes) {
      for (let index = parameters.colors; index < rowBytes; index += 1) {
        decoded[rowStart + index] = (
          decoded[rowStart + index] + decoded[rowStart + index - parameters.colors]
        ) & 0xff;
      }
    }
    return decoded;
  }
  if (parameters.bitsPerComponent === 16) {
    const componentBytes = parameters.colors * 2;
    for (let rowStart = 0; rowStart < decoded.byteLength; rowStart += rowBytes) {
      for (let index = componentBytes; index < rowBytes; index += 2) {
        const current = decoded[rowStart + index] * 256 + decoded[rowStart + index + 1];
        const previous = decoded[rowStart + index - componentBytes] * 256
          + decoded[rowStart + index - componentBytes + 1];
        const value = (current + previous) & 0xffff;
        decoded[rowStart + index] = value >> 8;
        decoded[rowStart + index + 1] = value & 0xff;
      }
    }
    return decoded;
  }
  const bitsPerComponent = parameters.bitsPerComponent;
  const samplesPerRow = parameters.colors * parameters.columns;
  const sampleMask = (1 << bitsPerComponent) - 1;
  for (let rowStart = 0; rowStart < decoded.byteLength; rowStart += rowBytes) {
    const previousSamples = new Uint8Array(parameters.colors);
    for (let sample = 0; sample < samplesPerRow; sample += 1) {
      const bitOffset = sample * bitsPerComponent;
      const byteOffset = rowStart + Math.floor(bitOffset / 8);
      const shift = 8 - bitsPerComponent - (bitOffset % 8);
      const color = sample % parameters.colors;
      const encoded = (decoded[byteOffset] >> shift) & sampleMask;
      const value = (encoded + previousSamples[color]) & sampleMask;
      previousSamples[color] = value;
      decoded[byteOffset] = (
        decoded[byteOffset] & ~(sampleMask << shift)
      ) | (value << shift);
    }
  }
  return decoded;
}

function decodePngPredictor(
  contents: Uint8Array,
  parameters: PdfFilterDecodeParameters,
  rowBytes: number,
  maxDecodedBytes: number,
): Uint8Array {
  const encodedRowBytes = rowBytes + 1;
  if (contents.byteLength % encodedRowBytes !== 0) throw new Error('Invalid PNG predictor');
  const rowCount = contents.byteLength / encodedRowBytes;
  const decodedBytes = rowCount * rowBytes;
  if (!Number.isSafeInteger(decodedBytes) || decodedBytes > maxDecodedBytes) {
    throw new Error('PDF object stream expansion limit');
  }
  const decoded = new Uint8Array(decodedBytes);
  const bytesPerPixel = Math.max(
    1,
    Math.ceil(parameters.colors * parameters.bitsPerComponent / 8),
  );
  for (let row = 0; row < rowCount; row += 1) {
    const sourceStart = row * encodedRowBytes;
    const targetStart = row * rowBytes;
    const predictor = contents[sourceStart];
    if (predictor > 4) throw new Error('Invalid PNG predictor');
    for (let index = 0; index < rowBytes; index += 1) {
      const raw = contents[sourceStart + 1 + index];
      const left = index >= bytesPerPixel ? decoded[targetStart + index - bytesPerPixel] : 0;
      const up = row > 0 ? decoded[targetStart - rowBytes + index] : 0;
      const upperLeft = row > 0 && index >= bytesPerPixel
        ? decoded[targetStart - rowBytes + index - bytesPerPixel]
        : 0;
      let reconstructed = raw;
      if (predictor === 1) reconstructed += left;
      else if (predictor === 2) reconstructed += up;
      else if (predictor === 3) reconstructed += Math.floor((left + up) / 2);
      else if (predictor === 4) reconstructed += paethPredictor(left, up, upperLeft);
      decoded[targetStart + index] = reconstructed & 0xff;
    }
  }
  return decoded;
}

function paethPredictor(left: number, up: number, upperLeft: number): number {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}

function readCompressedScalarObjects(
  data: Uint8Array,
  objectCount: number,
  firstObjectOffset: number,
): CompressedScalarObject[] {
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

  const values: CompressedScalarObject[] = [];
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
    const objectNumber = objectNumbers[index] ?? 0;
    const integer = tryReadInteger(data, valueStart);
    if (
      integer
      && integer.end <= end
      && containsOnlyWhitespaceAndComments(data, integer.end, end)
    ) {
      values.push({ objectNumber, objectIndex: index, kind: 'integer', value: integer.value });
      continue;
    }
    const name = readPdfName(data, valueStart);
    if (name && name.end <= end && containsOnlyWhitespaceAndComments(data, name.end, end)) {
      values.push({ objectNumber, objectIndex: index, kind: 'name', value: name.value });
      continue;
    }
    if (
      matchesKeyword(data, valueStart, 'null')
      && containsOnlyWhitespaceAndComments(data, valueStart + 'null'.length, end)
    ) values.push({ objectNumber, objectIndex: index, kind: 'null' });
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
  ignoreCrossReferenceAuthority = false,
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
    if (matchesKeyword(data, skipWhitespaceAndComments(data, streamEnd), 'endstream')) {
      boundaryValues.push(value);
    }
  }

  if (!ignoreCrossReferenceAuthority) {
    const authoritativeOffset = candidates.authoritativeOffsets.get(key);
    if (authoritativeOffset !== undefined) {
      const authoritativeValues = boundaryValues.filter(value => (
        candidates.declarationOffsets.get(key)?.get(value)?.has(authoritativeOffset) ?? false
      ));
      return authoritativeValues.length === 1 ? authoritativeValues[0] : undefined;
    }
    if (candidates.authoritativeCompressedEntries.has(key)) {
      const compressedValues = candidates.compressedValues.get(key);
      if (!compressedValues) return undefined;
      const authoritativeValues = boundaryValues.filter(value => compressedValues.has(value));
      return authoritativeValues.length === 1 ? authoritativeValues[0] : undefined;
    }
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

function dictionaryDeclaresEncryption(
  _data: Uint8Array,
  dictionary: ParsedDictionary,
  candidates: Pick<IndirectLengthCandidateIndex, 'authoritativeNullObjects'>,
): boolean {
  if (dictionary.hasEncryptionDictionary) return true;
  return dictionary.encryptionReference !== undefined
    && !candidates.authoritativeNullObjects.has(referenceKey(
      dictionary.encryptionReference.objectNumber,
      dictionary.encryptionReference.generationNumber,
    ));
}

function isAuthoritativeNullObject(
  data: Uint8Array,
  reference: RawPdfReference,
  authoritativeOffsets: ReadonlyMap<string, number>,
): boolean {
  const offset = authoritativeOffsets.get(referenceKey(
    reference.objectNumber,
    reference.generationNumber,
  ));
  if (offset === undefined) return false;
  const header = readIndirectObjectHeader(data, offset);
  if (
    !header
    || header.start !== offset
    || header.objectNumber !== reference.objectNumber
    || header.generationNumber !== reference.generationNumber
  ) return false;
  const valueStart = skipWhitespaceAndComments(data, header.end);
  if (!matchesKeyword(data, valueStart, 'null')) return false;
  const objectEnd = skipWhitespaceAndComments(data, valueStart + 'null'.length);
  return matchesKeyword(data, objectEnd, 'endobj');
}

function isAuthoritativeCompressedNullObject(
  data: Uint8Array,
  reference: RawPdfReference,
  authoritativeOffsets: ReadonlyMap<string, number>,
  compressedEntries: ReadonlyMap<string, CompressedCrossReferenceEntry>,
  expansionBudget: PdfStreamExpansionBudget,
): boolean {
  if (reference.generationNumber !== 0) return false;
  const entry = compressedEntries.get(referenceKey(reference.objectNumber, 0));
  if (!entry) return false;
  const objectStreamOffset = authoritativeOffsets.get(referenceKey(
    entry.objectStreamNumber,
    0,
  ));
  if (objectStreamOffset === undefined) return false;
  const header = readIndirectObjectHeader(data, objectStreamOffset);
  if (
    !header
    || header.start !== objectStreamOffset
    || header.objectNumber !== entry.objectStreamNumber
    || header.generationNumber !== 0
  ) return false;

  const dictionaryStart = skipWhitespaceAndComments(data, header.end);
  if (data[dictionaryStart] !== LESS_THAN || data[dictionaryStart + 1] !== LESS_THAN) return false;
  const dictionaryEnd = findDictionaryEnd(data, dictionaryStart);
  if (dictionaryEnd === undefined) return false;
  let dictionary: ParsedDictionary;
  try {
    dictionary = parseCriticalDictionary(data, dictionaryStart, dictionaryEnd);
  } catch {
    return false;
  }
  if (
    resolveCriticalStreamType(
      data,
      dictionary.type,
      { authoritativeOffsets },
    ) !== 'ObjStm'
    || dictionary.objectCount === undefined
    || dictionary.firstObjectOffset === undefined
    || entry.objectIndex >= dictionary.objectCount
  ) return false;

  const streamKeyword = skipWhitespaceAndComments(data, dictionaryEnd);
  if (!matchesKeyword(data, streamKeyword, 'stream')) return false;
  let streamStart: number;
  try {
    streamStart = readStreamStart(data, streamKeyword + 'stream'.length);
  } catch {
    return false;
  }
  const length = resolveAuthoritativeUncompressedLength(
    data,
    dictionary.length,
    authoritativeOffsets,
  );
  if (length === undefined) return false;
  const streamEnd = streamStart + length;
  if (
    !Number.isSafeInteger(streamEnd)
    || streamEnd > data.byteLength
    || !matchesKeyword(data, skipWhitespaceAndComments(data, streamEnd), 'endstream')
  ) return false;
  const decoded = decodeObjectStreamContents(
    data.subarray(streamStart, streamEnd),
    resolveFilters(data, dictionary.filters, { authoritativeOffsets }),
    resolveDecodeParameters(data, dictionary.decodeParameters, { authoritativeOffsets }),
    expansionBudget,
  );
  return decoded !== undefined && compressedObjectIsNull(
    decoded,
    dictionary.objectCount,
    dictionary.firstObjectOffset,
    reference.objectNumber,
    entry.objectIndex,
  );
}

function resolveAuthoritativeUncompressedLength(
  data: Uint8Array,
  length: number | RawPdfReference | undefined,
  authoritativeOffsets: ReadonlyMap<string, number>,
): number | undefined {
  if (typeof length === 'number') return length;
  if (!length) return undefined;
  const offset = authoritativeOffsets.get(referenceKey(
    length.objectNumber,
    length.generationNumber,
  ));
  if (offset === undefined) return undefined;
  const header = readIndirectObjectHeader(data, offset);
  if (
    !header
    || header.start !== offset
    || header.objectNumber !== length.objectNumber
    || header.generationNumber !== length.generationNumber
  ) return undefined;
  const valueStart = skipWhitespaceAndComments(data, header.end);
  const value = tryReadUnsignedInteger(data, valueStart);
  if (!value) return undefined;
  const objectEnd = skipWhitespaceAndComments(data, value.end);
  return matchesKeyword(data, objectEnd, 'endobj') ? value.value : undefined;
}

function compressedObjectIsNull(
  data: Uint8Array,
  objectCount: number,
  firstObjectOffset: number,
  expectedObjectNumber: number,
  expectedObjectIndex: number,
): boolean {
  if (
    !Number.isSafeInteger(objectCount)
    || objectCount < 0
    || objectCount > PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS
    || !Number.isSafeInteger(firstObjectOffset)
    || firstObjectOffset < 0
    || firstObjectOffset > data.byteLength
    || expectedObjectIndex < 0
    || expectedObjectIndex >= objectCount
  ) return false;
  const objectNumbers: number[] = [];
  const objectOffsets: number[] = [];
  let headerOffset = 0;
  for (let index = 0; index < objectCount; index += 1) {
    headerOffset = skipWhitespaceAndComments(data, headerOffset);
    const objectNumber = tryReadUnsignedInteger(data, headerOffset);
    if (!objectNumber || objectNumber.end > firstObjectOffset) return false;
    headerOffset = skipWhitespaceAndComments(data, objectNumber.end);
    const objectOffset = tryReadUnsignedInteger(data, headerOffset);
    if (!objectOffset || objectOffset.end > firstObjectOffset) return false;
    objectNumbers.push(objectNumber.value);
    objectOffsets.push(objectOffset.value);
    headerOffset = objectOffset.end;
  }
  if (
    skipWhitespaceAndComments(data, headerOffset) > firstObjectOffset
    || objectNumbers[expectedObjectIndex] !== expectedObjectNumber
  ) return false;
  const start = firstObjectOffset + (objectOffsets[expectedObjectIndex] ?? 0);
  const end = expectedObjectIndex + 1 < objectCount
    ? firstObjectOffset + (objectOffsets[expectedObjectIndex + 1] ?? 0)
    : data.byteLength;
  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(end)
    || start < firstObjectOffset
    || end < start
    || end > data.byteLength
  ) return false;
  const valueStart = skipWhitespaceAndComments(data, start);
  if (!matchesKeyword(data, valueStart, 'null')) return false;
  return containsOnlyWhitespaceAndComments(data, valueStart + 'null'.length, end);
}

function resolveCriticalStreamType(
  data: Uint8Array,
  type: string | RawPdfReference | undefined,
  candidates: CompressedReferenceCandidates,
): string | null | undefined {
  if (typeof type === 'string' || type === undefined) return type;
  const key = referenceKey(type.objectNumber, type.generationNumber);
  const offset = candidates.authoritativeOffsets.get(key);
  if (offset === undefined) {
    const compressedEntry = candidates.authoritativeCompressedEntries?.get(key);
    if (type.generationNumber !== 0 || !compressedEntry) return null;
    const isNull = candidates.compressedNullObjects?.has(key) ?? false;
    const names = candidates.compressedNames?.get(key);
    if ((isNull ? 1 : 0) + (names?.size ?? 0) !== 1) return null;
    if (isNull) return undefined;
    if (!names) return null;
    return names.values().next().value ?? null;
  }
  const header = readIndirectObjectHeader(data, offset);
  if (
    !header
    || header.start !== offset
    || header.objectNumber !== type.objectNumber
    || header.generationNumber !== type.generationNumber
  ) return null;
  const valueStart = skipWhitespaceAndComments(data, header.end);
  if (matchesKeyword(data, valueStart, 'null')) {
    const objectEnd = skipWhitespaceAndComments(data, valueStart + 'null'.length);
    return matchesKeyword(data, objectEnd, 'endobj') ? undefined : null;
  }
  const value = readPdfName(data, valueStart);
  if (!value) return null;
  const objectEnd = skipWhitespaceAndComments(data, value.end);
  return matchesKeyword(data, objectEnd, 'endobj') ? value.value : null;
}

function parseCriticalDictionary(
  data: Uint8Array,
  dictionaryStart: number,
  dictionaryEnd: number,
): ParsedDictionary {
  let type: string | RawPdfReference | undefined;
  let length: number | RawPdfReference | undefined;
  let filters: PdfFilters | undefined = [];
  let decodeParameters: PdfDecodeParameters | undefined;
  let objectCount: number | undefined;
  let firstObjectOffset: number | undefined;
  let xrefSize: number | undefined;
  let xrefWidths: readonly number[] | undefined;
  let xrefIndex: readonly number[] | undefined;
  let previousXrefOffset: number | undefined;
  let supplementalXrefOffset: number | undefined;
  let hasType = false;
  let hasFilter = false;
  let hasDecodeParameters = false;
  let hasEncryptionDictionary = false;
  let encryptionReference: RawPdfReference | undefined;
  let hasEncryptionEntry = false;
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
      if (hasType) throw new Error('Duplicate PDF stream type');
      hasType = true;
      if (matchesKeyword(data, valueStart, 'null')) {
        type = undefined;
        offset = valueStart + 'null'.length;
        continue;
      }
      const value = readPdfName(data, valueStart);
      if (value) {
        type = value.value;
        offset = value.end;
        continue;
      }
      const reference = readRawPdfReference(data, valueStart);
      if (!reference) throw new Error('Invalid PDF stream type');
      type = reference.reference;
      offset = reference.end;
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
    } else if (key.value === 'DecodeParms' || key.value === 'DP') {
      if (hasDecodeParameters) throw new Error('Duplicate PDF stream decode parameters');
      hasDecodeParameters = true;
      try {
        const value = readDecodeParameters(data, valueStart);
        decodeParameters = value.parameters;
        offset = value.end;
      } catch {
        decodeParameters = null;
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
      || key.value === 'XRefStm'
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
      } else if (key.value === 'Prev') {
        if (previousXrefOffset !== undefined) throw new Error('Duplicate PDF previous xref');
        previousXrefOffset = value.value;
      } else {
        if (supplementalXrefOffset !== undefined) {
          throw new Error('Duplicate PDF supplemental xref');
        }
        supplementalXrefOffset = value.value;
      }
      offset = value.end;
    } else {
      if (key.value === 'Encrypt') {
        if (hasEncryptionEntry) throw new Error('Duplicate PDF encryption dictionary');
        hasEncryptionEntry = true;
        const reference = readRawPdfReference(data, valueStart);
        if (reference) encryptionReference = reference.reference;
        else if (!matchesKeyword(data, valueStart, 'null')) hasEncryptionDictionary = true;
      }
      offset = skipPdfValue(data, valueStart, dictionaryEnd);
    }
  }
  return {
    type,
    length,
    filters,
    decodeParameters,
    objectCount,
    firstObjectOffset,
    xrefSize,
    xrefWidths,
    xrefIndex,
    previousXrefOffset,
    supplementalXrefOffset,
    hasEncryptionDictionary,
    encryptionReference,
  };
}

function skipPdfValue(data: Uint8Array, start: number, end: number): number {
  let offset = skipWhitespaceAndComments(data, start);
  if (offset >= end) throw new Error('Missing PDF dictionary value');

  if (data[offset] === LEFT_PARENTHESIS) {
    const valueEnd = skipLiteralString(data, offset);
    if (valueEnd > end) throw new Error('PDF dictionary value limit');
    return valueEnd;
  }
  if (data[offset] === LESS_THAN && data[offset + 1] !== LESS_THAN) {
    const valueEnd = skipHexString(data, offset);
    if (valueEnd > end) throw new Error('PDF dictionary value limit');
    return valueEnd;
  }
  if (data[offset] === PDF_NAME) {
    const name = readPdfName(data, offset);
    if (!name || name.end > end) throw new Error('Invalid PDF dictionary value');
    return name.end;
  }

  const reference = readRawPdfReference(data, offset);
  if (reference && reference.end <= end) return reference.end;

  const containers: ('array' | 'dictionary')[] = [];
  if (data[offset] === LEFT_BRACKET) {
    containers.push('array');
    offset += 1;
  } else if (data[offset] === LESS_THAN && data[offset + 1] === LESS_THAN) {
    containers.push('dictionary');
    offset += 2;
  } else {
    return skipPdfAtomicValue(data, offset, end);
  }

  while (containers.length > 0) {
    offset = skipWhitespaceAndComments(data, offset);
    if (offset >= end) throw new Error('Unterminated PDF dictionary value');
    const byte = data[offset];
    if (byte === LEFT_PARENTHESIS) {
      offset = skipLiteralString(data, offset);
    } else if (byte === LESS_THAN && data[offset + 1] === LESS_THAN) {
      containers.push('dictionary');
      offset += 2;
    } else if (byte === GREATER_THAN && data[offset + 1] === GREATER_THAN) {
      if (containers.pop() !== 'dictionary') throw new Error('Invalid PDF dictionary value');
      offset += 2;
    } else if (byte === LESS_THAN) {
      offset = skipHexString(data, offset);
    } else if (byte === LEFT_BRACKET) {
      containers.push('array');
      offset += 1;
    } else if (byte === RIGHT_BRACKET) {
      if (containers.pop() !== 'array') throw new Error('Invalid PDF array value');
      offset += 1;
    } else if (byte === PDF_NAME) {
      const name = readPdfName(data, offset);
      if (!name) throw new Error('Invalid PDF dictionary value');
      offset = name.end;
    } else {
      const nestedReference = readRawPdfReference(data, offset);
      offset = nestedReference?.end ?? skipPdfAtomicValue(data, offset, end);
    }
    if (containers.length > PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH || offset > end) {
      throw new Error('PDF dictionary value limit');
    }
  }
  return offset;
}

function skipPdfAtomicValue(data: Uint8Array, start: number, end: number): number {
  if (isDelimiter(data[start])) throw new Error('Invalid PDF dictionary value');
  let offset = start;
  while (offset < end && !isWhitespace(data[offset]) && !isDelimiter(data[offset])) {
    offset += 1;
  }
  if (offset === start) throw new Error('Invalid PDF dictionary value');
  return offset;
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
): { filters: PdfFilters; end: number } {
  if (matchesKeyword(data, start, 'null')) return { filters: [], end: start + 4 };
  if (data[start] === PDF_NAME) {
    const filter = readPdfName(data, start);
    if (!filter) throw new Error('Invalid PDF stream filter');
    return { filters: [filter.value], end: filter.end };
  }
  const reference = readRawPdfReference(data, start);
  if (reference) {
    return {
      filters: { reference: reference.reference },
      end: reference.end,
    };
  }
  if (data[start] !== LEFT_BRACKET) throw new Error('Invalid PDF stream filter');
  const filters: PdfFilter[] = [];
  let offset = start + 1;
  while (offset < data.byteLength) {
    offset = skipWhitespaceAndComments(data, offset);
    if (data[offset] === RIGHT_BRACKET) return { filters, end: offset + 1 };
    if (filters.length >= MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
      throw new Error('PDF stream filter limit');
    }
    const filter = readPdfName(data, offset);
    if (filter) {
      filters.push(filter.value);
      offset = filter.end;
      continue;
    }
    const referenceItem = readRawPdfReference(data, offset);
    if (!referenceItem) throw new Error('Invalid PDF stream filter array');
    filters.push(referenceItem.reference);
    offset = referenceItem.end;
  }
  throw new Error('Unterminated PDF stream filter array');
}

function resolveFilters(
  data: Uint8Array,
  filters: PdfFilters | undefined,
  candidates?: Pick<IndirectLengthCandidateIndex, 'authoritativeOffsets'>,
): readonly string[] | undefined {
  if (filters === undefined) return undefined;
  if ('reference' in filters) {
    const reference = filters.reference;
    const offset = candidates?.authoritativeOffsets.get(referenceKey(
      reference.objectNumber,
      reference.generationNumber,
    ));
    if (offset === undefined) return undefined;
    const header = readIndirectObjectHeader(data, offset);
    if (
      !header
      || header.objectNumber !== reference.objectNumber
      || header.generationNumber !== reference.generationNumber
    ) return undefined;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    let value: { filters: PdfFilters; end: number };
    try {
      value = readFilters(data, valueStart);
    } catch {
      return undefined;
    }
    if ('reference' in value.filters) return undefined;
    const objectEnd = skipWhitespaceAndComments(data, value.end);
    if (!matchesKeyword(data, objectEnd, 'endobj')) return undefined;
    return resolveFilters(data, value.filters, candidates);
  }
  const resolved: string[] = [];
  for (const filter of filters) {
    if (typeof filter === 'string') {
      resolved.push(filter);
      continue;
    }
    const offset = candidates?.authoritativeOffsets.get(referenceKey(
      filter.objectNumber,
      filter.generationNumber,
    ));
    if (offset === undefined) return undefined;
    const header = readIndirectObjectHeader(data, offset);
    if (
      !header
      || header.objectNumber !== filter.objectNumber
      || header.generationNumber !== filter.generationNumber
    ) return undefined;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    const value = readPdfName(data, valueStart);
    if (!value) return undefined;
    const objectEnd = skipWhitespaceAndComments(data, value.end);
    if (!matchesKeyword(data, objectEnd, 'endobj')) return undefined;
    resolved.push(value.value);
  }
  return resolved;
}

function readDecodeParameters(
  data: Uint8Array,
  start: number,
): { parameters: Exclude<PdfDecodeParameters, null>; end: number } {
  if (matchesKeyword(data, start, 'null')) return { parameters: [], end: start + 4 };
  if (data[start] === LESS_THAN && data[start + 1] === LESS_THAN) {
    const end = findDictionaryEnd(data, start);
    if (end === undefined) throw new Error('Invalid PDF decode parameters');
    return { parameters: [readDecodeParameterDictionary(data, start, end)], end };
  }
  const reference = readRawPdfReference(data, start);
  if (reference) {
    return { parameters: { reference: reference.reference }, end: reference.end };
  }
  if (data[start] !== LEFT_BRACKET) throw new Error('Invalid PDF decode parameters');
  const parameters: PdfFilterDecodeParameter[] = [];
  let offset = start + 1;
  while (offset < data.byteLength) {
    offset = skipWhitespaceAndComments(data, offset);
    if (data[offset] === RIGHT_BRACKET) return { parameters, end: offset + 1 };
    if (parameters.length >= MAX_INDIRECT_LENGTH_CANDIDATES_PER_OBJECT) {
      throw new Error('PDF decode parameters limit');
    }
    if (matchesKeyword(data, offset, 'null')) {
      parameters.push(undefined);
      offset += 4;
      continue;
    }
    const itemReference = readRawPdfReference(data, offset);
    if (itemReference) {
      parameters.push(itemReference.reference);
      offset = itemReference.end;
      continue;
    }
    if (data[offset] !== LESS_THAN || data[offset + 1] !== LESS_THAN) {
      throw new Error('Invalid PDF decode parameters array');
    }
    const end = findDictionaryEnd(data, offset);
    if (end === undefined) throw new Error('Invalid PDF decode parameters');
    parameters.push(readDecodeParameterDictionary(data, offset, end));
    offset = end;
  }
  throw new Error('Unterminated PDF decode parameters array');
}

function readDecodeParameterDictionary(
  data: Uint8Array,
  start: number,
  end: number,
): RawPdfFilterDecodeParameters {
  const values = new Map<string, number | RawPdfReference>();
  let depth = 0;
  let arrayDepth = 0;
  let offset = start;
  while (offset < end) {
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
    } else if (byte === LESS_THAN) {
      offset = skipHexString(data, offset);
    } else if (depth === 1 && byte === LEFT_BRACKET) {
      arrayDepth += 1;
      offset += 1;
    } else if (depth === 1 && byte === RIGHT_BRACKET) {
      arrayDepth = Math.max(0, arrayDepth - 1);
      offset += 1;
    } else if (depth === 1 && arrayDepth === 0 && byte === PDF_NAME) {
      const key = readPdfName(data, offset);
      if (!key) throw new Error('Invalid PDF decode parameter name');
      offset = key.end;
      if (!['Predictor', 'Colors', 'BitsPerComponent', 'BPC', 'Columns', 'EarlyChange']
        .includes(key.value)) {
        const extensionValueStart = skipWhitespaceAndComments(data, offset);
        if (data[extensionValueStart] === PDF_NAME) {
          const extensionName = readPdfName(data, extensionValueStart);
          if (!extensionName) throw new Error('Invalid PDF extension name');
          offset = extensionName.end;
        }
        continue;
      }
      if (values.has(key.value)) throw new Error('Duplicate PDF decode parameter');
      const valueStart = skipWhitespaceAndComments(data, offset);
      const reference = readRawPdfReference(data, valueStart);
      if (reference) {
        values.set(key.value, reference.reference);
        offset = reference.end;
        continue;
      }
      const value = readInteger(data, valueStart);
      if (!value) throw new Error('Invalid PDF decode parameter');
      values.set(key.value, value.value);
      offset = value.end;
    } else {
      offset += 1;
    }
  }

  const predictor = values.get('Predictor') ?? 1;
  const colors = values.get('Colors') ?? 1;
  if (values.has('BitsPerComponent') && values.has('BPC')) {
    throw new Error('Duplicate PDF bits per component');
  }
  const bitsPerComponent = values.get('BitsPerComponent') ?? values.get('BPC') ?? 8;
  const columns = values.get('Columns') ?? 1;
  const earlyChange = values.get('EarlyChange') ?? 1;
  return {
    predictor,
    colors,
    bitsPerComponent,
    columns,
    earlyChange,
  };
}

function resolveDecodeParameterScalar(
  data: Uint8Array,
  value: number | RawPdfReference,
  candidates?: CompressedReferenceCandidates,
): number | null {
  if (typeof value === 'number') return value;
  const key = referenceKey(value.objectNumber, value.generationNumber);
  const offset = candidates?.authoritativeOffsets.get(key);
  if (offset === undefined) {
    const compressedEntry = candidates?.authoritativeCompressedEntries?.get(key);
    const compressedValues = candidates?.compressedScalarValues?.get(key);
    if (
      value.generationNumber !== 0
      || !compressedEntry
      || !compressedValues
      || compressedValues.size !== 1
      || candidates?.compressedNullObjects?.has(key)
      || (candidates?.compressedNames?.get(key)?.size ?? 0) > 0
    ) return null;
    const scalar = compressedValues.values().next().value;
    return scalar === undefined ? null : scalar;
  }
  const header = readIndirectObjectHeader(data, offset);
  if (
    !header
    || header.start !== offset
    || header.objectNumber !== value.objectNumber
    || header.generationNumber !== value.generationNumber
  ) return null;
  const valueStart = skipWhitespaceAndComments(data, header.end);
  const scalar = readInteger(data, valueStart);
  if (!scalar) return null;
  const objectEnd = skipWhitespaceAndComments(data, scalar.end);
  return matchesKeyword(data, objectEnd, 'endobj') ? scalar.value : null;
}

function resolveDecodeParameterDictionary(
  data: Uint8Array,
  parameter: RawPdfFilterDecodeParameters,
  candidates?: CompressedReferenceCandidates,
): PdfFilterDecodeParameters | null {
  const predictor = resolveDecodeParameterScalar(data, parameter.predictor, candidates);
  const colors = resolveDecodeParameterScalar(data, parameter.colors, candidates);
  const bitsPerComponent = resolveDecodeParameterScalar(
    data,
    parameter.bitsPerComponent,
    candidates,
  );
  const columns = resolveDecodeParameterScalar(data, parameter.columns, candidates);
  const earlyChange = resolveDecodeParameterScalar(data, parameter.earlyChange, candidates);
  if (
    predictor === null
    || colors === null
    || bitsPerComponent === null
    || columns === null
    || earlyChange === null
  ) return null;
  return { predictor, colors, bitsPerComponent, columns, earlyChange };
}

function resolveDecodeParameters(
  data: Uint8Array,
  parameters: PdfDecodeParameters | undefined,
  candidates?: CompressedReferenceCandidates,
): readonly (PdfFilterDecodeParameters | undefined)[] | null | undefined {
  if (parameters === null || parameters === undefined) return parameters;
  if ('reference' in parameters) {
    const reference = parameters.reference;
    const offset = candidates?.authoritativeOffsets.get(referenceKey(
      reference.objectNumber,
      reference.generationNumber,
    ));
    if (offset === undefined) return null;
    const header = readIndirectObjectHeader(data, offset);
    if (
      !header
      || header.objectNumber !== reference.objectNumber
      || header.generationNumber !== reference.generationNumber
    ) return null;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    let value: { parameters: Exclude<PdfDecodeParameters, null>; end: number };
    try {
      value = readDecodeParameters(data, valueStart);
    } catch {
      return null;
    }
    if ('reference' in value.parameters) return null;
    const objectEnd = skipWhitespaceAndComments(data, value.end);
    if (!matchesKeyword(data, objectEnd, 'endobj')) return null;
    return resolveDecodeParameters(data, value.parameters, candidates);
  }
  const resolved: Array<PdfFilterDecodeParameters | undefined> = [];
  for (const parameter of parameters) {
    if (parameter === undefined) {
      resolved.push(undefined);
      continue;
    }
    if ('predictor' in parameter) {
      const resolvedParameter = resolveDecodeParameterDictionary(data, parameter, candidates);
      if (!resolvedParameter) return null;
      resolved.push(resolvedParameter);
      continue;
    }
    const offset = candidates?.authoritativeOffsets.get(referenceKey(
      parameter.objectNumber,
      parameter.generationNumber,
    ));
    if (offset === undefined) return null;
    const header = readIndirectObjectHeader(data, offset);
    if (
      !header
      || header.objectNumber !== parameter.objectNumber
      || header.generationNumber !== parameter.generationNumber
    ) return null;
    const valueStart = skipWhitespaceAndComments(data, header.end);
    if (matchesKeyword(data, valueStart, 'null')) {
      const objectEnd = skipWhitespaceAndComments(data, valueStart + 'null'.length);
      if (!matchesKeyword(data, objectEnd, 'endobj')) return null;
      resolved.push(undefined);
      continue;
    }
    if (data[valueStart] !== LESS_THAN || data[valueStart + 1] !== LESS_THAN) return null;
    const dictionaryEnd = findDictionaryEnd(data, valueStart);
    if (dictionaryEnd === undefined) return null;
    const objectEnd = skipWhitespaceAndComments(data, dictionaryEnd);
    if (!matchesKeyword(data, objectEnd, 'endobj')) return null;
    const resolvedParameter = resolveDecodeParameterDictionary(
      data,
      readDecodeParameterDictionary(data, valueStart, dictionaryEnd),
      candidates,
    );
    if (!resolvedParameter) return null;
    resolved.push(resolvedParameter);
  }
  return resolved;
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
  if (data[offset] === 0x2b) offset += 1;
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

function readInteger(
  data: Uint8Array,
  start: number,
): { value: number; end: number } | undefined {
  let offset = start;
  let sign = 1;
  if (data[offset] === 0x2b) offset += 1;
  else if (data[offset] === 0x2d) {
    sign = -1;
    offset += 1;
  }
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
  if (digits === 0) return undefined;
  return { value: sign * value, end: offset };
}

function readRawPdfReference(
  data: Uint8Array,
  start: number,
): { reference: RawPdfReference; end: number } | undefined {
  const objectNumber = readUnsignedInteger(data, start);
  if (!objectNumber) return undefined;
  const generationStart = skipWhitespaceAndComments(data, objectNumber.end);
  if (generationStart === objectNumber.end) return undefined;
  const generation = readUnsignedInteger(data, generationStart);
  if (!generation) return undefined;
  const marker = skipWhitespaceAndComments(data, generation.end);
  if (marker === generation.end || !matchesKeyword(data, marker, 'R')) return undefined;
  return {
    reference: {
      objectNumber: objectNumber.value,
      generationNumber: generation.value,
    },
    end: marker + 1,
  };
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

function tryReadInteger(
  data: Uint8Array,
  start: number,
): { value: number; end: number } | undefined {
  try {
    return readInteger(data, start);
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
