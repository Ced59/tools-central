export const OOXML_METADATA_MAX_FILE_BYTES = 50 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_OUTPUT_BYTES = 75 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_ENTRIES = 5_000;
export const OOXML_METADATA_MAX_UNCOMPRESSED_BYTES = 200 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_ENTRY_BYTES = 100 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_XML_BYTES = 2 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_THUMBNAIL_BYTES = 25 * 1_024 * 1_024;
export const OOXML_METADATA_MAX_COMPRESSION_RATIO = 100;

export type OoxmlDocumentKind = 'docx' | 'xlsx' | 'pptx';
export type OoxmlMetadataScope = 'core' | 'application' | 'custom' | 'thumbnail';

export interface OoxmlMetadataOptions {
  removeCoreProperties: boolean;
  removeApplicationProperties: boolean;
  removeCustomProperties: boolean;
  removeThumbnail: boolean;
}

export interface OoxmlMetadataFinding {
  scope: OoxmlMetadataScope;
  name: string;
  value: string;
  path: string;
}

export interface OoxmlMetadataReport {
  kind: OoxmlDocumentKind;
  detected: readonly OoxmlMetadataFinding[];
  removed: readonly OoxmlMetadataFinding[];
  remaining: readonly OoxmlMetadataFinding[];
  detectedCount: number;
  removedCount: number;
  remainingCount: number;
  truncatedFindingCount: number;
  archiveEntryCount: number;
  uncompressedBytes: number;
}

export interface OoxmlCleanedDocument {
  bytes: Uint8Array;
  fileName: string;
  report: OoxmlMetadataReport;
}

export interface ZipDirectoryEntry {
  name: string;
  crc32: number;
  dataOffset: number;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  encrypted: boolean;
  directory: boolean;
}

export interface ZipDirectoryInspection {
  entries: readonly ZipDirectoryEntry[];
  compressedBytes: number;
  uncompressedBytes: number;
}

export type OoxmlArchiveFailureCode =
  | 'invalid-zip'
  | 'zip64-unsupported'
  | 'multi-disk-unsupported'
  | 'encrypted-entry'
  | 'unsupported-compression'
  | 'unsafe-entry-path'
  | 'duplicate-entry'
  | 'too-many-entries'
  | 'entry-too-large'
  | 'archive-too-large'
  | 'compression-ratio-exceeded';

export class OoxmlArchiveError extends Error {
  constructor(readonly code: OoxmlArchiveFailureCode, readonly entryName?: string) {
    super(code);
  }
}

const REQUIRED_PARTS: Readonly<Record<OoxmlDocumentKind, readonly string[]>> = {
  docx: ['[content_types].xml', '_rels/.rels', 'word/document.xml'],
  xlsx: ['[content_types].xml', '_rels/.rels', 'xl/workbook.xml'],
  pptx: ['[content_types].xml', '_rels/.rels', 'ppt/presentation.xml'],
};

export function detectOoxmlKind(fileName: string): OoxmlDocumentKind | null {
  const extension = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/u)?.[1];
  if (extension === 'docx' || extension === 'xlsx' || extension === 'pptx') return extension;
  return null;
}

export function buildCleanedOoxmlFileName(fileName: string, kind: OoxmlDocumentKind): string {
  const base = fileName.trim().replace(/\.[^.]+$/u, '').trim() || 'document';
  const safeBase = base.replace(/[\\/:*?"<>|\u0000-\u001f]/gu, '-').replace(/\s+/gu, ' ').slice(0, 120);
  return `${safeBase || 'document'}-sans-metadonnees.${kind}`;
}

export function hasRequiredOoxmlParts(
  inspection: ZipDirectoryInspection,
  kind: OoxmlDocumentKind,
): boolean {
  const names = new Set(inspection.entries.map(entry => entry.name.toLowerCase()));
  return REQUIRED_PARTS[kind].every(part => names.has(part));
}

export function inspectZipDirectory(data: Uint8Array): ZipDirectoryInspection {
  const endOffset = findEndOfCentralDirectory(data);
  const diskNumber = readUint16(data, endOffset + 4);
  const centralDirectoryDisk = readUint16(data, endOffset + 6);
  const entriesOnDisk = readUint16(data, endOffset + 8);
  const entryCount = readUint16(data, endOffset + 10);
  const centralDirectorySize = readUint32(data, endOffset + 12);
  const centralDirectoryOffset = readUint32(data, endOffset + 16);

  if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new OoxmlArchiveError('multi-disk-unsupported');
  }
  if (
    entryCount === 0xffff
    || centralDirectorySize === 0xffffffff
    || centralDirectoryOffset === 0xffffffff
  ) {
    throw new OoxmlArchiveError('zip64-unsupported');
  }
  if (entryCount > OOXML_METADATA_MAX_ENTRIES) {
    throw new OoxmlArchiveError('too-many-entries');
  }
  if (centralDirectoryOffset + centralDirectorySize > endOffset) {
    throw new OoxmlArchiveError('invalid-zip');
  }

  const entries: ZipDirectoryEntry[] = [];
  const names = new Set<string>();
  let cursor = centralDirectoryOffset;
  let compressedBytes = 0;
  let uncompressedBytes = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > endOffset || readUint32(data, cursor) !== 0x02014b50) {
      throw new OoxmlArchiveError('invalid-zip');
    }
    const flags = readUint16(data, cursor + 8);
    const compressionMethod = readUint16(data, cursor + 10);
    const crc32 = readUint32(data, cursor + 16);
    const compressedSize = readUint32(data, cursor + 20);
    const uncompressedSize = readUint32(data, cursor + 24);
    const fileNameLength = readUint16(data, cursor + 28);
    const extraLength = readUint16(data, cursor + 30);
    const commentLength = readUint16(data, cursor + 32);
    const localHeaderOffset = readUint32(data, cursor + 42);
    const recordLength = 46 + fileNameLength + extraLength + commentLength;
    if (cursor + recordLength > endOffset || fileNameLength === 0) {
      throw new OoxmlArchiveError('invalid-zip');
    }
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new OoxmlArchiveError('zip64-unsupported');
    }

    const name = decodeFileName(data.subarray(cursor + 46, cursor + 46 + fileNameLength));
    validateEntryPath(name);
    const encrypted = (flags & 0x0001) !== 0;
    if (encrypted) throw new OoxmlArchiveError('encrypted-entry', name);
    if (compressionMethod !== 0 && compressionMethod !== 8) {
      throw new OoxmlArchiveError('unsupported-compression', name);
    }
    const dataOffset = readLocalDataOffset(
      data,
      localHeaderOffset,
      centralDirectoryOffset,
      name,
      flags,
      compressionMethod,
      compressedSize,
    );
    const normalizedName = name.toLowerCase();
    if (names.has(normalizedName)) throw new OoxmlArchiveError('duplicate-entry', name);
    names.add(normalizedName);

    if (uncompressedSize > OOXML_METADATA_MAX_ENTRY_BYTES) {
      throw new OoxmlArchiveError('entry-too-large', name);
    }
    if (
      uncompressedSize > 1_024 * 1_024
      && compressedSize > 0
      && uncompressedSize / compressedSize > OOXML_METADATA_MAX_COMPRESSION_RATIO
    ) {
      throw new OoxmlArchiveError('compression-ratio-exceeded', name);
    }

    compressedBytes += compressedSize;
    uncompressedBytes += uncompressedSize;
    if (uncompressedBytes > OOXML_METADATA_MAX_UNCOMPRESSED_BYTES) {
      throw new OoxmlArchiveError('archive-too-large');
    }
    entries.push({
      name,
      crc32,
      dataOffset,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      encrypted,
      directory: name.endsWith('/'),
    });
    cursor += recordLength;
  }

  if (cursor !== centralDirectoryOffset + centralDirectorySize) {
    throw new OoxmlArchiveError('invalid-zip');
  }
  return { entries, compressedBytes, uncompressedBytes };
}

function readLocalDataOffset(
  data: Uint8Array,
  localHeaderOffset: number,
  centralDirectoryOffset: number,
  centralName: string,
  centralFlags: number,
  centralCompressionMethod: number,
  compressedSize: number,
): number {
  if (
    localHeaderOffset + 30 > centralDirectoryOffset
    || readUint32(data, localHeaderOffset) !== 0x04034b50
  ) {
    throw new OoxmlArchiveError('invalid-zip', centralName);
  }
  const localFlags = readUint16(data, localHeaderOffset + 6);
  const localCompressionMethod = readUint16(data, localHeaderOffset + 8);
  const localNameLength = readUint16(data, localHeaderOffset + 26);
  const localExtraLength = readUint16(data, localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
  if (dataOffset + compressedSize > centralDirectoryOffset) {
    throw new OoxmlArchiveError('invalid-zip', centralName);
  }
  const localName = decodeFileName(
    data.subarray(localHeaderOffset + 30, localHeaderOffset + 30 + localNameLength),
  );
  if (
    localName !== centralName
    || localFlags !== centralFlags
    || localCompressionMethod !== centralCompressionMethod
  ) {
    throw new OoxmlArchiveError('invalid-zip', centralName);
  }
  return dataOffset;
}

function findEndOfCentralDirectory(data: Uint8Array): number {
  if (data.byteLength < 22) throw new OoxmlArchiveError('invalid-zip');
  const earliest = Math.max(0, data.byteLength - 65_557);
  for (let offset = data.byteLength - 22; offset >= earliest; offset -= 1) {
    if (readUint32(data, offset) !== 0x06054b50) continue;
    const commentLength = readUint16(data, offset + 20);
    if (offset + 22 + commentLength === data.byteLength) return offset;
  }
  throw new OoxmlArchiveError('invalid-zip');
}

function validateEntryPath(name: string): void {
  const parts = name.split('/');
  const pathParts = name.endsWith('/') ? parts.slice(0, -1) : parts;
  if (
    name.includes('\\')
    || name.startsWith('/')
    || name.includes('\u0000')
    || pathParts.some(part => part === '' || part === '.' || part === '..')
  ) {
    throw new OoxmlArchiveError('unsafe-entry-path', name);
  }
}

function decodeFileName(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new OoxmlArchiveError('invalid-zip');
  }
}

function readUint16(data: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > data.byteLength) throw new OoxmlArchiveError('invalid-zip');
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32(data: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > data.byteLength) throw new OoxmlArchiveError('invalid-zip');
  return (
    data[offset]
    + data[offset + 1] * 0x100
    + data[offset + 2] * 0x10000
    + data[offset + 3] * 0x1000000
  );
}
