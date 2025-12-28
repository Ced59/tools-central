import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFArray,
  PDFNumber,
} from 'pdf-lib';

type ToolStatus = 'idle' | 'loading' | 'ready' | 'error';

type LinkType = 'url' | 'internal' | 'unknown';

interface PdfLinkItem {
  type: LinkType;
  pageNumber: number; // page containing the link
  url?: string | null;
  targetPage?: number | null; // for internal goto
  rect?: { x: number; y: number; w: number; h: number } | null;
  rawAction?: string | null;
}

@Component({
  selector: 'app-pdf-links-to-json-tool',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './pdf-links-to-json-tool.component.html',
  styleUrl: './pdf-links-to-json-tool.component.scss',
})
export class PdfLinksToJsonToolComponent {
  private readonly fb = new FormBuilder();
  readonly fileInputId = 'pdf-links-file-input';

  readonly ui = {
    btnPick: $localize`:@@pdf_links_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_links_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_links_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_links_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_links_filter_placeholder:Filtrer (url, page…)`,
    statusLoading: $localize`:@@pdf_links_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_links_status_ready:Prêt`,
    statusError: $localize`:@@pdf_links_status_error:Erreur`,
    copied: $localize`:@@pdf_links_copied:JSON copié dans le presse-papiers.`,
    copyFail: $localize`:@@pdf_links_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`,
    errGeneric: $localize`:@@pdf_links_err_generic:Impossible de lire ce PDF.`,
    tipNone: $localize`:@@pdf_links_tip_none:Aucun lien détecté dans ce PDF.`,
  };

  readonly status = signal<ToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly links = signal<PdfLinkItem[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeRect: this.fb.nonNullable.control(false),
  });

  readonly filter = computed(() => (this.form.value.filter ?? '').trim().toLowerCase());
  readonly pretty = computed(() => !!this.form.value.pretty);
  readonly includeRect = computed(() => !!this.form.value.includeRect);

  readonly filteredLinks = computed(() => {
    const f = this.filter();
    const all = this.links();
    if (!f) return all;

    return all.filter(l => {
      const url = (l.url ?? '').toLowerCase();
      const raw = (l.rawAction ?? '').toLowerCase();
      const p = `${l.pageNumber}`.includes(f);
      const tp = `${l.targetPage ?? ''}`.includes(f);
      return url.includes(f) || raw.includes(f) || p || tp || l.type.includes(f);
    });
  });

  readonly jsonObject = computed((): Record<string, unknown> => {
    const items = this.filteredLinks().map(l => {
      const base: Record<string, unknown> = {
        type: l.type,
        pageNumber: l.pageNumber,
      };
      if (l.type === 'url') base['url'] = l.url ?? null;
      if (l.type === 'internal') base['targetPage'] = l.targetPage ?? null;
      if (this.includeRect()) base['rect'] = l.rect ?? null;
      if (l.type === 'unknown') base['rawAction'] = l.rawAction ?? null;
      return base;
    });

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      links: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly stats = computed(() => {
    const all = this.links();
    const url = all.filter(l => l.type === 'url').length;
    const internal = all.filter(l => l.type === 'internal').length;
    const unknown = all.filter(l => l.type === 'unknown').length;
    return {
      pages: this.pageCount(),
      total: all.length,
      url,
      internal,
      unknown,
    };
  });

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
    this.links.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const pages = doc.getPages();
      this.pageCount.set(pages.length);

      const pageRefToNumber = buildPageRefMap(doc);

      const allLinks: PdfLinkItem[] = [];

      for (let i = 0; i < pages.length; i++) {
        const pageNumber = i + 1;
        const page = pages[i] as any;

        // low-level page dict
        const pageDict = page.node as PDFDict;
        const annots = pageDict.get(PDFName.of('Annots'));

        const annotArray = resolveArray(doc, annots);
        if (!annotArray) continue;

        for (let j = 0; j < annotArray.size(); j++) {
          const annot = annotArray.get(j);
          const annotDict = resolveDict(doc, annot);
          if (!annotDict) continue;

          const subtype = annotDict.get(PDFName.of('Subtype'));
          if (!(subtype instanceof PDFName) || subtype.asString() !== '/Link') continue;

          // Rect (optional)
          const rect = readRect(doc, annotDict.get(PDFName.of('Rect')));

          // Action can be /A or /Dest directly on annot
          const a = annotDict.get(PDFName.of('A'));
          const dest = annotDict.get(PDFName.of('Dest'));

          const link = parseLinkTarget(doc, pageNumber, a, dest, pageRefToNumber, rect);
          if (link) allLinks.push(link);
        }
      }

      this.links.set(allLinks);
      this.status.set('ready');

      if (allLinks.length === 0) this.tipMessage.set(this.ui.tipNone);
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
    this.links.set([]);
    this.form.patchValue({ filter: '', pretty: true, includeRect: false });
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
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-links') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

// ---------------- helpers ----------------

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

function resolveArray(doc: PDFDocument, v: unknown): PDFArray | null {
  const ctx = doc.context;
  if (v instanceof PDFArray) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFArray ? looked : null;
  }
  return null;
}

function decodePdfString(v: unknown): string | null {
  if (v instanceof PDFString) return v.decodeText().trim() || null;
  if (v instanceof PDFHexString) return v.decodeText().trim() || null;
  return null;
}

function readRect(doc: PDFDocument, rectVal: unknown): { x: number; y: number; w: number; h: number } | null {
  const arr = resolveArray(doc, rectVal);
  if (!arr || arr.size() < 4) return null;

  const n = (idx: number): number | null => {
    const v = arr.get(idx);
    if (v instanceof PDFNumber) return v.asNumber();
    return null;
  };

  const x1 = n(0), y1 = n(1), x2 = n(2), y2 = n(3);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return null;

  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function parseLinkTarget(
  doc: PDFDocument,
  pageNumber: number,
  actionVal: unknown,
  destVal: unknown,
  pageRefToNumber: Map<string, number>,
  rect: { x: number; y: number; w: number; h: number } | null
): PdfLinkItem | null {
  // 1) URI action
  const actionDict = resolveDict(doc, actionVal);
  if (actionDict) {
    const s = actionDict.get(PDFName.of('S'));
    if (s instanceof PDFName) {
      const sName = s.asString();

      if (sName === '/URI') {
        const uri = decodePdfString(actionDict.get(PDFName.of('URI')));
        return {
          type: 'url',
          pageNumber,
          url: uri ?? null,
          rect,
        };
      }

      if (sName === '/GoTo') {
        const d = actionDict.get(PDFName.of('D'));
        const targetPage = resolveDestToPageNumber(doc, d, pageRefToNumber);
        return {
          type: 'internal',
          pageNumber,
          targetPage,
          rect,
        };
      }

      // Other actions (Launch, JavaScript, etc.)
      return {
        type: 'unknown',
        pageNumber,
        rawAction: sName,
        rect,
      };
    }
  }

  // 2) Direct /Dest on annotation
  if (destVal) {
    const targetPage = resolveDestToPageNumber(doc, destVal, pageRefToNumber);
    return {
      type: 'internal',
      pageNumber,
      targetPage,
      rect,
    };
  }

  return null;
}

function resolveDestToPageNumber(doc: PDFDocument, dest: unknown, pageRefToNumber: Map<string, number>): number | null {
  // Common: dest is array [pageRef /XYZ ...] or ref to such array
  if (dest instanceof PDFArray) {
    const first = dest.get(0);
    if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    return null;
  }

  if (dest instanceof PDFRef) {
    const looked = doc.context.lookup(dest);
    if (looked instanceof PDFArray) {
      const first = looked.get(0);
      if (first instanceof PDFRef) return pageRefToNumber.get(first.toString()) ?? null;
    }
    return null;
  }

  // Named destinations (name/string) require NameTree parsing. Best-effort => null.
  return null;
}
