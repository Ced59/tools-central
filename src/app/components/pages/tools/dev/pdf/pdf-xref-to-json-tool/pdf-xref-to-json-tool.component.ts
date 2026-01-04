import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

type XrefKind = 'table' | 'stream' | 'unknown';

type XrefEntryKind = 'inUse' | 'free' | 'compressed';

interface XrefEntryView {
  objNumber: number;
  gen: number | null;

  kind: XrefEntryKind;

  // table + stream type 1
  offset: number | null;

  // stream type 0 (free list)
  nextFreeObj: number | null;

  // stream type 2 (compressed)
  objStm: number | null;
  objStmIndex: number | null;
}

interface XrefParseDiagnostics {
  startxrefOffset: number | null;
  kind: XrefKind;
  message: string | null;

  // stream details
  xrefStream?: {
    xrefObjOffset: number | null;
    filter: string[]; // names
    w: number[] | null;
    index: number[] | null;
    size: number | null;
    decodedBytes: number | null;
    supported: boolean;
    reasonIfUnsupported: string | null;
  };

  // table details
  xrefTable?: {
    parsedSubsections: number;
    parsedEntries: number;
  };
}

@Component({
  selector: 'app-pdf-xref-to-json-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-xref-to-json-tool.component.html',
  styleUrl: './pdf-xref-to-json-tool.component.scss',
})
export class PdfXrefToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_xref_title:XRef PDF → JSON`,
    subtitle: $localize`:@@pdf_xref_subtitle:Inspectez la table/stream XRef d’un PDF (offsets, générations, statuts) et exportez un JSON exploitable, localement dans le navigateur.`,
    errTitle: $localize`:@@pdf_xref_err_title:Impossible d’inspecter la XRef.`,
    errGeneric: $localize`:@@pdf_xref_err_generic:Impossible de lire ce PDF.`,
    tipPrivacy: $localize`:@@pdf_xref_tip_privacy:Tout se fait localement dans votre navigateur (aucun upload).`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_xref_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_xref_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_xref_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_xref_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_xref_filter_placeholder:Filtrer (obj, offset, free, compressed, gen…)`,

    statusLoading: $localize`:@@pdf_xref_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_xref_status_ready:Prêt`,
    statusError: $localize`:@@pdf_xref_status_error:Erreur`,

    importTitle: $localize`:@@pdf_xref_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_xref_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_xref_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_xref_card_results_sub:Entrées XRef (table ou stream) + export JSON.`,

    jsonTitle: $localize`:@@pdf_xref_json_title:JSON`,
    jsonSub: $localize`:@@pdf_xref_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_xref_list_title:Entrées XRef`,
    emptyText: $localize`:@@pdf_xref_empty:Aucune entrée à afficher.`,
    backText: $localize`:@@pdf_xref_back:← Retour aux outils PDF`,
  };

  // ---- State ----
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);

  readonly entries = signal<XrefEntryView[]>([]);
  readonly diagnostics = signal<XrefParseDiagnostics>({
    startxrefOffset: null,
    kind: 'unknown',
    message: null,
  });

  // ---- Form ----
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),

    // options export
    includeDiagnostics: this.fb.nonNullable.control(true),
  });

  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includeDiagnostics = controlToSignal(this.form.controls.includeDiagnostics);

  readonly filteredEntries = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.entries();

    if (!f) return all;

    return all.filter(e => {
      const hay = [
        String(e.objNumber),
        String(e.gen ?? ''),
        e.kind,
        String(e.offset ?? ''),
        String(e.nextFreeObj ?? ''),
        String(e.objStm ?? ''),
        String(e.objStmIndex ?? ''),
      ].join(' ').toLowerCase();

      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.entries();
    const inUse = all.filter(e => e.kind === 'inUse').length;
    const free = all.filter(e => e.kind === 'free').length;
    const compressed = all.filter(e => e.kind === 'compressed').length;

    const maxOffset = all.reduce((m, e) => Math.max(m, e.offset ?? 0), 0);

    const d = this.diagnostics();

    return {
      total: all.length,
      inUse,
      free,
      compressed,
      maxOffset: maxOffset || 0,
      kind: d.kind,
      startxref: d.startxrefOffset,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_xref_stat_total:Entrées`, value: this.stats().total },
    { label: $localize`:@@pdf_xref_stat_inuse:In-use`, value: this.stats().inUse },
    { label: $localize`:@@pdf_xref_stat_free:Free`, value: this.stats().free },
    { label: $localize`:@@pdf_xref_stat_comp:Compressed`, value: this.stats().compressed },
  ]);

  readonly jsonObject = computed(() => {
    const includeDiagnostics = this.includeDiagnostics();
    const d = this.diagnostics();

    const out: Record<string, unknown> = {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _note: this.ui.tipPrivacy,
      xrefKind: d.kind,
      startxrefOffset: d.startxrefOffset,
      entries: this.filteredEntries().map(e => ({
        objNumber: e.objNumber,
        gen: e.gen,
        kind: e.kind,
        offset: e.offset,
        nextFreeObj: e.nextFreeObj,
        objStm: e.objStm,
        objStmIndex: e.objStmIndex,
      })),
      stats: this.stats(),
    };

    if (includeDiagnostics) out['diagnostics'] = d;

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
    this.entries.set([]);
    this.diagnostics.set({ startxrefOffset: null, kind: 'unknown', message: null });

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const result = await parseXref(bytes);

      this.entries.set(result.entries);
      this.diagnostics.set(result.diagnostics);

      this.status.set('ready');
      this.tipMessage.set(this.ui.tipPrivacy);
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

    this.entries.set([]);
    this.diagnostics.set({ startxrefOffset: null, kind: 'unknown', message: null });

    this.form.patchValue({
      filter: '',
      pretty: true,
      includeDiagnostics: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_xref_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_xref_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-xref') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* =============================================================================
 * XREF PARSING (client-side only)
 * ============================================================================= */

async function parseXref(bytes: Uint8Array): Promise<{ entries: XrefEntryView[]; diagnostics: XrefParseDiagnostics }> {
  const startxrefOffset = findStartXref(bytes);

  const baseDiag: XrefParseDiagnostics = {
    startxrefOffset,
    kind: 'unknown',
    message: null,
  };

  if (startxrefOffset == null) {
    return {
      entries: [],
      diagnostics: { ...baseDiag, message: 'startxref introuvable.' },
    };
  }

  const head = readAscii(bytes, startxrefOffset, 32).trimStart();

  if (head.startsWith('xref')) {
    const table = parseXrefTable(bytes, startxrefOffset);
    const entries = flattenXrefTable(table.entriesByObj);

    return {
      entries,
      diagnostics: {
        ...baseDiag,
        kind: 'table',
        xrefTable: { parsedSubsections: table.subsections, parsedEntries: entries.length },
      },
    };
  }

  const streamRes = await parseXrefStreamAtOffset(bytes, startxrefOffset);

  return {
    entries: streamRes.entries,
    diagnostics: streamRes.diagnostics,
  };
}

/* ---------------- startxref finder ---------------- */

function findStartXref(bytes: Uint8Array): number | null {
  const tailStart = Math.max(0, bytes.length - 4096);
  const tail = bytes.subarray(tailStart);
  const txt = ascii(tail);

  const m = txt.match(/startxref\s+(\d+)\s+%%EOF/);
  if (!m) return null;

  const off = Number(m[1]);
  if (!Number.isFinite(off) || off < 0 || off >= bytes.length) return null;

  return off;
}

/* ---------------- XRef TABLE ---------------- */

function parseXrefTable(bytes: Uint8Array, startOffset: number): {
  subsections: number;
  entriesByObj: Map<number, { objNumber: number; gen: number; offset: number; inUse: boolean }>;
} {
  const entriesByObj = new Map<number, { objNumber: number; gen: number; offset: number; inUse: boolean }>();

  const window = bytes.subarray(startOffset, Math.min(bytes.length, startOffset + 2_000_000));
  const text = ascii(window);
  const lines = text.split(/\r?\n/);

  let i = 0;
  if (!lines[i]?.startsWith('xref')) return { subsections: 0, entriesByObj };
  i++;

  let subsections = 0;

  while (i < lines.length) {
    const header = (lines[i] ?? '').trim();
    if (!header) break;
    if (header.startsWith('trailer')) break;

    const hm = header.match(/^(\d+)\s+(\d+)$/);
    if (!hm) break;

    subsections++;
    const first = Number(hm[1]);
    const count = Number(hm[2]);
    i++;

    for (let k = 0; k < count && i < lines.length; k++, i++) {
      const ln = (lines[i] ?? '').trim();
      const em = ln.match(/^(\d{10})\s+(\d{5})\s+([nf])$/);
      if (!em) continue;

      const offset = Number(em[1]);
      const gen = Number(em[2]);
      const inUse = em[3] === 'n';
      const objNumber = first + k;

      entriesByObj.set(objNumber, { objNumber, gen, offset, inUse });
    }
  }

  return { subsections, entriesByObj };
}

function flattenXrefTable(entriesByObj: Map<number, { objNumber: number; gen: number; offset: number; inUse: boolean }>): XrefEntryView[] {
  const out: XrefEntryView[] = [];

  for (const e of entriesByObj.values()) {
    out.push({
      objNumber: e.objNumber,
      gen: e.gen,
      kind: e.inUse ? 'inUse' : 'free',
      offset: e.offset,
      nextFreeObj: null,
      objStm: null,
      objStmIndex: null,
    });
  }

  out.sort((a, b) => a.objNumber - b.objNumber);
  return out;
}

/* ---------------- XRef STREAM (PDF 1.5+) ---------------- */

async function parseXrefStreamAtOffset(bytes: Uint8Array, startOffset: number): Promise<{ entries: XrefEntryView[]; diagnostics: XrefParseDiagnostics }> {
  const baseDiag: XrefParseDiagnostics = {
    startxrefOffset: startOffset,
    kind: 'stream',
    message: null,
    xrefStream: {
      xrefObjOffset: startOffset,
      filter: [],
      w: null,
      index: null,
      size: null,
      decodedBytes: null,
      supported: false,
      reasonIfUnsupported: null,
    },
  };

  const obj = parseIndirectObjectWithStream(bytes, startOffset);
  if (!obj) {
    return {
      entries: [],
      diagnostics: { ...baseDiag, kind: 'unknown', message: 'XRef stream attendu mais objet indirect illisible.' },
    };
  }

  const dict = obj.dict;
  const streamBytes = obj.streamBytes;

  const filter = normalizeFilter(dict['/Filter']);
  const w = toNumberArray(dict['/W']);
  const index = toNumberArray(dict['/Index']);
  const size = toNumber(dict['/Size']);

  const diag = { ...baseDiag };
  diag.xrefStream = {
    xrefObjOffset: startOffset,
    filter,
    w,
    index,
    size,
    decodedBytes: null,
    supported: false,
    reasonIfUnsupported: null,
  };

  if (!w || w.length !== 3) {
    diag.xrefStream.supported = false;
    diag.xrefStream.reasonIfUnsupported = 'XRef stream: /W manquant ou invalide.';
    return { entries: [], diagnostics: diag };
  }

  const decoded = await decodePdfStreamBytes(streamBytes, filter);
  if (!decoded.ok) {
    diag.xrefStream.supported = false;
    diag.xrefStream.reasonIfUnsupported = decoded.reason;
    return { entries: [], diagnostics: diag };
  }

  diag.xrefStream.decodedBytes = decoded.bytes.length;
  diag.xrefStream.supported = true;

  const effectiveIndex = (index && index.length >= 2 && index.length % 2 === 0)
    ? index
    : (size != null ? [0, size] : null);

  if (!effectiveIndex) {
    diag.xrefStream.supported = false;
    diag.xrefStream.reasonIfUnsupported = 'XRef stream: /Index absent et /Size absent.';
    return { entries: [], diagnostics: diag };
  }

  const entries = parseXrefStreamEntries(decoded.bytes, w, effectiveIndex);
  return { entries, diagnostics: diag };
}

function parseXrefStreamEntries(data: Uint8Array, w: number[], index: number[]): XrefEntryView[] {
  const [w0, w1, w2] = w;
  const entryLen = w0 + w1 + w2;

  const out: XrefEntryView[] = [];

  // Per spec: if w0 == 0, the type field is assumed to be 1.
  let p = 0;
  for (let i = 0; i < index.length; i += 2) {
    const firstObj = index[i];
    const count = index[i + 1];

    for (let k = 0; k < count; k++) {
      if (p + entryLen > data.length) break;

      const type = w0 === 0 ? 1 : readUInt(data, p, w0);
      const f1 = readUInt(data, p + w0, w1);
      const f2 = readUInt(data, p + w0 + w1, w2);

      const objNumber = firstObj + k;

      if (type === 0) {
        out.push({
          objNumber,
          gen: w2 ? f2 : null,
          kind: 'free',
          offset: null,
          nextFreeObj: w1 ? f1 : null,
          objStm: null,
          objStmIndex: null,
        });
      } else if (type === 1) {
        out.push({
          objNumber,
          gen: w2 ? f2 : null,
          kind: 'inUse',
          offset: w1 ? f1 : null,
          nextFreeObj: null,
          objStm: null,
          objStmIndex: null,
        });
      } else if (type === 2) {
        out.push({
          objNumber,
          gen: null,
          kind: 'compressed',
          offset: null,
          nextFreeObj: null,
          objStm: w1 ? f1 : null,
          objStmIndex: w2 ? f2 : null,
        });
      } else {
        out.push({
          objNumber,
          gen: null,
          kind: 'inUse',
          offset: null,
          nextFreeObj: null,
          objStm: null,
          objStmIndex: null,
        });
      }

      p += entryLen;
    }
  }

  out.sort((a, b) => a.objNumber - b.objNumber);
  return out;
}

function readUInt(buf: Uint8Array, offset: number, len: number): number {
  if (len <= 0) return 0;
  let v = 0;
  for (let i = 0; i < len; i++) v = (v << 8) + buf[offset + i];
  return v >>> 0;
}

/* ---------------- minimal PDF object parsing for xref stream dict ---------------- */

function parseIndirectObjectWithStream(bytes: Uint8Array, offset: number): { dict: Record<string, any>; streamBytes: Uint8Array } | null {
  const window = bytes.subarray(offset, Math.min(bytes.length, offset + 5_000_000));
  const text = ascii(window);

  const m = text.match(/^(\s*\d+\s+\d+\s+obj\b)/);
  if (!m) return null;

  const dictStart = text.indexOf('<<');
  if (dictStart < 0) return null;

  const dictParsed = parsePdfDict(text, dictStart);
  if (!dictParsed) return null;

  const afterDict = dictParsed.end;

  const streamPos = findKeyword(text, 'stream', afterDict);
  if (streamPos < 0) return null;

  const streamDataStart = skipEol(text, streamPos + 'stream'.length);

  const endStreamPos = findKeyword(text, 'endstream', streamDataStart);
  if (endStreamPos < 0) return null;

  const absStreamStart = offset + streamDataStart;
  const absStreamEnd = offset + endStreamPos;

  const streamBytes = bytes.subarray(absStreamStart, absStreamEnd);

  return { dict: dictParsed.value, streamBytes };
}

function findKeyword(text: string, kw: string, from: number): number {
  return text.indexOf(kw, from);
}

function skipEol(text: string, from: number): number {
  let i = from;
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
  if (text[i] === '\r' && text[i + 1] === '\n') return i + 2;
  if (text[i] === '\n' || text[i] === '\r') return i + 1;
  return i;
}

function parsePdfDict(text: string, start: number): { value: Record<string, any>; end: number } | null {
  if (text.slice(start, start + 2) !== '<<') return null;

  let i = start + 2;
  const out: Record<string, any> = {};

  while (i < text.length) {
    i = skipWs(text, i);

    if (text.slice(i, i + 2) === '>>') {
      return { value: out, end: i + 2 };
    }

    if (text[i] !== '/') return null;
    const key = readName(text, i);
    i = key.end;

    i = skipWs(text, i);

    const val = readValue(text, i);
    if (!val) return null;
    i = val.end;

    out[key.value] = val.value;
  }

  return null;
}

function readValue(text: string, start: number): { value: any; end: number } | null {
  const i0 = skipWs(text, start);
  const ch = text[i0];

  if (!ch) return null;

  if (text.slice(i0, i0 + 2) === '<<') {
    const d = parsePdfDict(text, i0);
    if (!d) return null;
    return { value: d.value, end: d.end };
  }

  if (ch === '[') {
    let i = i0 + 1;
    const arr: any[] = [];
    while (i < text.length) {
      i = skipWs(text, i);
      if (text[i] === ']') return { value: arr, end: i + 1 };
      const v = readValue(text, i);
      if (!v) return null;
      arr.push(v.value);
      i = v.end;
    }
    return null;
  }

  if (ch === '/') {
    const n = readName(text, i0);
    return { value: n.value, end: n.end };
  }

  if (isNumStart(ch)) {
    const n = readNumber(text, i0);
    return { value: n.value, end: n.end };
  }

  if (text.startsWith('true', i0)) return { value: true, end: i0 + 4 };
  if (text.startsWith('false', i0)) return { value: false, end: i0 + 5 };
  if (text.startsWith('null', i0)) return { value: null, end: i0 + 4 };

  const ref = text.slice(i0).match(/^(\d+)\s+(\d+)\s+R\b/);
  if (ref) {
    return { value: { _ref: `${ref[1]} ${ref[2]} R`, obj: Number(ref[1]), gen: Number(ref[2]) }, end: i0 + ref[0].length };
  }

  return null;
}

function readName(text: string, start: number): { value: string; end: number } {
  let i = start;
  i++;
  while (i < text.length) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '/' || c === '>' || c === '<' || c === '[' || c === ']' || c === '(' || c === ')') break;
    i++;
  }
  return { value: text.slice(start, i), end: i };
}

function readNumber(text: string, start: number): { value: number; end: number } {
  let i = start;
  while (i < text.length) {
    const c = text[i];
    if (!('0123456789+-.'.includes(c))) break;
    i++;
  }
  const raw = text.slice(start, i);
  return { value: Number(raw), end: i };
}

function skipWs(text: string, i: number): number {
  while (i < text.length) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') i++;
    else break;
  }
  return i;
}

function isNumStart(c: string): boolean {
  return (c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.';
}

/* ---------------- stream decoding ---------------- */

async function decodePdfStreamBytes(
  stream: Uint8Array,
  filterNames: string[]
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: string }> {
  if (!filterNames || filterNames.length === 0) {
    return { ok: true, bytes: stream };
  }

  const supported = filterNames.every(f => f === '/FlateDecode');
  if (!supported) {
    return { ok: false, reason: `Filtres non supportés: ${filterNames.join(', ')}` };
  }

  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    return { ok: false, reason: `DecompressionStream indisponible sur ce navigateur (FlateDecode non décodable).` };
  }

  try {
    const ds = new DS('deflate');

    // ✅ FIX TS2322 (définitivement) :
    // On copie les bytes dans un ArrayBuffer neuf => type EXACT = ArrayBuffer.
    const ab = new ArrayBuffer(stream.byteLength);
    new Uint8Array(ab).set(stream);

    const blob = new Blob([ab]);
    const decompressedStream = blob.stream().pipeThrough(ds);

    const outAb = await new Response(decompressedStream).arrayBuffer();
    return { ok: true, bytes: new Uint8Array(outAb) };
  } catch (e: any) {
    return { ok: false, reason: `Échec décompression FlateDecode: ${String(e?.message ?? e)}` };
  }
}

/* ---------------- dict helpers ---------------- */

function normalizeFilter(v: any): string[] {
  if (!v) return [];
  if (typeof v === 'string' && v.startsWith('/')) return [v];
  if (Array.isArray(v)) return v.filter(x => typeof x === 'string' && x.startsWith('/'));
  return [];
}

function toNumber(v: any): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function toNumberArray(v: any): number[] | null {
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const it of v) {
    if (typeof it !== 'number' || !Number.isFinite(it)) return null;
    out.push(it);
  }
  return out;
}

/* ---------------- ascii helpers ---------------- */

function readAscii(bytes: Uint8Array, offset: number, len: number): string {
  const end = Math.min(bytes.length, offset + len);
  return ascii(bytes.subarray(offset, end));
}

function ascii(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}
