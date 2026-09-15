import { describe, expect, it, vi } from 'vitest';

import {
  PdfPrivacyEngineError,
  extractPdfVersion,
  inspectPdfPrivacyDocument,
  type PdfJsPrivacyDocument,
  type PdfJsPrivacyPage,
} from './pdf-privacy.engine';
import {
  PDF_PRIVACY_MAX_DISCOVERED_ITEMS,
  PDF_PRIVACY_MAX_PAGES,
} from '../domain/pdf-privacy.models';

function pdfBytes(version = '1.7'): Uint8Array {
  return new TextEncoder().encode(`%PDF-${version}\n%%EOF`);
}

function documentFixture(overrides: Partial<PdfJsPrivacyDocument> = {}): PdfJsPrivacyDocument {
  const page: PdfJsPrivacyPage = {
    getAnnotations: vi.fn().mockResolvedValue([]),
    getJSActions: vi.fn().mockResolvedValue(null),
    cleanup: vi.fn(),
  };
  return {
    numPages: 1,
    getMetadata: vi.fn().mockResolvedValue({ info: {}, metadata: null }),
    getAttachments: vi.fn().mockResolvedValue(null),
    getJSActions: vi.fn().mockResolvedValue(null),
    hasJSActions: vi.fn().mockResolvedValue(false),
    getFieldObjects: vi.fn().mockResolvedValue(null),
    getSignatures: vi.fn().mockResolvedValue(null),
    getPermissions: vi.fn().mockResolvedValue(null),
    getOpenAction: vi.fn().mockResolvedValue(null),
    getOutline: vi.fn().mockResolvedValue(null),
    getPage: vi.fn().mockResolvedValue(page),
    ...overrides,
  };
}

describe('extractPdfVersion', () => {
  it('lit les versions PDF standards dans les 1 024 premiers octets', () => {
    expect(extractPdfVersion(new TextEncoder().encode('préfixe\n%PDF-2.0\n'))).toBe('2.0');
  });

  it('refuse une entrée sans en-tête PDF', () => {
    expect(() => extractPdfVersion(new TextEncoder().encode('pas un pdf')))
      .toThrow(new PdfPrivacyEngineError('invalid-pdf'));
  });
});

describe('inspectPdfPrivacyDocument', () => {
  it('agrège toutes les familles sans exposer le code JavaScript ni les valeurs de formulaire', async () => {
    const cleanup = vi.fn();
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([
        { id: 'l1', url: 'https://tracker.example/click' },
        { id: 'l2', url: 'https://tracker.example/click' },
        { id: 'a1', action: 'Print' },
        { id: 'a2', unsafeUrl: 'calc.exe' },
        { id: 'a3', annotationType: 27, richMedia: { filename: 'demo.swf', contentType: 'application/x-shockwave-flash' } },
      ]),
      getJSActions: vi.fn().mockResolvedValue(new Map([['PageOpen', ['app.alert("secret")']]])),
      cleanup,
    };
    const document = documentFixture({
      numPages: 1,
      getMetadata: vi.fn().mockResolvedValue({
        info: { Author: ' Alice ', PDFFormatVersion: '1.7' },
        metadata: { getAll: () => ({ 'dc:creator': ['Alice'], 'dc:format': 'application/pdf' }) },
      }),
      getAttachments: vi.fn().mockResolvedValue(new Map([
        ['secret.txt', { filename: 'secret.txt', contentType: 'text/plain', content: new Uint8Array(12) }],
      ])),
      getJSActions: vi.fn().mockResolvedValue(new Map([['OpenAction', ['collect()', 'print()']]])),
      hasJSActions: vi.fn().mockResolvedValue(true),
      getFieldObjects: vi.fn().mockResolvedValue(new Map([
        ['email', [{ fieldType: 'Tx', value: 'alice@example.test', actions: { Keystroke: ['x'] } }]],
      ])),
      getSignatures: vi.fn().mockResolvedValue([
        { fieldName: 'Validation', signerName: 'Alice', subFilter: 'ETSI.CAdES.detached', coversWholeDocument: true },
      ]),
      getPermissions: vi.fn().mockResolvedValue(new Set([4, 8])),
      getOpenAction: vi.fn().mockResolvedValue(new Map([['action', 'Print']])),
      getOutline: vi.fn().mockResolvedValue([{ title: 'Site', url: 'https://example.test', items: [] }]),
      getPage: vi.fn().mockResolvedValue(page),
    });

    const report = await inspectPdfPrivacyDocument(document, {
      headerData: pdfBytes(), fileBytes: 3_840, passwordUsed: true,
    });

    expect(report.attentionLevel).toBe('high');
    expect(report.encrypted).toBe(true);
    expect(report.categoryCounts['active-content']).toBeGreaterThanOrEqual(4);
    expect(report.categoryCounts.attachments).toBe(1);
    expect(report.categoryCounts.links).toBe(3);
    expect(report.categoryCounts.forms).toBe(1);
    expect(report.categoryCounts.signatures).toBe(1);
    expect(report.categoryCounts.metadata).toBe(2);
    expect(report.findings.some(finding => finding.value?.includes('alice@example.test'))).toBe(false);
    expect(report.findings.some(finding => finding.value?.includes('collect()'))).toBe(false);
    expect(report.findings.find(finding => finding.kind === 'external-link' && finding.value?.includes('tracker')))
      .toMatchObject({ occurrences: 2, pageNumber: 1 });
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'automatic-action', message: { code: 'named-action' }, value: 'Print' }),
      expect.objectContaining({ kind: 'automatic-action', message: { code: 'unsafe-external-target' }, value: 'calc.exe' }),
    ]));
    expect(report.findings.some(finding => (
      finding.kind === 'automatic-action'
      && finding.message?.code === 'rich-media'
      && finding.value?.includes('demo.swf') === true
    ))).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('inventorie chaque propriété Info personnalisée exposée par PDF.js', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getMetadata: vi.fn().mockResolvedValue({
        info: {
          Custom: new Map<string, unknown>([
            ['ClientEmail', ' client@example.test '],
            ['InternalId', 42],
            ['IgnoredObject', { secret: 'not-a-scalar' }],
          ]),
        },
        metadata: null,
      }),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.filter(finding => finding.kind === 'document-metadata')).toEqual([
      expect.objectContaining({ label: 'ClientEmail', value: 'client@example.test' }),
      expect.objectContaining({ label: 'InternalId', value: '42' }),
    ]);
  });

  it('borne une grande Map de métadonnées personnalisées pendant son itération', async () => {
    const custom = new Map<string, string>();
    for (let index = 0; index <= PDF_PRIVACY_MAX_DISCOVERED_ITEMS; index += 1) {
      custom.set(`Key${String(index)}`, `Value${String(index)}`);
    }

    await expect(inspectPdfPrivacyDocument(documentFixture({
      getMetadata: vi.fn().mockResolvedValue({ info: { Custom: custom }, metadata: null }),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false }))
      .rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('ne demande pas à PDF.js de décoder les pièces jointes déjà inventoriées', async () => {
    const document = documentFixture();
    const getAttachments = vi.spyOn(document, 'getAttachments');

    await inspectPdfPrivacyDocument(document, {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: false,
      associatedFiles: [],
    });

    expect(getAttachments).not.toHaveBeenCalled();
  });

  it('préserve les métadonnées privées renvoyées pour une signature', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getSignatures: vi.fn().mockResolvedValue([{
        fieldName: 'Approval',
        contactInfo: 'signer@example.test',
        location: 'Paris',
        reason: 'Validation interne',
        signingTime: 'D:20260915113000+02\'00\'',
      }]),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.find(finding => finding.kind === 'digital-signature')).toMatchObject({
      severity: 'low',
      message: {
        code: 'signature-details',
        contactInfo: 'signer@example.test',
        location: 'Paris',
        reason: 'Validation interne',
        signingTime: 'D:20260915113000+02\'00\'',
      },
    });
  });

  it('signale un formulaire XFA pur et un JavaScript de champ sans détail disponible', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      isPureXfa: true,
      hasJSActions: vi.fn().mockResolvedValue(true),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'javascript',
        severity: 'high',
        message: { code: 'form-actions-undetailed' },
      }),
      expect.objectContaining({ kind: 'xfa-form', severity: 'medium' }),
    ]));
    expect(report.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'javascript', label: 'Document' }),
    ]));
  });

  it('ne double pas les actions héritées et ignore les contrôles vierges sans valeur', async () => {
    const inheritedActions = new Map([['Keystroke', ['app.alert("secret")']]]);
    const report = await inspectPdfPrivacyDocument(documentFixture({
      hasJSActions: vi.fn().mockResolvedValue(true),
      getFieldObjects: vi.fn().mockResolvedValue(new Map([
        ['consent', [
          { type: 'checkbox', value: 'Off', defaultValue: 'Off', actions: inheritedActions },
          { type: 'checkbox', value: 'Off', defaultValue: 'Off', actions: inheritedActions },
        ]],
        ['submit', [
          { type: 'button', value: 'Off', defaultValue: 'Off' },
        ]],
      ])),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.filter(finding => finding.kind === 'javascript')).toEqual([
      expect.objectContaining({ message: { code: 'form-actions' }, occurrences: 1 }),
    ]);
    expect(report.findings.find(finding => finding.kind === 'form-fields')).toMatchObject({
      severity: 'low',
      message: { code: 'acroform-summary', fieldCount: 2, populatedCount: 0 },
    });
  });

  it('compte deux scripts distincts liés au même événement de champ', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      hasJSActions: vi.fn().mockResolvedValue(true),
      getFieldObjects: vi.fn().mockResolvedValue(new Map([
        ['approval', [
          { actions: new Map([['Mouse Up', ['approve()']]]) },
          { actions: new Map([['Mouse Up', ['reject()']]]) },
        ]],
      ])),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.find(finding => finding.id === 'javascript:forms')).toMatchObject({
      message: { code: 'form-actions' },
      occurrences: 2,
    });
  });

  it('conserve un signal sans détail à côté des actions de champ détaillées', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      hasJSActions: vi.fn().mockResolvedValue(true),
      getFieldObjects: vi.fn().mockResolvedValue(new Map([
        ['approval', [
          { actions: new Map([['Mouse Up', ['approve()']]]) },
          { hasJSActions: true },
        ]],
      ])),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.find(finding => finding.id === 'javascript:forms')).toMatchObject({
      message: { code: 'form-actions' },
      occurrences: 2,
    });
  });

  it('détecte aussi les formulaires XFA hybrides annoncés dans les métadonnées PDF.js', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      isPureXfa: false,
      getMetadata: vi.fn().mockResolvedValue({
        info: { IsXFAPresent: true },
        metadata: null,
      }),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'xfa-form', severity: 'medium' }),
    ]));
  });

  it('inspecte les formes d’action réellement exposées par PDF.js dans le plan', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getOutline: vi.fn().mockResolvedValue([
        { title: 'Programme', unsafeUrl: 'viewer.exe', items: [] },
        { title: 'Annexe', attachment: { filename: 'annexe.pdf' }, items: [] },
        { title: 'Navigation', action: 'Print', items: [] },
      ]),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: { code: 'unsafe-external-target' }, value: 'viewer.exe' }),
      expect.objectContaining({ message: { code: 'attachment-opening' }, value: 'annexe.pdf' }),
      expect.objectContaining({ message: { code: 'named-action' }, value: 'Print' }),
    ]));
  });

  it('signale Launch et SubmitForm même après la normalisation de PDF.js', async () => {
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([
        { id: 'launch', url: 'https://launch.example/run', unsafeUrl: 'https://launch.example/run' },
      ]),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: false,
      actionDictionaries: [
        {
          actionType: 'Launch', context: 'annotation-action',
          target: 'https://launch.example/run', occurrences: 1,
        },
        {
          actionType: 'SubmitForm', context: 'annotation-action',
          target: 'https://submit.example/collect', occurrences: 1,
        },
      ],
    });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'Launch', context: 'other' },
        value: 'https://launch.example/run',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'SubmitForm', context: 'other' },
        value: 'https://submit.example/collect',
      }),
      expect.objectContaining({ kind: 'external-link', value: 'https://launch.example/run' }),
    ]));
  });

  it('préserve les chemins URL sensibles à la casse pendant leur agrégation', async () => {
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([
        { id: 'upper', url: 'https://example.test/Report' },
        { id: 'lower', url: 'https://example.test/report' },
      ]),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings.filter(finding => finding.kind === 'external-link')).toHaveLength(2);
  });

  it('signale une action URI non sûre sans exposer son payload', async () => {
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([
        { id: 'unsafe', unsafeUrl: 'javascript:alert("private-value")' },
      ]),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: false,
      actionDictionaries: [{
        actionType: 'URI',
        context: 'annotation-action',
        target: 'javascript:alert("private-value")',
        occurrences: 1,
      }],
    });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'other' },
        value: 'javascript:…',
      }),
    ]));
    expect(JSON.stringify(report)).not.toContain('private-value');
  });

  it('conserve un JavaScript brut omis des formes publiques de PDF.js', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture(), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: false,
      actionDictionaries: [
        { actionType: 'JavaScript', context: 'annotation-action', occurrences: 1 },
        { actionType: 'JavaScript', context: 'next-action', occurrences: 1 },
        { actionType: 'JavaScript', context: 'annotation-additional-action', occurrences: 1 },
      ],
    });

    expect(report.attentionLevel).toBe('high');
    expect(report.findings.filter(finding => finding.kind === 'javascript')).toEqual([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'JavaScript', context: 'other' },
        occurrences: 1,
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'JavaScript', context: 'chained-action' },
        occurrences: 1,
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'JavaScript', context: 'additional-action' },
        occurrences: 1,
      }),
    ]);
  });

  it('utilise l’inventaire structurel sans doublon de nom normalisé ou chiffré', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getAttachments: vi.fn().mockResolvedValue(new Map([
        ['associated.txt', {
          filename: 'associated.txt',
          contentType: 'text/plain',
          content: new Uint8Array(18),
        }],
        ['encrypted.txt', {
          filename: 'encrypted.txt',
          contentType: 'text/plain',
          content: new Uint8Array(12),
        }],
      ])),
    }), {
      headerData: pdfBytes(),
      fileBytes: 64,
      passwordUsed: false,
      associatedFiles: [{
        id: 1,
        fileName: 'folder/associated.txt',
        description: 'Associated only',
        contentType: 'text/plain',
        bytes: 18,
        occurrences: 1,
      }, {
        id: 2,
        bytes: 12,
        occurrences: 1,
      }],
    });

    expect(report.findings.filter(finding => finding.kind === 'embedded-file')).toEqual([
      expect.objectContaining({
        id: 'attachment:associated:1',
        label: 'folder/associated.txt',
        value: 'text/plain · Associated only',
        bytes: 18,
      }),
      expect.objectContaining({
        id: 'attachment:associated:2',
        message: { code: 'unnamed-attachment', index: 2 },
        bytes: 12,
      }),
    ]);
  });

  it('conserve les URI sûres déclenchées à l’ouverture ou comme action additionnelle', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture(), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: false,
      actionDictionaries: [
        {
          actionType: 'URI', context: 'open-action',
          target: 'https://open.example/start', occurrences: 1,
        },
        {
          actionType: 'URI', context: 'additional-action',
          target: 'https://additional.example/ping', occurrences: 1,
        },
        {
          actionType: 'URI', context: 'next-action',
          target: 'https://next.example/continue', occurrences: 1,
        },
        {
          actionType: 'URI', context: 'page-additional-action',
          target: 'https://page-open.example/ping', occurrences: 1,
        },
        {
          actionType: 'URI', context: 'field-additional-action',
          target: 'https://field-focus.example/ping', occurrences: 1,
        },
        {
          actionType: 'Sound', context: 'open-action', occurrences: 1,
        },
      ],
    });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'open-action' },
        value: 'https://open.example/start',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'additional-action' },
        value: 'https://additional.example/ping',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'chained-action' },
        value: 'https://next.example/continue',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'additional-action' },
        value: 'https://page-open.example/ping',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'URI', context: 'additional-action' },
        value: 'https://field-focus.example/ping',
      }),
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'Sound', context: 'open-action' },
      }),
    ]));
  });

  it('ne double pas une action chiffrée dont le parseur brut masque la cible', async () => {
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([{ id: 'encrypted', unsafeUrl: 'calc.exe' }]),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: true,
      actionDictionaries: [{
        actionType: 'Launch', context: 'annotation-action', occurrences: 1,
        triggerIds: ['encrypted'],
      }],
    });

    expect(report.findings.filter(finding => finding.kind === 'automatic-action')).toEqual([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'Launch', context: 'other' },
        occurrences: 1,
      }),
    ]);
  });

  it('ne double pas une action de plan chiffrée dont la cible brute est masquée', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getOutline: vi.fn().mockResolvedValue([{
        title: 'Programme', unsafeUrl: 'viewer.exe', items: [],
      }]),
    }), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: true,
      actionDictionaries: [{
        actionType: 'Launch', context: 'outline-action', occurrences: 1,
      }],
    });

    expect(report.findings.filter(finding => finding.kind === 'automatic-action')).toEqual([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'Launch', context: 'other' },
        occurrences: 1,
      }),
    ]);
  });

  it('ne masque pas une URI portée par une autre annotation chiffrée', async () => {
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue([
        { id: 'uri', unsafeUrl: 'javascript:alert("private-value")' },
      ]),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };
    const report = await inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), {
      headerData: pdfBytes(),
      fileBytes: 16,
      passwordUsed: true,
      actionDictionaries: [{
        actionType: 'SubmitForm',
        context: 'annotation-action',
        occurrences: 1,
        triggerIds: ['submit'],
      }],
    });

    expect(report.findings.filter(finding => finding.kind === 'automatic-action')).toEqual([
      expect.objectContaining({
        message: { code: 'dictionary-action', actionType: 'SubmitForm', context: 'other' },
      }),
      expect.objectContaining({
        message: { code: 'unsafe-external-target' },
        value: 'javascript:…',
      }),
    ]);
    expect(JSON.stringify(report)).not.toContain('private-value');
  });

  it('refuse les documents vides ou dépassant la limite de pages', async () => {
    await expect(inspectPdfPrivacyDocument(documentFixture({ numPages: 0 }), {
      headerData: pdfBytes(), fileBytes: 16, passwordUsed: false,
    })).rejects.toMatchObject({ code: 'invalid-pdf' });
    await expect(inspectPdfPrivacyDocument(documentFixture({ numPages: PDF_PRIVACY_MAX_PAGES + 1 }), {
      headerData: pdfBytes(), fileBytes: 16, passwordUsed: false,
    })).rejects.toMatchObject({ code: 'too-many-pages' });
  });

  it('borne aussi les annotations sans signal afin de protéger le temps de traitement', async () => {
    const annotations = Array.from(
      { length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 },
      () => ({}),
    );
    const page: PdfJsPrivacyPage = {
      getAnnotations: vi.fn().mockResolvedValue(annotations),
      getJSActions: vi.fn().mockResolvedValue(null),
      cleanup: vi.fn(),
    };

    await expect(inspectPdfPrivacyDocument(documentFixture({
      getPage: vi.fn().mockResolvedValue(page),
    }), {
      headerData: pdfBytes(), fileBytes: 16, passwordUsed: false,
    })).rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('borne les enfants du plan avant de les ajouter à la file', async () => {
    const children = Array.from(
      { length: PDF_PRIVACY_MAX_DISCOVERED_ITEMS + 1 },
      () => ({ items: [] }),
    );

    await expect(inspectPdfPrivacyDocument(documentFixture({
      getOutline: vi.fn().mockResolvedValue([{ items: children }]),
    }), {
      headerData: pdfBytes(), fileBytes: 16, passwordUsed: false,
    })).rejects.toMatchObject({ code: 'inspection-limit' });
  });

  it('publie une progression bornée et un rapport clair pour un PDF simple', async () => {
    const progress = vi.fn();
    const report = await inspectPdfPrivacyDocument(documentFixture(), {
      headerData: pdfBytes(), fileBytes: 16, passwordUsed: false, onProgress: progress,
    });

    expect(report.attentionLevel).toBe('clear');
    expect(report.findingCount).toBe(0);
    expect(progress.mock.calls.flat()).toEqual([8, 20, 92, 98]);
  });
});
