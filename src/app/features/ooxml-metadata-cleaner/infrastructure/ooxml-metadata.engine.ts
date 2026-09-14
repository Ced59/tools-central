import { decodeXML } from 'entities';
import JSZip, { type JSZipObject } from 'jszip';

import {
  OOXML_METADATA_MAX_COMPRESSION_RATIO,
  OOXML_METADATA_MAX_ENTRY_BYTES,
  OOXML_METADATA_MAX_OUTPUT_BYTES,
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

const EMPTY_CORE_PROPERTIES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
  + 'xmlns:dc="http://purl.org/dc/elements/1.1/" '
  + 'xmlns:dcterms="http://purl.org/dc/terms/" '
  + 'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
  + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>';

const EMPTY_APPLICATION_PROPERTIES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
  + 'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"></Properties>';

const EMPTY_CUSTOM_PROPERTIES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" '
  + 'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"></Properties>';

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
  validateMetadataPartSizes(inspection.entries);
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
  const metadataParts = await resolveMetadataParts(filesByLowerName, entriesByLowerName);
  const detected: OoxmlMetadataFinding[] = [];

  await collectPartFindings(filesByLowerName, entriesByLowerName, metadataParts.core, 'core', CORE_FIELDS, detected);
  await collectPartFindings(
    filesByLowerName,
    entriesByLowerName,
    metadataParts.application,
    'application',
    APPLICATION_FIELDS,
    detected,
  );
  await collectCustomFindings(filesByLowerName, entriesByLowerName, metadataParts.custom, detected);
  collectThumbnailFindings(filesByLowerName, entriesByLowerName, metadataParts.thumbnail, detected);
  onProgress?.(32);

  const removedScopes = new Set<OoxmlMetadataScope>();
  if (options.removeCoreProperties) {
    replaceParts(zip, filesByLowerName, metadataParts.core, EMPTY_CORE_PROPERTIES);
    removedScopes.add('core');
  }
  if (options.removeApplicationProperties) {
    replaceParts(zip, filesByLowerName, metadataParts.application, EMPTY_APPLICATION_PROPERTIES);
    removedScopes.add('application');
  }
  if (options.removeCustomProperties) {
    replaceParts(zip, filesByLowerName, metadataParts.custom, EMPTY_CUSTOM_PROPERTIES);
    removedScopes.add('custom');
  }
  if (options.removeThumbnail) {
    await removeThumbnails(zip, filesByLowerName, entriesByLowerName, metadataParts.thumbnail);
    removedScopes.add('thumbnail');
  }

  const removed = detected.filter(finding => removedScopes.has(finding.scope));
  const remaining = detected.filter(finding => !removedScopes.has(finding.scope));
  const report = createReport(kind, inspection.entries.length, actualUncompressedBytes, detected, removed, remaining);
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
  output: OoxmlMetadataFinding[],
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (!file) continue;
    validateMetadataEntry(entries.get(lowerPath), file.name);
    const xml = await readXmlPart(file);
    for (const field of fields) {
      for (const value of extractElementValues(xml, field)) {
        if (value) output.push({ scope, name: field, value, path: file.name });
      }
    }
  }
}

async function collectCustomFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  output: OoxmlMetadataFinding[],
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (!file) continue;
    validateMetadataEntry(entries.get(lowerPath), file.name);
    const xml = await readXmlPart(file);
    const propertyPattern = /<(?:[\w.-]+:)?property\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?property\s*>/giu;
    for (const match of xml.matchAll(propertyPattern)) {
      const name = extractAttribute(match[1], 'name') || 'Propriété personnalisée';
      const value = normalizeXmlValue(match[2]);
      output.push({ scope: 'custom', name, value, path: file.name });
    }
  }
}

function collectThumbnailFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
  output: OoxmlMetadataFinding[],
): void {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    const entry = entries.get(lowerPath);
    if (!file || !entry) continue;
    validateMetadataEntry(entry, file.name);
    output.push({
      scope: 'thumbnail',
      name: 'Aperçu intégré',
      value: `${String(entry.uncompressedSize)} octets`,
      path: file.name,
    });
  }
}

function extractElementValues(xml: string, localName: string): string[] {
  const pattern = new RegExp(
    `<(?:[\\w.-]+:)?${localName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${localName}\\s*>`,
    'giu',
  );
  return [...xml.matchAll(pattern)].map(match => normalizeXmlValue(match[1]));
}

function normalizeXmlValue(value: string): string {
  const text = decodeXML(value.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim());
  if (text.length <= MAX_REPORTED_VALUE_LENGTH) return text;
  return `${text.slice(0, MAX_REPORTED_VALUE_LENGTH - 1)}…`;
}

function extractAttribute(attributes: string, name: string): string {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'iu');
  const match = pattern.exec(attributes);
  return match ? normalizeXmlValue(match[2]) : '';
}

function replaceParts(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
  lowerPaths: readonly string[],
  xml: string,
): void {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (file) zip.file(file.name, xml);
  }
}

async function removeThumbnails(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPaths: readonly string[],
): Promise<void> {
  for (const lowerPath of lowerPaths) {
    const file = files.get(lowerPath);
    if (file) zip.remove(file.name);
  }
  const relationships = files.get('_rels/.rels');
  if (relationships) {
    validateMetadataEntry(entries.get('_rels/.rels'), relationships.name);
    await rewriteXmlPart(zip, relationships, stripThumbnailRelationships);
  }
  const contentTypes = files.get('[content_types].xml');
  if (contentTypes) {
    validateMetadataEntry(entries.get('[content_types].xml'), contentTypes.name);
    const thumbnailPaths = new Set(lowerPaths);
    await rewriteXmlPart(zip, contentTypes, xml => stripThumbnailOverrides(xml, thumbnailPaths));
  }
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

async function resolveMetadataParts(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
): Promise<OoxmlMetadataParts> {
  const paths: Record<OoxmlMetadataScope, Set<string>> = {
    core: new Set(files.has('docprops/core.xml') ? ['docprops/core.xml'] : []),
    application: new Set(files.has('docprops/app.xml') ? ['docprops/app.xml'] : []),
    custom: new Set(files.has('docprops/custom.xml') ? ['docprops/custom.xml'] : []),
    thumbnail: new Set(
      [...files.keys()].filter(path => /^docprops\/thumbnail\.[^/]+$/iu.test(path)),
    ),
  };
  const relationships = files.get('_rels/.rels');
  if (!relationships) return toMetadataParts(paths);
  validateMetadataEntry(entries.get('_rels/.rels'), relationships.name);

  const xml = await readXmlPart(relationships);
  const relationshipPattern = /<(?:[\w.-]+:)?Relationship\b[^>]*(?:\/>|>[\s\S]*?<\/(?:[\w.-]+:)?Relationship\s*>)/giu;
  for (const element of xml.matchAll(relationshipPattern)) {
    if (extractAttribute(element[0], 'TargetMode').toLowerCase() === 'external') continue;
    const scope = metadataScopeFromRelationshipType(extractAttribute(element[0], 'Type'));
    const path = resolvePackageTarget(extractAttribute(element[0], 'Target'));
    if (!scope || !path || !files.has(path)) continue;
    paths[scope].add(path);
  }
  return toMetadataParts(paths);
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
  const normalized = type.trim().replace(/\/+$/u, '').toLowerCase();
  if (normalized.endsWith('/metadata/core-properties')) return 'core';
  if (normalized.endsWith('/extended-properties')) return 'application';
  if (normalized.endsWith('/custom-properties')) return 'custom';
  if (normalized.endsWith('/metadata/thumbnail')) return 'thumbnail';
  return null;
}

function resolvePackageTarget(target: string): string | null {
  const path = target.trim().split(/[?#]/u, 1)[0];
  if (!path || path.includes('\\')) return null;
  const resolved: string[] = [];
  for (const encodedPart of path.replace(/^\/+|\/+$/gu, '').split('/')) {
    let part: string;
    try {
      part = decodeURIComponent(encodedPart);
    } catch {
      return null;
    }
    if (!part || part === '.') continue;
    if (part === '..') {
      if (resolved.length === 0) return null;
      resolved.pop();
      continue;
    }
    if (part.includes('/') || part.includes('\\') || part.includes('\u0000')) return null;
    resolved.push(part);
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
  return xml.replace(/<(?:[\w.-]+:)?Relationship\b[^>]*(?:\/>|>[\s\S]*?<\/(?:[\w.-]+:)?Relationship\s*>)/giu, element => {
    const type = extractAttribute(element, 'Type');
    const target = extractAttribute(element, 'Target');
    return /\/metadata\/thumbnail$/iu.test(type) || /(?:^|\/)docprops\/thumbnail\.[^/]+$/iu.test(target)
      ? ''
      : element;
  });
}

function stripThumbnailOverrides(xml: string, thumbnailPaths: ReadonlySet<string>): string {
  return xml.replace(/<(?:[\w.-]+:)?Override\b[^>]*(?:\/>|>[\s\S]*?<\/(?:[\w.-]+:)?Override\s*>)/giu, element => {
    const partName = extractAttribute(element, 'PartName');
    const resolved = resolvePackageTarget(partName);
    return resolved && thumbnailPaths.has(resolved) ? '' : element;
  });
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

function validateMetadataPartSizes(entries: readonly ZipDirectoryEntry[]): void {
  for (const entry of entries) {
    if (
      (/^docprops\/(?:core|app|custom)\.xml$/iu.test(entry.name)
        || /^docprops\/thumbnail\.[^/]+$/iu.test(entry.name))
      && entry.uncompressedSize > OOXML_METADATA_MAX_XML_BYTES
    ) {
      throw new OoxmlMetadataEngineError('metadata-part-too-large', entry.name);
    }
  }
}

function validateMetadataEntry(entry: ZipDirectoryEntry | undefined, name: string): void {
  if (!entry || entry.uncompressedSize > OOXML_METADATA_MAX_XML_BYTES) {
    throw new OoxmlMetadataEngineError('metadata-part-too-large', name);
  }
}

function createReport(
  kind: OoxmlDocumentKind,
  archiveEntryCount: number,
  uncompressedBytes: number,
  detected: readonly OoxmlMetadataFinding[],
  removed: readonly OoxmlMetadataFinding[],
  remaining: readonly OoxmlMetadataFinding[],
): OoxmlMetadataReport {
  const visibleDetected = detected.slice(0, MAX_REPORTED_FINDINGS);
  const removedFindings = new Set(removed);
  return {
    kind,
    detected: visibleDetected,
    removed: visibleDetected.filter(finding => removedFindings.has(finding)),
    remaining: visibleDetected.filter(finding => !removedFindings.has(finding)),
    detectedCount: detected.length,
    removedCount: removed.length,
    remainingCount: remaining.length,
    truncatedFindingCount: Math.max(0, detected.length - visibleDetected.length),
    archiveEntryCount,
    uncompressedBytes,
  };
}
