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

function encodeUtf16Le(value: string): Uint8Array {
  const output = new Uint8Array(value.length * 2 + 2);
  output.set([0xff, 0xfe]);
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    output[index * 2 + 2] = codeUnit & 0xff;
    output[index * 2 + 3] = codeUnit >>> 8;
  }
  return output;
}

function forgeCentralUncompressedSize(
  source: Uint8Array,
  targetName: string,
  size: number,
): Uint8Array {
  const output = source.slice();
  for (let offset = 0; offset + 46 <= output.byteLength; offset += 1) {
    if (
      output[offset] !== 0x50
      || output[offset + 1] !== 0x4b
      || output[offset + 2] !== 0x01
      || output[offset + 3] !== 0x02
    ) continue;
    const fileNameLength = output[offset + 28] | (output[offset + 29] << 8);
    const name = new TextDecoder().decode(output.subarray(offset + 46, offset + 46 + fileNameLength));
    if (name !== targetName) continue;
    output[offset + 24] = size & 0xff;
    output[offset + 25] = (size >>> 8) & 0xff;
    output[offset + 26] = (size >>> 16) & 0xff;
    output[offset + 27] = (size >>> 24) & 0xff;
    return output;
  }
  throw new Error(`Central directory entry not found: ${targetName}`);
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

  it('retains only 500 findings across many relationship-addressed custom parts', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    const properties = Array.from(
      { length: 600 },
      () => '<property name="Client"><vt:lpwstr xmlns:vt="vt">Identique</vt:lpwstr></property>',
    ).join('');
    source.file('docProps/custom.xml', `<?xml version="1.0"?><Properties>${properties}</Properties>`);
    source.file('metadata/custom-one.xml', `<?xml version="1.0"?><Properties>${properties}</Properties>`);
    source.file('metadata/custom-two.xml', `<?xml version="1.0"?><Properties>${properties}</Properties>`);
    source.file('_rels/.rels', '<?xml version="1.0"?><Relationships>'
      + '<Relationship Id="rCustomOne" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="metadata/custom-one.xml"/>'
      + '<Relationship Id="rCustomTwo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="metadata/custom-two.xml"/>'
      + '<Relationship Id="rThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/>'
      + '</Relationships>');
    const bytes = await source.generateAsync({ type: 'uint8array' });

    const result = await sanitizeOoxmlBuffer(bytes, 'docx', allOptions);

    expect(result.report.detectedCount).toBe(1_807);
    expect(result.report.removedCount).toBe(1_807);
    expect(result.report.detected).toHaveLength(500);
    expect(result.report.removed).toHaveLength(500);
    expect(result.report.remaining).toHaveLength(0);
    expect(result.report.truncatedFindingCount).toBe(1_307);
  });

  it('bounds bytes actually emitted by DEFLATE when the directory understates the size', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<Types/>');
    zip.file('_rels/.rels', '<Relationships/>');
    zip.file('word/document.xml', `<document>${'A'.repeat(2 * 1_024 * 1_024)}</document>`);
    const bytes = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    const forged = forgeCentralUncompressedSize(bytes, 'word/document.xml', 16);

    await expect(sanitizeOoxmlBuffer(forged, 'docx', allOptions))
      .rejects.toEqual(expect.objectContaining({
        code: 'compression-ratio-exceeded',
        entryName: 'word/document.xml',
      }));
  });

  it('preserves UTF-16 XML encoding while removing thumbnail references', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    const relationships = '<?xml version="1.0" encoding="UTF-16"?>'
      + '<Relationships><Relationship Id="rThumb" '
      + 'Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" '
      + 'Target="docProps/thumbnail.jpeg"/></Relationships>';
    const contentTypes = '<?xml version="1.0" encoding="UTF-16"?>'
      + '<Types><Override PartName="/docProps/thumbnail.jpeg" ContentType="image/jpeg"/></Types>';
    source.file('_rels/.rels', encodeUtf16Le(relationships));
    source.file('[Content_Types].xml', encodeUtf16Le(contentTypes));
    const bytes = await source.generateAsync({ type: 'uint8array' });

    const result = await sanitizeOoxmlBuffer(bytes, 'docx', allOptions);
    const output = await JSZip.loadAsync(result.output);
    const relationshipBytes = await output.file('_rels/.rels')?.async('uint8array');
    const contentTypeBytes = await output.file('[Content_Types].xml')?.async('uint8array');

    expect(relationshipBytes).toBeDefined();
    expect(contentTypeBytes).toBeDefined();
    if (!relationshipBytes || !contentTypeBytes) throw new Error('Expected XML package parts.');
    expect(relationshipBytes.subarray(0, 2)).toEqual(new Uint8Array([0xff, 0xfe]));
    expect(contentTypeBytes.subarray(0, 2)).toEqual(new Uint8Array([0xff, 0xfe]));
    expect(new TextDecoder('utf-16le').decode(relationshipBytes)).not.toContain('thumbnail');
    expect(new TextDecoder('utf-16le').decode(contentTypeBytes)).not.toContain('thumbnail');
  });

  it('resolves and cleans metadata parts declared at nonconventional package paths', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    const core = await source.file('docProps/core.xml')?.async('uint8array');
    const application = await source.file('docProps/app.xml')?.async('uint8array');
    const custom = await source.file('docProps/custom.xml')?.async('uint8array');
    const thumbnail = await source.file('docProps/thumbnail.jpeg')?.async('uint8array');
    if (!core || !application || !custom || !thumbnail) throw new Error('Expected fixture metadata.');
    source.remove('docProps');
    source.file('metadata/core.xml', core);
    source.file('metadata/application.xml', application);
    source.file('metadata/custom.xml', custom);
    source.file('previews/cover.jpeg', thumbnail);
    source.file('_rels/.rels', '<?xml version="1.0"?><Relationships>'
      + '<Relationship Id="rCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="metadata/core.xml"/>'
      + '<Relationship Id="rApp" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="metadata/application.xml"/>'
      + '<Relationship Id="rCustom" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="metadata/custom.xml"/>'
      + '<Relationship Id="rThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="previews/cover.jpeg"/>'
      + '</Relationships>');
    source.file('[Content_Types].xml', '<?xml version="1.0"?><Types>'
      + '<Override PartName="/metadata/core.xml" ContentType="application/core"/>'
      + '<Override PartName="/metadata/application.xml" ContentType="application/app"/>'
      + '<Override PartName="/metadata/custom.xml" ContentType="application/custom"/>'
      + '<Override PartName="/previews/cover.jpeg" ContentType="image/jpeg"/>'
      + '</Types>');

    const result = await sanitizeOoxmlBuffer(
      await source.generateAsync({ type: 'uint8array' }),
      'docx',
      allOptions,
    );
    const output = await JSZip.loadAsync(result.output);

    await expect(output.file('metadata/core.xml')?.async('string')).resolves.not.toContain('Alice');
    await expect(output.file('metadata/application.xml')?.async('string')).resolves.not.toContain('Exemple SA');
    await expect(output.file('metadata/custom.xml')?.async('string')).resolves.not.toContain('Société secrète');
    expect(output.file('previews/cover.jpeg')).toBeNull();
    await expect(output.file('_rels/.rels')?.async('string')).resolves.not.toContain('previews/cover.jpeg');
    await expect(output.file('[Content_Types].xml')?.async('string')).resolves.not.toContain('/previews/cover.jpeg');
    expect(result.report.detectedCount).toBe(8);
    expect(result.report.removedCount).toBe(8);
    expect(result.report.remainingCount).toBe(0);
    expect(result.report.detected.map(finding => finding.path)).toContain('metadata/core.xml');
  });

  it('ignores relationship-shaped text inside XML comments and CDATA sections', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    source.file('_rels/.rels', '<?xml version="1.0"?><Relationships>'
      + '<!-- <Relationship Id="fake-comment" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="word/document.xml"/> -->'
      + '<![CDATA[<Relationship Id="fake-cdata" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="word/document.xml"/>]]>'
      + '<Relationship Id="rThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/>'
      + '</Relationships>');

    const result = await sanitizeOoxmlBuffer(
      await source.generateAsync({ type: 'uint8array' }),
      'docx',
      allOptions,
    );
    const output = await JSZip.loadAsync(result.output);

    await expect(output.file('word/document.xml')?.async('string')).resolves.toContain('Préservé');
    await expect(output.file('_rels/.rels')?.async('string')).resolves.toContain('fake-comment');
    await expect(output.file('_rels/.rels')?.async('string')).resolves.toContain('fake-cdata');
  });

  it('decodes UTF-16 metadata parts when reporting values that remain', async () => {
    const source = await JSZip.loadAsync(await createPackage('docx'));
    source.file('docProps/core.xml', encodeUtf16Le(
      '<?xml version="1.0" encoding="UTF-16"?><cp:coreProperties xmlns:cp="core" xmlns:dc="dc">'
      + '<dc:title>Projet confidentiel</dc:title><dc:creator>Alice UTF16</dc:creator>'
      + '<cp:lastModifiedBy>Bob UTF16</cp:lastModifiedBy></cp:coreProperties>',
    ));
    source.file('docProps/app.xml', encodeUtf16Le(
      '<?xml version="1.0" encoding="UTF-16"?><Properties><Application>Word UTF16</Application>'
      + '<AppVersion>16.0</AppVersion><Company>Exemple UTF16</Company></Properties>',
    ));
    source.file('docProps/custom.xml', encodeUtf16Le(
      '<?xml version="1.0" encoding="UTF-16"?><Properties>'
      + '<property name="Client UTF16"><vt:lpwstr xmlns:vt="vt">Secret UTF16</vt:lpwstr></property>'
      + '</Properties>',
    ));

    const result = await sanitizeOoxmlBuffer(
      await source.generateAsync({ type: 'uint8array' }),
      'docx',
      {
        removeCoreProperties: false,
        removeApplicationProperties: false,
        removeCustomProperties: false,
        removeThumbnail: false,
      },
    );

    expect(result.report.detectedCount).toBe(8);
    expect(result.report.removedCount).toBe(0);
    expect(result.report.remainingCount).toBe(8);
    expect(result.report.remaining.map(finding => finding.value)).toEqual(expect.arrayContaining([
      'Projet confidentiel',
      'Alice UTF16',
      'Exemple UTF16',
      'Secret UTF16',
    ]));
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
