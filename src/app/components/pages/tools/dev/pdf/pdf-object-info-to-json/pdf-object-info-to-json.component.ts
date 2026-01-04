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
  PDFName,
  PDFRawStream,
  PDFRef,
} from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

type PdfObjKind = 'dict' | 'stream' | 'array' | 'other';

type XrefKind = 'table' | 'stream' | 'unknown';

interface XrefEntry {
  objNumber: number;
  gen: number;
  offset: number;
  inUse: boolean;
}

interface PdfFinding {
  kind: 'javascript' | 'openaction' | 'embeddedfiles' | 'launch' | 'uri' | 'submitform' | 'gotor' | 'rendition' | 'unknown-action';
  label: string;
  ref?: string | null;
  detail?: string | null;
}

interface PdfObjectItem {
  id: string; // "12 0 R"
  objNumber: number;
  generation: number;
  kind: PdfObjKind;

  typeName: string | null;     // /Type
  subtypeName: string | null;  // /Subtype

  keysCount: number | null;
  keys?: string[];

  // streams
  streamLengthRawBytes: number | null;  // contents length (raw bytes in file)
  lengthDeclared: number | null;        // /Length value if numeric (best-effort)
  filters?: string[];                   // /Filter (names) best-effort

  // xref
  xref?: {
    inUse: boolean | null;
    offset: number | null;
  };

  // reachability
  reachable?: boolean | null;

  // “suspect” hints
  actionS?: string | null; // /S (action type) if present
  hasJavaScript?: boolean | null;
  hasEmbeddedFile?: boolean | null;
}

@Component({
  selector: 'app-pdf-object-info-to-json-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-object-info-to-json.component.html',
  styleUrl: './pdf-object-info-to-json.component.scss',
})
export class PdfObjectInfoToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_obj_title:Objets PDF → JSON`,
    subtitle: $localize`:@@pdf_obj_subtitle:Inventoriez les objets indirects d’un PDF (références, dict/stream/array), analysez la XRef (table) et repérez des objets orphelins/suspects. Export JSON local.`,
    errTitle: $localize`:@@pdf_obj_err_title:Impossible d’analyser les objets du PDF.`,
    errGeneric: $localize`:@@pdf_obj_err_generic:Impossible de lire ce PDF.`,
    tipPrivacy: $localize`:@@pdf_obj_tip_privacy:Tout se fait localement dans votre navigateur (aucun upload).`,
    tipNone: $localize`:@@pdf_obj_tip_none:Aucun objet indirect détecté (très rare).`,
    tipXrefStream: $localize`:@@pdf_obj_tip_xref_stream:XRef “stream” détectée (PDF 1.5+) : offsets détaillés non disponibles dans cette version.`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_obj_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_obj_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_obj_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_obj_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_obj_filter_placeholder:Filtrer (ref, type, subtype, key, filter, orphan, js…)`,

    statusLoading: $localize`:@@pdf_obj_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_obj_status_ready:Prêt`,
    statusError: $localize`:@@pdf_obj_status_error:Erreur`,

    importTitle: $localize`:@@pdf_obj_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_obj_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_obj_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_obj_card_results_sub:Aperçu des objets détectés + XRef (table) + orphelins/suspects et export JSON.`,

    jsonTitle: $localize`:@@pdf_obj_json_title:JSON`,
    jsonSub: $localize`:@@pdf_obj_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_obj_list_title:Objets`,
    emptyText: $localize`:@@pdf_obj_empty:Aucun objet à afficher.`,
    backText: $localize`:@@pdf_obj_back:← Retour aux outils PDF`,
  };

  // ---- State ----
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly objects = signal<PdfObjectItem[]>([]);

  // XRef summary
  readonly xrefKind = signal<XrefKind>('unknown');
  readonly startXrefOffset = signal<number | null>(null);
  readonly xrefParsedCount = signal<number>(0);

  // Findings + reachability summary
  readonly findings = signal<PdfFinding[]>([]);
  readonly reachableCount = signal<number>(0);
  readonly orphanCount = signal<number>(0);

  // ---- Form ----
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeKeys: this.fb.nonNullable.control(false),
    hideOther: this.fb.nonNullable.control(true),

    includeXref: this.fb.nonNullable.control(true),
    includeReachability: this.fb.nonNullable.control(true),
    includeFindings: this.fb.nonNullable.control(true),
  });

  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includeKeys = controlToSignal(this.form.controls.includeKeys);
  readonly hideOther = controlToSignal(this.form.controls.hideOther);
  readonly includeXref = controlToSignal(this.form.controls.includeXref);
  readonly includeReachability = controlToSignal(this.form.controls.includeReachability);
  readonly includeFindings = controlToSignal(this.form.controls.includeFindings);

  readonly filteredObjects = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const hideOther = this.hideOther();

    const all = this.objects();
    const base = hideOther ? all.filter(o => o.kind !== 'other') : all;

    if (!f) return base;

    return base.filter(o => {
      const hay = [
        o.id,
        o.kind,
        o.typeName ?? '',
        o.subtypeName ?? '',
        String(o.objNumber),
        String(o.generation),
        String(o.keysCount ?? ''),
        String(o.streamLengthRawBytes ?? ''),
        String(o.lengthDeclared ?? ''),
        (o.filters ?? []).join(' '),
        (o.keys ?? []).join(' '),
        String(o.reachable ?? ''),
        String(o.hasJavaScript ?? ''),
        String(o.hasEmbeddedFile ?? ''),
        o.actionS ?? '',
        o.xref?.offset != null ? `off:${o.xref.offset}` : '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.objects();

    const dict = all.filter(o => o.kind === 'dict').length;
    const stream = all.filter(o => o.kind === 'stream').length;
    const array = all.filter(o => o.kind === 'array').length;
    const other = all.filter(o => o.kind === 'other').length;

    const streams = all.filter(o => o.kind === 'stream');
    const totalStreamBytes = streams.reduce((acc, s) => acc + (s.streamLengthRawBytes ?? 0), 0);
    const maxStreamBytes = streams.reduce((m, s) => Math.max(m, s.streamLengthRawBytes ?? 0), 0);

    const dictLike = all.filter(o => o.kind === 'dict' || o.kind === 'stream');
    const totalKeys = dictLike.reduce((acc, d) => acc + (d.keysCount ?? 0), 0);
    const avgKeys = dictLike.length ? totalKeys / dictLike.length : 0;

    const js = all.filter(o => o.hasJavaScript === true).length;
    const embedded = all.filter(o => o.hasEmbeddedFile === true).length;

    return {
      pages: this.pageCount(),
      total: all.length,
      dict,
      stream,
      array,
      other,
      totalStreamBytes,
      maxStreamBytes,
      avgKeys,
      js,
      embedded,
      xrefKind: this.xrefKind(),
      startXrefOffset: this.startXrefOffset(),
      xrefParsedCount: this.xrefParsedCount(),
      reachable: this.reachableCount(),
      orphans: this.orphanCount(),
      findings: this.findings().length,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_obj_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_obj_stat_total_label:Objets`, value: this.stats().total },
    { label: $localize`:@@pdf_obj_stat_streams_label:Streams`, value: this.stats().stream },
    { label: $localize`:@@pdf_obj_stat_orphans_label:Orphelins`, value: this.stats().orphans },
  ]);

  readonly jsonObject = computed(() => {
    const includeKeys = this.includeKeys();
    const includeXref = this.includeXref();
    const includeReachability = this.includeReachability();
    const includeFindings = this.includeFindings();

    const items = this.filteredObjects().map(o => {
      const base: Record<string, unknown> = {
        id: o.id,
        objNumber: o.objNumber,
        generation: o.generation,
        kind: o.kind,
        type: o.typeName,
        subtype: o.subtypeName,
        keysCount: o.keysCount,
        streamLengthRawBytes: o.streamLengthRawBytes,
        lengthDeclared: o.lengthDeclared,
        filters: o.filters ?? [],
        actionS: o.actionS ?? null,
        hasJavaScript: o.hasJavaScript ?? null,
        hasEmbeddedFile: o.hasEmbeddedFile ?? null,
      };

      if (includeKeys) base['keys'] = o.keys ?? [];

      if (includeXref) base['xref'] = o.xref ?? { inUse: null, offset: null };

      if (includeReachability) base['reachable'] = o.reachable ?? null;

      return base;
    });

    const out: Record<string, unknown> = {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      _note: this.ui.tipPrivacy,
      stats: this.stats(),
      objects: items,
    };

    if (includeXref) {
      out['xref'] = {
        kind: this.xrefKind(),
        startXrefOffset: this.startXrefOffset(),
        parsedEntries: this.xrefParsedCount(),
      };
    }

    if (includeReachability) {
      out['reachability'] = {
        reachable: this.reachableCount(),
        orphans: this.orphanCount(),
      };
    }

    if (includeFindings) {
      out['findings'] = this.findings();
    }

    return out;
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.objects.set([]);
    this.findings.set([]);
    this.reachableCount.set(0);
    this.orphanCount.set(0);

    this.xrefKind.set('unknown');
    this.startXrefOffset.set(null);
    this.xrefParsedCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);
    this.pageCount.set(0);

    try {
      const buffer = await file.arrayBuffer();
      const rawBytes = new Uint8Array(buffer);

      // --- XRef best-effort (table) ---
      const xref = analyzeXrefBestEffort(rawBytes);
      this.xrefKind.set(xref.kind);
      this.startXrefOffset.set(xref.startxrefOffset);
      this.xrefParsedCount.set(xref.entriesByObjNum?.size ?? 0);

      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
      const pages = doc.getPages();
      this.pageCount.set(pages.length);

      // Map id -> obj (for reachability traversal)
      const idToObj = new Map<string, unknown>();
      const byObjNum = new Map<number, { gen: number; id: string; obj: unknown }>();

      const list: PdfObjectItem[] = [];

      for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
        const id = ref.toString(); // "12 0 R"
        const objNumber = safeObjNumber(ref, id);
        const generation = safeGenNumber(ref, id);

        idToObj.set(id, obj);
        byObjNum.set(objNumber, { gen: generation, id, obj });

        const kind = classifyObject(obj);
        const dict = getObjectDict(obj);

        const typeName = dict ? nameToString(dict.get(PDFName.of('Type'))) : null;
        const subtypeName = dict ? nameToString(dict.get(PDFName.of('Subtype'))) : null;

        const keys = dict ? dictKeys(dict) : [];
        const keysCount = dict ? keys.length : null;

        const streamLengthRawBytes = readStreamRawLength(obj);
        const lengthDeclared = dict ? readDeclaredLengthNumber(doc, dict) : null;
        const filters = dict ? readFilters(doc, dict) : [];

        const actionS = dict ? nameToString(dict.get(PDFName.of('S'))) : null;

        const hasJavaScript = dict ? looksLikeJavaScript(dict) : false;
        const hasEmbeddedFile = dict ? looksLikeEmbeddedFile(dict) : false;

        const xrefEntry = xref.entriesByObjNum?.get(objNumber);
        const xrefView = xrefEntry
          ? { inUse: xrefEntry.inUse, offset: xrefEntry.offset }
          : { inUse: null, offset: null };

        list.push({
          id,
          objNumber,
          generation,
          kind,
          typeName,
          subtypeName,
          keysCount,
          keys,
          streamLengthRawBytes,
          lengthDeclared,
          filters,
          xref: xrefView,
          reachable: null,
          actionS,
          hasJavaScript,
          hasEmbeddedFile,
        });
      }

      // --- Reachability: walk from trailer Root/Info if possible (best-effort) ---
      const reachableIds = computeReachableIdsBestEffort(doc, idToObj);

      let reachableCount = 0;
      for (const it of list) {
        const ok = reachableIds.size === 0 ? null : reachableIds.has(it.id);
        it.reachable = ok;
        if (ok === true) reachableCount++;
      }

      this.reachableCount.set(reachableCount);
      this.orphanCount.set(reachableIds.size === 0 ? 0 : Math.max(0, list.length - reachableCount));

      // --- Findings (forensic-ish) ---
      const findings = computeFindingsBestEffort(doc, list);
      this.findings.set(findings);

      // Sort
      list.sort((a, b) => (a.objNumber - b.objNumber) || (a.generation - b.generation));

      this.objects.set(list);
      this.status.set('ready');

      if (list.length === 0) {
        this.tipMessage.set(this.ui.tipNone);
      } else if (this.xrefKind() === 'stream') {
        // not an error, just a hint
        this.tipMessage.set(this.ui.tipXrefStream);
      } else {
        this.tipMessage.set(this.ui.tipPrivacy);
      }
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

    this.objects.set([]);

    this.xrefKind.set('unknown');
    this.startXrefOffset.set(null);
    this.xrefParsedCount.set(0);

    this.findings.set([]);
    this.reachableCount.set(0);
    this.orphanCount.set(0);

    this.form.patchValue({
      filter: '',
      pretty: true,
      includeKeys: false,
      hideOther: true,
      includeXref: true,
      includeReachability: true,
      includeFindings: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_obj_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_obj_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-objects') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* ---------------- helpers (pdf-lib low-level) ---------------- */

function safeObjNumber(ref: any, refStr: string): number {
  const n = ref?.objectNumber;
  if (typeof n === 'number') return n;
  const m = refStr.match(/^(\d+)\s+(\d+)\s+R$/);
  return m ? Number(m[1]) : 0;
}

function safeGenNumber(ref: any, refStr: string): number {
  const n = ref?.generationNumber;
  if (typeof n === 'number') return n;
  const m = refStr.match(/^(\d+)\s+(\d+)\s+R$/);
  return m ? Number(m[2]) : 0;
}

function classifyObject(obj: unknown): PdfObjKind {
  if (obj instanceof PDFDict) return 'dict';
  if (obj instanceof PDFArray) return 'array';
  if (obj instanceof PDFRawStream) return 'stream';

  const anyObj: any = obj as any;
  if (anyObj?.dict instanceof PDFDict && typeof anyObj?.contents !== 'undefined') return 'stream';

  return 'other';
}

function getObjectDict(obj: unknown): PDFDict | null {
  if (obj instanceof PDFDict) return obj;

  const anyObj: any = obj as any;
  if (anyObj?.dict instanceof PDFDict) return anyObj.dict as PDFDict;

  return null;
}

function dictKeys(dict: PDFDict): string[] {
  const out: string[] = [];
  const entries = (dict as any).entries?.() as Iterable<[PDFName, unknown]> | undefined;
  if (!entries) return out;

  for (const [k] of entries) out.push(k.asString());
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

function nameToString(v: unknown): string | null {
  if (v instanceof PDFName) return v.asString();
  return null;
}

function resolveDict(doc: PDFDocument, v: unknown): PDFDict | null {
  const ctx = doc.context;
  if (v instanceof PDFDict) return v;
  if (v instanceof PDFRef) {
    try {
      const looked = ctx.lookup(v);
      return looked instanceof PDFDict ? looked : null;
    } catch {
      return null;
    }
  }
  return null;
}

function resolveArray(doc: PDFDocument, v: unknown): PDFArray | null {
  const ctx = doc.context;
  if (v instanceof PDFArray) return v;
  if (v instanceof PDFRef) {
    try {
      const looked = ctx.lookup(v);
      return looked instanceof PDFArray ? looked : null;
    } catch {
      return null;
    }
  }
  return null;
}

function readStreamRawLength(obj: unknown): number | null {
  if (obj instanceof PDFRawStream) {
    const contents: any = (obj as any).contents;
    if (contents instanceof Uint8Array) return contents.length;
    if (typeof contents?.length === 'number') return contents.length;
    return null;
  }

  const anyObj: any = obj as any;
  const contents = anyObj?.contents;
  if (contents instanceof Uint8Array) return contents.length;
  if (typeof contents?.length === 'number') return contents.length;

  return null;
}

function readDeclaredLengthNumber(doc: PDFDocument, dict: PDFDict): number | null {
  const lenVal = dict.get(PDFName.of('Length'));
  if (typeof (lenVal as any)?.asNumber === 'function') {
    try {
      return (lenVal as any).asNumber();
    } catch {
      // ignore
    }
  }

  // Length may be an indirect ref or non-numeric
  if (lenVal instanceof PDFRef) {
    try {
      const looked: any = doc.context.lookup(lenVal);
      if (typeof looked?.asNumber === 'function') return looked.asNumber();
      if (typeof looked?.number === 'number') return looked.number;
    } catch {
      // ignore
    }
  }

  // Some PDFs have /Length as a plain JS number internally (rare)
  if (typeof lenVal === 'number') return lenVal;

  return null;
}

function readFilters(doc: PDFDocument, dict: PDFDict): string[] {
  const filterVal = dict.get(PDFName.of('Filter'));
  if (!filterVal) return [];

  // /Filter can be Name or Array of Names
  if (filterVal instanceof PDFName) return [filterVal.asString()];

  const arr = resolveArray(doc, filterVal);
  if (!arr) return [];

  const out: string[] = [];
  for (let i = 0; i < arr.size(); i++) {
    const it = arr.get(i);
    if (it instanceof PDFName) out.push(it.asString());
  }
  return out;
}

function looksLikeJavaScript(dict: PDFDict): boolean {
  // Action dict with /S /JavaScript OR contains /JS key
  const s = dict.get(PDFName.of('S'));
  if (s instanceof PDFName && s.asString() === '/JavaScript') return true;
  return !!dict.get(PDFName.of('JS'));
}

function looksLikeEmbeddedFile(dict: PDFDict): boolean {
  // Filespec: /Type /Filespec and /EF entry, or EmbeddedFile subtype
  const t = dict.get(PDFName.of('Type'));
  if (t instanceof PDFName && t.asString() === '/Filespec') {
    if (dict.get(PDFName.of('EF'))) return true;
  }
  const st = dict.get(PDFName.of('Subtype'));
  if (st instanceof PDFName && st.asString() === '/EmbeddedFile') return true;
  return false;
}

/* ---------------- XRef (table) best-effort ---------------- */

function analyzeXrefBestEffort(bytes: Uint8Array): {
  startxrefOffset: number | null;
  kind: XrefKind;
  entriesByObjNum?: Map<number, XrefEntry>;
} {
  const tail = bytes.subarray(Math.max(0, bytes.length - 4096));
  const tailText = ascii(tail);

  const m = tailText.match(/startxref\s+(\d+)\s+%%EOF/);
  if (!m) return { startxrefOffset: null, kind: 'unknown' };

  const start = Number(m[1]);
  if (!Number.isFinite(start) || start < 0 || start >= bytes.length) {
    return { startxrefOffset: start, kind: 'unknown' };
  }

  const head = ascii(bytes.subarray(start, Math.min(bytes.length, start + 32))).trimStart();

  if (head.startsWith('xref')) {
    const entriesByObjNum = parseXrefTable(bytes, start);
    return { startxrefOffset: start, kind: 'table', entriesByObjNum };
  }

  // Often an indirect object (xref stream) begins at startxref offset
  return { startxrefOffset: start, kind: 'stream' };
}

function parseXrefTable(bytes: Uint8Array, startOffset: number): Map<number, XrefEntry> {
  const entries = new Map<number, XrefEntry>();

  // We read a large-ish window; if it’s bigger, parsing stops at trailer.
  const window = bytes.subarray(startOffset, Math.min(bytes.length, startOffset + 2_000_000));
  const text = ascii(window);
  const lines = text.split(/\r?\n/);

  let i = 0;
  if (!lines[i]?.startsWith('xref')) return entries;
  i++;

  while (i < lines.length) {
    const header = (lines[i] ?? '').trim();
    if (!header) break;
    if (header.startsWith('trailer')) break;

    const hm = header.match(/^(\d+)\s+(\d+)$/);
    if (!hm) break;

    const first = Number(hm[1]);
    const count = Number(hm[2]);
    i++;

    for (let k = 0; k < count && i < lines.length; k++, i++) {
      const ln = (lines[i] ?? '').trim();
      const em = ln.match(/^(\d{10})\s+(\d{5})\s+([nf])$/);
      if (!em) continue;

      const off = Number(em[1]);
      const gen = Number(em[2]);
      const inUse = em[3] === 'n';

      const objNum = first + k;
      entries.set(objNum, { objNumber: objNum, gen, offset: off, inUse });
    }
  }

  return entries;
}

function ascii(bytes: Uint8Array): string {
  // ASCII safe conversion (pdf keywords are ASCII)
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/* ---------------- Reachability (orphans) best-effort ---------------- */

function computeReachableIdsBestEffort(doc: PDFDocument, idToObj: Map<string, unknown>): Set<string> {
  const reachable = new Set<string>();
  const visitedRefs = new Set<string>();

  const trailer: any = (doc.context as any).trailer;
  const startVals: unknown[] = [];

  if (trailer instanceof PDFDict) {
    const root = trailer.get(PDFName.of('Root'));
    const info = trailer.get(PDFName.of('Info'));
    if (root) startVals.push(root);
    if (info) startVals.push(info);
  }

  // If we can’t find a root, do not “guess” (avoid false orphans)
  if (startVals.length === 0) return new Set<string>();

  const walk = (v: unknown) => {
    if (!v) return;

    if (v instanceof PDFRef) {
      const id = v.toString();
      if (visitedRefs.has(id)) return;
      visitedRefs.add(id);
      reachable.add(id);

      let looked: any = null;
      try {
        looked = doc.context.lookup(v);
      } catch {
        return;
      }
      walk(looked);
      return;
    }

    if (v instanceof PDFDict) {
      const entries = (v as any).entries?.() as Iterable<[PDFName, unknown]> | undefined;
      if (entries) for (const [, vv] of entries) walk(vv);
      return;
    }

    if (v instanceof PDFArray) {
      for (let i = 0; i < v.size(); i++) walk(v.get(i));
      return;
    }

    // RawStream: walk its dict (we do not walk content bytes)
    if (v instanceof PDFRawStream) {
      const d: any = (v as any).dict;
      if (d instanceof PDFDict) walk(d);
      return;
    }

    // Some internals might wrap stream differently
    const anyV: any = v as any;
    if (anyV?.dict instanceof PDFDict) walk(anyV.dict);
  };

  for (const s of startVals) walk(s);

  // Keep only ids that are in the enumerated object list (cosmetic)
  const filtered = new Set<string>();
  for (const id of reachable) if (idToObj.has(id)) filtered.add(id);

  return filtered;
}

/* ---------------- Findings (forensic-ish) best-effort ---------------- */

function computeFindingsBestEffort(doc: PDFDocument, objs: PdfObjectItem[]): PdfFinding[] {
  const out: PdfFinding[] = [];

  // 1) Root-level: OpenAction / Names (EmbeddedFiles / JavaScript)
  const trailer: any = (doc.context as any).trailer;
  const rootRef = trailer instanceof PDFDict ? trailer.get(PDFName.of('Root')) : null;
  const root = rootRef ? resolveDict(doc, rootRef) : null;

  if (root) {
    if (root.get(PDFName.of('OpenAction'))) {
      out.push({
        kind: 'openaction',
        label: 'OpenAction présent (action exécutée à l’ouverture)',
        ref: rootRef instanceof PDFRef ? rootRef.toString() : null,
        detail: null,
      });
    }

    const namesVal = root.get(PDFName.of('Names'));
    const names = resolveDict(doc, namesVal);
    if (names) {
      if (names.get(PDFName.of('EmbeddedFiles'))) {
        out.push({
          kind: 'embeddedfiles',
          label: 'Names/EmbeddedFiles présent (fichiers intégrés)',
          ref: rootRef instanceof PDFRef ? rootRef.toString() : null,
          detail: null,
        });
      }
      if (names.get(PDFName.of('JavaScript'))) {
        out.push({
          kind: 'javascript',
          label: 'Names/JavaScript présent (scripts)',
          ref: rootRef instanceof PDFRef ? rootRef.toString() : null,
          detail: null,
        });
      }
    }
  }

  // 2) Object-level action scanning (dicts)
  for (const o of objs) {
    const s = o.actionS;
    if (!s) continue;

    const norm = s.startsWith('/') ? s.slice(1) : s;

    if (norm === 'JavaScript') {
      out.push({ kind: 'javascript', label: 'Action JavaScript', ref: o.id, detail: null });
    } else if (norm === 'URI') {
      out.push({ kind: 'uri', label: 'Action URI', ref: o.id, detail: null });
    } else if (norm === 'Launch') {
      out.push({ kind: 'launch', label: 'Action Launch', ref: o.id, detail: null });
    } else if (norm === 'SubmitForm') {
      out.push({ kind: 'submitform', label: 'Action SubmitForm', ref: o.id, detail: null });
    } else if (norm === 'GoToR') {
      out.push({ kind: 'gotor', label: 'Action GoToR (renvoi vers doc externe)', ref: o.id, detail: null });
    } else if (norm === 'Rendition') {
      out.push({ kind: 'rendition', label: 'Action Rendition (multimédia)', ref: o.id, detail: null });
    } else {
      out.push({ kind: 'unknown-action', label: `Action ${s}`, ref: o.id, detail: null });
    }
  }

  // 3) Embedded files (object hints)
  const embedded = objs.filter(o => o.hasEmbeddedFile === true);
  for (const o of embedded) {
    out.push({ kind: 'embeddedfiles', label: 'Objet lié à un fichier intégré (Filespec/EmbeddedFile)', ref: o.id, detail: null });
  }

  // de-dup (simple)
  const seen = new Set<string>();
  return out.filter(f => {
    const k = `${f.kind}|${f.ref ?? ''}|${f.label}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
