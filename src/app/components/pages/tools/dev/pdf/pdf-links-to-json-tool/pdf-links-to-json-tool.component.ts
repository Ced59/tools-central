import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRef, PDFString } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

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
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-links-to-json-tool.component.html',
  styleUrl: './pdf-links-to-json-tool.component.scss',
})
export class PdfLinksToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  // Tool texts
  readonly ui = {
    title: $localize`:@@pdf_links_title:Liens PDF → JSON`,
    subtitle: $localize`:@@pdf_links_subtitle:Détectez les liens cliquables d’un PDF (URL et liens internes) et exportez-les au format JSON, localement dans votre navigateur.`,

    errTitle: $localize`:@@pdf_links_err_title:Impossible d’extraire les liens.`,
  };

  // Shell texts
  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_links_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_links_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_links_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_links_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_links_filter_placeholder:Filtrer (url, page…)`,

    statusLoading: $localize`:@@pdf_links_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_links_status_ready:Prêt`,
    statusError: $localize`:@@pdf_links_status_error:Erreur`,

    importTitle: $localize`:@@pdf_links_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_links_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_links_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_links_card_results_sub:Aperçu des liens et export JSON.`,

    jsonTitle: $localize`:@@pdf_links_json_title:JSON`,
    jsonSub: $localize`:@@pdf_links_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_links_list_title:Liens`,
    emptyText: $localize`:@@pdf_links_empty:Aucun lien à afficher.`,
    backText: $localize`:@@pdf_links_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
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

  // ✅ reactive
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includeRect = controlToSignal(this.form.controls.includeRect);

  readonly filteredLinks = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
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

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_links_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_links_stat_total_label:Liens`, value: this.stats().total },
    { label: $localize`:@@pdf_links_stat_url_label:URL`, value: this.stats().url },
    { label: $localize`:@@pdf_links_stat_internal_label:Internes`, value: this.stats().internal },
  ]);

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  typeLabel(t: LinkType): string {
    if (t === 'url') return $localize`:@@pdf_links_type_url:URL`;
    if (t === 'internal') return $localize`:@@pdf_links_type_internal:Interne`;
    return $localize`:@@pdf_links_type_unknown:Autre`;
  }

  async onFileSelected(file: File) {
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

          const rect = readRect(doc, annotDict.get(PDFName.of('Rect')));

          const a = annotDict.get(PDFName.of('A'));
          const dest = annotDict.get(PDFName.of('Dest'));

          const link = parseLinkTarget(doc, pageNumber, a, dest, pageRefToNumber, rect);
          if (link) allLinks.push(link);
        }
      }

      this.links.set(allLinks);
      this.status.set('ready');

      if (allLinks.length === 0) {
        this.tipMessage.set($localize`:@@pdf_links_tip_none:Aucun lien détecté dans ce PDF.`);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_links_err_generic:Impossible de lire ce PDF.`;

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
      this.tipMessage.set($localize`:@@pdf_links_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_links_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
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

/* ---------------- helpers (inchangés) ---------------- */

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
  const actionDict = resolveDict(doc, actionVal);
  if (actionDict) {
    const s = actionDict.get(PDFName.of('S'));
    if (s instanceof PDFName) {
      const sName = s.asString();

      if (sName === '/URI') {
        const uri = decodePdfString(actionDict.get(PDFName.of('URI')));
        return { type: 'url', pageNumber, url: uri ?? null, rect };
      }

      if (sName === '/GoTo') {
        const d = actionDict.get(PDFName.of('D'));
        const targetPage = resolveDestToPageNumber(doc, d, pageRefToNumber);
        return { type: 'internal', pageNumber, targetPage, rect };
      }

      return { type: 'unknown', pageNumber, rawAction: sName, rect };
    }
  }

  if (destVal) {
    const targetPage = resolveDestToPageNumber(doc, destVal, pageRefToNumber);
    return { type: 'internal', pageNumber, targetPage, rect };
  }

  return null;
}

function resolveDestToPageNumber(doc: PDFDocument, dest: unknown, pageRefToNumber: Map<string, number>): number | null {
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

  return null;
}
