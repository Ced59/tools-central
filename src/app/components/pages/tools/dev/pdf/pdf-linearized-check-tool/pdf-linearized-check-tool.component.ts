import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

interface LinearizationDict {
  L?: number | null;   // File length
  H?: [number, number] | null; // Hint offset & length (or array)
  O?: number | null;   // First page object number
  E?: number | null;   // End offset of first page section
  N?: number | null;   // Number of pages
  T?: number | null;   // Main xref offset
  P?: number | null;   // First page number (0-based in spec, often 0)
}

interface LinearizedReport {
  isLinearized: boolean;

  markers: {
    linearizedKeywordFound: boolean;
    linearizationDictFound: boolean;
    linearizationDictOffset: number | null; // byte offset approx (in scanned text)
    withinFirstBytes: number; // scanned head length
  };

  linearizationDict: LinearizationDict | null;

  hints: {
    hasHintArray: boolean;
    hintOffset: number | null;
    hintLength: number | null;
    // Heuristic markers (not guaranteed)
    possibleHintObjectsFound: boolean;
  };

  structure: {
    fileSize: number;
    header: string | null; // "%PDF-1.7"
    startXrefOffset: number | null; // from 'startxref'
    eofCount: number;
  };

  notes: string[];
}

@Component({
  selector: 'app-pdf-linearized-check-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-linearized-check-tool.component.html',
  styleUrl: './pdf-linearized-check-tool.component.scss',
})
export class PdfLinearizedCheckToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_lin_title:PDF linéarisé (Fast Web View)`,
    subtitle: $localize`:@@pdf_lin_subtitle:Détectez si un PDF est linéarisé (Fast Web View) et exportez un diagnostic JSON (marqueurs, hints, offsets) — localement dans le navigateur.`,
    errTitle: $localize`:@@pdf_lin_err_title:Impossible d’analyser la linéarisation.`,
    errGeneric: $localize`:@@pdf_lin_err_generic:Impossible de lire ce PDF.`,
    tipPrivacy: $localize`:@@pdf_lin_tip_privacy:Tout se fait localement dans votre navigateur (aucun upload).`,
    tipRange: $localize`:@@pdf_lin_tip_range:Astuce : la linéarisation ne sert que si votre serveur/CDN supporte HTTP Range (partial content).`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_lin_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_lin_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_lin_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_lin_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_lin_filter_placeholder:Filtrer (Linearized, hints, startxref, …)`,

    statusLoading: $localize`:@@pdf_lin_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_lin_status_ready:Prêt`,
    statusError: $localize`:@@pdf_lin_status_error:Erreur`,

    importTitle: $localize`:@@pdf_lin_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_lin_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_lin_card_results_title:Diagnostic`,
    resultsSub: $localize`:@@pdf_lin_card_results_sub:Linéarisé ou non + indices techniques (dict, hints, offsets).`,

    jsonTitle: $localize`:@@pdf_lin_json_title:JSON`,
    jsonSub: $localize`:@@pdf_lin_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_lin_left_title:Résumé`,
    emptyText: $localize`:@@pdf_lin_empty:Aucune donnée à afficher.`,
    backText: $localize`:@@pdf_lin_back:← Retour aux outils PDF`,
  };

  // ---- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);

  readonly report = signal<LinearizedReport | null>(null);

  // ---- form
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    scanHeadBytes: this.fb.nonNullable.control<number>(256_000), // 256KB head scan
    scanTailBytes: this.fb.nonNullable.control<number>(256_000), // tail for startxref/eof
    includeNotes: this.fb.nonNullable.control(true),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly scanHeadBytes = controlToSignal(this.form.controls.scanHeadBytes);
  readonly scanTailBytes = controlToSignal(this.form.controls.scanTailBytes);
  readonly includeNotes = controlToSignal(this.form.controls.includeNotes);

  readonly statsCards = computed((): PdfToolStatCard[] => {
    const r = this.report();
    if (!r) return [];

    return [
      {
        label: $localize`:@@pdf_lin_stat_linearized:Linéarisé`,
        value: r.isLinearized ? $localize`:@@pdf_lin_yes:Oui` : $localize`:@@pdf_lin_no:Non`,
      },
      {
        label: $localize`:@@pdf_lin_stat_dict:Dict`,
        value: r.markers.linearizationDictFound ? 'OK' : '—',
      },
      {
        label: $localize`:@@pdf_lin_stat_hints:Hints`,
        value: r.hints.hasHintArray ? 'OK' : '—',
      },
      {
        label: $localize`:@@pdf_lin_stat_startxref:startxref`,
        value: r.structure.startXrefOffset != null ? String(r.structure.startXrefOffset) : '—',
      },
    ];
  });

  readonly jsonObject = computed(() => {
    const r = this.report();
    if (!r) return null;

    const includeNotes = this.includeNotes();

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _note: this.ui.tipPrivacy,
      isLinearized: r.isLinearized,
      markers: r.markers,
      linearizationDict: r.linearizationDict,
      hints: r.hints,
      structure: r.structure,
      notes: includeNotes ? r.notes : undefined,
    };
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

    this.fileName.set(file.name);
    this.fileSize.set(file.size);
    this.report.set(null);

    try {
      const buf = await file.arrayBuffer();

      const headN = clampInt(this.scanHeadBytes(), 8_192, 2_000_000);
      const tailN = clampInt(this.scanTailBytes(), 8_192, 2_000_000);

      const rep = analyzeLinearization(new Uint8Array(buf), headN, tailN);
      this.report.set(rep);

      this.status.set('ready');
      this.tipMessage.set(this.ui.tipRange);
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
    this.report.set(null);

    this.form.patchValue({
      pretty: true,
      filter: '',
      scanHeadBytes: 256_000,
      scanTailBytes: 256_000,
      includeNotes: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_lin_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_lin_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-linearized-check') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

/* =============================================================================
 * Core analysis (best-effort)
 * ============================================================================= */

function analyzeLinearization(bytes: Uint8Array, headBytes: number, tailBytes: number): LinearizedReport {
  const notes: string[] = [];

  const size = bytes.byteLength;

  const head = bytes.subarray(0, Math.min(size, headBytes));
  const tail = bytes.subarray(Math.max(0, size - tailBytes), size);

  const headStr = bytesToLatin1(head);
  const tailStr = bytesToLatin1(tail);

  const header = extractPdfHeader(headStr);

  // A linearized PDF should contain a Linearization dictionary in the first KBs
  // Typically pattern: "<obj> <gen> obj << /Linearized 1 /L ... >>"
  const linearizedKeywordFound = /\/Linearized\s+1\b/.test(headStr);
  const dictHit = findLinearizationDict(headStr);

  const linearizationDictFound = !!dictHit?.dictText;
  const linearizationDictOffset = dictHit?.approxOffset ?? null;

  let linDict: LinearizationDict | null = null;
  let hasHintArray = false;
  let hintOffset: number | null = null;
  let hintLength: number | null = null;

  if (linearizationDictFound && dictHit?.dictText) {
    linDict = parseLinearizationDict(dictHit.dictText);

    if (linDict?.H && Array.isArray(linDict.H)) {
      hasHintArray = true;
      hintOffset = linDict.H[0] ?? null;
      hintLength = linDict.H[1] ?? null;
    }
  } else {
    notes.push('Aucun Linearization dictionary détecté dans l’entête scannée (diagnostic indicatif).');
  }

  // Structure: startxref from tail
  const startXrefOffset = extractStartXref(tailStr);
  const eofCount = countOccurrences(tailStr, '%%EOF');

  // Heuristic: hint tables often appear as streams near hint offsets, but without full xref parsing
  // we only provide a weak signal: presence of "/Linearized" AND "/Hint" or "/H " like array already handled.
  const possibleHintObjectsFound =
    hasHintArray ||
    /\/Hint|\/Hints|LinearizationHint/i.test(headStr) ||
    /\/Hint|\/Hints|LinearizationHint/i.test(tailStr);

  // Decide isLinearized:
  // strong: dict found + /Linearized 1
  // weak: /Linearized 1 early but dict not reliably parsed
  const isLinearized = linearizationDictFound && linearizedKeywordFound;

  if (isLinearized) {
    notes.push('PDF linéarisé probable (Linearization dictionary + /Linearized 1 détectés tôt).');
  } else if (linearizedKeywordFound) {
    notes.push('Mot-clé /Linearized 1 détecté tôt, mais dictionnaire non parsé correctement (PDF peut être mal formé ou scan insuffisant).');
  } else {
    notes.push('Pas d’indice fort de linéarisation dans l’entête (Fast Web View improbable).');
  }

  notes.push('Rappel : la linéarisation n’améliore le rendu web que si le serveur/CDN supporte HTTP Range.');

  return {
    isLinearized,

    markers: {
      linearizedKeywordFound,
      linearizationDictFound,
      linearizationDictOffset,
      withinFirstBytes: head.length,
    },

    linearizationDict: linDict,

    hints: {
      hasHintArray,
      hintOffset,
      hintLength,
      possibleHintObjectsFound,
    },

    structure: {
      fileSize: size,
      header,
      startXrefOffset,
      eofCount,
    },

    notes,
  };
}

function extractPdfHeader(head: string): string | null {
  const m = head.match(/%PDF-\d\.\d/);
  return m ? m[0] : null;
}

function findLinearizationDict(head: string): { dictText: string; approxOffset: number } | null {
  const idx = head.search(/\/Linearized\s+1\b/);
  if (idx < 0) return null;

  // search backwards a bit for '<<' that starts dict
  const from = Math.max(0, idx - 2000);
  const around = head.slice(from, Math.min(head.length, idx + 6000));
  const dict = extractFirstDictText(around);
  if (!dict) return null;

  // approx byte offset: from + position of dict start within around
  const dictStartInAround = around.indexOf('<<');
  const approxOffset = dictStartInAround >= 0 ? (from + dictStartInAround) : from;

  return { dictText: dict, approxOffset };
}

function parseLinearizationDict(dictText: string): LinearizationDict {
  // dictText is "<< ... >>"
  // We parse only known keys (numbers/arrays)
  const getNum = (k: string) => toIntOrNull(extractDictValueRaw(dictText, k));
  const getArr2 = (k: string): [number, number] | null => {
    const raw = extractDictValueRaw(dictText, k);
    if (!raw) return null;
    const m = raw.match(/^\[\s*([+-]?\d+)\s+([+-]?\d+)\s*\]/);
    if (!m) return null;
    return [Number(m[1]), Number(m[2])];
  };

  const L = getNum('/L');
  const O = getNum('/O');
  const E = getNum('/E');
  const N = getNum('/N');
  const T = getNum('/T');
  const P = getNum('/P');
  const H = getArr2('/H');

  return {
    L, H, O, E, N, T, P,
  };
}

function extractStartXref(tail: string): number | null {
  // pattern:
  // startxref
  // 12345
  const m = tail.match(/startxref\s+(\d+)\s+/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function countOccurrences(s: string, sub: string): number {
  if (!sub) return 0;
  let c = 0;
  let i = 0;
  while (true) {
    const j = s.indexOf(sub, i);
    if (j < 0) break;
    c++;
    i = j + sub.length;
  }
  return c;
}

/* =============================================================================
 * Minimal dict parser helpers (same philosophy as encryption tool)
 * ============================================================================= */

function bytesToLatin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function extractFirstDictText(s: string): string | null {
  const start = s.indexOf('<<');
  if (start < 0) return null;

  let i = start;
  let depth = 0;

  while (i < s.length - 1) {
    if (s[i] === '<' && s[i + 1] === '<') {
      depth++;
      i += 2;
      continue;
    }
    if (s[i] === '>' && s[i + 1] === '>') {
      depth--;
      i += 2;
      if (depth === 0) return s.slice(start, i);
      continue;
    }
    i++;
  }
  return null;
}

function extractDictValueRaw(dictText: string, key: string): string | null {
  const idx = dictText.indexOf(key);
  if (idx < 0) return null;

  let i = idx + key.length;
  while (i < dictText.length && isWs(dictText[i])) i++;

  // array
  if (dictText[i] === '[') {
    const end = dictText.indexOf(']', i);
    if (end < 0) return null;
    return dictText.slice(i, end + 1).trim();
  }

  // dict
  if (dictText[i] === '<' && dictText[i + 1] === '<') {
    const sub = extractFirstDictText(dictText.slice(i));
    return sub ?? null;
  }

  // number token (or name)
  const start = i;
  while (i < dictText.length) {
    const c = dictText[i];
    if (c === '/' || (c === '>' && dictText[i + 1] === '>') || isWs(c)) break;
    i++;
  }
  const raw = dictText.slice(start, i).trim();

  // if ended on ws, also allow reading next token if current empty
  if (!raw) {
    while (i < dictText.length && isWs(dictText[i])) i++;
    const s2 = i;
    while (i < dictText.length) {
      const c = dictText[i];
      if (c === '/' || (c === '>' && dictText[i + 1] === '>') || isWs(c)) break;
      i++;
    }
    return dictText.slice(s2, i).trim() || null;
  }

  return raw || null;
}

function toIntOrNull(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw.trim().split(/\s+/)[0]);
  return Number.isFinite(n) ? n : null;
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f';
}

function clampInt(v: number, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
