import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PDFDocument, PDFName, PDFDict, PDFRef, PDFString, PDFHexString, PDFArray } from 'pdf-lib';

type ToolStatus = 'idle' | 'loading' | 'ready' | 'error';

interface OutlineItemJson {
  title: string;
  level: number;
  pageNumber: number | null;
  items?: OutlineItemJson[];
}

@Component({
  selector: 'app-pdf-outline-to-json-tool',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './pdf-outline-to-json-tool.component.html',
  styleUrl: './pdf-outline-to-json-tool.component.scss',
})
export class PdfOutlineToJsonToolComponent {
  private readonly fb = new FormBuilder();
  readonly fileInputId = 'pdf-outline-file-input';

  // UI labels (évite $localize dans le template)
  readonly ui = {
    btnPick: $localize`:@@pdf_outline_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_outline_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_outline_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_outline_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_outline_filter_placeholder:Filtrer (titre…)`,
    statusLoading: $localize`:@@pdf_outline_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_outline_status_ready:Prêt`,
    statusError: $localize`:@@pdf_outline_status_error:Erreur`,
    copied: $localize`:@@pdf_outline_copied:JSON copié dans le presse-papiers.`,
    copyFail: $localize`:@@pdf_outline_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`,
    errGeneric: $localize`:@@pdf_outline_err_generic:Impossible de lire ce PDF.`,
    tipNoOutline: $localize`:@@pdf_outline_tip_no_outline:Ce PDF ne contient pas de sommaire (bookmarks).`,
  };

  readonly status = signal<ToolStatus>('idle');
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

  readonly filter = computed(() => (this.form.value.filter ?? '').trim().toLowerCase());
  readonly pretty = computed(() => !!this.form.value.pretty);

  readonly flatCount = computed(() => countOutline(this.outline()));

  readonly filteredOutline = computed(() => {
    const f = this.filter();
    const items = this.outline();
    if (!f) return items;
    return filterOutline(items, f);
  });

  readonly jsonObject = computed((): Record<string, unknown> => {
    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      outline: this.filteredOutline(),
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly stats = computed(() => ({
    pages: this.pageCount(),
    topLevel: this.outline().length,
    totalItems: this.flatCount(),
  }));

  triggerFilePick() {
    const el = document.getElementById(this.fileInputId) as HTMLInputElement | null;
    el?.click();
  }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

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
        this.tipMessage.set(this.ui.tipNoOutline);
        return;
      }

      const outlinesDict = resolveDict(doc, outlinesEntry);
      if (!outlinesDict) {
        this.outline.set([]);
        this.status.set('ready');
        this.tipMessage.set(this.ui.tipNoOutline);
        return;
      }

      const first = outlinesDict.get(PDFName.of('First'));
      if (!first) {
        this.outline.set([]);
        this.status.set('ready');
        this.tipMessage.set(this.ui.tipNoOutline);
        return;
      }

      const items = readSiblingChain(doc, first, 0, pageRefToNumber);
      this.outline.set(items);

      this.status.set('ready');
      if (items.length === 0) this.tipMessage.set(this.ui.tipNoOutline);
    } catch (e: any) {
      const msg = typeof e?.message === 'string' && e.message.trim() ? e.message : this.ui.errGeneric;
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
      this.tipMessage.set(this.ui.copied);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(this.ui.copyFail);
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

/** Map internal page references -> 1-based page number */
function buildPageRefMap(doc: PDFDocument): Map<string, number> {
  const map = new Map<string, number>();
  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    // pdf-lib internal: each page has a ref (PDFRef)
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
  const seenRefs = new Set<string>(); // safety against cycles

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
  // Targets can be:
  // - /Dest [pageRef /XYZ ...]
  // - /A << /S /GoTo /D ... >>
  const dest = item.get(PDFName.of('Dest'));
  const action = item.get(PDFName.of('A'));

  const destValue = dest ?? getGoToDestFromAction(doc, action);
  if (!destValue) return null;

  // dest array: [pageRef ...]
  if (destValue instanceof PDFArray) {
    const first = destValue.get(0);
    if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    return null;
  }

  // dest ref -> array
  if (destValue instanceof PDFRef) {
    const looked = doc.context.lookup(destValue);
    if (looked instanceof PDFArray) {
      const first = looked.get(0);
      if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    }
    return null;
  }

  // Named destinations exist but resolving them requires parsing the NameTree (/Dests).
  // Best-effort: return null.
  return null;
}

function getGoToDestFromAction(doc: PDFDocument, action: unknown): unknown | null {
  const dict = resolveDict(doc, action);
  if (!dict) return null;

  const s = dict.get(PDFName.of('S'));
  if (!(s instanceof PDFName) || s.asString() !== '/GoTo') return null;

  const d = dict.get(PDFName.of('D'));
  if (!d) return null;

  // Ignore scalar-like pdf-lib objects (duck-typing) — they are not useful here
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
