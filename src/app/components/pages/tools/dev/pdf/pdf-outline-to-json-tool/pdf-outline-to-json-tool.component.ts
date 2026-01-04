import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef, PDFString } from 'pdf-lib';


import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';
import {PdfToolShellComponent} from "../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component";

interface OutlineItemJson {
  title: string;
  level: number;
  pageNumber: number | null;
  items?: OutlineItemJson[];
}

@Component({
  selector: 'app-pdf-outline-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-outline-to-json-tool.component.html',
  styleUrl: './pdf-outline-to-json-tool.component.scss',
})
export class PdfOutlineToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  // Text tool
  readonly ui = {
    title: $localize`:@@pdf_outline_title:Sommaire PDF → JSON`,
    subtitle: $localize`:@@pdf_outline_subtitle:Extrayez le sommaire (bookmarks / outline) d’un PDF et exportez-le au format JSON, localement dans votre navigateur.`,

    errTitle: $localize`:@@pdf_outline_err_title:Impossible d’extraire le sommaire.`,
  };

  // Text shell
  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_outline_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_outline_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_outline_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_outline_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_outline_filter_placeholder:Filtrer (titre…)`,

    statusLoading: $localize`:@@pdf_outline_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_outline_status_ready:Prêt`,
    statusError: $localize`:@@pdf_outline_status_error:Erreur`,

    importTitle: $localize`:@@pdf_outline_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_outline_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_outline_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_outline_card_results_sub:Aperçu du sommaire et export JSON.`,

    jsonTitle: $localize`:@@pdf_outline_json_title:JSON`,
    jsonSub: $localize`:@@pdf_outline_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_outline_list_title:Sommaire`,
    emptyText: $localize`:@@pdf_outline_empty:Aucun élément de sommaire à afficher.`,
    backText: $localize`:@@pdf_outline_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly outline = signal<OutlineItemJson[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
  });

  // ✅ fix réactivité
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);

  readonly flatCount = computed(() => countOutline(this.outline()));

  readonly filteredOutline = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const items = this.outline();
    if (!f) return items;
    return filterOutline(items, f);
  });

  // combien d’items restent après filtrage (flat)
  readonly flatFilteredCount = computed(() => countOutline(this.filteredOutline()));

  readonly stats = computed(() => ({
    pages: this.pageCount(),
    topLevel: this.outline().length,
    totalItems: this.flatCount(),
  }));

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_outline_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_outline_stat_top_label:Niveau 1`, value: this.stats().topLevel },
    { label: $localize`:@@pdf_outline_stat_total_label:Entrées`, value: this.stats().totalItems },
  ]);

  readonly jsonObject = computed((): Record<string, unknown> => ({
    _fileName: this.fileName() || null,
    _fileSize: this.fileSize(),
    _pageCount: this.pageCount(),
    outline: this.filteredOutline(),
  }));

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.outline.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      this.pageCount.set(doc.getPageCount());

      const pageRefToNumber = buildPageRefMap(doc);

      const outlinesEntry = doc.catalog.get(PDFName.of('Outlines'));
      if (!outlinesEntry) {
        this.outline.set([]);
        this.status.set('ready');
        this.tipMessage.set($localize`:@@pdf_outline_tip_no_outline:Ce PDF ne contient pas de sommaire (bookmarks).`);
        return;
      }

      const outlinesDict = resolveDict(doc, outlinesEntry);
      if (!outlinesDict) {
        this.outline.set([]);
        this.status.set('ready');
        this.tipMessage.set($localize`:@@pdf_outline_tip_no_outline:Ce PDF ne contient pas de sommaire (bookmarks).`);
        return;
      }

      const first = outlinesDict.get(PDFName.of('First'));
      if (!first) {
        this.outline.set([]);
        this.status.set('ready');
        this.tipMessage.set($localize`:@@pdf_outline_tip_no_outline:Ce PDF ne contient pas de sommaire (bookmarks).`);
        return;
      }

      const items = readSiblingChain(doc, first, 0, pageRefToNumber);
      this.outline.set(items);

      this.status.set('ready');
      if (items.length === 0) {
        this.tipMessage.set($localize`:@@pdf_outline_tip_no_outline:Ce PDF ne contient pas de sommaire (bookmarks).`);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_outline_err_generic:Impossible de lire ce PDF.`;

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
    this.outline.set([]);
    this.form.patchValue({ filter: '', pretty: true });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_outline_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_outline_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-outline') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* ---------------- PDF helpers (identiques à ton implémentation) ---------------- */

/** Map internal page references -> 1-based page number */
function buildPageRefMap(doc: PDFDocument): Map<string, number> {
  const map = new Map<string, number>();
  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const ref = (pages[i] as any).ref as PDFRef | undefined;
    if (ref) map.set(ref.toString(), i + 1);
  }
  return map;
}

function resolveDict(doc: PDFDocument, v: unknown): PDFDict | null {
  const ctx = doc.context;

  if (v instanceof PDFDict) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFDict ? looked : null;
  }
  return null;
}

function decodePdfString(v: unknown): string {
  if (v instanceof PDFString) return v.decodeText();
  if (v instanceof PDFHexString) return v.decodeText();
  return '';
}

function readSiblingChain(
  doc: PDFDocument,
  firstRefOrDict: unknown,
  level: number,
  pageRefToNumber: Map<string, number>
): OutlineItemJson[] {
  const items: OutlineItemJson[] = [];

  let current: unknown = firstRefOrDict;
  const seenRefs = new Set<string>();

  while (current) {
    const dict = resolveDict(doc, current);
    if (!dict) break;

    if (current instanceof PDFRef) {
      const key = current.toString();
      if (seenRefs.has(key)) break;
      seenRefs.add(key);
    }

    const title = decodePdfString(dict.get(PDFName.of('Title')));
    const pageNumber = resolvePageNumber(doc, dict, pageRefToNumber);

    const childFirst = dict.get(PDFName.of('First'));
    const children = childFirst ? readSiblingChain(doc, childFirst, level + 1, pageRefToNumber) : [];

    items.push({
      title: title || '—',
      level,
      pageNumber,
      ...(children.length ? { items: children } : {}),
    });

    current = dict.get(PDFName.of('Next'));
  }

  return items;
}

function resolvePageNumber(doc: PDFDocument, item: PDFDict, pageRefToNumber: Map<string, number>): number | null {
  const dest = item.get(PDFName.of('Dest'));
  const action = item.get(PDFName.of('A'));

  const destValue = dest ?? getGoToDestFromAction(doc, action);
  if (!destValue) return null;

  if (destValue instanceof PDFArray) {
    const first = destValue.get(0);
    if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    return null;
  }

  if (destValue instanceof PDFRef) {
    const looked = doc.context.lookup(destValue);
    if (looked instanceof PDFArray) {
      const first = looked.get(0);
      if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    }
    return null;
  }

  return null;
}

function getGoToDestFromAction(doc: PDFDocument, action: unknown): unknown | null {
  const dict = resolveDict(doc, action);
  if (!dict) return null;

  const s = dict.get(PDFName.of('S'));
  if (!(s instanceof PDFName) || s.asString() !== '/GoTo') return null;

  const d = dict.get(PDFName.of('D'));
  if (!d) return null;

  if (typeof (d as any)?.asNumber === 'function') return null;
  if (typeof (d as any)?.asBoolean === 'function') return null;
  if ((d as any)?.constructor?.name === 'PDFNull') return null;

  return d;
}

function countOutline(items: OutlineItemJson[]): number {
  let n = 0;
  for (const it of items) {
    n += 1;
    if (it.items?.length) n += countOutline(it.items);
  }
  return n;
}

function filterOutline(items: OutlineItemJson[], needle: string): OutlineItemJson[] {
  const out: OutlineItemJson[] = [];

  for (const it of items) {
    const t = (it.title ?? '').toLowerCase();
    const child = it.items?.length ? filterOutline(it.items, needle) : [];

    const keep = t.includes(needle) || child.length > 0;
    if (!keep) continue;

    out.push({
      ...it,
      items: child.length ? child : undefined,
    });
  }

  return out;
}
