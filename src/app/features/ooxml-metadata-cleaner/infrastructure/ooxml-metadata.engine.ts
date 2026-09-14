import { decodeXML } from 'entities';
import JSZip, { type JSZipObject } from 'jszip';

import {
  OOXML_METADATA_MAX_OUTPUT_BYTES,
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

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data, { checkCRC32: true, createFolders: false });
  } catch (error: unknown) {
    if (error instanceof OoxmlArchiveError) throw error;
    throw new OoxmlMetadataEngineError('corrupt-document');
  }
  onProgress?.(24);

  const entriesByLowerName = new Map(
    inspection.entries.map(entry => [entry.name.toLowerCase(), entry] as const),
  );
  const filesByLowerName = new Map(
    Object.values(zip.files).map(file => [file.name.toLowerCase(), file] as const),
  );
  const detected: OoxmlMetadataFinding[] = [];

  await collectPartFindings(filesByLowerName, entriesByLowerName, 'docprops/core.xml', 'core', CORE_FIELDS, detected);
  await collectPartFindings(
    filesByLowerName,
    entriesByLowerName,
    'docprops/app.xml',
    'application',
    APPLICATION_FIELDS,
    detected,
  );
  await collectCustomFindings(filesByLowerName, entriesByLowerName, detected);
  collectThumbnailFindings(inspection.entries, detected);
  onProgress?.(32);

  const removedScopes = new Set<OoxmlMetadataScope>();
  if (options.removeCoreProperties) {
    replacePart(zip, filesByLowerName, 'docprops/core.xml', EMPTY_CORE_PROPERTIES);
    removedScopes.add('core');
  }
  if (options.removeApplicationProperties) {
    replacePart(zip, filesByLowerName, 'docprops/app.xml', EMPTY_APPLICATION_PROPERTIES);
    removedScopes.add('application');
  }
  if (options.removeCustomProperties) {
    replacePart(zip, filesByLowerName, 'docprops/custom.xml', EMPTY_CUSTOM_PROPERTIES);
    removedScopes.add('custom');
  }
  if (options.removeThumbnail) {
    await removeThumbnails(zip, filesByLowerName);
    removedScopes.add('thumbnail');
  }

  const removed = detected.filter(finding => removedScopes.has(finding.scope));
  const remaining = detected.filter(finding => !removedScopes.has(finding.scope));
  const report = createReport(kind, inspection.entries.length, inspection.uncompressedBytes, detected, removed, remaining);
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

async function collectPartFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  lowerPath: string,
  scope: OoxmlMetadataScope,
  fields: readonly string[],
  output: OoxmlMetadataFinding[],
): Promise<void> {
  const file = files.get(lowerPath);
  if (!file) return;
  validateMetadataEntry(entries.get(lowerPath), file.name);
  const xml = await file.async('string');
  for (const field of fields) {
    for (const value of extractElementValues(xml, field)) {
      if (value) output.push({ scope, name: field, value, path: file.name });
    }
  }
}

async function collectCustomFindings(
  files: ReadonlyMap<string, JSZipObject>,
  entries: ReadonlyMap<string, ZipDirectoryEntry>,
  output: OoxmlMetadataFinding[],
): Promise<void> {
  const file = files.get('docprops/custom.xml');
  if (!file) return;
  validateMetadataEntry(entries.get('docprops/custom.xml'), file.name);
  const xml = await file.async('string');
  const propertyPattern = /<(?:[\w.-]+:)?property\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?property\s*>/giu;
  for (const match of xml.matchAll(propertyPattern)) {
    const name = extractAttribute(match[1], 'name') || 'Propriété personnalisée';
    const value = normalizeXmlValue(match[2]);
    output.push({ scope: 'custom', name, value, path: file.name });
  }
}

function collectThumbnailFindings(
  entries: readonly ZipDirectoryEntry[],
  output: OoxmlMetadataFinding[],
): void {
  for (const entry of entries) {
    if (!/^docprops\/thumbnail\.[^/]+$/iu.test(entry.name)) continue;
    output.push({
      scope: 'thumbnail',
      name: 'Aperçu intégré',
      value: `${String(entry.uncompressedSize)} octets`,
      path: entry.name,
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

function replacePart(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
  lowerPath: string,
  xml: string,
): void {
  const file = files.get(lowerPath);
  if (file) zip.file(file.name, xml);
}

async function removeThumbnails(
  zip: JSZip,
  files: ReadonlyMap<string, JSZipObject>,
): Promise<void> {
  for (const file of Object.values(zip.files)) {
    if (/^docprops\/thumbnail\.[^/]+$/iu.test(file.name)) zip.remove(file.name);
  }
  const relationships = files.get('_rels/.rels');
  if (relationships) {
    const xml = await relationships.async('string');
    zip.file(relationships.name, stripThumbnailRelationships(xml));
  }
  const contentTypes = files.get('[content_types].xml');
  if (contentTypes) {
    const xml = await contentTypes.async('string');
    zip.file(contentTypes.name, stripThumbnailOverrides(xml));
  }
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

function stripThumbnailOverrides(xml: string): string {
  return xml.replace(/<(?:[\w.-]+:)?Override\b[^>]*(?:\/>|>[\s\S]*?<\/(?:[\w.-]+:)?Override\s*>)/giu, element => {
    const partName = extractAttribute(element, 'PartName');
    return /^\/docprops\/thumbnail\.[^/]+$/iu.test(partName) ? '' : element;
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
  const visibleKeys = new Set(visibleDetected.map(findingKey));
  return {
    kind,
    detected: visibleDetected,
    removed: removed.filter(finding => visibleKeys.has(findingKey(finding))),
    remaining: remaining.filter(finding => visibleKeys.has(findingKey(finding))),
    detectedCount: detected.length,
    removedCount: removed.length,
    remainingCount: remaining.length,
    truncatedFindingCount: Math.max(0, detected.length - visibleDetected.length),
    archiveEntryCount,
    uncompressedBytes,
  };
}

function findingKey(finding: OoxmlMetadataFinding): string {
  return `${finding.scope}\u0000${finding.path}\u0000${finding.name}\u0000${finding.value}`;
}
