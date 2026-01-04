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
  PDFRef,
} from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

type TokenKind =
  | 'number'
  | 'name'
  | 'string'
  | 'hex'
  | 'array'
  | 'keyword'
  | 'operator'
  | 'inlineImage'
  | 'unknown';

interface PdfToken {
  kind: TokenKind;
  value: any;
  raw?: string;
}

interface PdfOp {
  index: number;
  op: string;
  args: PdfToken[];
}

interface PageOps {
  pageNumber: number;
  ops: PdfOp[];
  stats: {
    totalOps: number;
    textOps: number;
    xobjectOps: number;
    graphicsOps: number;
    hasInlineImages: boolean;
  };
  decode: {
    streams: number;
    decoded: number;
    skipped: number;
    notes: string[];
  };
}

@Component({
  selector: 'app-pdf-page-content-ops-to-json-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-page-content-ops-to-json-tool.component.html',
  styleUrl: './pdf-page-content-ops-to-json-tool.component.scss',
})
export class PdfPageContentOpsToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_ops_title:Opérateurs de page → JSON`,
    subtitle: $localize`:@@pdf_ops_subtitle:Analysez les content streams d’un PDF et exportez les opérateurs/operandés (TJ/Tj, Do, cm, q/Q…) page par page en JSON — localement dans le navigateur.`,
    errTitle: $localize`:@@pdf_ops_err_title:Impossible d’extraire les opérateurs.`,
    errGeneric: $localize`:@@pdf_ops_err_generic:Impossible de lire ce PDF.`,
    tipPrivacy: $localize`:@@pdf_ops_tip_privacy:Tout se fait localement dans votre navigateur (aucun upload).`,
    tipHuge: $localize`:@@pdf_ops_tip_huge:Astuce : limitez la plage de pages ou le nombre d’opérations par page pour éviter un export énorme.`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_ops_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_ops_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_ops_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_ops_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_ops_filter_placeholder:Filtrer (opérateur, Do, Tj/TJ, cm, nom XObject, texte…)`,

    statusLoading: $localize`:@@pdf_ops_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_ops_status_ready:Prêt`,
    statusError: $localize`:@@pdf_ops_status_error:Erreur`,

    importTitle: $localize`:@@pdf_ops_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_ops_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_ops_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_ops_card_results_sub:Opérateurs extraits par page + export JSON.`,

    jsonTitle: $localize`:@@pdf_ops_json_title:JSON`,
    jsonSub: $localize`:@@pdf_ops_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_ops_list_title:Pages`,
    emptyText: $localize`:@@pdf_ops_empty:Aucune donnée à afficher.`,
    backText: $localize`:@@pdf_ops_back:← Retour aux outils PDF`,
  };

  // ---- State ----
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly pages = signal<PageOps[]>([]);

  // ---- Form ----
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),

    pageFrom: this.fb.nonNullable.control<number>(1),
    pageTo: this.fb.nonNullable.control<number>(999999),

    maxOpsPerPage: this.fb.nonNullable.control<number>(5000),

    includeArgsRaw: this.fb.nonNullable.control(false),
    includeDecodeNotes: this.fb.nonNullable.control(true),
  });

  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly pageFrom = controlToSignal(this.form.controls.pageFrom);
  readonly pageTo = controlToSignal(this.form.controls.pageTo);
  readonly maxOpsPerPage = controlToSignal(this.form.controls.maxOpsPerPage);
  readonly includeArgsRaw = controlToSignal(this.form.controls.includeArgsRaw);
  readonly includeDecodeNotes = controlToSignal(this.form.controls.includeDecodeNotes);

  readonly filteredPages = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.pages();
    if (!f) return all;

    return all.filter(p => {
      const preview = this.previewOps(p).toLowerCase();

      const hay = [
        `page:${p.pageNumber}`,
        `ops:${p.stats.totalOps}`,
        `textOps:${p.stats.textOps}`,
        `xobjectOps:${p.stats.xobjectOps}`,
        preview,
      ].join(' ').toLowerCase();

      return hay.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.pages();
    const totalPages = all.length;
    const totalOps = all.reduce((s, p) => s + p.stats.totalOps, 0);
    const totalText = all.reduce((s, p) => s + p.stats.textOps, 0);
    const totalDo = all.reduce((s, p) => s + p.stats.xobjectOps, 0);
    const inline = all.some(p => p.stats.hasInlineImages);

    return {
      pages: this.pageCount(),
      analyzedPages: totalPages,
      totalOps,
      totalText,
      totalDo,
      inline,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_ops_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_ops_stat_analyzed_label:Analysées`, value: this.stats().analyzedPages },
    { label: $localize`:@@pdf_ops_stat_ops_label:Ops`, value: this.stats().totalOps },
    { label: $localize`:@@pdf_ops_stat_text_label:Texte`, value: this.stats().totalText },
  ]);

  readonly jsonObject = computed(() => {
    const includeRaw = this.includeArgsRaw();
    const includeNotes = this.includeDecodeNotes();

    const pages = this.filteredPages().map(p => ({
      pageNumber: p.pageNumber,
      stats: p.stats,
      decode: includeNotes
        ? p.decode
        : { streams: p.decode.streams, decoded: p.decode.decoded, skipped: p.decode.skipped },
      ops: p.ops.map(o => ({
        index: o.index,
        op: o.op,
        args: o.args.map(a => tokenToJson(a, includeRaw)),
      })),
    }));

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      _note: this.ui.tipPrivacy,
      scope: {
        pageFrom: this.pageFrom(),
        pageTo: this.pageTo(),
        maxOpsPerPage: this.maxOpsPerPage(),
      },
      summary: this.stats(),
      pages,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  // ✅ Helper pour template (pas d'arrow function dans interpolation)
  previewOps(p: PageOps, max = 6): string {
    if (!p?.ops?.length) return '—';
    const take = Math.max(0, Math.min(max, p.ops.length));
    const names: string[] = [];
    for (let i = 0; i < take; i++) names.push(p.ops[i].op);
    return p.ops.length > take ? `${names.join(' · ')} …` : names.join(' · ');
  }

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

      const from = clampInt(this.pageFrom(), 1, pages.length);
      const to = clampInt(this.pageTo(), 1, pages.length);
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);

      const maxOps = clampInt(this.maxOpsPerPage(), 1, 1_000_000);

      const results: PageOps[] = [];

      for (let i = lo - 1; i <= hi - 1; i++) {
        const pageNumber = i + 1;
        const pageNode = (pages[i] as any).node as PDFDict;

        const res = await extractPageOps(doc, pageNode, pageNumber, maxOps);
        results.push(res);
      }

      this.pages.set(results);
      this.status.set('ready');
      this.tipMessage.set(this.ui.tipHuge);
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
    this.pages.set([]);

    this.form.patchValue({
      filter: '',
      pretty: true,
      pageFrom: 1,
      pageTo: 999999,
      maxOpsPerPage: 5000,
      includeArgsRaw: false,
      includeDecodeNotes: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_ops_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_ops_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-page-content-ops') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* =============================================================================
 * Extraction (pdf-lib low-level + FlateDecode best-effort)
 * ============================================================================= */

async function extractPageOps(doc: PDFDocument, pageNode: PDFDict, pageNumber: number, maxOps: number): Promise<PageOps> {
  const contentsVal = pageNode.get(PDFName.of('Contents'));

  const streams: Uint8Array[] = [];
  const decodeNotes: string[] = [];
  let decoded = 0;
  let skipped = 0;

  const contentRefs = resolveContentsAsArray(doc, contentsVal);
  for (const c of contentRefs) {
    const rawStream = resolveStreamBytes(doc, c);
    if (!rawStream) {
      skipped++;
      decodeNotes.push('Stream /Contents non résolu (ref/dict inconnu).');
      continue;
    }

    const decodedRes = await decodePdfStreamIfNeeded(rawStream.bytes, rawStream.filterNames);
    if (decodedRes.ok) {
      streams.push(decodedRes.bytes);
      decoded++;
      if (decodedRes.note) decodeNotes.push(decodedRes.note);
    } else {
      streams.push(rawStream.bytes);
      skipped++;
      decodeNotes.push(decodedRes.reason);
    }
  }

  const merged = mergeStreamsWithLF(streams);
  const ops = parseContentStreamOps(merged, maxOps);
  const stats = computeOpsStats(ops);

  return {
    pageNumber,
    ops,
    stats,
    decode: {
      streams: streams.length,
      decoded,
      skipped,
      notes: decodeNotes,
    },
  };
}

function resolveContentsAsArray(doc: PDFDocument, v: unknown): unknown[] {
  const ctx = doc.context;
  if (!v) return [];

  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return resolveContentsAsArray(doc, looked);
  }

  if (v instanceof PDFArray) {
    const out: unknown[] = [];
    for (let i = 0; i < v.size(); i++) out.push(v.get(i));
    return out;
  }

  return [v];
}

function resolveStreamBytes(doc: PDFDocument, v: unknown): { bytes: Uint8Array; filterNames: string[] } | null {
  const ctx = doc.context;

  let obj: any = v;
  if (v instanceof PDFRef) obj = ctx.lookup(v);

  const maybeStream: any = obj;

  const dict: any =
    maybeStream?.dict ??
    maybeStream?.get?.(PDFName.of('Filter')) ? maybeStream : null;

  const bytes: Uint8Array | null =
    maybeStream?.contents instanceof Uint8Array ? maybeStream.contents :
      typeof maybeStream?.getContents === 'function' ? maybeStream.getContents() :
        null;

  if (!bytes) return null;

  const filterVal = dict?.dict?.get?.(PDFName.of('Filter')) ?? dict?.get?.(PDFName.of('Filter'));
  const filterNames = normalizeFilterNames(doc, filterVal);

  return { bytes, filterNames };
}

function normalizeFilterNames(doc: PDFDocument, v: unknown): string[] {
  const ctx = doc.context;

  if (!v) return [];
  if (v instanceof PDFRef) return normalizeFilterNames(doc, ctx.lookup(v));
  if (v instanceof PDFName) return [v.asString()];

  if (v instanceof PDFArray) {
    const out: string[] = [];
    for (let i = 0; i < v.size(); i++) {
      const it = v.get(i);
      if (it instanceof PDFName) out.push(it.asString());
    }
    return out;
  }
  return [];
}

async function decodePdfStreamIfNeeded(
  bytes: Uint8Array,
  filterNames: string[]
): Promise<{ ok: true; bytes: Uint8Array; note?: string } | { ok: false; reason: string }> {
  if (!filterNames || filterNames.length === 0) return { ok: true, bytes };

  const supported = filterNames.every(f => f === '/FlateDecode');
  if (!supported) return { ok: false, reason: `Filtres non supportés: ${filterNames.join(', ')}` };

  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) return { ok: false, reason: 'DecompressionStream indisponible: FlateDecode non décodable sur ce navigateur.' };

  try {
    const ds = new DS('deflate');

    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);

    const blob = new Blob([copy.buffer]);
    const decompressedStream = blob.stream().pipeThrough(ds);
    const ab = await new Response(decompressedStream).arrayBuffer();

    return { ok: true, bytes: new Uint8Array(ab), note: 'FlateDecode OK' };
  } catch (e: any) {
    return { ok: false, reason: `Échec décompression FlateDecode: ${String(e?.message ?? e)}` };
  }
}

function mergeStreamsWithLF(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 0) return new Uint8Array();

  const lf = 1;
  const total = parts.reduce((s, p) => s + p.length, 0) + Math.max(0, parts.length - 1) * lf;
  const out = new Uint8Array(total);

  let o = 0;
  for (let i = 0; i < parts.length; i++) {
    out.set(parts[i], o);
    o += parts[i].length;
    if (i < parts.length - 1) out[o++] = 0x0a;
  }
  return out;
}

/* =============================================================================
 * Tokenizer + op grouping (best-effort)
 * ============================================================================= */

function parseContentStreamOps(bytes: Uint8Array, maxOps: number): PdfOp[] {
  const s = bytesToAsciiLossy(bytes);
  const tokens = tokenizeContentStream(s);

  const ops: PdfOp[] = [];
  let stack: PdfToken[] = [];
  let index = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.kind === 'operator' || t.kind === 'inlineImage') {
      const opName = t.kind === 'inlineImage' ? 'INLINE_IMAGE' : String(t.value);

      ops.push({
        index: index++,
        op: opName,
        args: stack,
      });

      stack = [];

      if (ops.length >= maxOps) break;
      continue;
    }

    stack.push(t);
  }

  return ops;
}

function tokenizeContentStream(input: string): PdfToken[] {
  const out: PdfToken[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const c = input[i];

    if (isWs(c)) { i++; continue; }

    if (c === '%') {
      while (i < len && input[i] !== '\n' && input[i] !== '\r') i++;
      continue;
    }

    if (startsWithWord(input, i, 'BI')) {
      const biStart = i;
      const idPos = findWord(input, i, 'ID');
      const eiPos = idPos >= 0 ? findWord(input, idPos + 2, 'EI') : -1;

      if (idPos >= 0 && eiPos >= 0) {
        const dictPart = input.slice(biStart, idPos).trim();
        const payload = input.slice(idPos + 2, eiPos);
        out.push({
          kind: 'inlineImage',
          value: { header: dictPart, payloadBytesApprox: payload.length },
          raw: dictPart,
        });
        i = eiPos + 2;
        continue;
      }
    }

    if (input.startsWith('<<', i)) { out.push({ kind: 'keyword', value: '<<' }); i += 2; continue; }
    if (input.startsWith('>>', i)) { out.push({ kind: 'keyword', value: '>>' }); i += 2; continue; }

    if (c === '[') {
      const arr = readArray(input, i);
      out.push({ kind: 'array', value: arr.value, raw: arr.raw });
      i = arr.end;
      continue;
    }

    if (c === '(') {
      const str = readLiteralString(input, i);
      out.push({ kind: 'string', value: str.value, raw: str.raw });
      i = str.end;
      continue;
    }

    if (c === '<' && !input.startsWith('<<', i)) {
      const hx = readHexString(input, i);
      out.push({ kind: 'hex', value: hx.value, raw: hx.raw });
      i = hx.end;
      continue;
    }

    if (c === '/') {
      const name = readName(input, i);
      out.push({ kind: 'name', value: name.value, raw: name.raw });
      i = name.end;
      continue;
    }

    if (isNumStart(c)) {
      const n = readNumber(input, i);
      out.push({ kind: 'number', value: n.value, raw: n.raw });
      i = n.end;
      continue;
    }

    const w = readWord(input, i);
    const word = w.value;

    if (word === 'true' || word === 'false' || word === 'null') out.push({ kind: 'keyword', value: word, raw: word });
    else out.push({ kind: 'operator', value: word, raw: word });

    i = w.end;
  }

  return out;
}

function readArray(input: string, start: number): { value: PdfToken[]; end: number; raw: string } {
  let i = start + 1;
  const items: PdfToken[] = [];
  const rawStart = start;

  while (i < input.length) {
    while (i < input.length && isWs(input[i])) i++;
    if (i < input.length && input[i] === '%') {
      while (i < input.length && input[i] !== '\n' && input[i] !== '\r') i++;
      continue;
    }

    if (input[i] === ']') {
      const raw = input.slice(rawStart, i + 1);
      return { value: items, end: i + 1, raw };
    }

    const c = input[i];
    if (c === '/') { const n = readName(input, i); items.push({ kind: 'name', value: n.value, raw: n.raw }); i = n.end; continue; }
    if (isNumStart(c)) { const n = readNumber(input, i); items.push({ kind: 'number', value: n.value, raw: n.raw }); i = n.end; continue; }
    if (c === '(') { const s = readLiteralString(input, i); items.push({ kind: 'string', value: s.value, raw: s.raw }); i = s.end; continue; }
    if (c === '<' && !input.startsWith('<<', i)) { const h = readHexString(input, i); items.push({ kind: 'hex', value: h.value, raw: h.raw }); i = h.end; continue; }
    if (c === '[') { const a = readArray(input, i); items.push({ kind: 'array', value: a.value, raw: a.raw }); i = a.end; continue; }

    const w = readWord(input, i);
    items.push({ kind: 'keyword', value: w.value, raw: w.value });
    i = w.end;
  }

  const raw = input.slice(rawStart, i);
  return { value: items, end: i, raw };
}

function readLiteralString(input: string, start: number): { value: string; end: number; raw: string } {
  let i = start + 1;
  let depth = 1;
  let out = '';
  while (i < input.length) {
    const c = input[i];

    if (c === '\\') {
      const n = input[i + 1];
      if (n) { out += n; i += 2; } else i++;
      continue;
    }

    if (c === '(') { depth++; out += c; i++; continue; }

    if (c === ')') {
      depth--;
      if (depth === 0) {
        const raw = input.slice(start, i + 1);
        return { value: out, end: i + 1, raw };
      }
      out += c; i++; continue;
    }

    out += c;
    i++;
  }

  const raw = input.slice(start, i);
  return { value: out, end: i, raw };
}

function readHexString(input: string, start: number): { value: string; end: number; raw: string } {
  let i = start + 1;
  let hex = '';
  while (i < input.length) {
    const c = input[i];
    if (c === '>') {
      const raw = input.slice(start, i + 1);
      return { value: hex.replace(/\s+/g, ''), end: i + 1, raw };
    }
    hex += c; i++;
  }
  const raw = input.slice(start, i);
  return { value: hex.replace(/\s+/g, ''), end: i, raw };
}

function readName(input: string, start: number): { value: string; end: number; raw: string } {
  let i = start + 1;
  while (i < input.length) {
    const c = input[i];
    if (isWs(c) || c === '/' || c === '[' || c === ']' || c === '(' || c === ')' || c === '<' || c === '>') break;
    i++;
  }
  const raw = input.slice(start, i);
  return { value: raw, end: i, raw };
}

function readNumber(input: string, start: number): { value: number; end: number; raw: string } {
  let i = start;
  while (i < input.length) {
    const c = input[i];
    if (!('0123456789+-.'.includes(c))) break;
    i++;
  }
  const raw = input.slice(start, i);
  return { value: Number(raw), end: i, raw };
}

function readWord(input: string, start: number): { value: string; end: number } {
  let i = start;
  while (i < input.length) {
    const c = input[i];
    if (isWs(c) || c === '[' || c === ']' || c === '(' || c === ')' || c === '<' || c === '>' || c === '/') break;
    i++;
  }
  return { value: input.slice(start, i), end: i };
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f';
}
function isNumStart(c: string): boolean {
  return (c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.';
}

function startsWithWord(s: string, i: number, w: string): boolean {
  if (s.slice(i, i + w.length) !== w) return false;
  const before = i - 1 >= 0 ? s[i - 1] : ' ';
  const after = i + w.length < s.length ? s[i + w.length] : ' ';
  return isWs(before) && isWs(after);
}
function findWord(s: string, from: number, w: string): number {
  for (let i = from; i <= s.length - w.length; i++) {
    if (startsWithWord(s, i, w)) return i;
  }
  return -1;
}

function bytesToAsciiLossy(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/* =============================================================================
 * Stats + JSON helpers
 * ============================================================================= */

function computeOpsStats(ops: PdfOp[]): PageOps['stats'] {
  let textOps = 0;
  let xobjectOps = 0;
  let graphicsOps = 0;
  let hasInlineImages = false;

  for (const o of ops) {
    if (o.op === 'Tj' || o.op === 'TJ' || o.op === "'" || o.op === '"') textOps++;
    if (o.op === 'Do') xobjectOps++;
    if (o.op === 'cm' || o.op === 'q' || o.op === 'Q' || o.op === 're' || o.op === 'W' || o.op === 'n') graphicsOps++;
    if (o.op === 'INLINE_IMAGE') hasInlineImages = true;
  }

  return { totalOps: ops.length, textOps, xobjectOps, graphicsOps, hasInlineImages };
}

function tokenToJson(t: PdfToken, includeRaw: boolean): any {
  if (t.kind === 'array') {
    const arr = (t.value as PdfToken[]).map(x => tokenToJson(x, includeRaw));
    return includeRaw ? { kind: 'array', value: arr, raw: t.raw } : { kind: 'array', value: arr };
  }
  if (t.kind === 'inlineImage') {
    return includeRaw ? { kind: 'inlineImage', value: t.value, raw: t.raw } : { kind: 'inlineImage', value: t.value };
  }
  if (includeRaw) return { kind: t.kind, value: t.value, raw: t.raw ?? null };
  return { kind: t.kind, value: t.value };
}

function clampInt(v: number, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
