import { PDFDict, PDFDocument, PDFName, PDFNull, PDFRef, PDFString } from 'pdf-lib';
import { deflate } from 'pako';
import { describe, expect, it } from 'vitest';

import {
  PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH,
  PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_JAVASCRIPT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_MEDIA_TEXT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_OPTIONAL_CONTENT_EXPANSION_ENTRIES,
  PDF_PRIVACY_MAX_ANNOTATION_RENDITION_EXPANSION_ENTRIES,
  PDF_PRIVACY_MAX_ANNOTATION_RICH_MEDIA_EXPANSION_ENTRIES,
  PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_DOCUMENT_JAVASCRIPT_BYTES,
  PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_ALTERNATE_TEXT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_APPEARANCE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_INDEX_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_NAME_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_OPTION_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_RESOURCE_MERGE_ENTRIES,
  PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_JAVASCRIPT_BYTES,
  PDF_PRIVACY_MAX_NAMETREE_JAVASCRIPT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_INFO_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_SIGNATURE_TAIL_BYTES,
  PDF_PRIVACY_MAX_TEXT_STREAM_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_XMP_BYTES,
  PDF_PRIVACY_MAX_XFA_BYTES,
  PdfActionDictionaryInspectionError,
  inspectPdfStructuralSignals,
} from './pdf-action-dictionary.engine';
import {
  PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS,
  PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH,
  PDF_PRIVACY_MAX_RAW_TOKENS,
  validatePdfObjectStreamBudgets,
} from './pdf-object-stream-preflight';
import { PDF_PRIVACY_MAX_DISCOVERED_ITEMS } from '../domain/pdf-privacy.models';

describe('inspectPdfStructuralSignals', () => {
  it('lit Launch et SubmitForm dans un vrai PDF avec object streams', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action', S: 'URI', URI: PDFString.of('https://open.example/start'),
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10],
        A: { Type: 'Action', S: 'Launch', F: PDFString.of('https://launch.example/run') },
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [20, 0, 30, 10],
        A: { Type: 'Action', S: 'SubmitForm', F: PDFString.of('https://submit.example/collect') },
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [40, 0, 50, 10],
        A: {
          Type: 'Action', S: 'GoTo', D: [page.ref, PDFName.of('Fit')],
          Next: { Type: 'Action', S: 'URI', URI: PDFString.of('https://next.example/continue') },
        },
      })),
    ]));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toEqual(expect.arrayContaining([
      {
        actionType: 'Launch', context: 'annotation-action',
        target: 'https://launch.example/run', occurrences: 1,
      },
      {
        actionType: 'SubmitForm', context: 'annotation-action',
        target: 'https://submit.example/collect', occurrences: 1,
      },
      {
        actionType: 'URI', context: 'open-action',
        target: 'https://open.example/start', occurrences: 1,
      },
      {
        actionType: 'URI', context: 'next-action',
        target: 'https://next.example/continue', occurrences: 1,
      },
    ]));
  });

  it('résout les longueurs indirectes et borne les object streams avant pdf-lib', async () => {
    const indirectLengthFixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length 2 0 R >>\n',
      'stream\nabc\nendstream\nendobj\n2 0 obj\n3\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(indirectLengthFixture);
    }).not.toThrow();

    const commentedDirectBoundary = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length 3 >>\n',
      'stream\nabc\n% commentaire de frontière\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(commentedDirectBoundary)).not.toThrow();

    const commentedIndirectBoundary = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length 2 0 R >>\n',
      'stream\nabc\n% commentaire de frontière\nendstream\nendobj\n',
      '2 0 obj\n3\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(commentedIndirectBoundary)).not.toThrow();

    const payloadWithFakeLengthObject = '2 0 obj\n999999\nendobj\nabc';
    const indirectLengthWithFakePayloadObject = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      payloadWithFakeLengthObject,
      '\nendstream\nendobj\n2 0 obj\n',
      String(payloadWithFakeLengthObject.length),
      '\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(indirectLengthWithFakePayloadObject);
    }).not.toThrow();

    let fakeBoundary = 0;
    let fakeObjectPrefix: string;
    for (;;) {
      fakeObjectPrefix = `2 0 obj\n${String(fakeBoundary)}\nendobj\npadding\n`;
      const nextBoundary = fakeObjectPrefix.length;
      if (nextBoundary === fakeBoundary) break;
      fakeBoundary = nextBoundary;
    }
    const payloadWithFakeBoundary = `${fakeObjectPrefix}endstream\nstill-payload`;
    const indirectLengthWithTwoApparentBoundaries = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      payloadWithFakeBoundary,
      '\nendstream\nendobj\n2 0 obj\n',
      String(payloadWithFakeBoundary.length),
      '\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(indirectLengthWithTwoApparentBoundaries);
    }).not.toThrow();

    const payloadWithDeclarationAfterFakeBoundary = [
      'endstream',
      '2 0 obj',
      '0',
      'endobj',
      'still-payload',
    ].join('\n');
    const lateDeclarationBody = [
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      payloadWithDeclarationAfterFakeBoundary,
      '\nendstream\nendobj\n2 0 obj\n',
      String(payloadWithDeclarationAfterFakeBoundary.length),
      '\nendobj\n',
    ].join('');
    const lateDeclarationXrefOffset = lateDeclarationBody.length;
    const lateDeclarationObjectOneOffset = lateDeclarationBody.indexOf('1 0 obj');
    const lateDeclarationObjectTwoOffset = lateDeclarationBody.lastIndexOf('2 0 obj');
    const indirectLengthWithLateFakeDeclaration = joinBytes(
      lateDeclarationBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(lateDeclarationObjectOneOffset).padStart(10, '0')} 00000 n \n`,
      `${String(lateDeclarationObjectTwoOffset).padStart(10, '0')} 00000 n \n`,
      '% trailer\ntrailer\n<< /Size 3 >>\nstartxref\n',
      String(lateDeclarationXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(indirectLengthWithLateFakeDeclaration);
    }).not.toThrow();

    const activeShortLength = 3;
    const obsoleteLongPayload = [
      'abc\nendstream\nendobj\n2 0 obj\n',
      String(activeShortLength),
      '\nendobj\n0 0 0\n',
    ].join('');
    const xrefSelectedShortBody = [
      '%PDF-1.7\n2 0 obj\n',
      String(obsoleteLongPayload.length),
      '\nendobj\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      obsoleteLongPayload,
      'endstream\n',
    ].join('');
    const selectedShortXrefOffset = xrefSelectedShortBody.length;
    const selectedShortObjectOneOffset = xrefSelectedShortBody.indexOf('1 0 obj');
    const selectedShortObjectTwoOffset = xrefSelectedShortBody.lastIndexOf('2 0 obj');
    const xrefSelectedShortFixture = joinBytes(
      xrefSelectedShortBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(selectedShortObjectOneOffset).padStart(10, '0')} 00000 n \n`,
      `${String(selectedShortObjectTwoOffset).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 3 >>\nstartxref\n',
      String(selectedShortXrefOffset),
      '\n% startxref bogus\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(xrefSelectedShortFixture);
    }).not.toThrow();

    const obsoleteStreamBody = [
      '%PDF-1.7\n',
      '1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
      '2 0 obj\n3\nendobj\n',
    ].join('');
    const obsoleteStreamXrefOffset = obsoleteStreamBody.length;
    const obsoleteStreamRevision = [
      obsoleteStreamBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(obsoleteStreamBody.indexOf('1 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(obsoleteStreamBody.indexOf('2 0 obj')).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 3 >>\nstartxref\n',
      String(obsoleteStreamXrefOffset),
      '\n%%EOF\n',
    ].join('');
    const activeStreamOffset = obsoleteStreamRevision.length;
    const activeStreamBody = [
      obsoleteStreamRevision,
      '1 0 obj\n<< /Length 2 0 R >>\nstream\nabcdef\nendstream\nendobj\n',
    ].join('');
    const activeStreamLengthOffset = activeStreamBody.length;
    const activeStreamRevisionBody = [
      activeStreamBody,
      '2 0 obj\n6\nendobj\n',
    ].join('');
    const activeStreamXrefOffset = activeStreamRevisionBody.length;
    const replacedStreamAndLength = joinBytes(
      activeStreamRevisionBody,
      'xref\n1 2\n',
      `${String(activeStreamOffset).padStart(10, '0')} 00000 n \n`,
      `${String(activeStreamLengthOffset).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 3 /Prev ',
      String(obsoleteStreamXrefOffset),
      ' >>\nstartxref\n',
      String(activeStreamXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(replacedStreamAndLength)).not.toThrow();

    const xrefStreamAttackTail = [
      '\nendstream\nendobj\n2 0 obj\n3\nendobj\n',
      '['.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '0',
      ']'.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '\n',
    ].join('');
    const xrefStreamBody = [
      '%PDF-1.7\n2 0 obj\n',
      String(3 + xrefStreamAttackTail.length),
      '\nendobj\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc',
      xrefStreamAttackTail,
      'endstream\n',
    ].join('');
    const previousXrefOffset = xrefStreamBody.length;
    const staleLengthOffset = xrefStreamBody.indexOf('2 0 obj');
    const activeLengthOffset = xrefStreamBody.lastIndexOf('2 0 obj');
    const previousRevision = [
      xrefStreamBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(xrefStreamBody.indexOf('1 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(staleLengthOffset).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 6 >>\nstartxref\n',
      String(previousXrefOffset),
      '\n%%EOF\n',
    ].join('');
    const currentXrefOffset = previousRevision.length;
    const encodeXrefEntry = (
      type: number,
      fieldOne: number,
      fieldTwo = 0,
    ): Uint8Array => Uint8Array.of(
      type,
      (fieldOne >>> 24) & 0xff,
      (fieldOne >>> 16) & 0xff,
      (fieldOne >>> 8) & 0xff,
      fieldOne & 0xff,
      (fieldTwo >>> 8) & 0xff,
      fieldTwo & 0xff,
    );
    const xrefStreamFixture = joinBytes(
      previousRevision,
      '5 0 obj\n<< /Type /XRef /Size 6 /Prev ',
      String(previousXrefOffset),
      ' /W [1 4 2] /Index [2 1 5 1] /Length 14 >>\nstream\n',
      encodeXrefEntry(1, activeLengthOffset),
      encodeXrefEntry(1, currentXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(currentXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(xrefStreamFixture);
    }).toThrow('PDF raw container depth limit');

    const obsoleteXrefLengthBody = '%PDF-1.7\n7 0 obj\n999\nendobj\n';
    const obsoleteXrefOffset = obsoleteXrefLengthBody.length;
    const obsoleteXrefRevision = [
      obsoleteXrefLengthBody,
      'xref\n7 1\n',
      `${String(obsoleteXrefLengthBody.indexOf('7 0 obj')).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 8 >>\nstartxref\n',
      String(obsoleteXrefOffset),
      '\n%%EOF\n',
    ].join('');
    const activeXrefLengthOffset = obsoleteXrefRevision.length;
    const indirectXrefLengthBody = obsoleteXrefRevision + '7 0 obj\n14\nendobj\n';
    const indirectXrefOffset = indirectXrefLengthBody.length;
    const indirectXrefLengthFixture = joinBytes(
      indirectXrefLengthBody,
      '8 0 obj\n<< /Type /XRef /Size 9 /Prev ',
      String(obsoleteXrefOffset),
      ' /W [1 4 2] /Index [7 2] /Length 7 0 R >>\nstream\n',
      encodeXrefEntry(1, activeXrefLengthOffset),
      encodeXrefEntry(1, indirectXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(indirectXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(indirectXrefLengthFixture)).not.toThrow();

    const staleObjectStreamPayload = '2 0 99';
    const activeObjectStreamPayload = '2 0 3';
    const compressedRevisionBody = [
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
      '3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(staleObjectStreamPayload.length),
      ' >>\nstream\n',
      staleObjectStreamPayload,
      '\nendstream\nendobj\n4 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(activeObjectStreamPayload.length),
      ' >>\nstream\n',
      activeObjectStreamPayload,
      '\nendstream\nendobj\n6 0 obj\n',
      '<< /Type /ObjStm /N 0 /First 0 /Filter /FlateDecode /Length 4 >>\n',
      'stream\nnope\nendstream\nendobj\n',
    ].join('');
    const compressedXrefOffset = compressedRevisionBody.length;
    const compressedXrefFixture = joinBytes(
      compressedRevisionBody,
      '5 0 obj\n<< /Type /XRef /Size 7 /W [1 4 2] /Index [2 5] /Length 35 >>\nstream\n',
      encodeXrefEntry(2, 4),
      encodeXrefEntry(1, compressedRevisionBody.indexOf('3 0 obj')),
      encodeXrefEntry(1, compressedRevisionBody.indexOf('4 0 obj')),
      encodeXrefEntry(1, compressedXrefOffset),
      encodeXrefEntry(1, compressedRevisionBody.indexOf('6 0 obj')),
      '\nendstream\nendobj\nstartxref\n',
      String(compressedXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(compressedXrefFixture);
    }).not.toThrow();

    const hybridAttackTail = [
      '\nendstream\nendobj\n',
      '['.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '0',
      ']'.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '\n',
    ].join('');
    const hybridBody = [
      '%PDF-1.7\n2 0 obj\n',
      String(3 + hybridAttackTail.length),
      '\nendobj\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc',
      hybridAttackTail,
      'endstream\n4 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(activeObjectStreamPayload.length),
      ' >>\nstream\n',
      activeObjectStreamPayload,
      '\nendstream\nendobj\n',
    ].join('');
    const hybridPreviousXrefOffset = hybridBody.length;
    const hybridPreviousRevision = [
      hybridBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(hybridBody.indexOf('1 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(hybridBody.indexOf('2 0 obj')).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 6 >>\nstartxref\n',
      String(hybridPreviousXrefOffset),
      '\n%%EOF\n',
    ].join('');
    const supplementalXrefOffset = hybridPreviousRevision.length;
    const supplementalXrefObject = joinBytes(
      '5 0 obj\n<< /Type /XRef /Size 6 /W [1 4 2] /Index [2 1 4 2] /Length 21 >>\nstream\n',
      encodeXrefEntry(2, 4),
      encodeXrefEntry(1, hybridBody.indexOf('4 0 obj')),
      encodeXrefEntry(1, supplementalXrefOffset),
      '\nendstream\nendobj\n',
    );
    const hybridCurrentXrefOffset = supplementalXrefOffset + supplementalXrefObject.byteLength;
    const hybridXrefFixture = joinBytes(
      hybridPreviousRevision,
      supplementalXrefObject,
      'xref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 6 /XRefStm ',
      String(supplementalXrefOffset),
      ' /Prev ',
      String(hybridPreviousXrefOffset),
      ' >>\nstartxref\n',
      String(hybridCurrentXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(hybridXrefFixture);
    }).toThrow('PDF raw container depth limit');

    const compressedLengthPayload = '2 0 3';
    const compressedLengthFixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
      '3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(compressedLengthPayload.length),
      ' >>\nstream\n',
      compressedLengthPayload,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(compressedLengthFixture);
    }).not.toThrow();

    const staleCompressedLengthPayload = '2 0 99';
    const activeClassicBody = [
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
      '3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(staleCompressedLengthPayload.length),
      ' >>\nstream\n',
      staleCompressedLengthPayload,
      '\nendstream\nendobj\n2 0 obj\n3\nendobj\n',
    ].join('');
    const activeClassicXrefOffset = activeClassicBody.length;
    const activeClassicFixture = joinBytes(
      activeClassicBody,
      'xref\n0 4\n0000000000 65535 f \n',
      `${String(activeClassicBody.indexOf('1 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(activeClassicBody.lastIndexOf('2 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(activeClassicBody.indexOf('3 0 obj')).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 4 >>\nstartxref\n',
      String(activeClassicXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(activeClassicFixture);
    }).not.toThrow();

    const payloadWithFakeEncryptedTrailer = [
      'trailer',
      '<< /Encrypt 9 0 R >>',
      'ordinary payload',
    ].join('\n');
    const unresolvedLengthPayload = `2 0 ${String(payloadWithFakeEncryptedTrailer.length)}`;
    const unresolvedLengthWithFakeTrailer = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      payloadWithFakeEncryptedTrailer,
      '\nendstream\nendobj\n3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(unresolvedLengthPayload.length),
      ' >>\nstream\n',
      unresolvedLengthPayload,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(unresolvedLengthWithFakeTrailer)).toEqual({
      encrypted: false,
      skippedEncryptedObjectStreams: 0,
    });

    const ordinaryPayload = '<< /Type /ObjStm /Length 999999 >>\nstream\n';
    const ordinaryStreamFixture = joinBytes(
      `%PDF-1.7\n1 0 obj\n<< /Length ${String(ordinaryPayload.length)} >>\nstream\n`,
      ordinaryPayload,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(ordinaryStreamFixture);
    }).not.toThrow();

    const nullTypeOrdinaryStream = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type null /Length 3 >>\n',
      'stream\nabc\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(nullTypeOrdinaryStream)).not.toThrow();

    const indirectTypeBody = [
      '%PDF-1.7\n',
      '1 0 obj\n<< /Type 2 0 R /Length 3 >>\nstream\nabc\nendstream\nendobj\n',
      '2 0 obj\n/Foo\nendobj\n',
    ].join('');
    const indirectTypeXrefOffset = indirectTypeBody.length;
    const indirectTypeOrdinaryStream = joinBytes(
      indirectTypeBody,
      'xref\n0 3\n0000000000 65535 f \n',
      `${String(indirectTypeBody.indexOf('1 0 obj')).padStart(10, '0')} 00000 n \n`,
      `${String(indirectTypeBody.indexOf('2 0 obj')).padStart(10, '0')} 00000 n \n`,
      'trailer\n<< /Size 3 >>\nstartxref\n',
      String(indirectTypeXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(indirectTypeOrdinaryStream)).not.toThrow();

    const duplicateNullType = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type null /Type /ObjStm /N 0 /First 0 /Length 0 >>\n',
      'stream\n\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(duplicateNullType))
      .toThrow('Duplicate PDF stream type');

    const encryptedFixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length 10 ',
      '/Filter /FlateDecode >>\nstream\nciphertext\nendstream\nendobj\n',
      'trailer\n<< /Encrypt 9 0 R >>\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(encryptedFixture)).toEqual({
      encrypted: true,
      skippedEncryptedObjectStreams: 1,
    });

    const nullEncryptionFixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length 0 >>\n',
      'stream\n\nendstream\nendobj\ntrailer\n<< /Encrypt null >>\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(nullEncryptionFixture)).toEqual({
      encrypted: false,
      skippedEncryptedObjectStreams: 0,
    });

    const indirectNullBody = [
      '%PDF-1.7',
      '1 0 obj',
      '<< /Type /ObjStm /N 1 /First 4 /Length 8 >>',
      'stream',
      '2 0 null',
      'endstream',
      'endobj',
      '5 0 obj',
      'null',
      'endobj',
      '',
    ].join('\n');
    const indirectNullXrefOffset = indirectNullBody.length;
    const indirectNullFixture = joinBytes(
      indirectNullBody,
      '6 0 obj\n<< /Type /XRef /Size 7 /W [1 4 2] /Index [1 2 5 2] ',
      '/Encrypt 5 0 R /Length 28 >>\nstream\n',
      encodeXrefEntry(1, indirectNullBody.indexOf('1 0 obj')),
      encodeXrefEntry(2, 1),
      encodeXrefEntry(1, indirectNullBody.indexOf('5 0 obj')),
      encodeXrefEntry(1, indirectNullXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(indirectNullXrefOffset),
      '\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(indirectNullFixture)).toEqual({
      encrypted: false,
      skippedEncryptedObjectStreams: 0,
    });

    const compressedNullEncryptionFixture = joinBytes(
      indirectNullBody,
      '6 0 obj\n<< /Type /XRef /Size 7 /W [1 4 2] /Index [1 2 5 2] ',
      '/Encrypt 2 0 R /Length 28 >>\nstream\n',
      encodeXrefEntry(1, indirectNullBody.indexOf('1 0 obj')),
      encodeXrefEntry(2, 1),
      encodeXrefEntry(1, indirectNullBody.indexOf('5 0 obj')),
      encodeXrefEntry(1, indirectNullXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(indirectNullXrefOffset),
      '\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(compressedNullEncryptionFixture)).toEqual({
      encrypted: false,
      skippedEncryptedObjectStreams: 0,
    });

    const replacedEncryptionBody = indirectNullBody
      + '5 0 obj\n<< /Filter /Standard >>\nendobj\n';
    const replacedEncryptionXrefOffset = replacedEncryptionBody.length;
    const replacedEncryptionFixture = joinBytes(
      replacedEncryptionBody,
      '6 0 obj\n<< /Type /XRef /Size 7 /W [1 4 2] /Index [1 2 5 2] ',
      '/Encrypt 5 0 R /Length 28 >>\nstream\n',
      encodeXrefEntry(1, replacedEncryptionBody.indexOf('1 0 obj')),
      encodeXrefEntry(2, 1),
      encodeXrefEntry(1, replacedEncryptionBody.lastIndexOf('5 0 obj')),
      encodeXrefEntry(1, replacedEncryptionXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(replacedEncryptionXrefOffset),
      '\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(replacedEncryptionFixture)).toEqual({
      encrypted: true,
      skippedEncryptedObjectStreams: 1,
    });

    const encryptedLengthCandidate = `2 0 ${String(fakeBoundary)}`;
    const compressedEncryptedCandidate = deflate(new TextEncoder().encode(encryptedLengthCandidate));
    const encryptedCandidateFixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\n',
      payloadWithFakeBoundary,
      '\nendstream\nendobj\n2 0 obj\n',
      String(payloadWithFakeBoundary.length),
      '\nendobj\n3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /Length ',
      String(compressedEncryptedCandidate.byteLength),
      ' >>\nstream\n',
      compressedEncryptedCandidate,
      '\nendstream\nendobj\ntrailer\n<< /Encrypt 9 0 R >>\n%%EOF\n',
    );
    expect(validatePdfObjectStreamBudgets(encryptedCandidateFixture)).toEqual({
      encrypted: true,
      skippedEncryptedObjectStreams: 1,
    });

    const expanded = new Uint8Array(PDF_PRIVACY_MAX_OBJECT_STREAM_EXPANSION_BYTES + 1);
    const compressed = deflate(expanded);
    const fixture = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 /Length ',
      String(compressed.byteLength),
      ' /Filter /FlateDecode >>\nstream\n',
      compressed,
      '\nendstream\nendobj\n%%EOF\n',
    );

    await expect(inspectPdfStructuralSignals(fixture))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('décode les filtres PDF standards et leurs chaînes avant le budget', () => {
    const plain = new TextEncoder().encode('2 0 3');
    const pngSubRow = Uint8Array.of(1, plain[0], ...plain.slice(1).map((value, index) => (
      value - plain[index]
    ) & 0xff));
    const predictedFlate = deflate(pngSubRow);
    const fixtures = [
      {
        filterDictionary: '/Filter null',
        payload: plain,
      },
      {
        filterDictionary: '/Filter /ASCIIHexDecode /DecodeParms null',
        payload: encodeAsciiHex(plain),
        explicitPlusLength: true,
      },
      {
        filterDictionary: [
          '/Filter /ASCIIHexDecode',
          '/DecodeParms << /Vendor [/Predictor 99] /ScalarVendor /Predictor >>',
        ].join(' '),
        payload: encodeAsciiHex(plain),
      },
      {
        filterDictionary: '/Filter /RunLengthDecode',
        payload: encodeRunLengthLiteral(plain),
      },
      {
        filterDictionary: '/Filter /LZWDecode',
        payload: encodeLzwLiteral(plain),
      },
      {
        filterDictionary: '/Filter /FlateDecode /DecodeParms << /EarlyChange 2 >>',
        payload: deflate(plain),
      },
      {
        filterDictionary: '/Filter /ASCIIHexDecode /DecodeParms << /Predictor 99 >>',
        payload: encodeAsciiHex(plain),
      },
      {
        filterDictionary: [
          '/Filter [/ASCII85Decode /FlateDecode]',
          `/DecodeParms [null << /Predictor 12 /Columns ${String(plain.byteLength)} >>]`,
        ].join(' '),
        payload: encodeAscii85(predictedFlate),
      },
      {
        filterDictionary: '/Filter [/ASCIIHexDecode /RunLengthDecode]',
        payload: encodeAsciiHex(encodeRunLengthLiteral(plain)),
      },
      ...([1, 2, 4] as const).map(bitsPerComponent => ({
        filterDictionary: [
          '/Filter /FlateDecode',
          `/DP << /Predictor 2 /BPC ${String(bitsPerComponent)} `,
          `/Columns ${String(plain.byteLength * 8 / bitsPerComponent)} >>`,
        ].join(' '),
        payload: deflate(encodeTiffPredictor(plain, bitsPerComponent)),
      })),
    ];

    for (const fixture of fixtures) {
      const pdf = joinBytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
        '3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
        fixture.explicitPlusLength ? `+${String(fixture.payload.byteLength)}` : String(fixture.payload.byteLength),
        ' ',
        fixture.filterDictionary,
        ' >>\nstream\n',
        fixture.payload,
        '\nendstream\nendobj\n%%EOF\n',
      );
      expect(() => validatePdfObjectStreamBudgets(pdf)).not.toThrow();
    }

    const invalidLzwParameters = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Length ',
      String(encodeLzwLiteral(plain).byteLength),
      ' /Filter /LZWDecode /DecodeParms << /EarlyChange 2 >> >>\nstream\n',
      encodeLzwLiteral(plain),
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(invalidLzwParameters)).toThrow();

    const xrefBody = '%PDF-1.7\n1 0 obj\nnull\nendobj\n';
    const xrefOffset = xrefBody.length;
    const encodeXrefEntry = (
      type: number,
      objectOffset: number,
      fieldTwo = 0,
    ): Uint8Array => Uint8Array.of(
      type,
      (objectOffset >>> 24) & 0xff,
      (objectOffset >>> 16) & 0xff,
      (objectOffset >>> 8) & 0xff,
      objectOffset & 0xff,
      (fieldTwo >>> 8) & 0xff,
      fieldTwo & 0xff,
    );
    const encodedXref = encodeAsciiHex(joinBytes(
      encodeXrefEntry(1, xrefBody.indexOf('1 0 obj')),
      encodeXrefEntry(1, xrefOffset),
    ));
    const filteredXref = joinBytes(
      xrefBody,
      '2 0 obj\n<< /Type /XRef /Size 3 /W [1 4 2] /Index [1 2] ',
      `/Filter /ASCIIHexDecode /Length ${String(encodedXref.byteLength)} >>\nstream\n`,
      encodedXref,
      '\nendstream\nendobj\nstartxref\n',
      String(xrefOffset),
      '\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(filteredXref)).not.toThrow();

    for (const fixture of [
      {
        filterValue: '/ASCIIHexDecode',
        decodeParametersValue: '<< /Predictor 1 >>',
        encode: encodeAsciiHex,
        objectSevenValue: '<< /Predictor 99 >>',
      },
      {
        filterValue: '/FlateDecode',
        decodeParametersValue: '<< /Predictor 7 0 R >>',
        encode: deflate,
        objectSevenValue: '1',
      },
      {
        filterValue: '[/ASCII85Decode 6 0 R]',
        decodeParametersValue: '[null 7 0 R]',
        encode: (contents: Uint8Array): Uint8Array => encodeAscii85(encodeAsciiHex(contents)),
        objectSevenValue: '<< /Predictor 99 >>',
      },
      {
        filterValue: '/ASCIIHexDecode',
        decodeParametersValue: 'null',
        encode: encodeAsciiHex,
        objectSevenValue: '<< /Predictor 99 >>',
      },
    ]) {
      const indirectXrefBody = [
        '%PDF-1.7\n',
        '1 0 obj\nnull\nendobj\n',
        '5 0 obj\n<< /Length 17 >>\nstream\n2 0 obj fake data\nendstream\nendobj\n',
        `2 0 obj\n${fixture.filterValue}\nendobj\n`,
        `3 0 obj\n${fixture.decodeParametersValue}\nendobj\n`,
        '6 0 obj\n/ASCIIHexDecode\nendobj\n',
        `7 0 obj\n${fixture.objectSevenValue}\nendobj\n`,
      ].join('');
      const indirectFilterXrefOffset = indirectXrefBody.length;
      const indirectFilterXrefPayload = fixture.encode(joinBytes(
        encodeXrefEntry(1, indirectXrefBody.indexOf('1 0 obj')),
        encodeXrefEntry(1, indirectXrefBody.lastIndexOf('2 0 obj')),
        encodeXrefEntry(1, indirectXrefBody.indexOf('3 0 obj')),
        encodeXrefEntry(1, indirectFilterXrefOffset),
        encodeXrefEntry(1, indirectXrefBody.indexOf('5 0 obj')),
        encodeXrefEntry(1, indirectXrefBody.indexOf('6 0 obj')),
        encodeXrefEntry(1, indirectXrefBody.indexOf('7 0 obj')),
      ));
      const indirectFilterXref = joinBytes(
        indirectXrefBody,
        '4 0 obj\n<< /Type /XRef /Size 8 /W [1 4 2] /Index [1 7] ',
        '/Filter 2 0 R /DecodeParms 3 0 R ',
        `/Length ${String(indirectFilterXrefPayload.byteLength)} >>\nstream\n`,
        indirectFilterXrefPayload,
        '\nendstream\nendobj\nstartxref\n',
        String(indirectFilterXrefOffset),
        '\n%%EOF\n',
      );
      expect(() => validatePdfObjectStreamBudgets(indirectFilterXref)).not.toThrow();
    }

    const compressedPlain = encodeAscii85(deflate(plain));
    for (const indirectParameterValue of ['<< /Predictor 1 >>', 'null']) {
      const indirectParameterBody = joinBytes(
        '%PDF-1.7\n1 0 obj\n<< /Length 2 0 R >>\nstream\nabc\nendstream\nendobj\n',
        '3 0 obj\n<< /Type /ObjStm /N 1 /First 4 /Filter 8 0 R ',
        `/DecodeParms [null 9 0 R] /Length ${String(compressedPlain.byteLength)} >>\nstream\n`,
        compressedPlain,
        '\nendstream\nendobj\n8 0 obj\n[/ASCII85Decode /FlateDecode]\nendobj\n',
        `9 0 obj\n${indirectParameterValue}\nendobj\n`,
      );
      const indirectXrefOffset = indirectParameterBody.byteLength;
      const objectThreeOffset = findByteSequence(
        indirectParameterBody,
        new TextEncoder().encode('3 0 obj'),
      );
      const objectNineOffset = findByteSequence(
        indirectParameterBody,
        new TextEncoder().encode('9 0 obj'),
      );
      const objectEightOffset = findByteSequence(
        indirectParameterBody,
        new TextEncoder().encode('8 0 obj'),
      );
      const indirectXrefPayload = joinBytes(
        encodeXrefEntry(2, 3),
        encodeXrefEntry(1, objectThreeOffset),
        encodeXrefEntry(1, objectEightOffset),
        encodeXrefEntry(1, objectNineOffset),
        encodeXrefEntry(1, indirectXrefOffset),
      );
      const indirectParameters = joinBytes(
        indirectParameterBody,
        '10 0 obj\n<< /Type /XRef /Size 11 /W [1 4 2] /Index [2 2 8 3] /Length 35 >>',
        '\nstream\n',
        indirectXrefPayload,
        '\nendstream\nendobj\nstartxref\n',
        String(indirectXrefOffset),
        '\n%%EOF\n',
      );
      expect(() => validatePdfObjectStreamBudgets(indirectParameters)).not.toThrow();
    }

    const compressedScalarTarget = deflate(plain);
    const compressedScalarCarrier = new TextEncoder().encode('7 0 1');
    const compressedScalarBody = joinBytes(
      '%PDF-1.7\n3 0 obj\n<< /Type /ObjStm /N 1 /First 4 ',
      '/Filter /FlateDecode /DecodeParms << /Predictor 7 0 R >> ',
      `/Length ${String(compressedScalarTarget.byteLength)} >>\nstream\n`,
      compressedScalarTarget,
      '\nendstream\nendobj\n8 0 obj\n<< /Type /ObjStm /N 1 /First 4 ',
      `/Length ${String(compressedScalarCarrier.byteLength)} >>\nstream\n`,
      compressedScalarCarrier,
      '\nendstream\nendobj\n',
    );
    const compressedScalarXrefOffset = compressedScalarBody.byteLength;
    const compressedScalarXref = joinBytes(
      compressedScalarBody,
      '10 0 obj\n<< /Type /XRef /Size 11 /W [1 4 2] /Index [3 1 7 2 10 1] ',
      '/Length 28 >>\nstream\n',
      encodeXrefEntry(1, findByteSequence(
        compressedScalarBody,
        new TextEncoder().encode('3 0 obj'),
      )),
      encodeXrefEntry(2, 8, 0),
      encodeXrefEntry(1, findByteSequence(
        compressedScalarBody,
        new TextEncoder().encode('8 0 obj'),
      )),
      encodeXrefEntry(1, compressedScalarXrefOffset),
      '\nendstream\nendobj\nstartxref\n',
      String(compressedScalarXrefOffset),
      '\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(compressedScalarXref)).not.toThrow();

    const intermediateBytes = 22 * 1_024 * 1_024;
    const shrinkingIntermediate = new Uint8Array(intermediateBytes + 2);
    shrinkingIntermediate.fill(0x30);
    for (let index = 0; index < intermediateBytes; index += 2) {
      shrinkingIntermediate[index] = 0x33;
    }
    shrinkingIntermediate[intermediateBytes] = 0x3e;
    shrinkingIntermediate[intermediateBytes + 1] = 0x3e;
    const shrinkingCompressed = deflate(shrinkingIntermediate);
    const shrinkingChain = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 ',
      `/Filter [/FlateDecode /ASCIIHexDecode /ASCIIHexDecode] /Length ${String(shrinkingCompressed.byteLength)} >>`,
      '\nstream\n',
      shrinkingCompressed,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => validatePdfObjectStreamBudgets(shrinkingChain))
      .toThrow('PDF object stream expansion limit');
  }, 30_000);

  it('saute la valeur complète des clés d’extension avant les clés de flux critiques', () => {
    const payload = new TextEncoder().encode('2 0 3');
    const extensions = [
      '/Vendor /Filter',
      '/Vendor [/Filter /Length << /DecodeParms /N >>]',
      '/Vendor << /Filter /Length /Nested [/Size /W] >>',
      '/Vendor 8 0 R',
    ];

    for (const extension of extensions) {
      const pdf = joinBytes(
        '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N 0 /First 0 ',
        extension,
        ` /Length ${String(payload.byteLength)} >>\nstream\n`,
        payload,
        '\nendstream\nendobj\n8 0 obj\n/Filter\nendobj\n%%EOF\n',
      );

      expect(() => validatePdfObjectStreamBudgets(pdf)).not.toThrow();
    }
  });

  it('borne les objets indirects classiques avant le chargement par pdf-lib', () => {
    const objectDeclarations = Array.from(
      { length: PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1 },
      (_, index) => `${String(index + 1)} 0 obj\nnull\nendobj\n`,
    ).join('');
    expect(() => {
      validatePdfObjectStreamBudgets(joinBytes('%PDF-1.7\n', objectDeclarations, '%%EOF\n'));
    }).toThrow('PDF classic indirect object limit');

    const streamPayload = '1 0 obj\n'.repeat(PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1);
    const headersInsideStream = joinBytes(
      `%PDF-1.7\n1 0 obj\n<< /Length ${String(streamPayload.length)} >>\nstream\n`,
      streamPayload,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(headersInsideStream);
    }).not.toThrow();

    const duplicateLengthDeclarations = '2 0 obj\n3\nendobj\n'.repeat(
      PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1,
    );
    const duplicateLengthDeclarationsInsideStream = joinBytes(
      `%PDF-1.7\n1 0 obj\n<< /Length ${String(duplicateLengthDeclarations.length)} >>\nstream\n`,
      duplicateLengthDeclarations,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(duplicateLengthDeclarationsInsideStream);
    }).toThrow('PDF indirect length declaration limit');

    const oversizedCompressedCount = joinBytes(
      '%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /N ',
      String(PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 1),
      ' /First 0 /Length 0 >>\nstream\n\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(oversizedCompressedCount);
    }).toThrow('PDF compressed indirect object limit');

    const oversizedXref = joinBytes(
      '%PDF-1.7\ntrailer\n<< /Size ',
      String(PDF_PRIVACY_MAX_CLASSIC_INDIRECT_OBJECTS + 2),
      ' >>\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(oversizedXref);
    }).toThrow('PDF xref size limit');
  }, 30_000);

  it('borne les tokens et la profondeur des conteneurs classiques avant pdf-lib', () => {
    const oversizedArray = joinBytes(
      '%PDF-1.7\n1 0 obj\n[',
      '0 '.repeat(PDF_PRIVACY_MAX_RAW_TOKENS),
      ']\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(oversizedArray);
    }).toThrow('PDF raw token limit');

    const deeplyNestedArray = joinBytes(
      '%PDF-1.7\n1 0 obj\n',
      '['.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '0',
      ']'.repeat(PDF_PRIVACY_MAX_RAW_CONTAINER_DEPTH + 1),
      '\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(deeplyNestedArray);
    }).toThrow('PDF raw container depth limit');

    const streamPayload = '0 '.repeat(PDF_PRIVACY_MAX_RAW_TOKENS + 1);
    const tokensInsideStream = joinBytes(
      `%PDF-1.7\n1 0 obj\n<< /Length ${String(streamPayload.length)} >>\nstream\n`,
      streamPayload,
      '\nendstream\nendobj\n%%EOF\n',
    );
    expect(() => {
      validatePdfObjectStreamBudgets(tokensInsideStream);
    }).not.toThrow();
  }, 30_000);

  it('inventorie un fichier embarqué uniquement atteignable depuis une action', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.stream(
      Uint8Array.of(1, 2, 3, 4),
      { Type: 'EmbeddedFile', Subtype: 'application#2Foctet-stream' },
    ));
    const fileSpec = source.context.register(source.context.obj({
      Type: 'Filespec', F: PDFString.of('action.bin'), EF: { F: embeddedFile },
    }));
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action', S: 'Launch', F: fileSpec,
    }));

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals?.associatedFiles).toEqual([expect.objectContaining({
      fileName: 'action.bin', bytes: 4, occurrences: 1,
    })]);
    expect(signals?.actionDictionaries).toContainEqual(expect.objectContaining({
      actionType: 'Launch', target: 'action.bin', occurrences: 1,
    }));
  });

  it('ignore un discriminateur S malformé sans perdre les autres actions du PDF', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10],
        A: { Type: 'Action', S: PDFString.of('Launch'), F: PDFString.of('broken.exe') },
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [20, 0, 30, 10],
        A: {
          Type: 'Action', S: 'SubmitForm',
          F: PDFString.of('https://submit.example/valid'),
        },
      })),
    ]));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals).not.toBeNull();
    expect(signals?.actionDictionaries).toEqual([
      {
        actionType: 'SubmitForm', context: 'annotation-action',
        target: 'https://submit.example/valid', occurrences: 1,
      },
    ]);
  });

  it('suit Next depuis une action stockée dans la name tree JavaScript', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const entry = source.context.register(source.context.obj({
      Type: 'Action',
      S: 'JavaScript',
      JS: PDFString.of(''),
      Next: {
        Type: 'Action',
        S: 'SubmitForm',
        F: PDFString.of('https://submit.example/hidden'),
      },
    }));
    source.catalog.set(PDFName.of('Names'), source.context.obj({
      JavaScript: { Names: [PDFString.of('entry'), entry] },
    }));

    const data = await source.save();
    expect(() => {
      validatePdfObjectStreamBudgets(data);
    }).not.toThrow();
    const signals = await inspectPdfStructuralSignals(data);

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'SubmitForm',
      context: 'next-action',
      target: 'https://submit.example/hidden',
      occurrences: 1,
    });
  });

  it('borne le même script partagé par plusieurs noms JavaScript', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const scriptBytes = 1 * 1_024 * 1_024;
    const sharedScript = source.context.register(PDFString.of('A'.repeat(scriptBytes)));
    const sharedAction = source.context.register(source.context.obj({
      Type: 'Action', S: 'JavaScript', JS: sharedScript,
    }));
    const entryCount = Math.floor(
      PDF_PRIVACY_MAX_NAMETREE_JAVASCRIPT_EXPANSION_BYTES / scriptBytes,
    ) + 1;
    const entries = Array.from({ length: entryCount }, (_, index) => [
      PDFString.of(`entry-${String(index)}`),
      sharedAction,
    ]).flat();
    source.catalog.set(PDFName.of('Names'), source.context.obj({
      JavaScript: { Names: entries },
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('ne double pas une annotation atteinte depuis la destination du plan', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'Launch', F: PDFString.of('viewer.exe'),
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], A: action,
      })),
    ]));
    const outlineRoot = source.context.obj({ Type: 'Outlines' });
    const outlineRootRef = source.context.register(outlineRoot);
    const outlineItem = source.context.obj({
      Title: PDFString.of('Page'),
      Parent: outlineRootRef,
      Dest: [page.ref, PDFName.of('Fit')],
    });
    const outlineItemRef = source.context.register(outlineItem);
    outlineRoot.set(PDFName.of('First'), outlineItemRef);
    outlineRoot.set(PDFName.of('Last'), outlineItemRef);
    source.catalog.set(PDFName.of('Outlines'), outlineRootRef);

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).not.toBeNull();
    expect(signals?.filter(signal => signal.actionType === 'Launch')).toEqual([{
      actionType: 'Launch', context: 'annotation-action', target: 'viewer.exe', occurrences: 1,
    }]);
  });

  it('compte une référence partagée pour chacun de ses déclencheurs', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'SubmitForm', F: PDFString.of('https://submit.example/shared'),
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], A: action,
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [20, 0, 30, 10], A: action,
      })),
    ]));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toEqual([{
      actionType: 'SubmitForm', context: 'annotation-action',
      target: 'https://submit.example/shared', occurrences: 2,
    }]);
  });

  it('expose l’identifiant PDF.js du déclencheur quand une cible est chiffrée ou absente', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const annotation = source.context.register(source.context.obj({
      Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10],
      A: { Type: 'Action', S: 'SubmitForm' },
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj([annotation]));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toContainEqual({
      actionType: 'SubmitForm',
      context: 'annotation-action',
      occurrences: 1,
      triggerIds: [`${String(annotation.objectNumber)}R`],
    });
  });

  it('préserve le JavaScript masqué dans une annotation et une chaîne Next', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10],
        A: { Type: 'Action', S: 'JavaScript', JS: PDFString.of('hidden()') },
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [20, 0, 30, 10],
        A: {
          Type: 'Action', S: 'GoTo', D: [page.ref, PDFName.of('Fit')],
          Next: { Type: 'Action', S: 'JavaScript', JS: PDFString.of('chained()') },
        },
      })),
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [40, 0, 50, 10],
        AA: { E: { Type: 'Action', S: 'JavaScript', JS: PDFString.of('additional()') } },
      })),
    ]));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toEqual(expect.arrayContaining([
      { actionType: 'JavaScript', context: 'annotation-action', occurrences: 1 },
      { actionType: 'JavaScript', context: 'next-action', occurrences: 1 },
      { actionType: 'JavaScript', context: 'annotation-additional-action', occurrences: 1 },
    ]));
  });

  it('parcourt un conteneur AA même s’il contient une clé S incidente', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [0, 0, 10, 10],
        AA: {
          S: 'NotAnActionContainer',
          E: { Type: 'Action', S: 'JavaScript', JS: PDFString.of('hidden()') },
        },
      })),
    ]));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toContainEqual({
      actionType: 'JavaScript',
      context: 'annotation-additional-action',
      occurrences: 1,
    });
  });

  it('renvoie un état sémantique pour une cible trop longue', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action',
      S: 'Launch',
      F: PDFString.of('x'.repeat(4_097)),
    }));

    const signals = (await inspectPdfStructuralSignals(await source.save()))?.actionDictionaries;

    expect(signals).toContainEqual(expect.objectContaining({
      actionType: 'Launch',
      context: 'open-action',
      targetStatus: 'too-long',
      occurrences: 1,
    }));
    expect(JSON.stringify(signals)).not.toContain('cible trop longue');
  });

  it('inventorie une seule fois un FileSpec partagé par AF et la name tree', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.stream(
      'associated payload',
      { Type: 'EmbeddedFile', Subtype: PDFName.of('text#2Fplain') },
    ));
    const fileSpec = source.context.register(source.context.obj({
      Type: 'Filespec',
      F: PDFString.of('folder/associated.txt'),
      UF: PDFString.of('folder/associated.txt'),
      Desc: PDFString.of('Associated only'),
      EF: { F: embeddedFile },
    }));
    source.catalog.set(PDFName.of('AF'), source.context.obj([fileSpec]));
    source.catalog.set(PDFName.of('Names'), source.context.obj({
      EmbeddedFiles: {
        Names: [PDFString.of('associated.txt'), fileSpec],
      },
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([
      expect.objectContaining({
        id: 1,
        fileName: 'folder/associated.txt',
        description: 'Associated only',
        occurrences: 1,
      }),
    ]);
    expect(signals?.associatedFiles[0]?.bytes).toBe(18);
  });

  it('omet la taille trompeuse d’une pièce jointe compressée', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.flateStream(
      'payload highly compressible '.repeat(100),
      { Type: 'EmbeddedFile' },
    ));
    source.catalog.set(PDFName.of('AF'), source.context.obj([{
      Type: 'Filespec',
      F: PDFString.of('compressed.txt'),
      EF: { F: embeddedFile },
    }]));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([
      expect.objectContaining({ fileName: 'compressed.txt', bytes: undefined }),
    ]);
  });

  it('omet la taille chiffrée d’une pièce jointe non compressée', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.stream(
      'ciphertext with encryption overhead',
      { Type: 'EmbeddedFile' },
    ));
    source.catalog.set(PDFName.of('AF'), source.context.obj([{
      Type: 'Filespec',
      F: PDFString.of('encrypted.txt'),
      EF: { F: embeddedFile },
    }]));
    source.context.trailerInfo.Encrypt = source.context.register(
      source.context.obj({ Filter: 'Standard' }),
    );

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals).toMatchObject({
      encrypted: true,
      associatedFiles: [expect.objectContaining({ bytes: undefined })],
    });
  });

  it('ignore les clés JS et XFA d’un dictionnaire applicatif non sémantique', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const unsupportedStream = source.context.register(source.context.stream(
      'application payload',
      { Filter: 'LZWDecode' },
    ));
    source.catalog.set(PDFName.of('ExtensionData'), source.context.obj({
      JS: unsupportedStream,
      XFA: unsupportedStream,
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .resolves.not.toBeNull();
  });

  it('borne l’expansion agrégée des valeurs du dictionnaire Info', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.setTitle('Document');
    const info = source.context.lookupMaybe(source.context.trailerInfo.Info, PDFDict);
    if (!info) throw new Error('Info dictionary fixture creation failed.');
    const valueBytes = 1 * 1_024 * 1_024;
    const sharedValue = source.context.register(PDFString.of('A'.repeat(valueBytes)));
    const entryCount = Math.floor(PDF_PRIVACY_MAX_INFO_EXPANSION_BYTES / valueBytes) + 1;
    for (let index = 0; index < entryCount; index += 1) {
      info.set(PDFName.of(`Custom${String(index)}`), sharedValue);
    }

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('ignore un FileSpec dont EF ne contient aucun flux embarqué', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('FakeFileSpec'), source.context.obj({
      Type: 'Filespec',
      F: PDFString.of('invented.txt'),
      EF: PDFString.of('not-an-embedded-file-dictionary'),
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([]);
  });

  it.each(['Unix', 'Mac', 'DOS'])('inventorie un flux embarqué référencé par /%s', async platformKey => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.flateStream(
      'platform payload',
      { Type: 'EmbeddedFile' },
    ));
    source.catalog.set(PDFName.of('PlatformFileSpec'), source.context.obj({
      Type: 'Filespec',
      [platformKey]: PDFString.of(`${platformKey.toLowerCase()}.txt`),
      EF: { [platformKey]: embeddedFile },
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([
      expect.objectContaining({ fileName: `${platformKey.toLowerCase()}.txt` }),
    ]);
  });

  it('refuse un flux XMP dont la taille décompressée dépasse la limite', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const oversizedXmp = `<x:xmpmeta>${'A'.repeat(PDF_PRIVACY_MAX_XMP_BYTES)}</x:xmpmeta>`;
    source.catalog.set(PDFName.of('Metadata'), source.context.register(source.context.flateStream(
      oversizedXmp,
      { Type: 'Metadata', Subtype: 'XML' },
    )));

    await expect(inspectPdfStructuralSignals(await source.save()))
      .rejects.toBeInstanceOf(PdfActionDictionaryInspectionError);
  });

  it('accepte les filtres PDF textuels standards et leurs chaînes sous la limite', async () => {
    const plain = new TextEncoder().encode('<x:xmpmeta>safe</x:xmpmeta>');
    const fixtures: readonly {
      filters: string | readonly string[];
      contents: Uint8Array;
      decodeParameters?: Readonly<Record<string, number>>;
    }[] = [
      { filters: 'FlateDecode', contents: deflate(plain) },
      {
        filters: 'FlateDecode',
        contents: deflate(Uint8Array.of(0, ...plain)),
        decodeParameters: { Predictor: 12, Columns: plain.byteLength },
      },
      {
        filters: 'FlateDecode',
        contents: deflate(plain),
        decodeParameters: { EarlyChange: 2 },
      },
      { filters: 'LZWDecode', contents: encodeLzwLiteral(plain) },
      { filters: 'ASCII85Decode', contents: encodeAscii85(plain) },
      { filters: 'ASCIIHexDecode', contents: encodeAsciiHex(plain) },
      {
        filters: 'ASCIIHexDecode',
        contents: encodeAsciiHex(plain),
        decodeParameters: { Predictor: 99 },
      },
      { filters: 'RunLengthDecode', contents: encodeRunLengthLiteral(plain) },
      {
        filters: ['ASCII85Decode', 'FlateDecode'],
        contents: encodeAscii85(deflate(plain)),
      },
    ];

    for (const fixture of fixtures) {
      const source = await PDFDocument.create();
      source.addPage();
      source.catalog.set(PDFName.of('Metadata'), source.context.register(source.context.stream(
        Uint8Array.from(fixture.contents),
        {
          Type: 'Metadata',
          Subtype: 'XML',
          Filter: fixture.filters,
          ...(fixture.decodeParameters ? { DecodeParms: fixture.decodeParameters } : {}),
        },
      )));

      await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
        .resolves.not.toBeNull();
    }
  });

  it('refuse EarlyChange hors plage uniquement lorsque le filtre actif est LZW', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('Metadata'), source.context.register(source.context.stream(
      encodeLzwLiteral(new TextEncoder().encode('<x:xmpmeta>safe</x:xmpmeta>')),
      {
        Type: 'Metadata',
        Subtype: 'XML',
        Filter: 'LZWDecode',
        DecodeParms: { EarlyChange: 2 },
      },
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toBeInstanceOf(PdfActionDictionaryInspectionError);
  });

  it('traite /Filter null comme un flux texte non filtré pour XMP, JavaScript et XFA', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const nullFilteredStream = (contents: string): PDFRef => {
      const stream = source.context.stream(contents);
      stream.dict.set(PDFName.of('Filter'), PDFNull);
      return source.context.register(stream);
    };
    const xmp = source.context.stream(
      '<x:xmpmeta>safe</x:xmpmeta>',
      { Type: 'Metadata', Subtype: 'XML' },
    );
    xmp.dict.set(PDFName.of('Filter'), PDFNull);
    source.catalog.set(PDFName.of('Metadata'), source.context.register(xmp));
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action',
      S: 'JavaScript',
      JS: nullFilteredStream('app.alert("safe")'),
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: [],
      XFA: [PDFString.of('datasets'), nullFilteredStream('<xfa>safe</xfa>')],
    }));

    const pdf = await source.save({ useObjectStreams: false });

    expect(new TextDecoder().decode(pdf)).toContain('/Filter null');
    await expect(inspectPdfStructuralSignals(pdf)).resolves.not.toBeNull();
  });

  it('refuse un flux JavaScript dont la taille décompressée dépasse la limite', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const javascript = source.context.register(source.context.flateStream(
      'A'.repeat(PDF_PRIVACY_MAX_JAVASCRIPT_BYTES + 1),
    ));
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action', S: 'JavaScript', JS: javascript,
    }));

    await expect(inspectPdfStructuralSignals(await source.save()))
      .rejects.toBeInstanceOf(PdfActionDictionaryInspectionError);
  });

  it('borne la somme décompressée des scripts documentaires avant PDF.js', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const scriptBytes = PDF_PRIVACY_MAX_JAVASCRIPT_BYTES;
    const scriptCount = Math.floor(
      PDF_PRIVACY_MAX_DOCUMENT_JAVASCRIPT_BYTES / scriptBytes,
    ) + 1;
    const names: (PDFString | PDFRef)[] = [];
    for (let index = 0; index < scriptCount; index += 1) {
      const script = source.context.register(source.context.flateStream('A'.repeat(scriptBytes)));
      const action = source.context.register(source.context.obj({
        Type: 'Action', S: 'JavaScript', JS: script,
      }));
      names.push(PDFString.of(`script-${String(index)}`), action);
    }
    source.catalog.set(PDFName.of('Names'), source.context.obj({
      JavaScript: { Names: names },
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('partage le budget des étapes de décodage entre les flux texte', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const finalBytes = 300 * 1_024;
    const finalScript = new Uint8Array(finalBytes).fill(0x41);
    const encodedScript = deflate(encodeAsciiHex(finalScript));
    const expansionPerScript = (finalBytes * 2) + 1 + finalBytes;
    const scriptCount = Math.floor(
      PDF_PRIVACY_MAX_TEXT_STREAM_EXPANSION_BYTES / expansionPerScript,
    ) + 1;
    const names: (PDFString | PDFRef)[] = [];
    for (let index = 0; index < scriptCount; index += 1) {
      const script = source.context.register(source.context.stream(
        Uint8Array.from(encodedScript),
        { Filter: ['FlateDecode', 'ASCIIHexDecode'] },
      ));
      const action = source.context.register(source.context.obj({
        Type: 'Action', S: 'JavaScript', JS: script,
      }));
      names.push(PDFString.of(`script-${String(index)}`), action);
    }
    source.catalog.set(PDFName.of('Names'), source.context.obj({
      JavaScript: { Names: names },
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('refuse chaque paquet XFA dont la taille décompressée dépasse la limite', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const datasets = source.context.register(source.context.flateStream(
      'A'.repeat(PDF_PRIVACY_MAX_XFA_BYTES + 1),
    ));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: [],
      XFA: [PDFString.of('datasets'), datasets],
    }));

    await expect(inspectPdfStructuralSignals(await source.save()))
      .rejects.toBeInstanceOf(PdfActionDictionaryInspectionError);
  });

  it('ne tente pas de décompresser les flux encore chiffrés du parseur structurel', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('Metadata'), source.context.flateStream(
      'A'.repeat(PDF_PRIVACY_MAX_XMP_BYTES + 1),
      { Type: 'Metadata', Subtype: 'XML' },
    ));
    source.context.trailerInfo.Encrypt = source.context.register(
      source.context.obj({ Filter: 'Standard' }),
    );

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .resolves.toMatchObject({
        encrypted: true,
      });
  });

  it('identifie le JavaScript de formulaire avant toute expansion PDF.js', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('Annots'), source.context.obj([{
      Type: 'Annot', Subtype: 'Widget', FT: 'Tx', Rect: [0, 0, 10, 10],
      AA: { K: { Type: 'Action', S: 'JavaScript', JS: PDFString.of('validate()') } },
    }]));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'JavaScript', context: 'field-additional-action', occurrences: 1,
    });
  });

  it('borne l’expansion agrégée d’un script hérité par les widgets', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const javascript = source.context.register(source.context.flateStream(
      'A'.repeat(PDF_PRIVACY_MAX_JAVASCRIPT_BYTES),
    ));
    const field = source.context.obj({
      FT: 'Tx', T: PDFString.of('shared'), Kids: [],
      AA: { K: { Type: 'Action', S: 'JavaScript', JS: javascript } },
    });
    const fieldRef = source.context.register(field);
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES / PDF_PRIVACY_MAX_JAVASCRIPT_BYTES,
    ) + 1;
    const widgets = Array.from({ length: widgetCount }, () => source.context.register(
      source.context.obj({
        Type: 'Annot', Subtype: 'Widget', Rect: [0, 0, 10, 10], Parent: fieldRef,
      }),
    ));
    field.set(PDFName.of('Kids'), source.context.obj(widgets));
    page.node.set(PDFName.of('Annots'), source.context.obj(widgets));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [fieldRef] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('borne un script porté par un champ intermédiaire dont FT est hérité', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const javascriptBytes = 1 * 1_024 * 1_024;
    const javascript = source.context.register(source.context.flateStream(
      'A'.repeat(javascriptBytes),
    ));
    const intermediate = source.context.obj({
      T: PDFString.of('Intermediate'),
      AA: { K: { Type: 'Action', S: 'JavaScript', JS: javascript } },
      Kids: [],
    });
    const intermediateRef = source.context.register(intermediate);
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES / javascriptBytes,
    ) + 1;
    const widgets = Array.from({ length: widgetCount }, () => source.context.register(
      source.context.obj({
        Type: 'Annot', Subtype: 'Widget', Rect: [0, 0, 10, 10], Parent: intermediateRef,
      }),
    ));
    intermediate.set(PDFName.of('Kids'), source.context.obj(widgets));
    const parent = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Parent'), Kids: [intermediateRef],
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj(widgets));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [parent] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('ne facture pas un script de champ aux champs indépendants', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const javascript = source.context.register(PDFString.of('A'.repeat(40 * 1_024)));
    const scriptedField = source.context.register(source.context.obj({
      FT: 'Tx',
      T: PDFString.of('Scripted'),
      AA: { K: { Type: 'Action', S: 'JavaScript', JS: javascript } },
    }));
    const unrelatedFields = Array.from({ length: 1_000 }, () => (
      source.context.register(source.context.obj({ FT: 'Tx' }))
    ));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: [scriptedField, ...unrelatedFields],
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .resolves.not.toBeNull();
  });

  it('borne le nombre de champs avant leur normalisation par PDF.js', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: Array.from(
        { length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 },
        (_, index) => source.context.obj({ FT: 'Tx', T: PDFString.of(`field-${String(index)}`) }),
      ),
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('compte chaque occurrence d’une même référence dans Fields', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const field = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Repeated'),
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: Array.from({ length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 }, () => field),
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('facture une valeur partagée pour chaque référence de champ répétée', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const valueBytes = 1 * 1_024 * 1_024;
    const value = source.context.register(PDFString.of('A'.repeat(valueBytes)));
    const field = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Repeated'), V: value,
    }));
    const fieldCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES / valueBytes,
    ) + 1;
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: Array.from({ length: fieldCount }, () => field),
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('rejette un cycle dans l’arbre des champs', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const field = source.context.obj({ FT: 'Tx', T: PDFString.of('Cyclic') });
    const fieldReference = source.context.register(field);
    field.set(PDFName.of('Kids'), source.context.obj([fieldReference]));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      Fields: [fieldReference],
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('borne le nombre de signets avant leur normalisation par PDF.js', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const outlineRoot = source.context.obj({ Type: 'Outlines' });
    const outlineRootRef = source.context.register(outlineRoot);
    let first: PDFRef | undefined;
    let last: PDFRef | undefined;
    for (let index = 0; index <= PDF_PRIVACY_MAX_DISCOVERED_ITEMS; index += 1) {
      const item = source.context.register(source.context.obj({
        Title: PDFString.of(`Section ${String(index)}`),
        Parent: outlineRootRef,
        ...(first ? { Next: first } : {}),
      }));
      last ??= item;
      first = item;
    }
    if (!first || !last) throw new Error('Outline fixture creation failed.');
    outlineRoot.set(PDFName.of('First'), first);
    outlineRoot.set(PDFName.of('Last'), last);
    source.catalog.set(PDFName.of('Outlines'), outlineRootRef);

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le nombre d’annotations avant leur normalisation par PDF.js', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const annotations = Array.from(
      { length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 },
      (_, index) => source.context.register(source.context.obj({
        Type: 'Annot',
        Subtype: 'Text',
        Rect: [0, 0, 10, 10],
        Contents: PDFString.of(`Note ${String(index)}`),
      })),
    );
    page.node.set(PDFName.of('Annots'), source.context.obj(annotations));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne l’expansion répétée d’une cible partagée par les annotations', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const targetBytes = 1 * 1_024 * 1_024;
    const target = source.context.register(PDFString.of('A'.repeat(targetBytes)));
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'URI', URI: target,
    }));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES / targetBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], A: action,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les cibles chaînées des actions additionnelles par annotation', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const targetBytes = 1 * 1_024 * 1_024;
    const target = source.context.register(PDFString.of('A'.repeat(targetBytes)));
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'GoTo',
      Next: { Type: 'Action', S: 'URI', URI: target },
    }));
    const additionalActions = source.context.register(source.context.obj({ D: action }));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES / targetBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], AA: additionalActions,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne la normalisation répétée du texte partagé par les annotations', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const textBytes = 1 * 1_024 * 1_024;
    const contents = source.context.register(PDFString.of('A'.repeat(textBytes)));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES / textBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Text', Rect: [0, 0, 10, 10], Contents: contents,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les métadonnées FileSpec matérialisées pour chaque annotation de pièce jointe', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const metadataBytes = 1 * 1_024 * 1_024;
    const metadata = source.context.register(PDFString.of('A'.repeat(metadataBytes)));
    const fileSpec = source.context.register(source.context.obj({
      Type: 'Filespec', UF: metadata, Desc: metadata,
    }));
    const bytesPerAnnotation = metadataBytes * 2;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES / bytesPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'FileAttachment', Rect: [0, 0, 10, 10], FS: fileSpec,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne la normalisation répétée d’une géométrie partagée par les annotations', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const coordinatesPerAnnotation = 4_096;
    const quadPoints = source.context.register(source.context.obj(
      Array.from({ length: coordinatesPerAnnotation }, () => 0),
    ));
    const geometryBytes = coordinatesPerAnnotation * 8 + 32;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES / geometryBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Highlight', Rect: [0, 0, 10, 10], QuadPoints: quadPoints,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les tableaux de contenu optionnel matérialisés pour chaque annotation', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const entriesPerAnnotation = 4_096;
    const optionalContentGroup = source.context.register(source.context.obj({ Type: 'OCG' }));
    const groups = source.context.register(source.context.obj(Array.from(
      { length: entriesPerAnnotation },
      () => optionalContentGroup,
    )));
    const optionalContent = source.context.register(source.context.obj({
      Type: 'OCMD', OCGs: groups,
    }));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_OPTIONAL_CONTENT_EXPANSION_ENTRIES / entriesPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Text', Rect: [0, 0, 10, 10], OC: optionalContent,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les configurations RichMedia matérialisées pour chaque annotation', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const instancesPerAnnotation = 4_096;
    const instance = source.context.register(source.context.obj({ Type: 'RichMediaInstance' }));
    const instances = source.context.register(source.context.obj(Array.from(
      { length: instancesPerAnnotation },
      () => instance,
    )));
    const configuration = source.context.register(source.context.obj({ Instances: instances }));
    const content = source.context.register(source.context.obj({
      Configurations: [configuration],
    }));
    const entriesPerAnnotation = instancesPerAnnotation + 1;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_RICH_MEDIA_EXPANSION_ENTRIES / entriesPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'RichMedia', Rect: [0, 0, 10, 10],
        RichMediaContent: content,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le texte FileSpec RichMedia matérialisé pour chaque annotation', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const textBytes = 1 * 1_024 * 1_024;
    const metadata = source.context.register(PDFString.of('A'.repeat(textBytes)));
    const embeddedFile = source.context.register(source.context.stream(Uint8Array.of(1), {
      Type: 'EmbeddedFile', Subtype: 'audio#2Fmpeg',
    }));
    const asset = source.context.register(source.context.obj({
      Type: 'Filespec', UF: metadata, Desc: metadata, EF: { UF: embeddedFile },
    }));
    const instance = source.context.register(source.context.obj({ Asset: asset }));
    const configuration = source.context.register(source.context.obj({ Instances: [instance] }));
    const content = source.context.register(source.context.obj({
      Configurations: [configuration],
    }));
    const bytesPerAnnotation = textBytes * 2;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_MEDIA_TEXT_EXPANSION_BYTES / bytesPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'RichMedia', Rect: [0, 0, 10, 10],
        RichMediaContent: content,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les arbres de rendition Screen parcourus pour chaque annotation', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const renditionsPerAnnotation = 4_096;
    const renditionTree = source.context.register(source.context.obj({
      S: 'SR', R: Array.from({ length: renditionsPerAnnotation }, () => PDFName.of('Invalid')),
    }));
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'Rendition', R: renditionTree,
    }));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_RENDITION_EXPANSION_ENTRIES / renditionsPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Screen', Rect: [0, 0, 10, 10], A: action,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les tableaux de bordure et tirets partagés par les annotations', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const dashCoordinates = 4_096;
    const dashArray = source.context.register(source.context.obj(
      Array.from({ length: dashCoordinates }, () => 1),
    ));
    const borderStyle = source.context.register(source.context.obj({ W: 1, D: dashArray }));
    const geometryBytes = dashCoordinates * 8 + 32;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES / geometryBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], BS: borderStyle,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les tableaux de couleur et de fin de ligne partagés avant leur clonage', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const coordinatesPerColor = 4_096;
    const color = source.context.register(source.context.obj(
      Array.from({ length: coordinatesPerColor }, () => 0.5),
    ));
    const appearanceCharacteristics = source.context.register(source.context.obj({
      BC: color, BG: color,
    }));
    const geometryBytes = coordinatesPerColor * 8 + 32;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES / (geometryBytes * 5),
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Line', Rect: [0, 0, 10, 10], L: [0, 0, 1, 1],
        C: color, IC: color, LE: color, MK: appearanceCharacteristics,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les textes et couleurs d’un parent partagé matérialisés par les popups', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const metadataBytes = 1 * 1_024 * 1_024;
    const metadata = source.context.register(PDFString.of('A'.repeat(metadataBytes)));
    const parent = source.context.register(source.context.obj({
      Type: 'Annot', Subtype: 'Text', Rect: [0, 0, 10, 10],
      T: metadata, Contents: metadata, RC: metadata,
    }));
    const bytesPerAnnotation = metadataBytes * 3;
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES / bytesPerAnnotation,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Popup', Rect: [0, 0, 10, 10], Parent: parent,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les annotations des feuilles de page sans Type explicite', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.delete(PDFName.of('Type'));
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 },
      () => source.context.register(source.context.obj({
        Subtype: 'Text', Rect: [0, 0, 10, 10], Contents: PDFString.of('note'),
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le décodage répété d’un JavaScript partagé par les annotations', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const javascriptBytes = 1 * 1_024 * 1_024;
    const javascript = source.context.register(source.context.flateStream(
      'A'.repeat(javascriptBytes),
    ));
    const action = source.context.register(source.context.obj({
      Type: 'Action', S: 'JavaScript', JS: javascript,
    }));
    const annotationCount = Math.floor(
      PDF_PRIVACY_MAX_ANNOTATION_JAVASCRIPT_EXPANSION_BYTES / javascriptBytes,
    ) + 1;
    page.node.set(PDFName.of('Annots'), source.context.obj(Array.from(
      { length: annotationCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10], A: action,
      })),
    )));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne la croissance cumulée des noms qualifiés de champs', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const partBytes = 1_024;
    const fieldDepth = Math.ceil(Math.sqrt(
      2 * PDF_PRIVACY_MAX_FIELD_NAME_EXPANSION_BYTES / partBytes,
    )) + 1;
    let child = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('A'.repeat(partBytes)),
    }));
    for (let index = 1; index < fieldDepth; index += 1) {
      child = source.context.register(source.context.obj({
        FT: 'Tx', T: PDFString.of('A'.repeat(partBytes)), Kids: [child],
      }));
    }
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [child] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('borne l’expansion agrégée des signatures avant getSignatures', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const payloadBytes = 1 * 1_024 * 1_024;
    const signature = source.context.register(source.context.obj({
      Type: 'Sig',
      ByteRange: [0, 1, 2, 1],
      Contents: PDFString.of('A'.repeat(payloadBytes)),
    }));
    const signatureCount = Math.floor(
      PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES / payloadBytes,
    ) + 1;
    const fields = Array.from({ length: signatureCount }, (_, index) => (
      source.context.register(source.context.obj({
        FT: 'Sig', T: PDFString.of(`signature-${String(index)}`), V: signature,
      }))
    ));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: fields }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne les métadonnées de signature partagées avant leur décodage répété', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const metadataBytes = 4_000;
    const sharedMetadata = source.context.register(PDFString.of('A'.repeat(metadataBytes)));
    const signature = source.context.register(source.context.obj({
      Type: 'Sig',
      ByteRange: [0, 1, 2, 1],
      Contents: PDFString.of('x'),
      Name: sharedMetadata,
      SubFilter: sharedMetadata,
      ContactInfo: sharedMetadata,
      Location: sharedMetadata,
      Reason: sharedMetadata,
      M: sharedMetadata,
    }));
    const bytesPerOccurrence = 1 + (7 * metadataBytes);
    const signatureCount = Math.floor(
      PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES / bytesPerOccurrence,
    ) + 1;
    const fields = Array.from({ length: signatureCount }, () => (
      source.context.register(source.context.obj({
        FT: 'Sig', T: sharedMetadata, V: signature,
      }))
    ));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: fields }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne l’expansion répétée d’une valeur héritée par les widgets', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const valueBytes = 1 * 1_024 * 1_024;
    const value = source.context.register(PDFString.of('A'.repeat(valueBytes)));
    const widgetCount = Math.floor(PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES / valueBytes) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', T: PDFString.of('Entry'),
      })),
    );
    const parent = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Shared'), V: value, Kids: widgets,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [parent] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne la matérialisation répétée des options héritées par les widgets', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const optionBytes = 1 * 1_024 * 1_024;
    const option = source.context.register(PDFString.of('A'.repeat(optionBytes)));
    const options = source.context.register(source.context.obj([option]));
    const normalizedOptionBytes = optionBytes + 64;
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_OPTION_EXPANSION_BYTES / normalizedOptionBytes,
    ) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', T: PDFString.of('Choice'),
      })),
    );
    const parent = source.context.register(source.context.obj({
      FT: 'Ch', T: PDFString.of('Shared'), Opt: options, Kids: widgets,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [parent] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le clonage répété des index partagés par les champs de choix', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const indicesPerField = 4_096;
    const indices = source.context.register(source.context.obj(
      Array.from({ length: indicesPerField }, () => 0),
    ));
    const normalizedIndexBytes = indicesPerField * 8 + 32;
    const fieldCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_INDEX_EXPANSION_BYTES / normalizedIndexBytes,
    ) + 1;
    const fields = Array.from(
      { length: fieldCount },
      () => source.context.register(source.context.obj({
        FT: 'Ch', T: PDFString.of('Choice'), I: indices,
      })),
    );
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: fields }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le parsing répété de l’apparence par défaut héritée', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const appearanceBytes = 1 * 1_024 * 1_024;
    const appearance = source.context.register(PDFString.of('A'.repeat(appearanceBytes)));
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_APPEARANCE_EXPANSION_BYTES / appearanceBytes,
    ) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', T: PDFString.of('Entry'),
      })),
    );
    const parent = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Shared'), DA: appearance, Kids: widgets,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [parent] }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne la fusion répétée des ressources DR héritées avant PDF.js', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const fontEntries = 2_048;
    const localFonts = source.context.obj({});
    const globalFonts = source.context.obj({});
    for (let index = 0; index < fontEntries; index += 1) {
      const key = PDFName.of(`F${String(index)}`);
      localFonts.set(key, PDFName.of('Helvetica'));
      globalFonts.set(key, PDFName.of('Helvetica'));
    }
    const localResources = source.context.obj({ Font: localFonts });
    const globalResources = source.context.obj({ Font: globalFonts });
    const mergeEntriesPerOccurrence = 3 + (fontEntries * 2);
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_RESOURCE_MERGE_ENTRIES / mergeEntriesPerOccurrence,
    ) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', T: PDFString.of('Entry'),
      })),
    );
    const parent = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Shared'), DR: localResources, Kids: widgets,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      DR: globalResources,
      Fields: [parent],
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('inclut les ressources de l’apparence sélectionnée dans le budget de fusion', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const appearanceFontEntries = 2_048;
    const appearanceFonts = source.context.obj({});
    for (let index = 0; index < appearanceFontEntries; index += 1) {
      appearanceFonts.set(PDFName.of(`F${String(index)}`), PDFName.of('Helvetica'));
    }
    const localResources = source.context.obj({ Font: { Local: 'Helvetica' } });
    const globalResources = source.context.obj({ Font: { Global: 'Helvetica' } });
    const appearanceResources = source.context.obj({ Font: appearanceFonts });
    const appearance = source.context.register(source.context.flateStream('', {
      Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 1, 1], Resources: appearanceResources,
    }));
    const mergeEntriesPerOccurrence = 4 + appearanceFontEntries + 2;
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_RESOURCE_MERGE_ENTRIES / mergeEntriesPerOccurrence,
    ) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', T: PDFString.of('Entry'), AP: { N: appearance },
      })),
    );
    const parent = source.context.register(source.context.obj({
      FT: 'Tx', T: PDFString.of('Shared'), DR: localResources, Kids: widgets,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({
      DR: globalResources,
      Fields: [parent],
    }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le décodage répété du texte alternatif partagé par les widgets', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const alternateTextBytes = 1 * 1_024 * 1_024;
    const alternateText = source.context.register(PDFString.of('A'.repeat(alternateTextBytes)));
    const widgetCount = Math.floor(
      PDF_PRIVACY_MAX_FIELD_ALTERNATE_TEXT_EXPANSION_BYTES / alternateTextBytes,
    ) + 1;
    const widgets = Array.from(
      { length: widgetCount },
      () => source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Widget', FT: 'Tx', TU: alternateText,
      })),
    );
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: widgets }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne l’expansion répétée des valeurs partagées du plan', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const titleBytes = 1 * 1_024 * 1_024;
    const title = source.context.register(PDFString.of('A'.repeat(titleBytes)));
    const outlineCount = Math.floor(PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES / titleBytes) + 1;
    let next: PDFRef | undefined;
    for (let index = outlineCount - 1; index >= 0; index -= 1) {
      const item = source.context.obj({ Title: title });
      if (next) item.set(PDFName.of('Next'), next);
      next = source.context.register(item);
    }
    source.catalog.set(PDFName.of('Outlines'), source.context.obj({ First: next }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('borne le clonage répété d’une couleur partagée par les signets', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const coordinatesPerColor = 4_096;
    const color = source.context.register(source.context.obj(
      Array.from({ length: coordinatesPerColor }, () => 0.5),
    ));
    const normalizedColorBytes = coordinatesPerColor * 8 + 32;
    const outlineCount = Math.floor(
      PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES / normalizedColorBytes,
    ) + 1;
    let next: PDFRef | undefined;
    for (let index = outlineCount - 1; index >= 0; index -= 1) {
      const item = source.context.obj({ Title: PDFString.of('Section'), C: color });
      if (next) item.set(PDFName.of('Next'), next);
      next = source.context.register(item);
    }
    source.catalog.set(PDFName.of('Outlines'), source.context.obj({ First: next }));

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('préserve une signature structurelle valide même sans SigFlags', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const signature = source.context.register(source.context.obj({
      Type: 'Sig',
      ByteRange: [0, 1, 2, 1],
      Contents: PDFString.of('signed'),
      SubFilter: 'ETSI.CAdES.detached',
      Name: PDFString.of('Alice'),
      ContactInfo: PDFString.of('alice@example.test'),
      Reason: PDFString.of('Validation interne'),
    }));
    const field = source.context.register(source.context.obj({
      FT: 'Sig', T: PDFString.of('Approval'), V: signature,
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [field] }));

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals?.signatures).toEqual([{
      fieldName: 'Approval',
      signerName: 'Alice',
      subFilter: 'ETSI.CAdES.detached',
      contactInfo: 'alice@example.test',
      location: undefined,
      reason: 'Validation interne',
      signingTime: undefined,
    }]);
  });

  it('préserve une signature dont le type de champ est hérité', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const signature = source.context.register(source.context.obj({
      Type: 'Sig',
      ByteRange: [0, 1, 2, 1],
      Contents: PDFString.of('signed'),
      Name: PDFString.of('Alice'),
    }));
    const child = source.context.register(source.context.obj({
      T: PDFString.of('Approval'), V: signature,
    }));
    const parent = source.context.register(source.context.obj({
      FT: 'Sig', T: PDFString.of('Signatures'), Kids: [child],
    }));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: [parent] }));

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals?.signatures).toContainEqual(expect.objectContaining({
      fieldName: 'Approval',
      signerName: 'Alice',
    }));
  });

  it('borne le balayage agrégé des queues de signature avant getSignatures', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const signature = source.context.register(source.context.obj({
      Type: 'Sig',
      ByteRange: [0, 1, 2, 9_999_999],
      Contents: PDFString.of('signed'),
    }));
    const tailBytes = 1 * 1_024 * 1_024;
    const signatureCount = Math.floor(PDF_PRIVACY_MAX_SIGNATURE_TAIL_BYTES / tailBytes) + 1;
    const fields = Array.from({ length: signatureCount }, (_, index) => (
      source.context.register(source.context.obj({
        FT: 'Sig', T: PDFString.of(`signature-tail-${String(index)}`), V: signature,
      }))
    ));
    source.catalog.set(PDFName.of('AcroForm'), source.context.obj({ Fields: fields }));
    const base = await source.save({ useObjectStreams: false });
    const marker = new TextEncoder().encode('9999999');
    const markerIndex = findByteSequence(base, marker);
    const signedLength = String(base.byteLength - 2).padStart(marker.byteLength, '0');
    if (markerIndex < 0 || signedLength.length !== marker.byteLength) {
      throw new Error('Signature ByteRange fixture creation failed.');
    }
    base.set(new TextEncoder().encode(signedLength), markerIndex);
    const withWhitespaceTail = new Uint8Array(base.byteLength + tailBytes);
    withWhitespaceTail.set(base);
    withWhitespaceTail.fill(0x20, base.byteLength);

    await expect(inspectPdfStructuralSignals(withWhitespaceTail))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  }, 30_000);

  it('conserve le nom d’une action additionnelle automatique', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('AA'), source.context.obj({
      O: { Type: 'Action', S: 'Named', N: 'Print' },
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'Named', context: 'page-additional-action', target: 'Print', occurrences: 1,
    });
  });

  it('agrège les dictionnaires identiques sans modifier la casse des cibles', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('AA'), source.context.obj({
      O: { S: 'Launch', F: PDFString.of('Report.EXE') },
      C: { S: 'Launch', F: PDFString.of('Report.EXE') },
    }));

    await expect(inspectPdfStructuralSignals(await source.save())).resolves.toMatchObject({
      actionDictionaries: [
        {
          actionType: 'Launch', context: 'page-additional-action',
          target: 'Report.EXE', occurrences: 2,
        },
      ],
    });
  });

  it('détecte une action Sound lancée automatiquement dans un vrai PDF', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const sound = source.context.register(source.context.stream(
      Uint8Array.of(0, 1, 2, 3),
      { R: 8_000, C: 1, B: 8, E: PDFName.of('Signed') },
    ));
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action',
      S: 'Sound',
      Sound: sound,
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'Sound', context: 'open-action', occurrences: 1,
    });
  });

  it('parcourt les grands tableaux sous la limite sans dépendre de la pile V8', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(
      PDFName.of('LargeArray'),
      source.context.obj(Array.from({ length: 130_000 }, () => 0)),
    );
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action',
      S: 'SubmitForm',
      F: PDFString.of('https://submit.example/large-array'),
    }));

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'SubmitForm',
      context: 'open-action',
      target: 'https://submit.example/large-array',
      occurrences: 1,
    });
  });

  it('rejette un tableau dépassant le budget sans remplir la file de parcours', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(
      PDFName.of('OversizedArray'),
      source.context.obj(Array.from({ length: 250_001 }, () => 0)),
    );

    await expect(inspectPdfStructuralSignals(
      await source.save({ useObjectStreams: false }),
    )).rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('parcourt une chaîne Next bornée sans dépendre de la pile JavaScript', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    let next = source.context.register(source.context.obj({
      Type: 'Action',
      S: 'SubmitForm',
      F: PDFString.of('https://submit.example/deep-chain'),
    }));
    for (let index = 0; index < PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH; index += 1) {
      next = source.context.register(source.context.obj({
        Type: 'Action',
        S: 'GoTo',
        D: [page.ref, PDFName.of('Fit')],
        Next: next,
      }));
    }
    source.catalog.set(PDFName.of('OpenAction'), next);

    const signals = await inspectPdfStructuralSignals(await source.save({ useObjectStreams: false }));

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'SubmitForm',
      context: 'next-action',
      target: 'https://submit.example/deep-chain',
      occurrences: 1,
    });
  });

  it('suit Next même si le discriminateur de l’action courante est malformé', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
      Type: 'Action',
      S: PDFString.of('invalid-name-object'),
      Next: {
        Type: 'Action',
        S: 'SubmitForm',
        F: PDFString.of('https://submit.example/after-malformed'),
      },
    }));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'SubmitForm',
      context: 'next-action',
      target: 'https://submit.example/after-malformed',
      occurrences: 1,
    });
  });

  it('borne les tableaux d’actions imbriqués avant la normalisation récursive', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    let nested = source.context.register(source.context.obj({
      Type: 'Action', S: 'JavaScript', JS: PDFString.of('safe()'),
    }));
    for (let index = 0; index <= PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH; index += 1) {
      nested = source.context.register(source.context.obj([nested]));
    }
    source.catalog.set(PDFName.of('OpenAction'), nested);

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('rejette une chaîne Next avant la limite de récursion de PDF.js', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    let next = source.context.register(source.context.obj({ Type: 'Action', S: 'GoTo' }));
    for (let index = 0; index <= PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH; index += 1) {
      next = source.context.register(source.context.obj({
        Type: 'Action', S: 'GoTo', Next: next,
      }));
    }
    source.catalog.set(PDFName.of('OpenAction'), next);

    await expect(inspectPdfStructuralSignals(await source.save({ useObjectStreams: false })))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('ne confond pas une cible FileSpec externe avec une pièce jointe', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const externalFile = source.context.register(source.context.obj({
      Type: 'Filespec',
      F: PDFString.of('remote.pdf'),
    }));
    page.node.set(PDFName.of('Annots'), source.context.obj([
      source.context.register(source.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10],
        A: { Type: 'Action', S: 'GoToR', F: externalFile },
      })),
    ]));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([]);
    expect(signals?.actionDictionaries).toContainEqual({
      actionType: 'GoToR',
      context: 'annotation-action',
      target: 'remote.pdf',
      occurrences: 1,
    });
  });

  it('laisse PDF.js décider de la validité si le parseur secondaire échoue', async () => {
    await expect(inspectPdfStructuralSignals(new TextEncoder().encode('not a pdf')))
      .resolves.toBeNull();
  });
});

function findByteSequence(haystack: Uint8Array, needle: Uint8Array): number {
  for (let start = 0; start <= haystack.byteLength - needle.byteLength; start += 1) {
    let matches = true;
    for (let index = 0; index < needle.byteLength; index += 1) {
      if (haystack[start + index] !== needle[index]) {
        matches = false;
        break;
      }
    }
    if (matches) return start;
  }
  return -1;
}

function joinBytes(...parts: readonly (Uint8Array | string)[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks = parts.map(part => typeof part === 'string' ? encoder.encode(part) : part);
  let byteLength = 0;
  for (const chunk of chunks) byteLength += chunk.byteLength;
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function encodeAsciiHex(contents: Uint8Array): Uint8Array {
  const hex = [...contents]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');
  return new TextEncoder().encode(`${hex}>`);
}

function encodeAscii85(contents: Uint8Array): Uint8Array {
  let encoded = '';
  for (let offset = 0; offset < contents.byteLength; offset += 4) {
    const byteCount = Math.min(4, contents.byteLength - offset);
    let value = 0;
    for (let index = 0; index < 4; index += 1) {
      value = value * 256 + (contents[offset + index] ?? 0);
    }
    if (byteCount === 4 && value === 0) {
      encoded += 'z';
      continue;
    }
    const digits = new Array<number>(5);
    for (let index = 4; index >= 0; index -= 1) {
      digits[index] = value % 85;
      value = Math.floor(value / 85);
    }
    encoded += digits.slice(0, byteCount + 1)
      .map(digit => String.fromCharCode(digit + 0x21))
      .join('');
  }
  return new TextEncoder().encode(`${encoded}~>`);
}

function encodeRunLengthLiteral(contents: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  let byteLength = 1;
  for (let offset = 0; offset < contents.byteLength; offset += 128) {
    const chunk = contents.slice(offset, offset + 128);
    chunks.push(Uint8Array.of(chunk.byteLength - 1, ...chunk));
    byteLength += chunk.byteLength + 1;
  }
  const encoded = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    encoded.set(chunk, offset);
    offset += chunk.byteLength;
  }
  encoded[offset] = 128;
  return encoded;
}

function encodeTiffPredictor(
  contents: Uint8Array,
  bitsPerComponent: 1 | 2 | 4,
): Uint8Array {
  const encoded = new Uint8Array(contents.byteLength);
  const sampleMask = (1 << bitsPerComponent) - 1;
  let previous = 0;
  const sampleCount = contents.byteLength * 8 / bitsPerComponent;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const bitOffset = sample * bitsPerComponent;
    const byteOffset = Math.floor(bitOffset / 8);
    const shift = 8 - bitsPerComponent - (bitOffset % 8);
    const current = (contents[byteOffset] >> shift) & sampleMask;
    const difference = (current - previous) & sampleMask;
    previous = current;
    encoded[byteOffset] = encoded[byteOffset] | (difference << shift);
  }
  return encoded;
}

function encodeLzwLiteral(contents: Uint8Array): Uint8Array {
  const codes = [256, ...contents, 257];
  const bitLength = codes.length * 9;
  const encoded = new Uint8Array(Math.ceil(bitLength / 8));
  let bitOffset = 0;
  for (const code of codes) {
    for (let index = 8; index >= 0; index -= 1) {
      if ((code & (1 << index)) !== 0) {
        const byteIndex = Math.floor(bitOffset / 8);
        encoded[byteIndex] = encoded[byteIndex] | (1 << (7 - (bitOffset % 8)));
      }
      bitOffset += 1;
    }
  }
  return encoded;
}
