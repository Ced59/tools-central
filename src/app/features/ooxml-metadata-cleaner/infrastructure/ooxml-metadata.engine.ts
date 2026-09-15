import { decodeXML } from 'entities';
import JSZip, { type JSZipObject } from 'jszip';

import {
  OOXML_METADATA_MAX_COMPRESSION_RATIO,
  OOXML_METADATA_MAX_ENTRY_BYTES,
  OOXML_METADATA_MAX_OUTPUT_BYTES,
  OOXML_METADATA_MAX_THUMBNAIL_BYTES,
  OOXML_METADATA_MAX_UNCOMPRESSED_BYTES,
  OOXML_METADATA_MAX_XML_BYTES,
  OoxmlArchiveError,
  hasRequiredOoxmlParts,
  inspectZipDirectory,
  type OoxmlDocumentKind,
  type OoxmlMetadataFinding,
  type OoxmlMetadataOptions,
  type OoxmlMetadataReport,
  type OoxmlMetadataScope,
  type ZipDirectoryEntry,
} from '../domain/ooxml-metadata.models';

export type OoxmlMetadataEngineFailureCode =
  | 'invalid-ooxml'
  | 'macro-package-unsupported'
  | 'signed-package-unsupported'
  | 'metadata-part-too-large'
  | 'output-too-large'
  | 'corrupt-document';

export class OoxmlMetadataEngineError extends Error {
  constructor(readonly code: OoxmlMetadataEngineFailureCode, readonly entryName?: string) {
    super(code);
  }
}

export interface OoxmlMetadataEngineResult {
  output: Uint8Array;
  report: OoxmlMetadataReport;
}

const MAX_REPORTED_FINDINGS = 500;
const MAX_REPORTED_VALUE_LENGTH = 240;
const MAX_REPORTED_PATH_LENGTH = 240;
const MAX_XML_TAG_COUNT = 100_000;
const MAX_XML_NESTING_DEPTH = 256;

const METADATA_RELATIONSHIP_SCOPES = new Map<string, OoxmlMetadataScope>([
  ['http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'core'],
  ['http://purl.oclc.org/ooxml/package/relationships/metadata/core-properties', 'core'],
  ['http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties', 'application'],
  ['http://purl.oclc.org/ooxml/officeDocument/relationships/extended-properties', 'application'],
  ['http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties', 'custom'],
  ['http://purl.oclc.org/ooxml/officeDocument/relationships/custom-properties', 'custom'],
  ['http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail', 'thumbnail'],
  ['http://purl.oclc.org/ooxml/package/relationships/metadata/thumbnail', 'thumbnail'],
]);

const DIGITAL_SIGNATURE_RELATIONSHIP_TYPES = new Set([
  'http://schemas.openxmlformats.org/package/2006/relationships/digital-signature/origin',
  'http://schemas.openxmlformats.org/package/2006/relationships/digital-signature/signature',
  'http://schemas.openxmlformats.org/package/2006/relationships/digital-signature/certificate',
  'http://purl.oclc.org/ooxml/package/relationships/digital-signature/origin',
  'http://purl.oclc.org/ooxml/package/relationships/digital-signature/signature',
  'http://purl.oclc.org/ooxml/package/relationships/digital-signature/certificate',
]);

const DIGITAL_SIGNATURE_CONTENT_TYPES = new Set([
  'application/vnd.openxmlformats-package.digital-signature-origin',
  'application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml',
  'application/vnd.openxmlformats-package.digital-signature-certificate',
]);

const MACRO_RELATIONSHIP_TYPES = new Set([
  'http://schemas.microsoft.com/office/2006/relationships/vbaproject',
  'http://schemas.microsoft.com/office/2006/relationships/vbaprojectsignature',
  'http://schemas.microsoft.com/office/2014/relationships/vbaprojectsignatureagile',
  'http://schemas.microsoft.com/office/2020/07/relationships/vbaprojectsignaturev3',
]);

interface FindingAccumulator {
  visible: OoxmlMetadataFinding[];
  counts: Record<OoxmlMetadataScope, number>;
  total: number;
}

function createFindingAccumulator(): FindingAccumulator {
  return {
    visible: [],
    counts: { core: 0, application: 0, custom: 0, thumbnail: 0 },
    total: 0,
  };
}

function recordFinding(
  accumulator: FindingAccumulator,
  scope: OoxmlMetadataScope,
  name: string,
  value: string,
  path: string,
): void {
  accumulator.counts[scope] += 1;
  accumulator.total += 1;
  if (accumulator.visible.length < MAX_REPORTED_FINDINGS) {
    accumulator.visible.push({ scope, name, value, path: truncateReportedPath(path) });
  }
}

function truncateReportedPath(path: string): string {
  if (path.length <= MAX_REPORTED_PATH_LENGTH) return path;
  const tailLength = Math.floor(MAX_REPORTED_PATH_LENGTH / 2);
  return `${path.slice(0, MAX_REPORTED_PATH_LENGTH - tailLength - 1)}…${path.slice(-tailLength)}`;
}

const CORE_FIELDS = [
  'title',
  'subject',
  'creator',
  'keywords',
  'description',
  'lastModifiedBy',
  'revision',
  'created',
  'modified',
  'lastPrinted',
  'category',
  'contentStatus',
  'identifier',
  'language',
  'version',
  'contentType',
] as const;

const APPLICATION_FIELDS = [
  'Application',
  'AppVersion',
  'Company',
  'Manager',
  'Template',
  'HyperlinkBase',
  'DocSecurity',
  'TotalTime',
  'PresentationFormat',
] as const;

export async function sanitizeOoxmlBuffer(
  data: Uint8Array,
  kind: OoxmlDocumentKind,
  options: OoxmlMetadataOptions,
  onProgress?: (percent: number) => void,
): Promise<OoxmlMetadataEngineResult> {
  onProgress?.(2);
  const inspection = inspectZipDirectory(data);
  if (!hasRequiredOoxmlParts(inspection, kind)) {
    throw new OoxmlMetadataEngineError('invalid-ooxml');
  }
  validateUnsupportedParts(inspection.entries);
  onProgress?.(8);

  const actualUncompressedBytes = await validateInflatedArchive(
    data,
    inspection.entries,
    onProgress,
  );
  onProgress?.(24);

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data, { checkCRC32: false, createFolders: false });
  } catch (error: unknown) {
    if (error instanceof OoxmlArchiveError) throw error;
    throw new OoxmlMetadataEngineError('corrupt-document');
  }
  validateLoadedArchiveNames(zip, inspection.entries);

  const entriesByLowerName = new Map(
    inspection.entries.map(entry => [entry.name.toLowerCase(), entry] as const),
  );
  const filesByLowerName = new Map(
    Object.values(zip.files).map(file => [file.name.toLowerCase(), file] as const),
  );
  await validateUnsupportedPackageMarkup(filesByLowerName, entriesByLowerName);
  const resolvedMetadataParts = await resolveMetadataParts(filesByLowerName, entriesByLowerName);
  const metadataParts = await retainRecognizedMetadataParts(
    resolvedMetadataParts,
    filesByLowerName,
    entriesByLowerName,
  );
  const findings = createFindingAccumulator();

  await collectPartFindings(filesByLowerName, entriesByLowerName, metadataParts.core, 'core', CORE_FIELDS, findings);
  await collectPartFindings(
    filesByLowerName,
    entriesByLowerName,
    metadataParts.application,
    'application',
    APPLICATION_FIELDS,
    findings,
  );
  await collectCustomFindings(filesByLowerName, entriesByLowerName, metadataParts.custom, findings);
  collectThumbnailFindings(filesByLowerName, entriesByLowerName, metadataParts.thumbnail, findings);
  onProgress?.(32);

  const removedScopes = new Set<OoxmlMetadataScope>();
  if (options.removeCoreProperties) {
    await clearMetadataParts(zip, filesByLowerName, entriesByLowerName, metadataParts.core, 'coreProperties');
    removedScopes.add('core');
  }
  if (options.removeApplicationProperties) {
    await clearMetadataParts(zip, filesByLowerName, entriesByLowerName, metadataParts.application, 'Properties');
    removedScopes.add('application');
  }
  if (options.removeCustomProperties) {
    await clearMetadataParts(zip, filesByLowerName, entriesByLowerName, metadataParts.custom, 'Properties');
    removedScopes.add('custom');
  }
  if (options.removeThumbnail) {
    await removeThumbnails(zip, filesByLowerName, entriesByLowerName, metadataParts.thumbnail);
    removedScopes.add('thumbnail');
  }

  const report = createReport(
    kind,
    inspection.entries.length,
    actualUncompressedBytes,
    findings,
    removedScopes,
  );
  onProgress?.(36);

  let output: Uint8Array;
  try {
    output = await zip.generateAsync(
      {
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        platform: 'DOS',
        streamFiles: true,
      },
      metadata => onProgress?.(36 + Math.round(metadata.percent * 0.63)),
    );
  } catch {
    throw new OoxmlMetadataEngineError('corrupt-document');
  }
  if (output.byteLength > OOXML_METADATA_MAX_OUTPUT_BYTES) {
    throw new OoxmlMetadataEngineError('output-too-large');
  }
  onProgress?.(100);
  return { output, report };
}

function validateLoadedArchiveNames(
  zip: JSZip,
  entries: readonly ZipDirectoryEntry[],
): void {
  const expectedNames = new Set(entries.map(entry => entry.name));
  for (const file of Object.values(zip.files)) {
    if (
      !expectedNames.delete(file.name)
      || (file.unsafeOriginalName !== undefined && file.unsafeOriginalName !== file.name)
    ) {
      throw new OoxmlArchiveError('unsafe-entry-path', file.unsafeOriginalName ?? file.name);
    }
  }
  if (expectedNames.size > 0) throw new OoxmlArchiveError('invalid-zip');
}

async function validateInflatedArchive(
  data: Uint8Array,
  entries: readonly ZipDirectoryEntry[],
  onProgress?: (percent: number) => void,
): Promise<number> {
  const fileEntries = entries.filter(entry => !entry.directory);
  let totalBytes = 0;

  for (let index = 0; index < fileEntries.length; index += 1) {
    const entry = fileEntries[index];
    const result = await inspectInflatedEntry(data, entry, totalBytes);
    if (result.size !== entry.uncompressedSize || result.crc32 !== entry.crc32) {
      throw new OoxmlArchiveError('invalid-zip', entry.name);
    }
    totalBytes += result.size;
    onProgress?.(10 + Math.round(((index + 1) / Math.max(1, fileEntries.length)) * 13));
  }

  return totalBytes;
}

function inspectInflatedEntry(
  data: Uint8Array,
  entry: ZipDirectoryEntry,
  previousTotalBytes: number,
): Promise<{ size: number; crc32: number }> {
  const compressed = data.subarray(
    entry.dataOffset,
    entry.dataOffset + entry.compressedSize,
  );
  if (entry.compressionMethod === 0) {
    const result = inspectInflatedChunk(compressed, entry, previousTotalBytes);
    return Promise.resolve({
      size: result.size,
      crc32: (result.crc32 ^ 0xffffffff) >>> 0,
    });
  }
  return inspectDeflatedEntry(compressed, entry, previousTotalBytes);
}

async function inspectDeflatedEntry(
  compressed: Uint8Array,
  entry: ZipDirectoryEntry,
  previousTotalBytes: number,
): Promise<{ size: number; crc32: number }> {
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    const compressedBuffer = compressed.buffer.slice(
      compressed.byteOffset,
      compressed.byteOffset + compressed.byteLength,
    ) as ArrayBuffer;
    const input = new ReadableStream<BufferSource>({
      start(controller) {
        controller.enqueue(compressedBuffer);
        controller.close();
      },
    });
    const stream = input
      .pipeThrough(new DecompressionStream('deflate-raw'));
    reader = stream.getReader();
  } catch {
    throw new OoxmlArchiveError('invalid-zip', entry.name);
  }

  let result = { size: 0, crc32: 0xffffffff };
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      result = inspectInflatedChunk(
        chunk.value,
        entry,
        previousTotalBytes,
        result,
      );
    }
  } catch (error: unknown) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof OoxmlArchiveError) throw error;
    throw new OoxmlArchiveError('invalid-zip', entry.name);
  } finally {
    reader.releaseLock();
  }
  return { size: result.size, crc32: (result.crc32 ^ 0xffffffff) >>> 0 };
}

function inspectInflatedChunk(
  chunk: Uint8Array,
  entry: ZipDirectoryEntry,
  previousTotalBytes: number,
  previous = { size: 0, crc32: 0xffffffff },
): { size: number; crc32: number } {
  const size = previous.size + chunk.byteLength;
  if (size > OOXML_METADATA_MAX_ENTRY_BYTES) {
    throw new OoxmlArchiveError('entry-too-large', entry.name);
  }
  if (previousTotalBytes + size > OOXML_METADATA_MAX_UNCOMPRESSED_BYTES) {
    throw new OoxmlArchiveError('archive-too-large', entry.name);
  }
  if (
    size > 1_024 * 1_024
    && entry.compressedSize > 0
    && size / entry.compressedSize > OOXML_METADATA_MAX_COMPRESSION_RATIO
  ) {
    throw new OoxmlArchiveError('compression-ratio-exceeded', entry.name);
  }
  return { size, crc32: updateCrc32(previous.crc32, chunk) };
}

function updateCrc32(crc32: number, chunk: Uint8Array): number {
  let value = crc32;
  for (const byte of chunk) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return value;
}

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

async function collectPartFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  scope: OoxmlMetadataScope,
  fields: readonly string[],
  output: FindingAccumulator,
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (!file) continue;
    validateMetadataEntry(entries.get(lowerPath), file.name);
    const xml = await readXmlPart(file);
    for (const finding of extractNamedElementValues(xml, new Set(fields))) {
      if (finding.value) recordFinding(output, scope, finding.name, finding.value, file.name);
    }
  }
}

async function collectCustomFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  output: FindingAccumulator,
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (!file) continue;
    validateMetadataEntry(entries.get(lowerPath), file.name);
    const xml = await readXmlPart(file);
    const tags = parseXmlTags(xml);
    const rootIndex = tags.findIndex(tag => !tag.closing);
    for (let index = 0; index < tags.length; index += 1) {
      const tag = tags[index];
      if (
        tag.closing
        || tag.localName !== 'property'
        || tag.parentIndex !== rootIndex
      ) continue;
      const closingIndex = findMatchingClosingTag(tags, index);
      const rawValue = closingIndex === null
        ? ''
        : extractXmlTextContent(xml, tag.end, tags[closingIndex].start);
      const name = normalizeReportedText(tag.attributes.get('name') ?? '')
        || 'Propriété personnalisée';
      recordFinding(output, 'custom', name, normalizeReportedText(rawValue), file.name);
    }
  }
}

function collectThumbnailFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  output: FindingAccumulator,
): void {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    const entry = entries.get(lowerPath);
    if (!file || !entry) continue;
    validateThumbnailEntry(entry, file.name);
    recordFinding(
      output,
      'thumbnail',
      'Aperçu intégré',
      `${String(entry.uncompressedSize)} octets`,
      file.name,
    );
  }
}

function* extractNamedElementValues(
  xml: string,
  names: ReadonlySet<string>,
): IterableIterator<{ name: string; value: string }> {
  const tags = parseXmlTags(xml);
  const rootIndex = tags.findIndex(tag => !tag.closing);
  for (let index = 0; index < tags.length; index += 1) {
    const tag = tags[index];
    if (tag.closing || tag.parentIndex !== rootIndex || !names.has(tag.localName)) continue;
    const closingIndex = findMatchingClosingTag(tags, index);
    const value = closingIndex === null
      ? ''
      : extractXmlTextContent(xml, tag.end, tags[closingIndex].start);
    yield { name: tag.localName, value: normalizeReportedText(value) };
  }
}

function normalizeReportedText(value: string): string {
  const text = decodeXML(value).replace(/\s+/gu, ' ').trim();
  if (text.length <= MAX_REPORTED_VALUE_LENGTH) return text;
  return `${text.slice(0, MAX_REPORTED_VALUE_LENGTH - 1)}…`;
}

async function clearMetadataParts(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  expectedRoot: string,
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (!file) continue;
    validateMetadataEntry(entries.get(lowerPath), file.name);
    await rewriteXmlPart(zip, file, xml => clearXmlRootContents(xml, expectedRoot));
  }
}

function clearXmlRootContents(xml: string, expectedRoot: string): string {
  const tags = parseXmlTags(xml);
  const rootIndex = tags.findIndex(tag => !tag.closing);
  if (rootIndex < 0) return xml;
  const root = tags[rootIndex];
  if (root.localName !== expectedRoot || root.selfClosing) return xml;
  const closingIndex = findMatchingClosingTag(tags, rootIndex);
  if (closingIndex === null) return xml;
  return xml.slice(0, root.end) + xml.slice(tags[closingIndex].start);
}

async function removeThumbnails(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
): Promise<void> {
  const referencedByDocumentContent = await findThumbnailPathsWithOtherReferences(
    files,
    entries,
    new Set(lowerPaths),
  );
  const removedPaths = new Set<string>();
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (file && !referencedByDocumentContent.has(lowerPath)) {
      zip.remove(file.name);
      removedPaths.add(lowerPath);
    }
  }
  const relationships = files.get('_rels/.rels');
  if (relationships) {
    validateMetadataEntry(entries.get('_rels/.rels'), relationships.name);
    await rewriteXmlPart(zip, relationships, stripThumbnailRelationships);
  }
  const contentTypes = files.get('[content_types].xml');
  if (contentTypes) {
    validateMetadataEntry(entries.get('[content_types].xml'), contentTypes.name);
    await rewriteXmlPart(zip, contentTypes, xml => stripThumbnailOverrides(xml, removedPaths));
  }
}

async function findThumbnailPathsWithOtherReferences(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  thumbnailPaths: ReadonlySet<string>,
): Promise<ReadonlySet<string>> {
  const referenced = new Set<string>();
  for (const [relationshipPath, file] of files) {
    if (!relationshipPath.endsWith('.rels')) continue;
    validateMetadataEntry(entries.get(relationshipPath), file.name);
    const tags = parseXmlTags(await readXmlPart(file));
    const rootIndex = tags.findIndex(tag => !tag.closing);
    for (const tag of tags) {
      if (
        tag.closing
        || tag.parentIndex !== rootIndex
        || tag.localName !== 'Relationship'
        || (tag.attributes.get('TargetMode') ?? '').toLowerCase() === 'external'
      ) continue;
      const type = (tag.attributes.get('Type') ?? '').trim();
      if (
        relationshipPath === '_rels/.rels'
        && metadataScopeFromRelationshipType(type) === 'thumbnail'
      ) continue;
      const target = resolveRelationshipTarget(
        relationshipPath,
        tag.attributes.get('Target') ?? '',
      );
      if (target && thumbnailPaths.has(target)) referenced.add(target);
    }
  }
  return referenced;
}

type XmlEncoding = 'utf-8' | 'utf-16le' | 'utf-16be';

interface DecodedXmlPart {
  text: string;
  encoding: XmlEncoding;
  hasBom: boolean;
}

interface OoxmlMetadataParts {
  core: readonly string[];
  application: readonly string[];
  custom: readonly string[];
  thumbnail: readonly string[];
}

interface XmlTag {
  start: number;
  end: number;
  name: string;
  localName: string;
  closing: boolean;
  selfClosing: boolean;
  attributes: ReadonlyMap<string, string>;
  parentIndex: number | null;
  matchingIndex: number | null;
}

async function resolveMetadataParts(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
): Promise<OoxmlMetadataParts> {
  const paths: Record<OoxmlMetadataScope, Set<string>> = {
    core: new Set(),
    application: new Set(),
    custom: new Set(),
    thumbnail: new Set(),
  };
  const relationships = files.get('_rels/.rels');
  if (!relationships) return toMetadataParts(paths);
  validateMetadataEntry(entries.get('_rels/.rels'), relationships.name);

  const xml = await readXmlPart(relationships);
  const tags = parseXmlTags(xml);
  const rootIndex = tags.findIndex(tag => !tag.closing);
  const relationshipTags = tags.filter(tag => (
    !tag.closing
    && tag.parentIndex === rootIndex
    && tag.localName === 'Relationship'
  ));
  for (const relationship of relationshipTags) {
    if ((relationship.attributes.get('TargetMode') ?? '').toLowerCase() === 'external') continue;
    const scope = metadataScopeFromRelationshipType(relationship.attributes.get('Type') ?? '');
    const path = resolvePackageTarget(relationship.attributes.get('Target') ?? '');
    if (!scope || !path || !files.has(path)) continue;
    paths[scope].add(path);
  }
  return toMetadataParts(paths);
}

async function retainRecognizedMetadataParts(
  parts: OoxmlMetadataParts,
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
): Promise<OoxmlMetadataParts> {
  const recognized: Record<OoxmlMetadataScope, string[]> = {
    core: [],
    application: [],
    custom: [],
    thumbnail: [],
  };
  for (const scope of ['core', 'application', 'custom'] as const) {
    for (const path of parts[scope]) {
      const file = files.get(path);
      if (!file) continue;
      validateMetadataEntry(entries.get(path), file.name);
      const root = parseXmlTags(await readXmlPart(file)).find(tag => !tag.closing);
      const expectedRoot = scope === 'core' ? 'coreProperties' : 'Properties';
      if (root?.localName === expectedRoot) recognized[scope].push(path);
    }
  }
  for (const path of parts.thumbnail) {
    const file = files.get(path);
    if (!file) continue;
    validateThumbnailEntry(entries.get(path), file.name);
    recognized.thumbnail.push(path);
  }
  return recognized;
}

function toMetadataParts(
  paths: Readonly<Record<OoxmlMetadataScope, ReadonlySet<string>>>,
): OoxmlMetadataParts {
  return {
    core: [...paths.core],
    application: [...paths.application],
    custom: [...paths.custom],
    thumbnail: [...paths.thumbnail],
  };
}

function metadataScopeFromRelationshipType(type: string): OoxmlMetadataScope | null {
  return METADATA_RELATIONSHIP_SCOPES.get(type.trim()) ?? null;
}

function resolvePackageTarget(target: string): string | null {
  return resolveTargetAgainstBase(target, []);
}

function resolveRelationshipTarget(relationshipPath: string, target: string): string | null {
  if (relationshipPath === '_rels/.rels') return resolvePackageTarget(target);
  const match = /^(?:(.*)\/)?_rels\/([^/]+)\.rels$/u.exec(relationshipPath);
  if (!match) return null;
  const base = match[1] ? match[1].split('/') : [];
  return resolveTargetAgainstBase(target, base);
}

function resolveTargetAgainstBase(target: string, base: readonly string[]): string | null {
  const path = target.trim().split(/[?#]/u, 1)[0];
  if (!path || path.includes('\\')) return null;
  const resolved: string[] = path.startsWith('/') ? [] : [...base];
  for (const encodedPart of path.replace(/^\/+|\/+$/gu, '').split('/')) {
    let decodedPart: string;
    try {
      decodedPart = decodeURIComponent(encodedPart);
    } catch {
      return null;
    }
    if (!decodedPart || decodedPart === '.') continue;
    if (decodedPart === '..') {
      if (resolved.length === 0) return null;
      resolved.pop();
      continue;
    }
    if (
      decodedPart.includes('/')
      || decodedPart.includes('\\')
      || decodedPart.includes('\u0000')
    ) return null;
    resolved.push(encodedPart);
  }
  return resolved.length > 0 ? resolved.join('/').toLowerCase() : null;
}

async function readXmlPart(file: JSZipObject): Promise<string> {
  try {
    return decodeXmlPart(await file.async('uint8array')).text;
  } catch (error: unknown) {
    if (error instanceof OoxmlMetadataEngineError) throw error;
    throw new OoxmlMetadataEngineError('corrupt-document', file.name);
  }
}

async function rewriteXmlPart(
  zip: JSZip,
  file: JSZipObject,
  transform: (xml: string) => string,
): Promise<void> {
  try {
    const decoded = decodeXmlPart(await file.async('uint8array'));
    const transformed = transform(decoded.text);
    if (transformed !== decoded.text) {
      zip.file(file.name, encodeXmlPart(transformed, decoded.encoding, decoded.hasBom));
    }
  } catch (error: unknown) {
    if (error instanceof OoxmlMetadataEngineError) throw error;
    throw new OoxmlMetadataEngineError('corrupt-document', file.name);
  }
}

function decodeXmlPart(data: Uint8Array): DecodedXmlPart {
  let encoding: XmlEncoding = 'utf-8';
  let bomLength = 0;
  if (data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
    bomLength = 3;
  } else if (data[0] === 0xff && data[1] === 0xfe) {
    encoding = 'utf-16le';
    bomLength = 2;
  } else if (data[0] === 0xfe && data[1] === 0xff) {
    encoding = 'utf-16be';
    bomLength = 2;
  } else if (data[0] === 0x3c && data[1] === 0x00) {
    encoding = 'utf-16le';
  } else if (data[0] === 0x00 && data[1] === 0x3c) {
    encoding = 'utf-16be';
  }
  const text = new TextDecoder(encoding, { fatal: true }).decode(data.subarray(bomLength));
  return { text, encoding, hasBom: bomLength > 0 };
}

function encodeXmlPart(text: string, encoding: XmlEncoding, hasBom: boolean): Uint8Array {
  if (encoding === 'utf-8') {
    const payload = new TextEncoder().encode(text);
    if (!hasBom) return payload;
    const output = new Uint8Array(payload.byteLength + 3);
    output.set([0xef, 0xbb, 0xbf]);
    output.set(payload, 3);
    return output;
  }

  const output = new Uint8Array(text.length * 2 + (hasBom ? 2 : 0));
  let offset = 0;
  if (hasBom) {
    output.set(encoding === 'utf-16le' ? [0xff, 0xfe] : [0xfe, 0xff]);
    offset = 2;
  }
  for (let index = 0; index < text.length; index += 1) {
    const codeUnit = text.charCodeAt(index);
    if (encoding === 'utf-16le') {
      output[offset] = codeUnit & 0xff;
      output[offset + 1] = codeUnit >>> 8;
    } else {
      output[offset] = codeUnit >>> 8;
      output[offset + 1] = codeUnit & 0xff;
    }
    offset += 2;
  }
  return output;
}

function stripThumbnailRelationships(xml: string): string {
  return removeXmlElements(xml, 'Relationship', attributes => {
    const type = attributes.get('Type') ?? '';
    return metadataScopeFromRelationshipType(type) === 'thumbnail';
  });
}

function stripThumbnailOverrides(xml: string, thumbnailPaths: ReadonlySet<string>): string {
  return removeXmlElements(xml, 'Override', attributes => {
    const partName = attributes.get('PartName') ?? '';
    const resolved = resolvePackageTarget(partName);
    return resolved !== null && thumbnailPaths.has(resolved);
  });
}

function removeXmlElements(
  xml: string,
  localName: string,
  shouldRemove: (attributes: ReadonlyMap<string, string>) => boolean,
): string {
  const tags = parseXmlTags(xml);
  const ranges: Array<{ start: number; end: number }> = [];
  for (let index = 0; index < tags.length; index += 1) {
    const tag = tags[index];
    if (tag.closing || tag.localName !== localName || !shouldRemove(tag.attributes)) continue;
    const closingIndex = findMatchingClosingTag(tags, index);
    const end = closingIndex === null ? tag.end : tags[closingIndex].end;
    ranges.push({ start: tag.start, end });
  }
  if (ranges.length === 0) return xml;
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  const retained: string[] = [];
  let cursor = 0;
  for (const range of merged) {
    retained.push(xml.slice(cursor, range.start));
    cursor = range.end;
  }
  retained.push(xml.slice(cursor));
  return retained.join('');
}

function findMatchingClosingTag(tags: readonly XmlTag[], startIndex: number): number | null {
  const start = tags[startIndex];
  if (start.closing) throw new OoxmlMetadataEngineError('corrupt-document');
  return start.matchingIndex;
}

function extractXmlTextContent(xml: string, from: number, to: number): string {
  const text: string[] = [];
  let cursor = from;
  while (cursor < to) {
    const start = xml.indexOf('<', cursor);
    if (start < 0 || start >= to) {
      text.push(xml.slice(cursor, to));
      break;
    }
    text.push(xml.slice(cursor, start));
    if (xml.startsWith('<!--', start)) {
      cursor = findXmlTerminator(xml, '-->', start + 4);
      continue;
    }
    if (xml.startsWith('<![CDATA[', start)) {
      const end = xml.indexOf(']]>', start + 9);
      if (end < 0 || end > to) throw new OoxmlMetadataEngineError('corrupt-document');
      text.push(xml.slice(start + 9, end));
      cursor = end + 3;
      continue;
    }
    if (xml.startsWith('<?', start)) {
      cursor = findXmlTerminator(xml, '?>', start + 2);
      continue;
    }
    if (xml.startsWith('<!', start)) throw new OoxmlMetadataEngineError('corrupt-document');
    cursor = findXmlTagEnd(xml, start + 1) + 1;
  }
  return text.join('');
}

function parseXmlTags(xml: string): XmlTag[] {
  const tags: XmlTag[] = [];
  const openTagIndexes: number[] = [];
  let cursor = 0;
  while (cursor < xml.length) {
    const start = xml.indexOf('<', cursor);
    if (start < 0) break;
    if (xml.startsWith('<!--', start)) {
      cursor = findXmlTerminator(xml, '-->', start + 4);
      continue;
    }
    if (xml.startsWith('<![CDATA[', start)) {
      cursor = findXmlTerminator(xml, ']]>', start + 9);
      continue;
    }
    if (xml.startsWith('<?', start)) {
      cursor = findXmlTerminator(xml, '?>', start + 2);
      continue;
    }
    if (xml.startsWith('<!', start)) {
      throw new OoxmlMetadataEngineError('corrupt-document');
    }

    const tagEnd = findXmlTagEnd(xml, start + 1);
    const raw = xml.slice(start + 1, tagEnd).trim();
    const closing = raw.startsWith('/');
    const withoutClosing = closing ? raw.slice(1).trimStart() : raw;
    const selfClosing = !closing && withoutClosing.endsWith('/');
    const content = selfClosing ? withoutClosing.slice(0, -1).trimEnd() : withoutClosing;
    const nameMatch = /^[^\s/>=]+/u.exec(content);
    if (!nameMatch) throw new OoxmlMetadataEngineError('corrupt-document');
    const name = nameMatch[0];
    const attributes = closing
      ? new Map<string, string>()
      : parseXmlAttributes(content.slice(name.length));
    const tag: XmlTag = {
      start,
      end: tagEnd + 1,
      name,
      localName: name.split(':').at(-1) ?? name,
      closing,
      selfClosing,
      attributes,
      parentIndex: closing
        ? (openTagIndexes.at(-2) ?? null)
        : (openTagIndexes.at(-1) ?? null),
      matchingIndex: null,
    };
    const tagIndex = tags.push(tag) - 1;
    if (closing) {
      const openingIndex = openTagIndexes.pop();
      if (openingIndex === undefined || tags[openingIndex].name !== name) {
        throw new OoxmlMetadataEngineError('corrupt-document');
      }
      tags[openingIndex].matchingIndex = tagIndex;
      tag.matchingIndex = openingIndex;
    } else if (!selfClosing) {
      openTagIndexes.push(tagIndex);
      if (openTagIndexes.length > MAX_XML_NESTING_DEPTH) {
        throw new OoxmlMetadataEngineError('corrupt-document');
      }
    }
    if (tags.length > MAX_XML_TAG_COUNT) {
      throw new OoxmlMetadataEngineError('corrupt-document');
    }
    cursor = tagEnd + 1;
  }
  if (openTagIndexes.length > 0) throw new OoxmlMetadataEngineError('corrupt-document');
  return tags;
}

function findXmlTerminator(xml: string, terminator: string, from: number): number {
  const end = xml.indexOf(terminator, from);
  if (end < 0) throw new OoxmlMetadataEngineError('corrupt-document');
  return end + terminator.length;
}

function findXmlTagEnd(xml: string, from: number): number {
  let quote = '';
  for (let index = from; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    } else if (character === '<') {
      break;
    }
  }
  throw new OoxmlMetadataEngineError('corrupt-document');
}

function parseXmlAttributes(raw: string): ReadonlyMap<string, string> {
  const attributes = new Map<string, string>();
  let cursor = 0;
  while (cursor < raw.length) {
    while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
    if (cursor >= raw.length) break;
    const nameMatch = /^[^\s=/>]+/u.exec(raw.slice(cursor));
    if (!nameMatch) throw new OoxmlMetadataEngineError('corrupt-document');
    const name = nameMatch[0];
    cursor += name.length;
    while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
    if (raw[cursor] !== '=') throw new OoxmlMetadataEngineError('corrupt-document');
    cursor += 1;
    while (/\s/u.test(raw[cursor] ?? '')) cursor += 1;
    const quote = raw[cursor];
    if (quote !== '"' && quote !== "'") throw new OoxmlMetadataEngineError('corrupt-document');
    const end = raw.indexOf(quote, cursor + 1);
    if (end < 0 || attributes.has(name)) {
      throw new OoxmlMetadataEngineError('corrupt-document');
    }
    attributes.set(name, decodeXML(raw.slice(cursor + 1, end)));
    cursor = end + 1;
  }
  return attributes;
}

async function validateUnsupportedPackageMarkup(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
): Promise<void> {
  for (const [lowerPath, relationships] of files) {
    if (!lowerPath.endsWith('.rels')) continue;
    validateMetadataEntry(entries.get(lowerPath), relationships.name);
    const tags = parseXmlTags(await readXmlPart(relationships));
    const rootIndex = tags.findIndex(tag => !tag.closing);
    for (const tag of tags) {
      if (
        tag.closing
        || tag.parentIndex !== rootIndex
        || tag.localName !== 'Relationship'
      ) continue;
      const type = (tag.attributes.get('Type') ?? '').trim();
      const target = tag.attributes.get('Target') ?? relationships.name;
      if (DIGITAL_SIGNATURE_RELATIONSHIP_TYPES.has(type)) {
        throw new OoxmlMetadataEngineError('signed-package-unsupported', target);
      }
      if (MACRO_RELATIONSHIP_TYPES.has(type.toLowerCase())) {
        throw new OoxmlMetadataEngineError('macro-package-unsupported', target);
      }
    }
  }

  const contentTypes = files.get('[content_types].xml');
  if (!contentTypes) return;
  validateMetadataEntry(entries.get('[content_types].xml'), contentTypes.name);
  const tags = parseXmlTags(await readXmlPart(contentTypes));
  const rootIndex = tags.findIndex(tag => !tag.closing);
  for (const tag of tags) {
    if (
      tag.closing
      || tag.parentIndex !== rootIndex
      || (tag.localName !== 'Default' && tag.localName !== 'Override')
    ) continue;
    const contentType = (tag.attributes.get('ContentType') ?? '').trim().toLowerCase();
    const partName = tag.attributes.get('PartName')
      ?? tag.attributes.get('Extension')
      ?? contentTypes.name;
    if (DIGITAL_SIGNATURE_CONTENT_TYPES.has(contentType)) {
      throw new OoxmlMetadataEngineError('signed-package-unsupported', partName);
    }
    if (isMacroContentType(contentType)) {
      throw new OoxmlMetadataEngineError('macro-package-unsupported', partName);
    }
  }
}

function isMacroContentType(contentType: string): boolean {
  return contentType === 'application/vnd.ms-office.vbaproject'
    || contentType.includes('.macroenabled.');
}

function validateUnsupportedParts(entries: readonly ZipDirectoryEntry[]): void {
  for (const entry of entries) {
    if (/(?:^|\/)vbaproject\.bin$/iu.test(entry.name)) {
      throw new OoxmlMetadataEngineError('macro-package-unsupported', entry.name);
    }
    if (/^_xmlsignatures\//iu.test(entry.name)) {
      throw new OoxmlMetadataEngineError('signed-package-unsupported', entry.name);
    }
  }
}

function validateMetadataEntry(entry: ZipDirectoryEntry | undefined, name: string): void {
  if (!entry || entry.uncompressedSize > OOXML_METADATA_MAX_XML_BYTES) {
    throw new OoxmlMetadataEngineError('metadata-part-too-large', name);
  }
}

function validateThumbnailEntry(entry: ZipDirectoryEntry | undefined, name: string): void {
  if (!entry || entry.uncompressedSize > OOXML_METADATA_MAX_THUMBNAIL_BYTES) {
    throw new OoxmlMetadataEngineError('metadata-part-too-large', name);
  }
}

function createReport(
  kind: OoxmlDocumentKind,
  archiveEntryCount: number,
  uncompressedBytes: number,
  findings: FindingAccumulator,
  removedScopes: ReadonlySet<OoxmlMetadataScope>,
): OoxmlMetadataReport {
  const removedCount = [...removedScopes]
    .reduce((total, scope) => total + findings.counts[scope], 0);
  return {
    kind,
    detected: findings.visible,
    removed: findings.visible.filter(finding => removedScopes.has(finding.scope)),
    remaining: findings.visible.filter(finding => !removedScopes.has(finding.scope)),
    detectedCount: findings.total,
    removedCount,
    remainingCount: findings.total - removedCount,
    truncatedFindingCount: Math.max(0, findings.total - findings.visible.length),
    archiveEntryCount,
    uncompressedBytes,
  };
}
