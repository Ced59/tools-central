import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import {
  OoxmlMetadataEngineError,
  sanitizeOoxmlBuffer,
} from './ooxml-metadata.engine';
import type {
  OoxmlDocumentKind,
  OoxmlMetadataOptions,
} from '../domain/ooxml-metadata.models';

const allOptions: OoxmlMetadataOptions = {
  removeCoreProperties: true,
  removeApplicationProperties: true,
  removeCustomProperties: true,
  removeThumbnail: true,
};

async function createPackage(kind: OoxmlDocumentKind): Promise<Uint8Array> {
  const mainParts: Record<OoxmlDocumentKind, string> = {
    docx: 'word/document.xml',
    xlsx: 'xl/workbook.xml',
    pptx: 'ppt/presentation.xml',
  };
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/docProps/thumbnail.jpeg" ContentType="image/jpeg"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/></Relationships>`);
  zip.file(mainParts[kind], '<document><content>Préservé</content></document>');
  zip.file('docProps/core.xml', `<?xml version="1.0"?><cp:coreProperties xmlns:cp="core" xmlns:dc="dc"><dc:title>Projet &amp; budget</dc:title><dc:creator>Alice</dc:creator><cp:lastModifiedBy>Bob</cp:lastModifiedBy></cp:coreProperties>`);
  zip.file('docProps/app.xml', `<?xml version="1.0"?><Properties><Application>Word</Application><AppVersion>16.0</AppVersion><Company>Exemple SA</Company></Properties>`);
  zip.file('docProps/custom.xml', `<?xml version="1.0"?><Properties><property name="Client"><vt:lpwstr xmlns:vt="vt">Société secrète</vt:lpwstr></property></Properties>`);
  zip.file('docProps/thumbnail.jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  return zip.generateAsync({ type: 'uint8array' });
}

describe('sanitizeOoxmlBuffer', () => {
  it.each(['docx', 'xlsx', 'pptx'] as const)('cleans %s package properties and preserves content', async kind => {
    const progress: number[] = [];
    const result = await sanitizeOoxmlBuffer(await createPackage(kind), kind, allOptions, value => progress.push(value));
    const output = await JSZip.loadAsync(result.output);
    const mainParts: Record<OoxmlDocumentKind, string> = {
      docx: 'word/document.xml',
      xlsx: 'xl/workbook.xml',
      pptx: 'ppt/presentation.xml',
    };

    await expect(output.file(mainParts[kind])?.async('string')).resolves.toContain('Préservé');
    await expect(output.file('docProps/core.xml')?.async('string')).resolves.not.toContain('Alice');
    await expect(output.file('docProps/app.xml')?.async('string')).resolves.not.toContain('Exemple SA');
    await expect(output.file('docProps/custom.xml')?.async('string')).resolves.not.toContain('Société secrète');
    expect(output.file('docProps/thumbnail.jpeg')).toBeNull();
    await expect(output.file('_rels/.rels')?.async('string')).resolves.not.toContain('thumbnail');
    await expect(output.file('[Content_Types].xml')?.async('string')).resolves.not.toContain('/docProps/thumbnail.jpeg');
    expect(result.report.kind).toBe(kind);
    expect(result.report.detectedCount).toBe(8);
    expect(result.report.removedCount).toBe(8);
    expect(result.report.remainingCount).toBe(0);
    expect(result.report.removed.map(item => item.value)).toContain('Projet & budget');
    expect(progress.at(-1)).toBe(100);
  });

  it('keeps unselected metadata and reports it as remaining', async () => {
    const result = await sanitizeOoxmlBuffer(await createPackage('docx'), 'docx', {
      removeCoreProperties: true,
      removeApplicationProperties: false,
      removeCustomProperties: false,
      removeThumbnail: false,
    });
    const output = await JSZip.loadAsync(result.output);
    await expect(output.file('docProps/core.xml')?.async('string')).resolves.not.toContain('Alice');
    await expect(output.file('docProps/app.xml')?.async('string')).resolves.toContain('Exemple SA');
    expect(output.file('docProps/thumbnail.jpeg')).not.toBeNull();
    expect(result.report.removedCount).toBe(3);
    expect(result.report.remainingCount).toBe(5);
  });

  it('caps each reported array even when custom properties are duplicated', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    const properties = Array.from(
      { length: 600 },
      () => '<property name="Client"><vt:lpwstr xmlns:vt="vt">Identique</vt:lpwstr></property>',
    ).join('');
    source.file('docProps/custom.xml', `<?xml version="1.0"?><Properties>${properties}</Properties>`);
    const bytes = await source.generateAsync({ type: 'uint8array' });

    const result = await sanitizeOoxmlBuffer(bytes, 'docx', allOptions);

    expect(result.report.detectedCount).toBe(607);
    expect(result.report.removedCount).toBe(607);
    expect(result.report.detected).toHaveLength(500);
    expect(result.report.removed).toHaveLength(500);
    expect(result.report.remaining).toHaveLength(0);
    expect(result.report.truncatedFindingCount).toBe(107);
  });

  it('rejects a ZIP whose contents do not match the chosen extension', async () => {
    await expect(sanitizeOoxmlBuffer(await createPackage('docx'), 'xlsx', allOptions))
      .rejects.toEqual(expect.objectContaining<OoxmlMetadataEngineError>({
        code: 'invalid-ooxml',
        name: 'Error',
        message: 'invalid-ooxml',
      }));
  });

  it('rejects renamed macro-enabled and digitally signed packages', async () => {
    for (const unsafePart of ['word/vbaProject.bin', '_xmlsignatures/sig1.xml']) {
      const source = await JSZip.loadAsync(await createPackage('docx'));
      source.file(unsafePart, 'unsafe');
      const bytes = await source.generateAsync({ type: 'uint8array' });
      await expect(sanitizeOoxmlBuffer(bytes, 'docx', allOptions)).rejects.toEqual(expect.objectContaining({
        code: unsafePart.includes('vbaProject')
          ? 'macro-package-unsupported'
          : 'signed-package-unsupported',
      }));
    }
  });
});
