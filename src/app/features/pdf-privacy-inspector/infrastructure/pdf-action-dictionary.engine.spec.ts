import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { inspectPdfActionDictionaries } from './pdf-action-dictionary.engine';

describe('inspectPdfActionDictionaries', () => {
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
    ]));

    const signals = await inspectPdfActionDictionaries(await source.save());

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
    ]));
  });

  it('agrège les dictionnaires identiques sans modifier la casse des cibles', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(PDFName.of('AA'), source.context.obj({
      O: { S: 'Launch', F: PDFString.of('Report.EXE') },
      C: { S: 'Launch', F: PDFString.of('Report.EXE') },
    }));

    await expect(inspectPdfActionDictionaries(await source.save())).resolves.toEqual([
      {
        actionType: 'Launch', context: 'additional-action',
        target: 'Report.EXE', occurrences: 2,
      },
    ]);
  });

  it('laisse PDF.js décider de la validité si le parseur secondaire échoue', async () => {
    await expect(inspectPdfActionDictionaries(new TextEncoder().encode('not a pdf')))
      .resolves.toBeNull();
  });
});
