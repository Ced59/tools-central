import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import JSZip from 'jszip';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
} from 'pdf-lib';

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

type SanitizeCounts = {
  pages: number;
  annotationsRemoved: number;
  openActionRemoved: boolean;
  catalogAaRemoved: boolean;
  namesRemoved: boolean;
  acroFormRemoved: boolean;
  metadataCleared: boolean;
  rebuilt: boolean;
};

type SanitizeReport = {
  tool: 'pdf-sanitize';
  source: SourceInfo;
  output: { fileName: string; bytes: number };
  options: {
    clearMetadata: boolean;
    removeAnnotations: boolean;
    removeActions: boolean;
    removeNames: boolean;
    removeAcroForm: boolean;
    rebuildPdf: boolean;
  };
  counts: SanitizeCounts;
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
  styleUrl: './pdf-sanitize-tool.component.scss',
})
export class PdfSanitizeToolComponent {
  private readonly fb = new FormBuilder();

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

    const options = {
      clearMetadata: this.form.controls.clearMetadata.value,
      removeAnnotations: this.form.controls.removeAnnotations.value,
      removeActions: this.form.controls.removeActions.value,
      removeNames: this.form.controls.removeNames.value,
      removeAcroForm: this.form.controls.removeAcroForm.value,
      rebuildPdf: this.form.controls.rebuildPdf.value,
    };

    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: false });

      const warnings: string[] = [];
      const notes: string[] = [
        this.ui.tipBestEffort,
        this.ui.tipPrivacy,
      ];

      // 1) compter les annotations (source)
      const annotationsBefore = safeCountAnnotations(srcDoc);

      // 2) base: rebuild (recommandé pour enlever un max d'éléments)
      let outDoc: PDFDocument;

      if (options.rebuildPdf) {
        outDoc = await rebuildDocumentByCopyingPages(srcDoc);
      } else {
        outDoc = srcDoc;
      }

      // 3) nettoyage bas niveau (sur outDoc)
      const counts: SanitizeCounts = {
        pages: outDoc.getPageCount(),
        annotationsRemoved: 0,
        openActionRemoved: false,
        catalogAaRemoved: false,
        namesRemoved: false,
        acroFormRemoved: false,
        metadataCleared: false,
        rebuilt: options.rebuildPdf,
      };

      if (options.removeAnnotations) {
        const removed = safeRemoveAnnotations(outDoc);
        counts.annotationsRemoved = removed;
        if (removed === 0 && annotationsBefore > 0) {
          warnings.push($localize`:@@pdf_sanitize_warn_annots:Certaines annotations peuvent subsister selon la structure du PDF.`);
        }
      }

      if (options.removeActions) {
        const { openActionRemoved, catalogAaRemoved } = safeRemoveActions(outDoc);
        counts.openActionRemoved = openActionRemoved;
        counts.catalogAaRemoved = catalogAaRemoved;
      }

      if (options.removeNames) {
        counts.namesRemoved = safeRemoveNames(outDoc);
      }

      if (options.removeAcroForm) {
        counts.acroFormRemoved = safeRemoveAcroForm(outDoc);
      }

      if (options.clearMetadata) {
        counts.metadataCleared = safeClearMetadata(outDoc);
      }

      // 4) sortie PDF
      const outU8 = await outDoc.save();

      // ✅ force un ArrayBuffer classique (pas SharedArrayBuffer)
      const outBuf = Uint8Array.from(outU8).buffer;
      const outBlob = new Blob([outBuf], { type: 'application/pdf' });

      const outputFileName = buildOutputName(info.name, this.form.controls.filePrefix.value);

      // 5) report
      const rep: SanitizeReport = {
        tool: 'pdf-sanitize',
        source: info,
        output: { fileName: outputFileName, bytes: outU8.byteLength },
        options,
        counts,
        notes,
        warnings,
      };

      this.report.set(rep);

      this.outputs.set([
        {
          index: 1,
          fileName: outputFileName,
          bytes: outU8.byteLength,
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
// Helpers (pdf-lib best-effort)
// =============================================================================

async function rebuildDocumentByCopyingPages(srcDoc: PDFDocument): Promise<PDFDocument> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(srcDoc, srcDoc.getPageIndices());
  for (const p of pages) out.addPage(p);
  return out;
}

function safeCountAnnotations(doc: PDFDocument): number {
  try {
    let total = 0;
    for (const p of doc.getPages()) {
      const ann = (p as any).node?.lookupMaybe?.(PDFName.of('Annots'), PDFArray);
      if (ann && ann instanceof PDFArray) total += ann.size();
    }
    return total;
  } catch {
    return 0;
  }
}

function safeRemoveAnnotations(doc: PDFDocument): number {
  let removed = 0;
  try {
    for (const p of doc.getPages()) {
      const node = (p as any).node as PDFDict | undefined;
      if (!node) continue;

      const ann = node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (ann && ann instanceof PDFArray) {
        removed += ann.size();
        node.delete(PDFName.of('Annots'));
      }

      // Additional Actions au niveau page
      if (node.has(PDFName.of('AA'))) {
        node.delete(PDFName.of('AA'));
      }
    }
  } catch {
    // ignore
  }
  return removed;
}

function safeRemoveActions(doc: PDFDocument): { openActionRemoved: boolean; catalogAaRemoved: boolean } {
  let openActionRemoved = false;
  let catalogAaRemoved = false;

  try {
    const catalog = (doc as any).catalog as PDFDict | undefined;
    if (!catalog) return { openActionRemoved, catalogAaRemoved };

    if (catalog.has(PDFName.of('OpenAction'))) {
      catalog.delete(PDFName.of('OpenAction'));
      openActionRemoved = true;
    }
    if (catalog.has(PDFName.of('AA'))) {
      catalog.delete(PDFName.of('AA'));
      catalogAaRemoved = true;
    }
  } catch {
    // ignore
  }

  return { openActionRemoved, catalogAaRemoved };
}

function safeRemoveNames(doc: PDFDocument): boolean {
  try {
    const catalog = (doc as any).catalog as PDFDict | undefined;
    if (!catalog) return false;

    // Names peut contenir JavaScript, EmbeddedFiles, etc.
    if (catalog.has(PDFName.of('Names'))) {
      catalog.delete(PDFName.of('Names'));
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function safeRemoveAcroForm(doc: PDFDocument): boolean {
  try {
    const catalog = (doc as any).catalog as PDFDict | undefined;
    if (!catalog) return false;

    if (catalog.has(PDFName.of('AcroForm'))) {
      catalog.delete(PDFName.of('AcroForm'));
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function safeClearMetadata(doc: PDFDocument): boolean {
  try {
    // pdf-lib “Document Info”
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');

    // dates — on évite d'inventer, on “neutralise” avec now (ou on peut tenter delete bas niveau)
    const now = new Date();
    try {
      doc.setCreationDate(now);
      doc.setModificationDate(now);
    } catch {
      // versions pdf-lib différentes
    }

    // tentative de suppression du Metadata stream (XMP) si présent
    try {
      const catalog = (doc as any).catalog as PDFDict | undefined;
      if (catalog?.has(PDFName.of('Metadata'))) {
        catalog.delete(PDFName.of('Metadata'));
      }
    } catch {
      // ignore
    }

    return true;
  } catch {
    return false;
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
