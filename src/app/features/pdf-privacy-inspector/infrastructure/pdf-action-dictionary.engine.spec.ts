import { PDFDict, PDFDocument, PDFName, PDFRef, PDFString } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import {
  PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH,
  PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_JAVASCRIPT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_DOCUMENT_JAVASCRIPT_BYTES,
  PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_APPEARANCE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_NAME_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_OPTION_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_JAVASCRIPT_BYTES,
  PDF_PRIVACY_MAX_NAMETREE_JAVASCRIPT_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_INFO_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_SIGNATURE_TAIL_BYTES,
  PDF_PRIVACY_MAX_XMP_BYTES,
  PDF_PRIVACY_MAX_XFA_BYTES,
  PdfActionDictionaryInspectionError,
  inspectPdfStructuralSignals,
} from './pdf-action-dictionary.engine';
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

    const signals = await inspectPdfStructuralSignals(await source.save());

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
      F: PDFString.of(`${platformKey.toLowerCase()}.txt`),
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

  it('accepte un flux XMP compressé sous la limite', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    source.catalog.set(PDFName.of('Metadata'), source.context.register(source.context.flateStream(
      '<x:xmpmeta>safe</x:xmpmeta>',
      { Type: 'Metadata', Subtype: 'XML' },
    )));

    await expect(inspectPdfStructuralSignals(await source.save())).resolves.not.toBeNull();
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
        hasUnboundedEncryptedTextStreams: true,
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
