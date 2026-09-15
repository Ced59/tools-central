import type { PdfPrivacyFailureCode } from '../application/pdf-privacy.use-cases';
import type { PdfPrivacyReport } from '../domain/pdf-privacy.models';

export interface PdfPrivacyWorkerRequest {
  type: 'inspect';
  data: ArrayBuffer;
  password?: string;
  assetRoot: string;
}

export type PdfPrivacyWorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'success'; report: PdfPrivacyReport }
  | { type: 'failure'; code: PdfPrivacyFailureCode; message: string };
