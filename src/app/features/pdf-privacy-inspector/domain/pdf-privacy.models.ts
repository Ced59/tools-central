export const PDF_PRIVACY_MAX_FILE_BYTES = 50 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_PAGES = 1_000;
export const PDF_PRIVACY_MAX_PASSWORD_CHARS = 128;
export const PDF_PRIVACY_MAX_DISCOVERED_ITEMS = 10_000;
export const PDF_PRIVACY_MAX_DISPLAYED_FINDINGS = 200;
export const PDF_PRIVACY_MAX_VALUE_CHARS = 320;

export type PdfPrivacyCategory =
  | 'metadata'
  | 'active-content'
  | 'attachments'
  | 'links'
  | 'forms'
  | 'signatures'
  | 'encryption';

export type PdfPrivacySeverity = 'high' | 'medium' | 'low' | 'info';
export type PdfPrivacyAttentionLevel = 'high' | 'medium' | 'low' | 'clear';

export type PdfPrivacyFindingKind =
  | 'document-metadata'
  | 'xmp-metadata'
  | 'javascript'
  | 'automatic-action'
  | 'embedded-file'
  | 'external-link'
  | 'form-fields'
  | 'xfa-form'
  | 'digital-signature'
  | 'encryption';

export type PdfPrivacyFindingMessage =
  | { code: 'form-actions-undetailed' }
  | { code: 'outline-link' }
  | { code: 'annotation-link' }
  | { code: 'document-permissions'; count: number }
  | { code: 'document-password' }
  | { code: 'unnamed-attachment'; index: number }
  | { code: 'open-action' }
  | { code: 'acroform-summary'; fieldCount: number; populatedCount: number }
  | { code: 'form-actions' }
  | { code: 'xfa-form' }
  | {
      code: 'signature-details';
      index: number;
      subFilter?: string;
      contactInfo?: string;
      location?: string;
      reason?: string;
      signingTime?: string;
      coversWholeDocument?: boolean;
      modifications?: number;
    }
  | { code: 'interactive-sound' }
  | { code: 'interactive-video' }
  | { code: 'interactive-screen' }
  | { code: 'interactive-3d' }
  | { code: 'rich-media' }
  | { code: 'annotated-attachment' }
  | { code: 'unsafe-external-target' }
  | { code: 'named-action' }
  | { code: 'attachment-opening' }
  | {
      code: 'dictionary-action';
      actionType: string;
      context: 'open-action' | 'additional-action' | 'chained-action' | 'other';
      targetStatus?: 'too-long';
    };

export interface PdfPrivacyFinding {
  id: string;
  category: PdfPrivacyCategory;
  kind: PdfPrivacyFindingKind;
  severity: PdfPrivacySeverity;
  message?: PdfPrivacyFindingMessage;
  /** Raw, document-provided label. Never use this field for UI copy. */
  label?: string;
  /** Raw, document-provided value. Never use this field for UI copy. */
  value?: string;
  pageNumber?: number;
  occurrences?: number;
  bytes?: number;
}

export interface PdfPrivacySeverityCounts {
  high: number;
  medium: number;
  low: number;
  info: number;
}

export type PdfPrivacyCategoryCounts = Readonly<Record<PdfPrivacyCategory, number>>;

export interface PdfPrivacyReport {
  schemaVersion: 1;
  pdfVersion: string;
  pageCount: number;
  inspectedPages: number;
  fileBytes: number;
  encrypted: boolean;
  inspectionMode: 'structural' | 'password-decrypted-structural';
  attentionLevel: PdfPrivacyAttentionLevel;
  findingCount: number;
  displayedFindingCount: number;
  truncatedFindingCount: number;
  severityCounts: PdfPrivacySeverityCounts;
  categoryCounts: PdfPrivacyCategoryCounts;
  findings: readonly PdfPrivacyFinding[];
  limitations: readonly [
    'no-malware-verdict',
    'no-cryptographic-signature-verification',
    'no-visual-content-analysis',
  ];
}

const CATEGORY_ORDER: readonly PdfPrivacyCategory[] = [
  'active-content',
  'attachments',
  'links',
  'forms',
  'metadata',
  'signatures',
  'encryption',
];

const SEVERITY_ORDER: Readonly<Record<PdfPrivacySeverity, number>> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

export function buildPdfPrivacyReport(input: {
  pdfVersion: string;
  pageCount: number;
  inspectedPages: number;
  fileBytes: number;
  encrypted: boolean;
  passwordUsed: boolean;
  findings: readonly PdfPrivacyFinding[];
}): PdfPrivacyReport {
  const severityCounts: PdfPrivacySeverityCounts = { high: 0, medium: 0, low: 0, info: 0 };
  const categoryCounts = Object.fromEntries(
    CATEGORY_ORDER.map(category => [category, 0]),
  ) as Record<PdfPrivacyCategory, number>;

  for (const finding of input.findings) {
    severityCounts[finding.severity] += finding.occurrences ?? 1;
    categoryCounts[finding.category] += finding.occurrences ?? 1;
  }

  const sorted = [...input.findings].sort((left, right) => (
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
    || CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category)
    || (left.pageNumber ?? 0) - (right.pageNumber ?? 0)
    || left.id.localeCompare(right.id)
  ));
  const displayed = sorted.slice(0, PDF_PRIVACY_MAX_DISPLAYED_FINDINGS);

  return {
    schemaVersion: 1,
    pdfVersion: input.pdfVersion,
    pageCount: input.pageCount,
    inspectedPages: input.inspectedPages,
    fileBytes: input.fileBytes,
    encrypted: input.encrypted,
    inspectionMode: input.encrypted && input.passwordUsed
      ? 'password-decrypted-structural'
      : 'structural',
    attentionLevel: attentionLevel(severityCounts),
    findingCount: input.findings.length,
    displayedFindingCount: displayed.length,
    truncatedFindingCount: Math.max(0, input.findings.length - displayed.length),
    severityCounts,
    categoryCounts,
    findings: displayed,
    limitations: [
      'no-malware-verdict',
      'no-cryptographic-signature-verification',
      'no-visual-content-analysis',
    ],
  };
}

export function sanitizePdfPrivacyValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }
  const normalized = String(value).replace(/[\u0000-\u001f\u007f]+/gu, ' ').replace(/\s+/gu, ' ').trim();
  if (!normalized) return undefined;
  return normalized.length <= PDF_PRIVACY_MAX_VALUE_CHARS
    ? normalized
    : `${normalized.slice(0, PDF_PRIVACY_MAX_VALUE_CHARS - 1)}…`;
}

export function isPdfFileName(fileName: string): boolean {
  return /\.pdf$/iu.test(fileName.trim());
}

export function buildPdfPrivacyReportFileName(fileName: string): string {
  const base = fileName.trim().replace(/\.pdf$/iu, '').trim() || 'document';
  const safe = base
    .replace(/[\\/:*?"<>|\u0000-\u001f]/gu, '-')
    .replace(/\s+/gu, ' ')
    .slice(0, 120);
  return `${safe || 'document'}-rapport-confidentialite.json`;
}

function attentionLevel(counts: PdfPrivacySeverityCounts): PdfPrivacyAttentionLevel {
  if (counts.high > 0) return 'high';
  if (counts.medium > 0) return 'medium';
  if (counts.low > 0) return 'low';
  return 'clear';
}
