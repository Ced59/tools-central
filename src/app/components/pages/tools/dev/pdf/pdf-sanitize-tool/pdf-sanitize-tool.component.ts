import { CommonModule } from '@angular/common';
import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from '@ui';
import { InputTextModule } from '@ui';
import { TagModule } from '@ui';

import JSZip from 'jszip';

import { SanitizePdfUseCase } from '../../../../../../features/pdf-sanitize/application/sanitize-pdf.use-case';
import type { PdfSanitizeCounts, PdfSanitizeOptions } from '../../../../../../features/pdf-sanitize/domain/pdf-sanitize.models';
import { PdfSanitizeWorkerAdapter } from '../../../../../../features/pdf-sanitize/infrastructure/pdf-sanitize-worker.adapter';

import {
  PdfToolShellComponent,
  type PdfToolShellUi,
  type PdfToolStatCard,
  type PdfToolStatus,
} from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';

type SourceInfo = {
  name: string;
  bytes: number;
  mime: string;
};

type SanitizeReport = {
  tool: 'pdf-sanitize';
  source: SourceInfo;
  output: { fileName: string; bytes: number };
  options: PdfSanitizeOptions;
  counts: PdfSanitizeCounts;
  notes: string[];
  warnings: string[];
};

type SanitizeOutput = {
  index: number;
  fileName: string;
  bytes: number;
  blob: Blob;
  tag: string; // "PDF" / "ZIP"
};

@Component({
  selector: 'app-pdf-sanitize-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    PdfToolShellComponent,

    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-sanitize-tool.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pdf-sanitize-tool.component.scss',
})
export class PdfSanitizeToolComponent {
  private readonly fb = new FormBuilder();
  private readonly sanitizePdf = new SanitizePdfUseCase(new PdfSanitizeWorkerAdapter());

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_sanitize_title:Nettoyer un PDF`,
    subtitle: $localize`:@@pdf_sanitize_subtitle:Produire une version “sanitisée” en supprimant/neutralisant des éléments sensibles (métadonnées, actions, annotations…). Tout se fait localement dans votre navigateur.`,
    errGeneric: $localize`:@@pdf_sanitize_err_generic:Une erreur est survenue.`,
    tipPrivacy: $localize`:@@pdf_sanitize_tip_privacy:Aucun upload : vos fichiers restent sur votre appareil.`,
    tipBestEffort: $localize`:@@pdf_sanitize_tip_best_effort:Le nettoyage est “best-effort” : certains éléments PDF très spécifiques peuvent subsister selon les lecteurs/structures.`,
  };

  readonly uiShell: PdfToolShellUi = {
    importTitle: $localize`:@@pdf_sanitize_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_sanitize_import_sub:Choisissez un PDF à nettoyer (sanitiser).`,

    btnPick: $localize`:@@pdf_sanitize_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_sanitize_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_sanitize_btn_copy:Copier le rapport`,
    btnDownload: $localize`:@@pdf_sanitize_btn_download:Télécharger en ZIP`,
    placeholderFilter: $localize`:@@pdf_sanitize_filter_placeholder:Filtrer (nom, type…)`,

    statusLoading: $localize`:@@pdf_sanitize_status_loading:Traitement…`,
    statusReady: $localize`:@@pdf_sanitize_status_ready:Prêt`,
    statusError: $localize`:@@pdf_sanitize_status_error:Erreur`,

    resultsTitle: $localize`:@@pdf_sanitize_results_title:Résultat`,
    resultsSub: $localize`:@@pdf_sanitize_results_sub:PDF nettoyé + rapport JSON des opérations (audit/traçabilité).`,

    jsonTitle: $localize`:@@pdf_sanitize_json_title:Rapport JSON`,
    jsonSub: $localize`:@@pdf_sanitize_json_sub:Options appliquées, compteurs et avertissements.`,

    leftTitle: $localize`:@@pdf_sanitize_left_title:Fichiers générés`,
    emptyText: $localize`:@@pdf_sanitize_empty:Aucun fichier généré.`,

    backText: $localize`:@@pdf_sanitize_back:← Retour aux outils PDF`,
  };

  // ---------------- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>(this.ui.tipPrivacy);

  readonly sourceFile = signal<File | null>(null);
  readonly sourceInfo = signal<SourceInfo | null>(null);

  readonly outputs = signal<SanitizeOutput[]>([]);
  readonly report = signal<SanitizeReport | null>(null);

  // ---------------- form
  readonly form = this.fb.nonNullable.group({
    clearMetadata: this.fb.nonNullable.control(true),
    removeAnnotations: this.fb.nonNullable.control(true),
    removeActions: this.fb.nonNullable.control(true),
    removeNames: this.fb.nonNullable.control(true),
    removeAcroForm: this.fb.nonNullable.control(true),
    rebuildPdf: this.fb.nonNullable.control(true),

    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    filePrefix: this.fb.nonNullable.control('sanitized'),
  });

  // ---------------- derived
  readonly fileName = computed(() => this.sourceInfo()?.name ?? '');
  readonly fileSize = computed(() => this.sourceInfo()?.bytes ?? 0);

  readonly showResults = computed(() =>
    !!this.sourceFile() || this.status() === 'loading' || this.status() === 'ready' || this.status() === 'error'
  );

  readonly filteredOutputs = computed(() => {
    const q = (this.form.controls.filter.value || '').trim().toLowerCase();
    const all = this.outputs();
    if (!q) return all;
    return all.filter(o => (o.fileName + ' ' + o.tag).toLowerCase().includes(q));
  });

  readonly downloadDisabled = computed(() => this.status() !== 'ready' || this.outputs().length === 0);

  readonly statsCards = computed<PdfToolStatCard[]>(() => {
    const info = this.sourceInfo();
    const rep = this.report();

    const inVal = info ? `${fmtMb(info.bytes)} • ${info.mime}` : $localize`:@@pdf_sanitize_stat_in_empty:—`;
    const outVal = rep ? `${fmtMb(rep.output.bytes)} • ${rep.output.fileName}` : $localize`:@@pdf_sanitize_stat_out_empty:—`;
    const pagesVal = rep ? `${rep.counts.pages}` : '—';

    return [
      { label: $localize`:@@pdf_sanitize_stat_in_label:Entrée`, value: inVal },
      { label: $localize`:@@pdf_sanitize_stat_out_label:Sortie`, value: outVal },
      { label: $localize`:@@pdf_sanitize_stat_pages_label:Pages`, value: pagesVal },
    ];
  });

  readonly jsonText = computed(() => {
    const rep = this.report();
    if (!rep) return '';
    return this.form.controls.pretty.value
      ? JSON.stringify(rep, null, 2)
      : JSON.stringify(rep);
  });

  readonly shellErrorMessage = computed(() => (this.status() === 'error' ? (this.errorMessage() || this.ui.errGeneric) : ''));

  // ---------------- handlers
  onFileSelected(file: File) {
    if (!file) return;
    this.reset(false);

    this.sourceFile.set(file);
    this.sourceInfo.set({
      name: file.name,
      bytes: file.size,
      mime: file.type || 'application/pdf',
    });

    this.tipMessage.set(this.ui.tipPrivacy);
  }

  // ---------------- main action
  async sanitizeNow() {
    const file = this.sourceFile();
    const info = this.sourceInfo();

    if (!file || !info) {
      this.tipMessage.set($localize`:@@pdf_sanitize_need_file:Choisissez d’abord un PDF.`);
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    const options: PdfSanitizeOptions = {
      clearMetadata: this.form.controls.clearMetadata.value,
      removeAnnotations: this.form.controls.removeAnnotations.value,
      removeActions: this.form.controls.removeActions.value,
      removeNames: this.form.controls.removeNames.value,
      removeAcroForm: this.form.controls.removeAcroForm.value,
      rebuildPdf: this.form.controls.rebuildPdf.value,
    };

    try {
      const processed = await this.sanitizePdf.execute({
        pdfBytes: await file.arrayBuffer(),
        options,
      });
      const warnings: string[] = [];
      const notes: string[] = [
        this.ui.tipBestEffort,
        this.ui.tipPrivacy,
      ];

      if (processed.annotationsMayRemain) {
        warnings.push($localize`:@@pdf_sanitize_warn_annots:Certaines annotations peuvent subsister selon la structure du PDF.`);
      }

      const outBlob = new Blob([processed.pdfBytes], { type: 'application/pdf' });

      const outputFileName = buildOutputName(info.name, this.form.controls.filePrefix.value);

      const rep: SanitizeReport = {
        tool: 'pdf-sanitize',
        source: info,
        output: { fileName: outputFileName, bytes: processed.pdfBytes.byteLength },
        options,
        counts: processed.counts,
        notes,
        warnings,
      };

      this.report.set(rep);

      this.outputs.set([
        {
          index: 1,
          fileName: outputFileName,
          bytes: processed.pdfBytes.byteLength,
          blob: outBlob,
          tag: 'PDF',
        },
      ]);

      this.status.set('ready');
      this.tipMessage.set($localize`:@@pdf_sanitize_done:PDF nettoyé prêt. Téléchargez le PDF ou le ZIP (PDF + rapport).`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch (e: any) {
      this.errorMessage.set(e?.message || this.ui.errGeneric);
      this.status.set('error');
      this.tipMessage.set($localize`:@@pdf_sanitize_fail:Impossible de nettoyer ce PDF.`);
    }
  }

  downloadOne(o: SanitizeOutput) {
    if (this.status() !== 'ready') return;

    try {
      downloadBlob(o.blob, o.fileName);
      this.tipMessage.set($localize`:@@pdf_sanitize_downloading_one:Téléchargement lancé.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2000);
    } catch {
      this.tipMessage.set($localize`:@@pdf_sanitize_download_one_fail:Impossible de télécharger ce fichier.`);
    }
  }

  async downloadZip() {
    if (this.status() !== 'ready') return;

    const rep = this.report();
    const outs = this.outputs();
    if (!rep || outs.length === 0) return;

    try {
      const zip = new JSZip();

      const pdf = outs[0];
      zip.file(pdf.fileName, pdf.blob);
      zip.file('report.json', this.jsonText());

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = buildZipName(rep.source.name, this.form.controls.filePrefix.value);
      downloadBlob(zipBlob, zipName);

      this.tipMessage.set($localize`:@@pdf_sanitize_zip_downloading:Téléchargement du ZIP lancé.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2000);
    } catch (e: any) {
      this.tipMessage.set($localize`:@@pdf_sanitize_zip_fail:Impossible de générer le ZIP.`);
      this.errorMessage.set(e?.message || this.ui.errGeneric);
      this.status.set('error');
    }
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_sanitize_copied:Rapport JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_sanitize_copy_fail:Impossible de copier automatiquement. Copiez manuellement le JSON.`);
    }
  }

  reset(clearFile = true) {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    this.outputs.set([]);
    this.report.set(null);
    this.form.controls.filter.setValue('');

    if (clearFile) {
      this.sourceFile.set(null);
      this.sourceInfo.set(null);
    }
  }
}

// =============================================================================
// Generic helpers
// =============================================================================

function buildOutputName(originalName: string, prefix: string): string {
  const base = stripExt(originalName);
  const safePrefix = (prefix || 'sanitized').trim() || 'sanitized';
  return `${safePrefix}_${sanitizeFileName(base)}.pdf`;
}

function buildZipName(originalName: string, prefix: string): string {
  const base = stripExt(originalName);
  const safePrefix = (prefix || 'sanitized').trim() || 'sanitized';
  return `${safePrefix}_${sanitizeFileName(base)}.zip`;
}

function stripExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i <= 0) return name;
  return name.slice(0, i);
}

function sanitizeFileName(s: string): string {
  return (s || 'file')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
