import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

type MetadataMode = 'keep-first' | 'blank' | 'custom';

interface SelectedPdf {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  fingerprint?: string | null; // best-effort
}

interface MergeMappingItem {
  sourceIndex: number;
  fileName: string;
  sourcePages: number;
  outputFromPage: number; // 1-based
  outputToPage: number;   // 1-based
}

interface MergeReport {
  output: {
    fileName: string;
    totalPages: number;
    totalSources: number;
    bytes: number;
  };
  sources: Array<{
    fileName: string;
    pages: number;
    size: number;
  }>;
  mapping: MergeMappingItem[];
  meta: {
    mode: MetadataMode;
    title?: string | null;
    author?: string | null;
    subject?: string | null;
    keywords?: string | null;
    producer?: string | null;
    creator?: string | null;
  };
  notes: string[];
}

@Component({
  selector: 'app-pdf-merge-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-merge-tool.component.html',
  styleUrl: './pdf-merge-tool.component.scss',
})
export class PdfMergeToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_merge_title:Fusionner des PDF`,
    subtitle: $localize`:@@pdf_merge_subtitle:Fusionnez plusieurs PDF en un seul document, dans l’ordre choisi, avec un mapping pages source → pages finales. Tout se fait localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_merge_err_title:Impossible de fusionner ces PDF.`,
    errGeneric: $localize`:@@pdf_merge_err_generic:Une erreur est survenue.`,
    tipPrivacy: $localize`:@@pdf_merge_tip_privacy:Aucun upload : vos fichiers restent sur votre appareil.`,
    tipSign: $localize`:@@pdf_merge_tip_sign:Attention : fusionner invalide généralement les signatures existantes (document signé doit rester inchangé).`,
  };

  readonly uiShell: PdfToolShellUi = {
    // 🔁 bouton shell = multi-sélection maintenant
    btnPick: $localize`:@@pdf_merge_btn_pick:Ajouter des PDF`,
    btnReset: $localize`:@@pdf_merge_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_merge_btn_copy:Copier le mapping`,
    btnDownload: $localize`:@@pdf_merge_btn_download:Télécharger le PDF fusionné`,

    placeholderFilter: $localize`:@@pdf_merge_filter_placeholder:Filtrer (nom, pages, ordre…)`,

    statusLoading: $localize`:@@pdf_merge_status_loading:Traitement…`,
    statusReady: $localize`:@@pdf_merge_status_ready:Prêt`,
    statusError: $localize`:@@pdf_merge_status_error:Erreur`,

    importTitle: $localize`:@@pdf_merge_card_import_title:Sélectionner les PDF`,
    importSub: $localize`:@@pdf_merge_card_import_sub:Ajoutez plusieurs PDF, réordonnez, puis lancez la fusion.`,

    resultsTitle: $localize`:@@pdf_merge_card_results_title:Résultat`,
    resultsSub: $localize`:@@pdf_merge_card_results_sub:PDF fusionné + mapping pages.`,

    jsonTitle: $localize`:@@pdf_merge_json_title:Mapping JSON`,
    jsonSub: $localize`:@@pdf_merge_json_sub:Traçabilité (pages sources → pages finales)`,

    leftTitle: $localize`:@@pdf_merge_left_title:Fichiers`,
    emptyText: $localize`:@@pdf_merge_empty:Aucun PDF ajouté.`,
    backText: $localize`:@@pdf_merge_back:← Retour aux outils PDF`,
  };

  // ---------- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>(this.ui.tipPrivacy);

  readonly files = signal<SelectedPdf[]>([]);
  readonly mergedBytes = signal<Uint8Array | null>(null);
  readonly mergedName = signal<string>('merged.pdf');

  readonly report = signal<MergeReport | null>(null);

  // ---------- form
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),

    metadataMode: this.fb.nonNullable.control<MetadataMode>('keep-first'),
    customTitle: this.fb.nonNullable.control(''),
    customAuthor: this.fb.nonNullable.control(''),
    customSubject: this.fb.nonNullable.control(''),
    customKeywords: this.fb.nonNullable.control(''),

    keepOutlinesBestEffort: this.fb.nonNullable.control(true), // pdf-lib: best-effort (no real outline merge)
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);

  readonly metadataMode = controlToSignal(this.form.controls.metadataMode);
  readonly customTitle = controlToSignal(this.form.controls.customTitle);
  readonly customAuthor = controlToSignal(this.form.controls.customAuthor);
  readonly customSubject = controlToSignal(this.form.controls.customSubject);
  readonly customKeywords = controlToSignal(this.form.controls.customKeywords);

  readonly filteredFiles = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.files();
    if (!f) return all;

    return all.filter(x => {
      const hay = `${x.name} ${x.pageCount} ${x.size}`.toLowerCase();
      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.files();
    const totalPages = all.reduce((a, b) => a + (b.pageCount || 0), 0);
    const totalBytes = all.reduce((a, b) => a + (b.size || 0), 0);
    const outBytes = this.mergedBytes()?.byteLength ?? 0;

    return {
      sources: all.length,
      totalPages,
      totalBytes,
      outBytes,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => ([
    { label: $localize`:@@pdf_merge_stat_sources:Fichiers`, value: this.stats().sources },
    { label: $localize`:@@pdf_merge_stat_pages:Pages`, value: this.stats().totalPages },
    { label: $localize`:@@pdf_merge_stat_in:Entrée`, value: fmtBytes(this.stats().totalBytes) },
    { label: $localize`:@@pdf_merge_stat_out:Sortie`, value: this.stats().outBytes ? fmtBytes(this.stats().outBytes) : '—' },
  ]));

  readonly jsonObject = computed(() => this.report());
  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  /** ✅ Affichage “sélection” dans le shell (à la place du mergedName avant fusion) */
  readonly pickedLabel = computed(() => {
    const count = this.files().length;
    if (count === 0) return null;

    // Après fusion: on affiche le nom de sortie
    if (this.status() === 'ready' && this.mergedBytes()) return this.mergedName();

    // Avant fusion: on affiche une info claire
    if (count === 1) return this.files()[0].name;
    return $localize`:@@pdf_merge_selected_n:${count}:n: fichiers sélectionnés`;
  });

  // ---------- add files (shell multi-select)
  async onFilesSelected(files: File[]) {
    await this.addFiles(files);
  }

  private async addFiles(list: File[]) {
    const add = list.filter(f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
    if (add.length === 0) return;

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    try {
      const current = [...this.files()];

      for (const f of add) {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: false });
        const pageCount = doc.getPageCount();

        current.push({
          id: cryptoId(),
          file: f,
          name: f.name,
          size: f.size,
          pageCount,
          fingerprint: null,
        });
      }

      this.files.set(current);
      this.status.set('idle');

      // Invalidate previous merge
      this.mergedBytes.set(null);
      this.report.set(null);
      this.mergedName.set('merged.pdf');
    } catch (e: any) {
      this.status.set('error');
      this.errorMessage.set(e?.message || this.ui.errGeneric);
    }
  }

  remove(id: string) {
    this.files.set(this.files().filter(f => f.id !== id));
    this.mergedBytes.set(null);
    this.report.set(null);
    this.mergedName.set('merged.pdf');
    if (this.files().length === 0) this.status.set('idle');
  }

  moveUp(id: string) {
    const arr = [...this.files()];
    const i = arr.findIndex(x => x.id === id);
    if (i <= 0) return;
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    this.files.set(arr);
    this.mergedBytes.set(null);
    this.report.set(null);
    this.mergedName.set('merged.pdf');
  }

  moveDown(id: string) {
    const arr = [...this.files()];
    const i = arr.findIndex(x => x.id === id);
    if (i < 0 || i >= arr.length - 1) return;
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    this.files.set(arr);
    this.mergedBytes.set(null);
    this.report.set(null);
    this.mergedName.set('merged.pdf');
  }

  async mergeNow() {
    const sources = this.files();
    if (sources.length < 2) {
      this.tipMessage.set($localize`:@@pdf_merge_need_2:Ajoutez au moins 2 PDF pour fusionner.`);
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    try {
      const out = await PDFDocument.create();

      // Metadata policy
      const mode = this.metadataMode();
      const notes: string[] = [this.ui.tipSign];

      const mapping: MergeMappingItem[] = [];
      let outPageCursor = 1;
      let firstMetaApplied = false;

      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];

        const srcBytes = await src.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: false });

        // Apply metadata once (based on policy)
        if (!firstMetaApplied) {
          firstMetaApplied = true;
          if (mode === 'keep-first') {
            applyMetadataKeepFirst(out, srcDoc);
          } else if (mode === 'blank') {
            applyMetadataBlank(out);
          } else {
            applyMetadataCustom(out, {
              title: this.customTitle(),
              author: this.customAuthor(),
              subject: this.customSubject(),
              keywords: this.customKeywords(),
            });
          }
        }

        const pageCount = srcDoc.getPageCount();
        const indices = Array.from({ length: pageCount }, (_, idx) => idx);

        const copied = await out.copyPages(srcDoc, indices);
        copied.forEach(p => out.addPage(p));

        const from = outPageCursor;
        const to = outPageCursor + pageCount - 1;

        mapping.push({
          sourceIndex: i,
          fileName: src.name,
          sourcePages: pageCount,
          outputFromPage: from,
          outputToPage: to,
        });

        outPageCursor = to + 1;
      }

      const outBytesU8 = await out.save();
      const safeBytes = forceArrayBufferBacked(outBytesU8);

      const outputName = buildMergedName(sources);
      this.mergedName.set(outputName);
      this.mergedBytes.set(safeBytes);

      const rep: MergeReport = {
        output: {
          fileName: outputName,
          totalPages: out.getPageCount(),
          totalSources: sources.length,
          bytes: safeBytes.byteLength,
        },
        sources: sources.map(s => ({ fileName: s.name, pages: s.pageCount, size: s.size })),
        mapping,
        meta: {
          mode,
          title: mode === 'custom' ? (this.customTitle() || null) : undefined,
          author: mode === 'custom' ? (this.customAuthor() || null) : undefined,
          subject: mode === 'custom' ? (this.customSubject() || null) : undefined,
          keywords: mode === 'custom' ? (this.customKeywords() || null) : undefined,
        },
        notes,
      };

      this.report.set(rep);
      this.status.set('ready');
      this.tipMessage.set($localize`:@@pdf_merge_done:Fusion terminée. Vous pouvez télécharger le PDF fusionné.`);
    } catch (e: any) {
      this.status.set('error');
      this.errorMessage.set(e?.message || this.ui.errGeneric);
    }
  }

  reset() {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    this.files.set([]);
    this.mergedBytes.set(null);
    this.mergedName.set('merged.pdf');
    this.report.set(null);

    this.form.patchValue({
      pretty: true,
      filter: '',
      metadataMode: 'keep-first',
      customTitle: '',
      customAuthor: '',
      customSubject: '',
      customKeywords: '',
      keepOutlinesBestEffort: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_merge_copied:Mapping JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_merge_copy_fail:Impossible de copier automatiquement. Copiez manuellement le JSON.`);
    }
  }

  downloadMerged() {
    const bytes = this.mergedBytes();
    if (!bytes || this.status() !== 'ready') {
      this.tipMessage.set($localize`:@@pdf_merge_no_out:Pas de PDF fusionné. Lancez la fusion d’abord.`);
      return;
    }

    const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.mergedName() || 'merged.pdf';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* =============================================================================
 * Metadata helpers (best-effort)
 * ============================================================================= */

function applyMetadataKeepFirst(out: PDFDocument, first: PDFDocument) {
  try {
    const title = (first as any).getTitle?.() as string | undefined;
    const author = (first as any).getAuthor?.() as string | undefined;
    const subject = (first as any).getSubject?.() as string | undefined;
    const keywords = (first as any).getKeywords?.() as string[] | string | undefined;

    if (title) out.setTitle(title);
    if (author) out.setAuthor(author);
    if (subject) out.setSubject(subject);
    if (Array.isArray(keywords)) out.setKeywords(keywords);
    else if (typeof keywords === 'string' && keywords.trim()) {
      out.setKeywords(keywords.split(',').map(s => s.trim()).filter(Boolean));
    }
  } catch {
    // ignore
  }
}

function applyMetadataBlank(out: PDFDocument) {
  out.setTitle('');
  out.setAuthor('');
  out.setSubject('');
  out.setKeywords([]);
}

function applyMetadataCustom(
  out: PDFDocument,
  m: { title: string; author: string; subject: string; keywords: string }
) {
  if (m.title?.trim()) out.setTitle(m.title.trim());
  if (m.author?.trim()) out.setAuthor(m.author.trim());
  if (m.subject?.trim()) out.setSubject(m.subject.trim());

  const kw = (m.keywords ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (kw.length) out.setKeywords(kw);
}

function forceArrayBufferBacked(u8: Uint8Array): Uint8Array {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy;
}

function buildMergedName(_sources: SelectedPdf[]): string {
  return 'merged.pdf';
}

function cryptoId(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`);
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

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}
