import { describe, expect, it } from 'vitest';

import {
  PDF_PRIVACY_MAX_DISPLAYED_FINDINGS,
  PDF_PRIVACY_MAX_VALUE_CHARS,
  buildPdfPrivacyReport,
  buildPdfPrivacyReportFileName,
  isPdfFileName,
  sanitizePdfPrivacyValue,
  type PdfPrivacyFinding,
} from './pdf-privacy.models';

describe('modèle du rapport de confidentialité PDF', () => {
  it('classe le niveau d’attention selon la sévérité la plus forte', () => {
    const findings: PdfPrivacyFinding[] = [
      { id: 'metadata', category: 'metadata', kind: 'document-metadata', severity: 'low' },
      { id: 'link', category: 'links', kind: 'external-link', severity: 'medium', occurrences: 3 },
      { id: 'javascript', category: 'active-content', kind: 'javascript', severity: 'high' },
    ];

    const report = buildPdfPrivacyReport({
      pdfVersion: '1.7', pageCount: 2, inspectedPages: 2, fileBytes: 42,
      encrypted: false, passwordUsed: false, findings,
    });

    expect(report.attentionLevel).toBe('high');
    expect(report.severityCounts).toEqual({ high: 1, medium: 3, low: 1, info: 0 });
    expect(report.categoryCounts.links).toBe(3);
    expect(report.findings.map(finding => finding.id)).toEqual(['javascript', 'link', 'metadata']);
  });

  it('limite seulement l’affichage sans perdre les totaux', () => {
    const findings = Array.from({ length: PDF_PRIVACY_MAX_DISPLAYED_FINDINGS + 4 }, (_, index) => ({
      id: `link-${String(index)}`,
      category: 'links' as const,
      kind: 'external-link' as const,
      severity: 'medium' as const,
    }));
    const report = buildPdfPrivacyReport({
      pdfVersion: '2.0', pageCount: 1, inspectedPages: 1, fileBytes: 10,
      encrypted: true, passwordUsed: true, findings,
    });

    expect(report.findingCount).toBe(PDF_PRIVACY_MAX_DISPLAYED_FINDINGS + 4);
    expect(report.findings).toHaveLength(PDF_PRIVACY_MAX_DISPLAYED_FINDINGS);
    expect(report.truncatedFindingCount).toBe(4);
    expect(report.inspectionMode).toBe('password-decrypted-structural');
  });

  it('normalise les valeurs non fiables et borne leur longueur', () => {
    const value = sanitizePdfPrivacyValue(`  Alice\u0000\n ${'x'.repeat(500)}  `);

    expect(value).toMatch(/^Alice x/u);
    expect(value).toHaveLength(PDF_PRIVACY_MAX_VALUE_CHARS);
    expect(value?.endsWith('…')).toBe(true);
  });

  it('valide l’extension et produit un nom de rapport sûr', () => {
    expect(isPdfFileName('Rapport.PDF')).toBe(true);
    expect(isPdfFileName('rapport.pdf.exe')).toBe(false);
    expect(buildPdfPrivacyReportFileName('  bilan:2026.pdf ')).toBe('bilan-2026-rapport-confidentialite.json');
  });
});
