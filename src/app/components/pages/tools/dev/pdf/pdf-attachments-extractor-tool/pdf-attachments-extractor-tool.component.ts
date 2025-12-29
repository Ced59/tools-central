import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

import { extractPdfAttachments, type PdfAttachmentItem } from './pdf-attachments-extractor';
import { buildZipStore } from './zip-store';

@Component({
  selector: 'app-pdf-attachments-extractor-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-attachments-extractor-tool.component.html',
  styleUrl: './pdf-attachments-extractor-tool.component.scss',
})
export class PdfAttachmentsExtractorToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_att_title:Pièces jointes PDF → JSON`,
    subtitle: $localize`:@@pdf_att_subtitle:Détectez et extrayez les fichiers embarqués dans un PDF (EmbeddedFiles) et exportez la liste en JSON. Téléchargez chaque fichier ou tout en ZIP, localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_att_err_title:Impossible d’extraire les pièces jointes.`,
    tipNone: $localize`:@@pdf_att_tip_none:Aucune pièce jointe détectée dans ce PDF.`,
    tipZip: $localize`:@@pdf_att_tip_zip:ZIP généré. Téléchargement lancé.`,
    tipDownloaded: $localize`:@@pdf_att_tip_downloaded:Fichier téléchargé.`,
    btnDownloadAll: $localize`:@@pdf_att_btn_download_all:Télécharger tout (ZIP)`,
    btnDownloadOne: $localize`:@@pdf_att_btn_download_one:Télécharger`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_att_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_att_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_att_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_att_btn_download:JSON`,
    placeholderFilter: $localize`:@@pdf_att_filter_placeholder:Filtrer (nom, type, taille…)`,

    statusLoading: $localize`:@@pdf_att_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_att_status_ready:Prêt`,
    statusError: $localize`:@@pdf_att_status_error:Erreur`,

    importTitle: $localize`:@@pdf_att_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_att_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_att_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_att_card_results_sub:Liste des pièces jointes (EmbeddedFiles) + export JSON + téléchargements.`,

    jsonTitle: $localize`:@@pdf_att_json_title:JSON`,
    jsonSub: $localize`:@@pdf_att_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_att_list_title:Fichiers`,
    emptyText: $localize`:@@pdf_att_empty:Aucune pièce jointe à afficher.`,
    backText: $localize`:@@pdf_att_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly attachments = signal<PdfAttachmentItem[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeRaw: this.fb.nonNullable.control(false),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly includeRaw = controlToSignal(this.form.controls.includeRaw);

  trackById = (_: number, it: PdfAttachmentItem) => it.id;

  readonly filtered = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.attachments();
    if (!f) return all;

    return all.filter(a => {
      const blob = [
        a.displayName,
        a.keyName ?? '',
        a.description ?? '',
        a.mime ?? '',
        `${a.size}`,
      ].join(' ').toLowerCase();
      return blob.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.attachments();
    const totalBytes = all.reduce((acc, a) => acc + (a.size ?? 0), 0);
    const withMime = all.filter(a => !!a.mime).length;

    return {
      pages: this.pageCount(),
      files: all.length,
      withMime,
      totalBytes,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_att_stat_pages:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_att_stat_files:Fichiers`, value: this.stats().files },
    { label: $localize`:@@pdf_att_stat_total_size:Taille`, value: formatBytes(this.stats().totalBytes) },
    { label: $localize`:@@pdf_att_stat_mime:MIME`, value: this.stats().withMime },
  ]);

  readonly jsonObject = computed(() => {
    const items = this.filtered().map(a => ({
      id: a.id,
      displayName: a.displayName,
      keyName: a.keyName ?? null,
      description: a.description ?? null,
      mime: a.mime ?? null,
      size: a.size,
      checksum: a.checksum ?? null,
      creationDate: a.creationDate ?? null,
      modDate: a.modDate ?? null,
      raw: this.includeRaw() ? (a.raw ?? null) : undefined,
    }));

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      attachments: items,
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
    this.attachments.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const res = await extractPdfAttachments(doc, {
        includeBytes: true,              // needed for download/zip
        includeRaw: this.includeRaw(),
      });

      this.pageCount.set(res.pageCount);
      this.attachments.set(res.attachments);

      this.status.set('ready');

      if (res.attachments.length === 0) {
        this.tipMessage.set(this.ui.tipNone);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_att_err_generic:Impossible de lire ce PDF.`;

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
    this.attachments.set([]);
    this.form.patchValue({ filter: '', pretty: true, includeRaw: false });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_att_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_att_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
    }
  }

  downloadJson() {
    downloadBlob(
      new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' }),
      (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-attachments') + '.json'
    );
  }

  downloadOne(it: PdfAttachmentItem) {
    const bytes = it.bytes ?? null;
    if (!bytes || bytes.length === 0) return;

    const mime = it.mime ?? 'application/octet-stream';
    const filename = sanitizeName(it.displayName || 'attachment.bin');
    downloadBlob(blobFromBytes(bytes, mime), filename);

    this.tipMessage.set(this.ui.tipDownloaded);
    window.setTimeout(() => this.tipMessage.set(''), 1500);
  }

  downloadAllZip() {
    const files = this.attachments()
      .filter(a => (a.bytes?.length ?? 0) > 0)
      .map(a => ({
        name: uniqueName(a.displayName || 'attachment.bin'),
        data: a.bytes as Uint8Array,
        mtime: new Date(),
      }));

    if (files.length === 0) return;

    const zipBytes = buildZipStore(files);
    const zipName = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-attachments') + '-attachments.zip';
    downloadBlob(blobFromBytes(zipBytes, 'application/zip'), zipName);

    this.tipMessage.set(this.ui.tipZip);
    window.setTimeout(() => this.tipMessage.set(''), 2000);
  }
}

/* ---------------- helpers ---------------- */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function blobFromBytes(bytes: Uint8Array, mime: string): Blob {
  // ✅ TS-safe: BlobPart accepts Uint8Array, and we also ensure it's a standalone Uint8Array
  // to avoid SharedArrayBuffer / ArrayBufferLike typing issues in strict builds.
  const safe = new Uint8Array(bytes.byteLength);
  safe.set(bytes);
  return new Blob([safe], { type: mime });
}

function sanitizeName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 180);
}

const usedNames = new Map<string, number>();
function uniqueName(name: string): string {
  const clean = sanitizeName(name);
  const n = usedNames.get(clean) ?? 0;
  usedNames.set(clean, n + 1);
  if (n === 0) return clean;

  const dot = clean.lastIndexOf('.');
  if (dot > 0 && dot < clean.length - 1) {
    const base = clean.slice(0, dot);
    const ext = clean.slice(dot);
    return `${base} (${n + 1})${ext}`;
  }
  return `${clean} (${n + 1})`;
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
