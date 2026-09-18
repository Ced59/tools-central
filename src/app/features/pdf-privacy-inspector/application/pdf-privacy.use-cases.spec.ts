import { describe, expect, it, vi } from 'vitest';

import type {
  PdfPrivacyFileReaderPort,
  PdfPrivacyInspectorPort,
  PdfPrivacyReportDownloadPort,
} from './pdf-privacy.ports';
import {
  DownloadPdfPrivacyReportUseCase,
  InspectPdfPrivacyUseCase,
  PDF_PRIVACY_MAX_FILE_BYTES,
  PdfPrivacyValidationError,
} from './pdf-privacy.use-cases';
import { buildPdfPrivacyReport } from '../domain/pdf-privacy.models';

const report = buildPdfPrivacyReport({
  pdfVersion: '1.7', pageCount: 1, inspectedPages: 1, fileBytes: 8,
  encrypted: false, passwordUsed: false, findings: [],
});

describe('InspectPdfPrivacyUseCase', () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
  const reader: PdfPrivacyFileReaderPort = { read: vi.fn().mockResolvedValue(bytes) };
  const inspector: PdfPrivacyInspectorPort = { inspect: vi.fn().mockResolvedValue(report) };

  it('refuse une entrée vide, trop grande ou sans extension PDF', async () => {
    const useCase = new InspectPdfPrivacyUseCase(reader, inspector);
    const blob = new Blob(['pdf']);

    await expect(useCase.execute({ source: { fileName: 'x.pdf', size: 0, blob } }))
      .rejects.toMatchObject({ code: 'empty-file' });
    await expect(useCase.execute({ source: { fileName: 'x.pdf', size: PDF_PRIVACY_MAX_FILE_BYTES + 1, blob } }))
      .rejects.toMatchObject({ code: 'file-too-large' });
    await expect(useCase.execute({ source: { fileName: 'x.docx', size: 3, blob } }))
      .rejects.toMatchObject({ code: 'unsupported-format' });
  });

  it('borne le mot de passe avant lecture du fichier', async () => {
    const useCase = new InspectPdfPrivacyUseCase(reader, inspector);
    await expect(useCase.execute({
      source: { fileName: 'x.pdf', size: 3, blob: new Blob(['pdf']) },
      password: 'x'.repeat(129),
    })).rejects.toMatchObject({ code: 'password-too-long' });
  });

  it('orchestre la lecture et le Worker sans modifier les octets', async () => {
    const localReader: PdfPrivacyFileReaderPort = { read: vi.fn().mockResolvedValue(bytes) };
    const localInspector: PdfPrivacyInspectorPort = { inspect: vi.fn().mockResolvedValue(report) };
    const useCase = new InspectPdfPrivacyUseCase(localReader, localInspector);
    const progress = vi.fn();
    const result = await useCase.execute({
      source: { fileName: 'rapport.pdf', size: 8, blob: new Blob([bytes]) },
      password: 'secret',
      onProgress: progress,
    });

    expect(result).toBe(report);
    expect(localInspector.inspect).toHaveBeenCalledWith(bytes, 'secret', progress, undefined);
  });

  it('convertit un code technique connu en erreur de validation', async () => {
    const failing: PdfPrivacyInspectorPort = {
      inspect: vi.fn().mockRejectedValue(Object.assign(new Error('locked'), { code: 'password-required' })),
    };
    const useCase = new InspectPdfPrivacyUseCase(reader, failing);

    await expect(useCase.execute({
      source: { fileName: 'x.pdf', size: 3, blob: new Blob(['pdf']) },
    })).rejects.toEqual(new PdfPrivacyValidationError('password-required'));
  });
});

describe('DownloadPdfPrivacyReportUseCase', () => {
  it('exporte un JSON versionné avec un nom sûr', () => {
    const downloader: PdfPrivacyReportDownloadPort = { download: vi.fn() };
    new DownloadPdfPrivacyReportUseCase(downloader).execute('bilan:2026.pdf', 42, report);

    expect(downloader.download).toHaveBeenCalledOnce();
    const [json, fileName] = vi.mocked(downloader.download).mock.calls[0];
    expect(fileName).toBe('bilan-2026-rapport-confidentialite.json');
    expect(JSON.parse(json)).toMatchObject({
      schema: 'tools-central/pdf-privacy-report/v1',
      file: { name: 'bilan:2026.pdf', bytes: 42 },
      report: { schemaVersion: 1, attentionLevel: 'clear' },
    });
  });
});
