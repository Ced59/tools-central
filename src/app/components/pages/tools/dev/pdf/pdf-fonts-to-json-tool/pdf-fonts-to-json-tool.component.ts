import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
} from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

type ToolStatusLocal = 'idle' | 'loading' | 'ready' | 'error';

interface PdfFontStyleGuess {
  bold: boolean;
  italic: boolean;
  weight: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'black' | 'unknown';
  style: 'normal' | 'italic' | 'oblique' | 'unknown';
}

interface PdfFontItem {
  id: string;
  resourceKey: string | null;
  baseFont: string | null;
  family: string | null;
  subset: boolean | null;
  styleGuess: PdfFontStyleGuess | null;
  subtype: string | null;
  encoding: string | null;
  embedded: boolean | null;
  toUnicode: boolean | null;
  pages?: number[];
}

@Component({
  selector: 'app-pdf-fonts-to-json-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-fonts-to-json-tool.component.html',
  styleUrl: './pdf-fonts-to-json-tool.component.scss',
})
export class PdfFontsToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_fonts_title:Polices PDF → JSON`,
    subtitle: $localize`:@@pdf_fonts_subtitle:Identifiez les polices déclarées/utilisées dans un PDF (ressources des pages) et exportez la liste au format JSON, localement.`,
    errTitle: $localize`:@@pdf_fonts_err_title:Impossible d’extraire les polices.`,
    errGeneric: $localize`:@@pdf_fonts_err_generic:Impossible de lire ce PDF.`,
    tipNone: $localize`:@@pdf_fonts_tip_none:Aucune police détectée (rare).`,
    noteSubset: $localize`:@@pdf_fonts_note_subset:Note : beaucoup de PDFs “sous-ensemblent” les polices (ex: ABCDEF+NomPolice).`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_fonts_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_fonts_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_fonts_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_fonts_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_fonts_filter_placeholder:Filtrer (nom, famille, style, subtype…)`,

    statusLoading: $localize`:@@pdf_fonts_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_fonts_status_ready:Prêt`,
    statusError: $localize`:@@pdf_fonts_status_error:Erreur`,

    importTitle: $localize`:@@pdf_fonts_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_fonts_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_fonts_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_fonts_card_results_sub:Aperçu des polices détectées et export JSON.`,

    jsonTitle: $localize`:@@pdf_fonts_json_title:JSON`,
    jsonSub: $localize`:@@pdf_fonts_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_fonts_list_title:Polices`,
    emptyText: $localize`:@@pdf_fonts_empty:Aucune police à afficher.`,
    backText: $localize`:@@pdf_fonts_back:← Retour aux outils PDF`,
  };

  // ---- State ----
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly fonts = signal<PdfFontItem[]>([]);

  // ---- Form ----
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includePages: this.fb.nonNullable.control(true),
  });

  // ✅ Signals => filtre OK
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includePages = controlToSignal(this.form.controls.includePages);

  readonly filteredFonts = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.fonts();
    if (!f) return all;

    return all.filter(it => {
      const hay = [
        it.resourceKey ?? '',
        it.baseFont ?? '',
        it.family ?? '',
        it.subtype ?? '',
        it.encoding ?? '',
        String(it.subset ?? ''),
        String(it.embedded ?? ''),
        String(it.toUnicode ?? ''),
        JSON.stringify(it.styleGuess ?? {}),
        (it.pages ?? []).join(','),
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(f);
    });
  });

  readonly jsonObject = computed(() => {
    const items = this.filteredFonts().map(f => {
      const o: Record<string, unknown> = {
        id: f.id,
        resourceKey: f.resourceKey,
        baseFont: f.baseFont,
        family: f.family,
        subset: f.subset,
        styleGuess: f.styleGuess,
        subtype: f.subtype,
        encoding: f.encoding,
        embedded: f.embedded,
        toUnicode: f.toUnicode,
      };
      if (this.includePages()) o['pages'] = f.pages ?? [];
      return o;
    });

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      note: this.ui.noteSubset,
      fonts: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly stats = computed(() => {
    const all = this.fonts();
    const embedded = all.filter(f => f.embedded === true).length;
    const notEmbedded = all.filter(f => f.embedded === false).length;
    const unknownEmbedded = all.filter(f => f.embedded == null).length;

    const type0 = all.filter(f => (f.subtype ?? '').includes('Type0')).length;
    const truetype = all.filter(f => (f.subtype ?? '').includes('TrueType')).length;
    const type1 = all.filter(f => (f.subtype ?? '').includes('Type1')).length;
    const subsets = all.filter(f => f.subset === true).length;

    return {
      pages: this.pageCount(),
      total: all.length,
      embedded,
      notEmbedded,
      unknownEmbedded,
      type0,
      truetype,
      type1,
      subsets,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_fonts_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_fonts_stat_total_label:Polices`, value: this.stats().total },
    { label: $localize`:@@pdf_fonts_stat_embedded_label:Embeddées`, value: this.stats().embedded },
    { label: $localize`:@@pdf_fonts_stat_not_embedded_label:Non emb.`, value: this.stats().notEmbedded },
  ]);

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.fonts.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const pages = doc.getPages();
      this.pageCount.set(pages.length);

      const agg = new Map<string, PdfFontItem>();
      const visitedXObjectRefs = new Set<string>();

      for (let i = 0; i < pages.length; i++) {
        const pageNumber = i + 1;
        const pageNode = (pages[i] as any).node as PDFDict;
        scanResourcesForFonts(doc, pageNode.get(PDFName.of('Resources')), pageNumber, agg, visitedXObjectRefs);
      }

      const list = Array.from(agg.values()).sort((a, b) =>
        (a.family ?? a.baseFont ?? '').localeCompare(b.family ?? b.baseFont ?? '')
      );

      this.fonts.set(list);
      this.status.set('ready');

      if (list.length === 0) this.tipMessage.set(this.ui.tipNone);
      else this.tipMessage.set(this.ui.noteSubset);
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
    this.fonts.set([]);
    this.form.patchValue({ filter: '', pretty: true, includePages: true });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_fonts_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_fonts_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-fonts') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* ---------------- helpers (pdf-lib low-level) ---------------- */

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

function nameToString(v: unknown): string | null {
  if (v instanceof PDFName) return v.asString();
  return null;
}

function scanResourcesForFonts(
  doc: PDFDocument,
  resourcesVal: unknown,
  pageNumber: number,
  agg: Map<string, PdfFontItem>,
  visitedXObjectRefs: Set<string>
) {
  const resources = resolveDict(doc, resourcesVal);
  if (!resources) return;

  // 1) Fonts
  const fontVal = resources.get(PDFName.of('Font'));
  const fontDict = resolveDict(doc, fontVal);
  if (fontDict) {
    const entries = (fontDict as any).entries?.() as Iterable<[PDFName, unknown]> | undefined;

    if (entries) {
      for (const [k, v] of entries) {
        const resourceKey = k.asString();
        const fontRef = v instanceof PDFRef ? v : null;
        const font = resolveDict(doc, v);
        if (!font) continue;

        const id = fontRef ? fontRef.toString() : `p${pageNumber}:${resourceKey}`;

        const baseFont = readFontBaseName(doc, font);
        const norm = normalizeBaseFont(baseFont);
        const family = norm.family;
        const subset = norm.subset;
        const styleGuess = guessStyleFromFontName(norm.cleanedName);

        const subtype = nameToString(font.get(PDFName.of('Subtype')));
        const encoding = readFontEncoding(doc, font);
        const toUnicode = !!font.get(PDFName.of('ToUnicode'));
        const embedded = isFontEmbedded(doc, font);

        const existing = agg.get(id);
        if (existing) {
          existing.pages ??= [];
          if (!existing.pages.includes(pageNumber)) existing.pages.push(pageNumber);

          existing.resourceKey ??= resourceKey;
          existing.baseFont ??= baseFont;
          existing.family ??= family;
          existing.subset ??= subset;
          existing.styleGuess ??= styleGuess;

          existing.subtype ??= subtype;
          existing.encoding ??= encoding;
          existing.embedded ??= embedded;
          existing.toUnicode ??= toUnicode;
        } else {
          agg.set(id, {
            id,
            resourceKey,
            baseFont,
            family,
            subset,
            styleGuess,
            subtype,
            encoding,
            embedded,
            toUnicode,
            pages: [pageNumber],
          });
        }
      }
    }
  }

  // 2) XObjects
  const xobjVal = resources.get(PDFName.of('XObject'));
  const xobjDict = resolveDict(doc, xobjVal);
  const xEntries = xobjDict ? ((xobjDict as any).entries?.() as Iterable<[PDFName, unknown]> | undefined) : undefined;

  if (xobjDict && xEntries) {
    for (const [, v] of xEntries) {
      const xRef = v instanceof PDFRef ? v : null;
      const xDict = resolveDict(doc, v);
      if (!xDict) continue;

      if (xRef) {
        const key = xRef.toString();
        if (visitedXObjectRefs.has(key)) continue;
        visitedXObjectRefs.add(key);
      }

      const subtype = nameToString(xDict.get(PDFName.of('Subtype')));
      if (subtype !== '/Form') continue;

      const xResources = xDict.get(PDFName.of('Resources'));
      if (xResources) scanResourcesForFonts(doc, xResources, pageNumber, agg, visitedXObjectRefs);
    }
  }
}

function readFontBaseName(doc: PDFDocument, fontDict: PDFDict): string | null {
  const base = nameToString(fontDict.get(PDFName.of('BaseFont')));
  if (base) return base;

  const subtype = nameToString(fontDict.get(PDFName.of('Subtype')));
  if (subtype === '/Type0') {
    const descVal = fontDict.get(PDFName.of('DescendantFonts'));
    const descArr = resolveArray(doc, descVal);
    if (descArr && descArr.size() > 0) {
      const first = descArr.get(0);
      const descDict = resolveDict(doc, first);
      if (descDict) return nameToString(descDict.get(PDFName.of('BaseFont')));
    }
  }

  return null;
}

function readFontEncoding(doc: PDFDocument, fontDict: PDFDict): string | null {
  const enc = fontDict.get(PDFName.of('Encoding'));
  const encName = nameToString(enc);
  if (encName) return encName;

  const encDict = resolveDict(doc, enc);
  if (encDict) {
    const base = nameToString(encDict.get(PDFName.of('BaseEncoding')));
    if (base) return base;

    const diffs = encDict.get(PDFName.of('Differences'));
    if (diffs) return '/(custom differences)';
  }

  return null;
}

function isFontEmbedded(doc: PDFDocument, fontDict: PDFDict): boolean | null {
  const subtype = nameToString(fontDict.get(PDFName.of('Subtype')));

  if (subtype === '/Type0') {
    const descVal = fontDict.get(PDFName.of('DescendantFonts'));
    const descArr = resolveArray(doc, descVal);
    if (!descArr || descArr.size() === 0) return null;

    const first = resolveDict(doc, descArr.get(0));
    if (!first) return null;

    return isFontEmbedded(doc, first);
  }

  const fdVal = fontDict.get(PDFName.of('FontDescriptor'));
  const fd = resolveDict(doc, fdVal);
  if (!fd) return null;

  const ff = fd.get(PDFName.of('FontFile'));
  const ff2 = fd.get(PDFName.of('FontFile2'));
  const ff3 = fd.get(PDFName.of('FontFile3'));

  return !!(ff || ff2 || ff3);
}

function normalizeBaseFont(baseFont: string | null): { family: string | null; subset: boolean | null; cleanedName: string | null } {
  if (!baseFont) return { family: null, subset: null, cleanedName: null };

  const raw = baseFont.startsWith('/') ? baseFont.slice(1) : baseFont;

  const m = raw.match(/^([A-Z]{6})\+(.+)$/);
  if (m) {
    const cleaned = m[2];
    const fam = cleaned.split(/[-,]/)[0] || cleaned;
    return { family: fam || null, subset: true, cleanedName: cleaned || null };
  }

  const fam = raw.split(/[-,]/)[0] || raw;
  return { family: fam || null, subset: false, cleanedName: raw || null };
}

function guessStyleFromFontName(cleanedName: string | null): PdfFontStyleGuess | null {
  if (!cleanedName) return null;

  const n = cleanedName.toLowerCase();

  const italic = /italic|oblique/.test(n);
  const oblique = /oblique/.test(n);
  const bold = /bold|demi|semibold|extrabold|ultrabold|black|heavy/.test(n);

  let weight: PdfFontStyleGuess['weight'] = 'regular';
  if (/thin/.test(n)) weight = 'thin';
  else if (/extralight|ultralight/.test(n)) weight = 'light';
  else if (/\blight\b/.test(n)) weight = 'light';
  else if (/\bmedium\b/.test(n)) weight = 'medium';
  else if (/semibold|demibold|\bdemi\b/.test(n)) weight = 'semibold';
  else if (/extrabold|ultrabold/.test(n)) weight = 'bold';
  else if (/\bbold\b/.test(n)) weight = 'bold';
  else if (/black|heavy/.test(n)) weight = 'black';
  else if (/regular|book|roman|normal/.test(n)) weight = 'regular';
  else weight = 'unknown';

  const style: PdfFontStyleGuess['style'] =
    /\bitalic\b/.test(n) ? 'italic' : oblique ? 'oblique' : /normal|regular|roman/.test(n) ? 'normal' : 'unknown';

  return { bold, italic, weight, style };
}
