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

  it('inventorie un fichier associé AF absent de la name tree', async () => {
    const source = await PDFDocument.create();
    source.addPage();
    const embeddedFile = source.context.register(source.context.flateStream(
      'associated payload',
      { Type: 'EmbeddedFile', Subtype: PDFName.of('text#2Fplain') },
    ));
    const fileSpec = source.context.register(source.context.obj({
      Type: 'Filespec',
      F: PDFString.of('associated.txt'),
      UF: PDFString.of('associated.txt'),
      Desc: PDFString.of('Associated only'),
      EF: { F: embeddedFile },
    }));
    source.catalog.set(PDFName.of('AF'), source.context.obj([fileSpec]));

    const signals = await inspectPdfStructuralSignals(await source.save());

    expect(signals?.associatedFiles).toEqual([
      expect.objectContaining({
        id: 1,
        fileName: 'associated.txt',
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

  it('laisse PDF.js décider de la validité si le parseur secondaire échoue', async () => {
    await expect(inspectPdfStructuralSignals(new TextEncoder().encode('not a pdf')))
      .resolves.toBeNull();
  });
});
