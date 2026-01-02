import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

type PermissionId =
  | 'print'
  | 'printHighQuality'
  | 'modify'
  | 'copy'
  | 'annotate'
  | 'fillForms'
  | 'accessibility'
  | 'assemble';

interface PermissionInfo {
  id: PermissionId;
  label: string;
  allowed: boolean | null; // null => unknown
  bit?: number;
}

interface EncryptionInfo {
  encrypted: boolean;
  trailerEncrypt?: string | null; // raw value like "12 0 R" or "<<...>>"
  encryptDictResolved?: boolean;

  filter?: string | null; // /Standard, /Adobe.PubSec etc
  subFilter?: string | null;

  v?: number | null;
  r?: number | null;
  keyLengthBits?: number | null; // /Length

  encryptMetadata?: boolean | null;

  // Standard security strings presence (no need to dump contents)
  hasO?: boolean | null;
  hasU?: boolean | null;
  hasOE?: boolean | null;
  hasUE?: boolean | null;
  hasPerms?: boolean | null;

  pRaw?: number | null; // /P
  permissions: PermissionInfo[];

  notes: string[];
}

@Component({
  selector: 'app-pdf-encryption-check-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PdfToolShellComponent,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-encryption-check-tool.component.html',
  styleUrl: './pdf-encryption-check-tool.component.scss',
})
export class PdfEncryptionCheckToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_enc_title:Chiffrement & permissions PDF`,
    subtitle: $localize`:@@pdf_enc_subtitle:Détectez si un PDF est chiffré, identifiez le type de protection et lisez les permissions (impression, copie, modification…) — localement dans le navigateur.`,
    errTitle: $localize`:@@pdf_enc_err_title:Impossible d’analyser le chiffrement.`,
    errGeneric: $localize`:@@pdf_enc_err_generic:Impossible de lire ce PDF.`,
    tipPrivacy: $localize`:@@pdf_enc_tip_privacy:Tout se fait localement dans votre navigateur (aucun upload).`,
    tipPwd: $localize`:@@pdf_enc_tip_pwd:Astuce : si le PDF est chiffré, certains outils d’extraction échoueront sans mot de passe.`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_enc_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_enc_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_enc_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_enc_btn_download:Télécharger`,

    placeholderFilter: $localize`:@@pdf_enc_filter_placeholder:Filtrer (permission, print, copy, Standard, V/R, …)`,

    statusLoading: $localize`:@@pdf_enc_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_enc_status_ready:Prêt`,
    statusError: $localize`:@@pdf_enc_status_error:Erreur`,

    importTitle: $localize`:@@pdf_enc_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_enc_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_enc_card_results_title:Diagnostic`,
    resultsSub: $localize`:@@pdf_enc_card_results_sub:Chiffrement détecté + permissions déclarées.`,

    jsonTitle: $localize`:@@pdf_enc_json_title:JSON`,
    jsonSub: $localize`:@@pdf_enc_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_enc_left_title:Résumé`,
    emptyText: $localize`:@@pdf_enc_empty:Aucune donnée à afficher.`,
    backText: $localize`:@@pdf_enc_back:← Retour aux outils PDF`,
  };

  // ---- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);

  readonly info = signal<EncryptionInfo | null>(null);

  // ---- form
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeRawTrailerEncrypt: this.fb.nonNullable.control(false),
    includeNotes: this.fb.nonNullable.control(true),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly includeRawTrailerEncrypt = controlToSignal(this.form.controls.includeRawTrailerEncrypt);
  readonly includeNotes = controlToSignal(this.form.controls.includeNotes);

  readonly filteredPermissions = computed(() => {
    const i = this.info();
    if (!i) return [];

    const f = (this.filter() ?? '').trim().toLowerCase();
    if (!f) return i.permissions;

    return i.permissions.filter(p => `${p.id} ${p.label} ${p.allowed}`.toLowerCase().includes(f));
  });

  readonly statsCards = computed((): PdfToolStatCard[] => {
    const i = this.info();
    if (!i) return [];

    const enc = i.encrypted ? $localize`:@@pdf_enc_yes:Oui` : $localize`:@@pdf_enc_no:Non`;
    const filter = i.filter ? i.filter.replace(/^\//, '') : '—';
    const vr = i.v != null || i.r != null ? `V=${i.v ?? '—'} R=${i.r ?? '—'}` : '—';

    return [
      { label: $localize`:@@pdf_enc_stat_encrypted:Chiffré`, value: enc },
      { label: $localize`:@@pdf_enc_stat_filter:Filter`, value: filter },
      { label: $localize`:@@pdf_enc_stat_vr:V/R`, value: vr },
      { label: $localize`:@@pdf_enc_stat_keylen:Clé`, value: i.keyLengthBits ? `${i.keyLengthBits}b` : '—' },
    ];
  });

  readonly jsonObject = computed(() => {
    const i = this.info();
    if (!i) return null;

    const includeRaw = this.includeRawTrailerEncrypt();
    const includeNotes = this.includeNotes();

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _note: this.ui.tipPrivacy,

      encrypted: i.encrypted,

      encrypt: {
        // raw trailer value optional
        trailerEncrypt: includeRaw ? (i.trailerEncrypt ?? null) : undefined,
        encryptDictResolved: i.encryptDictResolved ?? false,

        filter: i.filter ?? null,
        subFilter: i.subFilter ?? null,

        V: i.v ?? null,
        R: i.r ?? null,
        keyLengthBits: i.keyLengthBits ?? null,
        encryptMetadata: i.encryptMetadata ?? null,

        hasUserPasswordEntry: i.hasU ?? null,
        hasOwnerPasswordEntry: i.hasO ?? null,
        hasOE: i.hasOE ?? null,
        hasUE: i.hasUE ?? null,
        hasPerms: i.hasPerms ?? null,

        P: i.pRaw ?? null,
      },

      permissions: i.permissions.map(p => ({
        id: p.id,
        label: p.label,
        allowed: p.allowed,
        bit: p.bit ?? null,
      })),

      notes: includeNotes ? i.notes : undefined,
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
    this.info.set(null);

    try {
      const buffer = await file.arrayBuffer();
      const res = analyzePdfEncryption(buffer);
      this.info.set(res);

      this.status.set('ready');
      this.tipMessage.set(this.ui.tipPwd);
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
    this.info.set(null);

    this.form.patchValue({
      pretty: true,
      filter: '',
      includeRawTrailerEncrypt: false,
      includeNotes: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_enc_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_enc_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`);
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-encryption-check') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  // helper for template
  permissionBadgeSeverity(p: PermissionInfo): 'success' | 'danger' | 'warn' {
    if (p.allowed === true) return 'success';
    if (p.allowed === false) return 'danger';
    return 'warn';
  }
}

/* =============================================================================
 * Core: encryption detection (best-effort, no password, client-side)
 * ============================================================================= */

function analyzePdfEncryption(buffer: ArrayBuffer): EncryptionInfo {
  const bytes = new Uint8Array(buffer);

  // latin1-ish string (no utf8 decoding assumptions)
  const s = bytesToLatin1(bytes);

  const notes: string[] = [];
  const permissionsBase = defaultPermissionsUnknown();

  // 1) try trailer parse (last incremental update)
  const trailerDictText = extractLastTrailerDictText(s);
  let trailerEncryptRaw: string | null = null;

  if (trailerDictText) {
    trailerEncryptRaw = extractDictValueRaw(trailerDictText, '/Encrypt');
    if (trailerEncryptRaw) notes.push('Encrypt trouvé dans le trailer.');
    else notes.push('Trailer trouvé, mais pas de /Encrypt.');
  } else {
    notes.push('Trailer non trouvé (fallback scan).');
  }

  // 2) fallback scan for /Encrypt in file
  const encryptedByScan = /\/Encrypt\b/.test(s);
  const encrypted = !!trailerEncryptRaw || encryptedByScan;

  if (!encrypted) {
    return {
      encrypted: false,
      trailerEncrypt: null,
      encryptDictResolved: false,
      filter: null,
      subFilter: null,
      v: null,
      r: null,
      keyLengthBits: null,
      encryptMetadata: null,
      hasO: null,
      hasU: null,
      hasOE: null,
      hasUE: null,
      hasPerms: null,
      pRaw: null,
      permissions: permissionsBase,
      notes,
    };
  }

  // If we have /Encrypt value, try resolve dict
  let encryptDictText: string | null = null;
  let encryptDictResolved = false;

  if (trailerEncryptRaw) {
    const ref = parseRef(trailerEncryptRaw);
    if (ref) {
      encryptDictText = findObjectDictText(s, ref.obj, ref.gen);
      if (encryptDictText) {
        encryptDictResolved = true;
        notes.push(`Encrypt dict résolu via ref ${ref.obj} ${ref.gen} R.`);
      } else {
        notes.push(`Ref Encrypt ${ref.obj} ${ref.gen} R non résolue (objet introuvable).`);
      }
    } else if (trailerEncryptRaw.trim().startsWith('<<')) {
      encryptDictText = extractFirstDictText(trailerEncryptRaw.trim());
      encryptDictResolved = !!encryptDictText;
      notes.push('Encrypt dict inline (dans trailer) détecté.');
    } else {
      notes.push('Valeur /Encrypt du trailer non interprétable.');
    }
  }

  // If not resolved, try “best effort” scan: find first Encrypt dict after keyword
  if (!encryptDictText) {
    const idx = s.lastIndexOf('/Encrypt');
    if (idx >= 0) {
      const around = s.slice(Math.max(0, idx), Math.min(s.length, idx + 5000));
      const dict = extractFirstDictText(around);
      if (dict) {
        encryptDictText = dict;
        encryptDictResolved = false;
        notes.push('Encrypt dict deviné via scan (moins fiable).');
      }
    }
  }

  // Extract fields
  const filter = encryptDictText ? normalizeName(extractDictValueRaw(encryptDictText, '/Filter')) : null;
  const subFilter = encryptDictText ? normalizeName(extractDictValueRaw(encryptDictText, '/SubFilter')) : null;

  const v = encryptDictText ? toIntOrNull(extractDictValueRaw(encryptDictText, '/V')) : null;
  const r = encryptDictText ? toIntOrNull(extractDictValueRaw(encryptDictText, '/R')) : null;
  const keyLengthBits = encryptDictText ? toIntOrNull(extractDictValueRaw(encryptDictText, '/Length')) : null;

  const encryptMetadata = encryptDictText ? toBoolOrNull(extractDictValueRaw(encryptDictText, '/EncryptMetadata')) : null;

  const hasO = encryptDictText ? containsKey(encryptDictText, '/O') : null;
  const hasU = encryptDictText ? containsKey(encryptDictText, '/U') : null;
  const hasOE = encryptDictText ? containsKey(encryptDictText, '/OE') : null;
  const hasUE = encryptDictText ? containsKey(encryptDictText, '/UE') : null;
  const hasPerms = encryptDictText ? containsKey(encryptDictText, '/Perms') : null;

  const pRaw = encryptDictText ? toIntOrNull(extractDictValueRaw(encryptDictText, '/P')) : null;

  const permissions = pRaw != null ? decodePermissionsFromP(pRaw, r) : permissionsBase;

  // Add a pragmatic note about weakness of permissions flags
  notes.push('Les permissions déclarées (/P) ne sont pas une sécurité forte : certaines apps peuvent les ignorer.');

  return {
    encrypted: true,
    trailerEncrypt: trailerEncryptRaw,
    encryptDictResolved,

    filter,
    subFilter,
    v,
    r,
    keyLengthBits,
    encryptMetadata,

    hasO,
    hasU,
    hasOE,
    hasUE,
    hasPerms,

    pRaw,
    permissions,
    notes,
  };
}

/* =============================================================================
 * Permissions decoding
 * ============================================================================= */

function defaultPermissionsUnknown(): PermissionInfo[] {
  return [
    { id: 'print', label: 'Impression', allowed: null, bit: 0x0004 },
    { id: 'printHighQuality', label: 'Impression haute qualité', allowed: null, bit: 0x0800 },
    { id: 'modify', label: 'Modification', allowed: null, bit: 0x0008 },
    { id: 'copy', label: 'Copie / extraction', allowed: null, bit: 0x0010 },
    { id: 'annotate', label: 'Annotations / commentaires', allowed: null, bit: 0x0020 },
    { id: 'fillForms', label: 'Remplissage formulaires', allowed: null, bit: 0x0100 },
    { id: 'accessibility', label: 'Extraction accessibilité', allowed: null, bit: 0x0200 },
    { id: 'assemble', label: 'Assemblage du document', allowed: null, bit: 0x0400 },
  ];
}

function decodePermissionsFromP(p: number, r: number | null): PermissionInfo[] {
  // P is a signed 32-bit integer in PDF; normalize to uint32 for bit tests
  const u = p >>> 0;

  const bit = (mask: number) => (u & mask) === mask;

  // Bits per PDF spec:
  // 0x0004 print (r2+), 0x0008 modify, 0x0010 copy, 0x0020 annotate
  // 0x0100 fill, 0x0200 accessibility, 0x0400 assemble, 0x0800 high quality print (r3+)
  const printAllowed = bit(0x0004);
  const modifyAllowed = bit(0x0008);
  const copyAllowed = bit(0x0010);
  const annotateAllowed = bit(0x0020);

  const fillAllowed = bit(0x0100);
  const accessibilityAllowed = bit(0x0200);
  const assembleAllowed = bit(0x0400);

  // High quality print introduced with revision >= 3 (128-bit+); if unknown, still show bit
  const hqPrintAllowed = bit(0x0800);

  return [
    { id: 'print', label: 'Impression', allowed: printAllowed, bit: 0x0004 },
    { id: 'printHighQuality', label: 'Impression haute qualité', allowed: r != null && r < 3 ? null : hqPrintAllowed, bit: 0x0800 },
    { id: 'modify', label: 'Modification', allowed: modifyAllowed, bit: 0x0008 },
    { id: 'copy', label: 'Copie / extraction', allowed: copyAllowed, bit: 0x0010 },
    { id: 'annotate', label: 'Annotations / commentaires', allowed: annotateAllowed, bit: 0x0020 },
    { id: 'fillForms', label: 'Remplissage formulaires', allowed: fillAllowed, bit: 0x0100 },
    { id: 'accessibility', label: 'Extraction accessibilité', allowed: accessibilityAllowed, bit: 0x0200 },
    { id: 'assemble', label: 'Assemblage du document', allowed: assembleAllowed, bit: 0x0400 },
  ];
}

/* =============================================================================
 * Minimal PDF text parsing helpers (best-effort)
 * ============================================================================= */

function bytesToLatin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function extractLastTrailerDictText(s: string): string | null {
  // We want last occurrence of "trailer" then parse first "<<...>>" after it.
  const idx = s.lastIndexOf('trailer');
  if (idx < 0) return null;
  const after = s.slice(idx + 'trailer'.length);

  const dict = extractFirstDictText(after);
  return dict;
}

function extractFirstDictText(s: string): string | null {
  const start = s.indexOf('<<');
  if (start < 0) return null;

  // naive balanced parse for << >>
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

  // fallback: return chunk if not balanced
  return null;
}

function extractDictValueRaw(dictText: string, key: string): string | null {
  // dictText like "<< /Key value /Other ... >>"
  const idx = dictText.indexOf(key);
  if (idx < 0) return null;

  // Move after key
  let i = idx + key.length;

  // skip ws
  while (i < dictText.length && isWs(dictText[i])) i++;

  // If value starts with '<<' return that dict
  if (dictText[i] === '<' && dictText[i + 1] === '<') {
    const sub = extractFirstDictText(dictText.slice(i));
    return sub ?? null;
  }

  // If value is ref like "12 0 R"
  // Read until delimiter (/ or >>)
  let start = i;
  while (i < dictText.length) {
    const c = dictText[i];
    if (c === '/' || (c === '>' && dictText[i + 1] === '>')) break;
    i++;
  }
  const raw = dictText.slice(start, i).trim();
  return raw || null;
}

function parseRef(raw: string): { obj: number; gen: number } | null {
  // "12 0 R"
  const m = raw.trim().match(/^(\d+)\s+(\d+)\s+R\b/);
  if (!m) return null;
  return { obj: Number(m[1]), gen: Number(m[2]) };
}

function findObjectDictText(s: string, obj: number, gen: number): string | null {
  // find "obj gen obj" sequence
  const needle = `${obj} ${gen} obj`;
  const idx = s.lastIndexOf(needle);
  if (idx < 0) return null;

  const after = s.slice(idx + needle.length);
  const dict = extractFirstDictText(after);
  return dict;
}

function normalizeName(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  // If it's a name like /Standard
  if (t.startsWith('/')) return t;
  return t || null;
}

function toIntOrNull(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw.trim().split(/\s+/)[0]);
  return Number.isFinite(n) ? n : null;
}

function toBoolOrNull(raw: string | null): boolean | null {
  if (!raw) return null;
  const t = raw.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  return null;
}

function containsKey(dictText: string, key: string): boolean {
  return dictText.indexOf(key) >= 0;
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f';
}
