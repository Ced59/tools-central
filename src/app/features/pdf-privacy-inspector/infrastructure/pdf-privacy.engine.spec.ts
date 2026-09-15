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
        { id: 'a1', action: 'Launch' },
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
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('signale un formulaire XFA et un JavaScript sans détail disponible', async () => {
    const report = await inspectPdfPrivacyDocument(documentFixture({
      isPureXfa: true,
      hasJSActions: vi.fn().mockResolvedValue(true),
    }), { headerData: pdfBytes(), fileBytes: 16, passwordUsed: false });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'javascript', severity: 'high' }),
      expect.objectContaining({ kind: 'xfa-form', severity: 'medium' }),
    ]));
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
