import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import {
  PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH,
  PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES,
  PDF_PRIVACY_MAX_JAVASCRIPT_BYTES,
  PDF_PRIVACY_MAX_XMP_BYTES,
  PDF_PRIVACY_MAX_XFA_BYTES,
  PdfActionDictionaryInspectionError,
  inspectPdfStructuralSignals,
} from './pdf-action-dictionary.engine';

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
    const embeddedFile = source.context.register(source.context.flateStream(
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
    expect(signals?.associatedFiles[0]?.bytes).toBeGreaterThan(0);
  });

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
      .resolves.toMatchObject({ encrypted: true });
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
