import type {
  PdfPrivacyFileReaderPort,
  PdfPrivacyInspectorPort,
  PdfPrivacyReportDownloadPort,
  PdfPrivacySource,
} from './pdf-privacy.ports';
import {
  PDF_PRIVACY_MAX_FILE_BYTES,
  PDF_PRIVACY_MAX_PASSWORD_CHARS,
  buildPdfPrivacyReportFileName,
  isPdfFileName,
  type PdfPrivacyReport,
} from '../domain/pdf-privacy.models';

export {
  PDF_PRIVACY_MAX_FILE_BYTES,
  PDF_PRIVACY_MAX_PAGES,
  type PdfPrivacyAttentionLevel,
  type PdfPrivacyCategory,
  type PdfPrivacyFinding,
  type PdfPrivacyFindingKind,
  type PdfPrivacyReport,
  type PdfPrivacySeverity,
} from '../domain/pdf-privacy.models';

export type PdfPrivacyFailureCode =
  | 'empty-file'
  | 'file-too-large'
  | 'unsupported-format'
  | 'password-too-long'
  | 'password-required'
  | 'incorrect-password'
  | 'invalid-pdf'
  | 'too-many-pages'
  | 'inspection-limit'
  | 'corrupt-document';

export class PdfPrivacyValidationError extends Error {
  constructor(readonly code: PdfPrivacyFailureCode) {
    super(code);
  }
}

export interface InspectPdfPrivacyInput {
  source: PdfPrivacySource;
  password?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export class InspectPdfPrivacyUseCase {
  constructor(
    private readonly reader: PdfPrivacyFileReaderPort,
    private readonly inspector: PdfPrivacyInspectorPort,
  ) {}

  async execute(input: InspectPdfPrivacyInput): Promise<PdfPrivacyReport> {
    if (!isPdfFileName(input.source.fileName)) throw new PdfPrivacyValidationError('unsupported-format');
    if (input.source.size === 0) throw new PdfPrivacyValidationError('empty-file');
    if (input.source.size > PDF_PRIVACY_MAX_FILE_BYTES) {
      throw new PdfPrivacyValidationError('file-too-large');
    }
    if ((input.password?.length ?? 0) > PDF_PRIVACY_MAX_PASSWORD_CHARS) {
      throw new PdfPrivacyValidationError('password-too-long');
    }

    try {
      const data = await this.reader.read(input.source.blob, input.signal);
      if (data.byteLength === 0) throw new PdfPrivacyValidationError('empty-file');
      if (data.byteLength > PDF_PRIVACY_MAX_FILE_BYTES) {
        throw new PdfPrivacyValidationError('file-too-large');
      }
      return await this.inspector.inspect(
        data,
        input.password || undefined,
        input.onProgress,
        input.signal,
      );
    } catch (error: unknown) {
      if (error instanceof PdfPrivacyValidationError || isAbortError(error)) throw error;
      const code = readFailureCode(error);
      throw new PdfPrivacyValidationError(code ?? 'corrupt-document');
    }
  }
}

export class DownloadPdfPrivacyReportUseCase {
  constructor(private readonly downloader: PdfPrivacyReportDownloadPort) {}

  execute(fileName: string, fileSize: number, report: PdfPrivacyReport): void {
    const json = JSON.stringify({
      schema: 'tools-central/pdf-privacy-report/v1',
      file: { name: fileName, bytes: fileSize },
      report,
    }, null, 2);
    this.downloader.download(json, buildPdfPrivacyReportFileName(fileName));
  }
}

function readFailureCode(error: unknown): PdfPrivacyFailureCode | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && FAILURE_CODES.has(code as PdfPrivacyFailureCode)
    ? code as PdfPrivacyFailureCode
    : null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const FAILURE_CODES = new Set<PdfPrivacyFailureCode>([
  'empty-file',
  'file-too-large',
  'unsupported-format',
  'password-too-long',
  'password-required',
  'incorrect-password',
  'invalid-pdf',
  'too-many-pages',
  'inspection-limit',
  'corrupt-document',
]);
