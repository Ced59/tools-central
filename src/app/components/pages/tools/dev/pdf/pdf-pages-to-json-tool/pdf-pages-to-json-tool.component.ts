import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PDFDocument } from 'pdf-lib';

import type { PdfToolStatCard, PdfToolStatus, PdfToolShellUi } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import {PdfToolShellComponent} from "../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component";

type PageOrientation = 'portrait' | 'landscape' | 'square' | 'unknown';

interface PdfPageItem {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  rotationDeg: number;
  orientation: PageOrientation;
  sizeName: string | null;
  widthMm: number;
  heightMm: number;
}

@Component({
  selector: 'app-pdf-pages-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-pages-to-json-tool.component.html',
  styleUrl: './pdf-pages-to-json-tool.component.scss',
})
export class PdfPagesToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  // UI (tool-specific)
  readonly ui = {
    title: $localize`:@@pdf_pages_title:Pages PDF → JSON`,
    subtitle: $localize`:@@pdf_pages_subtitle:Exporter les infos de pages (dimensions, rotation, orientation, format) au format JSON, localement.`,

    pageLabel: $localize`:@@pdf_pages_page:Page`,
    rotLabel: $localize`:@@pdf_pages_rotation:Rot.`,
    orientationLabel: $localize`:@@pdf_pages_orientation:Orientation`,
    sizePtLabel: $localize`:@@pdf_pages_size_pt:Taille (pt)`,
    sizeMmLabel: $localize`:@@pdf_pages_size_mm:Taille (mm)`,
    formatGuessLabel: $localize`:@@pdf_pages_format_guess:Format (guess)`,

    prettyLabel: $localize`:@@pdf_pages_pretty:JSON “pretty” (indenté)`,
    includeMmLabel: $localize`:@@pdf_pages_include_mm:Inclure les dimensions en mm`,
  };

  // Shell UI (structure commune)
  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_pages_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_pages_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_pages_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_pages_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_pages_filter_placeholder:Filtrer (A4, Letter, portrait, 90…)`,

    statusLoading: $localize`:@@pdf_pages_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_pages_status_ready:Prêt`,
    statusError: $localize`:@@pdf_pages_status_error:Erreur`,

    importTitle: $localize`:@@pdf_pages_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_pages_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_pages_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_pages_results_sub:Aperçu des pages et export JSON.`,

    jsonTitle: $localize`:@@pdf_pages_json_title:JSON`,
    jsonSub: $localize`:@@pdf_pages_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_pages_left_title:Pages`,
    emptyText: $localize`:@@pdf_pages_empty:Aucune page à afficher.`,
    backText: $localize`:@@pdf_pages_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly pages = signal<PdfPageItem[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeMm: this.fb.nonNullable.control(true),
  });

  // ✅ Fix filtre & options: FormControl -> Signal (réactif)
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includeMm = controlToSignal(this.form.controls.includeMm);

  readonly filteredPages = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.pages();
    if (!f) return all;

    return all.filter(p => {
      const hay = [
        p.pageNumber,
        p.widthPt,
        p.heightPt,
        p.rotationDeg,
        p.orientation,
        p.sizeName ?? '',
        this.includeMm() ? p.widthMm : '',
        this.includeMm() ? p.heightMm : '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.pages();
    const rotated = all.filter(p => normalizeRotationDeg(p.rotationDeg) !== 0).length;

    const sizes = new Map<string, number>();
    for (const p of all) {
      const k = p.sizeName ?? 'Unknown';
      sizes.set(k, (sizes.get(k) ?? 0) + 1);
    }

    const topSizes = Array.from(sizes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return { rotated, topSizes };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => {
    const s = this.stats();
    return [
      { label: $localize`:@@pdf_pages_stat_pages:Pages`, value: this.pageCount() },
      { label: $localize`:@@pdf_pages_stat_rotated:Pages rotées`, value: s.rotated },
      { label: $localize`:@@pdf_pages_stat_formats:Formats (top)`, value: s.topSizes.length },
    ];
  });

  readonly jsonObject = computed(() => {
    const items = this.filteredPages().map(p => {
      const o: Record<string, unknown> = {
        pageNumber: p.pageNumber,
        widthPt: p.widthPt,
        heightPt: p.heightPt,
        rotationDeg: p.rotationDeg,
        orientation: p.orientation,
        sizeName: p.sizeName,
      };

      if (this.includeMm()) {
        o['widthMm'] = p.widthMm;
        o['heightMm'] = p.heightMm;
      }
      return o;
    });

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      pages: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.pages.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const pages = doc.getPages();
      this.pageCount.set(pages.length);

      const items: PdfPageItem[] = [];

      for (let i = 0; i < pages.length; i++) {
        const pageNumber = i + 1;
        const page = pages[i];

        const size = page.getSize();
        const widthPt = round(size.width, 2);
        const heightPt = round(size.height, 2);

        const rotationDeg = normalizeRotationDeg(page.getRotation().angle ?? 0);
        const orientation = guessOrientation(widthPt, heightPt);
        const sizeName = guessSizeName(widthPt, heightPt);

        const widthMm = round(ptToMm(widthPt), 2);
        const heightMm = round(ptToMm(heightPt), 2);

        items.push({
          pageNumber,
          widthPt,
          heightPt,
          rotationDeg,
          orientation,
          sizeName,
          widthMm,
          heightMm,
        });
      }

      this.pages.set(items);
      this.status.set('ready');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' && e.message.trim()
        ? e.message
        : $localize`:@@pdf_pages_err_generic:Impossible de lire ce PDF.`;

      this.status.set('error');
      this.errorMessage.set(msg);
    }
  }

  reset() {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.fileName.set('');
    this.fileSize.set(0);
    this.pageCount.set(0);
    this.pages.set([]);
    this.form.patchValue({ filter: '', pretty: true, includeMm: true });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_pages_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_pages_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-pages') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* ---------------- helpers ---------------- */

function ptToMm(pt: number): number {
  return (pt / 72) * 25.4;
}

function round(n: number, d: number): number {
  const m = Math.pow(10, d);
  return Math.round(n * m) / m;
}

function normalizeRotationDeg(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

function guessOrientation(w: number, h: number): PageOrientation {
  const eps = 0.5;
  if (Math.abs(w - h) <= eps) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

function guessSizeName(wPt: number, hPt: number): string | null {
  const tol = 2.0;
  const sizes: Array<{ name: string; w: number; h: number }> = [
    { name: 'A0', w: 2383.94, h: 3370.39 },
    { name: 'A1', w: 1683.78, h: 2383.94 },
    { name: 'A2', w: 1190.55, h: 1683.78 },
    { name: 'A3', w: 841.89, h: 1190.55 },
    { name: 'A4', w: 595.28, h: 841.89 },
    { name: 'A5', w: 419.53, h: 595.28 },
    { name: 'Letter', w: 612, h: 792 },
    { name: 'Legal', w: 612, h: 1008 },
    { name: 'Tabloid', w: 792, h: 1224 },
  ];

  for (const s of sizes) {
    const match1 = Math.abs(wPt - s.w) <= tol && Math.abs(hPt - s.h) <= tol;
    const match2 = Math.abs(wPt - s.h) <= tol && Math.abs(hPt - s.w) <= tol;
    if (match1 || match2) return s.name;
  }

  return null;
}
