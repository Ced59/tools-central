import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { inspectPdfStructuralSignals } from './pdf-action-dictionary.engine';

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

  it('parcourt une chaîne Next profonde sans dépendre de la pile JavaScript', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    let next = source.context.register(source.context.obj({
      Type: 'Action',
      S: 'SubmitForm',
      F: PDFString.of('https://submit.example/deep-chain'),
    }));
    for (let index = 0; index < 6_000; index += 1) {
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
  }, 15_000);

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
