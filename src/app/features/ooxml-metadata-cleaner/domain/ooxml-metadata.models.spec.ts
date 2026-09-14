import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import {
  buildCleanedOoxmlFileName,
  detectOoxmlKind,
  hasRequiredOoxmlParts,
  inspectZipDirectory,
} from './ooxml-metadata.models';

async function createDocx(extra?: (zip: JSZip) => void): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types/>');
  zip.file('_rels/.rels', '<Relationships/>');
  zip.file('word/document.xml', '<document/>');
  extra?.(zip);
  return zip.generateAsync({ type: 'uint8array' });
}

describe('OOXML metadata domain', () => {
  it('detects only the three intentionally supported formats', () => {
    expect(detectOoxmlKind('Rapport.DOCX')).toBe('docx');
    expect(detectOoxmlKind('budget.xlsx')).toBe('xlsx');
    expect(detectOoxmlKind('deck.pptx')).toBe('pptx');
    expect(detectOoxmlKind('macro.docm')).toBeNull();
    expect(detectOoxmlKind('archive.zip')).toBeNull();
  });

  it('creates a safe and bounded output file name', () => {
    expect(buildCleanedOoxmlFileName(' Dossier: client?.docx ', 'docx'))
      .toBe('Dossier- client--sans-metadonnees.docx');
    expect(buildCleanedOoxmlFileName('.xlsx', 'xlsx')).toBe('document-sans-metadonnees.xlsx');
  });

  it('inspects a valid central directory and validates required parts', async () => {
    const inspection = inspectZipDirectory(await createDocx());
    expect(inspection.entries.map(entry => entry.name)).toEqual([
      '[Content_Types].xml',
      '_rels/',
      '_rels/.rels',
      'word/',
      'word/document.xml',
    ]);
    expect(inspection.uncompressedBytes).toBeGreaterThan(0);
    expect(hasRequiredOoxmlParts(inspection, 'docx')).toBe(true);
    expect(hasRequiredOoxmlParts(inspection, 'xlsx')).toBe(false);
  });

  it('rejects bytes without a valid ZIP directory', () => {
    expect(() => inspectZipDirectory(new Uint8Array([0x50, 0x4b, 0x03, 0x04])))
      .toThrow(expect.objectContaining({ code: 'invalid-zip' }));
  });

  it('rejects duplicate names case-insensitively to avoid ambiguous parts', async () => {
    const bytes = await createDocx(zip => {
      zip.file('DOCPROPS/core.xml', '<core/>');
      zip.file('docprops/core.xml', '<other/>');
    });
    expect(() => inspectZipDirectory(bytes))
      .toThrow(expect.objectContaining({ code: 'duplicate-entry' }));
  });

  it('rejects traversal paths before any entry is decompressed', async () => {
    const bytes = await createDocx(zip => zip.file('../secret.xml', '<secret/>'));
    expect(() => inspectZipDirectory(bytes))
      .toThrow(expect.objectContaining({ code: 'unsafe-entry-path' }));
  });
});
