import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type {
  PdfToolShellUi,
  PdfToolStatCard,
  PdfToolStatus,
} from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

type SplitMode = 'ranges' | 'each-page';

interface SourceInfo {
  name: string;
  size: number;
  pageCount: number;
}

interface Range {
  from: number; // 1-based inclusive
  to: number;   // 1-based inclusive
}

interface SplitOutput {
  index: number;
  fileName: string;
  range: Range;
  pages: number;
  bytes: number;
  pdfBytes: Uint8Array; // ArrayBuffer-backed
}

interface SplitReport {
  source: SourceInfo;
  mode: SplitMode;
  requested: {
    rangesText: string | null;
  };
  outputs: Array<{
    index: number;
    fileName: string;
    from: number;
    to: number;
    pages: number;
    bytes: number;
  }>;
  notes: string[];
}

@Component({
  selector: 'app-pdf-split-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-split-tool.component.html',
  styleUrl: './pdf-split-tool.component.scss',
})
export class PdfSplitToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_split_title:Découper un PDF`,
    subtitle: $localize`:@@pdf_split_subtitle:Extrayez certaines pages ou découpez un PDF en plusieurs fichiers (plages ou 1 page par fichier). Tout se fait localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_split_err_title:Impossible de découper ce PDF.`,
    errGeneric: $localize`:@@pdf_split_err_generic:Une erreur est survenue.`,
    tipPrivacy: $localize`:@@pdf_split_tip_privacy:Aucun upload : vos fichiers restent sur votre appareil.`,
    tipSign: $localize`:@@pdf_split_tip_sign:Attention : découper invalide généralement les signatures existantes (le fichier change). Conservez l’original si besoin de preuve.`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_split_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_split_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_split_btn_copy:Copier le mapping`,
    btnDownload: $localize`:@@pdf_split_btn_download:Télécharger en ZIP`,
    placeholderFilter: $localize`:@@pdf_split_filter_placeholder:Filtrer (nom, plage, pages…)`,

    statusLoading: $localize`:@@pdf_split_status_loading:Traitement…`,
    statusReady: $localize`:@@pdf_split_status_ready:Prêt`,
    statusError: $localize`:@@pdf_split_status_error:Erreur`,

    importTitle: $localize`:@@pdf_split_card_import_title:Sélectionner le PDF`,
    importSub: $localize`:@@pdf_split_card_import_sub:Choisissez un PDF, définissez le mode (plages ou 1 page/fichier), puis lancez le découpage.`,

    resultsTitle: $localize`:@@pdf_split_card_results_title:Résultat`,
    resultsSub: $localize`:@@pdf_split_card_results_sub:PDFs extraits + mapping pages.`,

    jsonTitle: $localize`:@@pdf_split_json_title:Mapping JSON`,
    jsonSub: $localize`:@@pdf_split_json_sub:Traçabilité (pages sources → fichiers extraits)`,

    leftTitle: $localize`:@@pdf_split_left_title:Fichiers générés`,
    emptyText: $localize`:@@pdf_split_empty:Aucun fichier généré.`,
    backText: $localize`:@@pdf_split_back:← Retour aux outils PDF`,
  };

  // ---------- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>(this.ui.tipPrivacy);

  readonly sourceFile = signal<File | null>(null);
  readonly sourceInfo = signal<SourceInfo | null>(null);

  readonly outputs = signal<SplitOutput[]>([]);
  readonly report = signal<SplitReport | null>(null);

  // ---------- form
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),

    mode: this.fb.nonNullable.control<SplitMode>('ranges'),
    rangesText: this.fb.nonNullable.control('1-1'),
    filePrefix: this.fb.nonNullable.control('split'),
    pad: this.fb.nonNullable.control(true),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly mode = controlToSignal(this.form.controls.mode);
  readonly rangesText = controlToSignal(this.form.controls.rangesText);
  readonly filePrefix = controlToSignal(this.form.controls.filePrefix);
  readonly pad = controlToSignal(this.form.controls.pad);

  readonly fileName = computed(() => this.sourceInfo()?.name ?? null);
  readonly fileSize = computed(() => this.sourceInfo()?.size ?? null);

  readonly filteredOutputs = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.outputs();
    if (!f) return all;

    return all.filter(o => {
      const hay = `${o.fileName} ${o.range.from}-${o.range.to} ${o.pages} ${o.bytes}`.toLowerCase();
      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const src = this.sourceInfo();
    const outs = this.outputs();
    const outBytes = outs.reduce((a, b) => a + (b.bytes || 0), 0);
    return {
      sourcePages: src?.pageCount ?? 0,
      sourceBytes: src?.size ?? 0,
      outputs: outs.length,
      outBytes,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => ([
    { label: $localize`:@@pdf_split_stat_pages:Pages (source)`, value: this.stats().sourcePages || '—' },
    { label: $localize`:@@pdf_split_stat_outputs:Fichiers`, value: this.stats().outputs },
    { label: $localize`:@@pdf_split_stat_in:Entrée`, value: this.stats().sourceBytes ? fmtBytes(this.stats().sourceBytes) : '—' },
    { label: $localize`:@@pdf_split_stat_out:Sortie`, value: this.stats().outBytes ? fmtBytes(this.stats().outBytes) : '—' },
  ]));

  readonly jsonObject = computed(() => this.report());
  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  readonly showResults = computed(() => !!this.sourceFile() || this.status() === 'ready');
  readonly downloadDisabled = computed(() => this.status() !== 'ready' || this.outputs().length === 0);

  // ---------- file input
  async onFileSelected(file: File) {
    this.reset(false);

    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return;

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: false });

      this.sourceFile.set(file);
      this.sourceInfo.set({
        name: file.name,
        size: file.size,
        pageCount: doc.getPageCount(),
      });

      this.status.set('idle');
      this.tipMessage.set(this.ui.tipPrivacy);
    } catch (e: any) {
      this.status.set('error');
      this.errorMessage.set(e?.message || this.ui.errGeneric);
    }
  }

  // ---------- main action
  async splitNow() {
    const file = this.sourceFile();
    const info = this.sourceInfo();

    if (!file || !info) {
      this.tipMessage.set($localize`:@@pdf_split_need_file:Choisissez d’abord un PDF.`);
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    try {
      const buf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: false });
      const totalPages = srcDoc.getPageCount();

      const mode = this.mode();
      const notes: string[] = [this.ui.tipSign];

      let ranges: Range[] = [];
      if (mode === 'each-page') {
        ranges = Array.from({ length: totalPages }, (_, i) => ({ from: i + 1, to: i + 1 }));
      } else {
        ranges = parseRanges(this.rangesText(), totalPages);
      }

      if (ranges.length === 0) {
        throw new Error($localize`:@@pdf_split_no_ranges:Aucune plage valide.`);
      }

      const prefix = (this.filePrefix() || 'split').trim() || 'split';
      const padWidth = this.pad() ? String(ranges.length).length : 0;

      const outs: SplitOutput[] = [];
      for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i];

        const outDoc = await PDFDocument.create();
        const indices = Array.from({ length: r.to - r.from + 1 }, (_, k) => (r.from - 1) + k);

        const copied = await outDoc.copyPages(srcDoc, indices);
        copied.forEach(p => outDoc.addPage(p));

        const bytes = await outDoc.save();
        const safe = forceArrayBufferBacked(bytes);

        const idx = i + 1;
        const idxStr = padWidth ? String(idx).padStart(padWidth, '0') : String(idx);
        const name = buildSplitName(file.name, prefix, idxStr, r);

        outs.push({
          index: idx,
          fileName: name,
          range: r,
          pages: r.to - r.from + 1,
          bytes: safe.byteLength,
          pdfBytes: safe,
        });
      }

      const rep: SplitReport = {
        source: { name: info.name, size: info.size, pageCount: info.pageCount },
        mode,
        requested: { rangesText: mode === 'ranges' ? this.rangesText() : null },
        outputs: outs.map(o => ({
          index: o.index,
          fileName: o.fileName,
          from: o.range.from,
          to: o.range.to,
          pages: o.pages,
          bytes: o.bytes,
        })),
        notes,
      };

      this.outputs.set(outs);
      this.report.set(rep);
      this.status.set('ready');
      this.tipMessage.set($localize`:@@pdf_split_done:Découpage terminé. Téléchargez le ZIP (PDFs + mapping).`);
    } catch (e: any) {
      this.status.set('error');
      this.errorMessage.set(e?.message || this.ui.errGeneric);
    }
  }

  // ---------- per-item download
  downloadOne(o: SplitOutput) {
    if (this.status() !== 'ready') return;
    downloadBytes(o.pdfBytes, o.fileName);
    this.tipMessage.set($localize`:@@pdf_split_one_downloading:Téléchargement lancé.`);
    window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 1500);
  }

  // ---------- ZIP download (shell button)
  async downloadZip() {
    const outs = this.outputs();
    const rep = this.report();
    const src = this.sourceInfo();

    if (!outs.length || !rep || !src) {
      this.tipMessage.set($localize`:@@pdf_split_no_out:Pas de fichiers extraits. Lancez le découpage d’abord.`);
      return;
    }

    try {
      const zip = new JSZip();

      // PDFs
      for (const o of outs) {
        zip.file(o.fileName, toArrayBuffer(o.pdfBytes));
      }

      // mapping.json (très utile pour CI/debug)
      const mappingName = 'mapping.json';
      zip.file(mappingName, this.jsonText());

      const zipU8 = await zip.generateAsync({ type: 'uint8array' });
      const safeZip = forceArrayBufferBacked(zipU8);

      const zipName = buildZipName(src.name);
      downloadBytes(safeZip, zipName, 'application/zip');

      this.tipMessage.set($localize`:@@pdf_split_zip_downloading:Téléchargement du ZIP lancé.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2000);
    } catch (e: any) {
      this.tipMessage.set($localize`:@@pdf_split_zip_fail:Impossible de générer le ZIP.`);
      this.errorMessage.set(e?.message || this.ui.errGeneric);
      this.status.set('error');
    }
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_split_copied:Mapping JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_split_copy_fail:Impossible de copier automatiquement. Copiez manuellement le JSON.`);
    }
  }

  reset(clearFile = true) {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    if (clearFile) {
      this.sourceFile.set(null);
      this.sourceInfo.set(null);
    }

    this.outputs.set([]);
    this.report.set(null);

    this.form.patchValue({
      pretty: true,
      filter: '',
      mode: 'ranges',
      rangesText: '1-1',
      filePrefix: 'split',
      pad: true,
    });
  }
}

/* =============================================================================
 * Helpers
 * ============================================================================= */

function parseRanges(text: string, maxPage: number): Range[] {
  const raw = (text ?? '').trim();
  if (!raw) return [];

  const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
  const ranges: Range[] = [];

  for (const p of parts) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(p);
    if (!m) continue;

    const a = clampInt(parseInt(m[1], 10), 1, maxPage);
    const b = m[2] ? clampInt(parseInt(m[2], 10), 1, maxPage) : a;

    const from = Math.min(a, b);
    const to = Math.max(a, b);

    ranges.push({ from, to });
  }

  // merge overlaps/contiguous
  ranges.sort((x, y) => x.from - y.from || x.to - y.to);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) merged.push({ ...r });
    else if (r.from <= last.to + 1) last.to = Math.max(last.to, r.to);
    else merged.push({ ...r });
  }

  return merged;
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function buildSplitName(originalName: string, prefix: string, idxStr: string, r: Range): string {
  const base = originalName.replace(/\.pdf$/i, '');
  const rangePart = r.from === r.to ? `p${r.from}` : `p${r.from}-${r.to}`;
  return `${base}_${prefix}_${idxStr}_${rangePart}.pdf`;
}

function buildZipName(originalName: string): string {
  const base = originalName.replace(/\.pdf$/i, '');
  return `${base}_split.zip`;
}

function forceArrayBufferBacked(u8: Uint8Array): Uint8Array {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

function downloadBytes(bytes: Uint8Array, name: string, mime = 'application/pdf') {
  const blob = new Blob([toArrayBuffer(bytes)], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = name || (mime === 'application/zip' ? 'files.zip' : 'file.pdf');
  a.click();

  URL.revokeObjectURL(url);
}

function fmtBytes(n: number): string {
  if (!n || n < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
