import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

import {
  PdfToolShellComponent,
  type PdfToolShellUi,
  type PdfToolStatCard,
  type PdfToolStatus,
} from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';

type SourceInfo = {
  name: string;
  bytes: number;
  mime: string;
};

type FlattenField = {
  name: string;
  type: string;
  value: string | boolean | number | null;
};

type FlattenReport = {
  source: SourceInfo;
  outputFileName: string;
  outputBytes: number;
  fieldsDetected: number;
  fieldsMapped: number;
  fields: FlattenField[];
  notes: string[];
};

type FlattenOutput = {
  index: number;
  fileName: string;
  bytes: number;
  fieldsCount: number | null;
  blob: Blob;
};

@Component({
  selector: 'app-pdf-flatten-form-tool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    PdfToolShellComponent,

    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-flatten-form-tool.component.html',
  styleUrl: './pdf-flatten-form-tool.component.scss',
})
export class PdfFlattenFormToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_flatten_title:Aplatir un formulaire PDF`,
    subtitle: $localize`:@@pdf_flatten_subtitle:Convertir les champs de formulaire en contenu statique (flatten), pour partage/archivage. Tout se fait localement dans votre navigateur.`,
    errGeneric: $localize`:@@pdf_flatten_err_generic:Une erreur est survenue.`,
    tipPrivacy: $localize`:@@pdf_flatten_tip_privacy:Aucun upload : vos fichiers restent sur votre appareil.`,
    tipSign: $localize`:@@pdf_flatten_tip_sign:Après “flatten”, les champs ne sont plus éditables. Conservez l’original si vous devez garder un formulaire modifiable.`,
  };

  // ✅ Conforme au shell : importTitle/importSub requis, stats label/value, fileSize number
  readonly uiShell: PdfToolShellUi = {
    importTitle: $localize`:@@pdf_flatten_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_flatten_import_sub:Choisissez un PDF contenant des champs de formulaire (rempli ou non).`,

    btnPick: $localize`:@@pdf_flatten_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_flatten_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_flatten_btn_copy:Copier le mapping`,
    btnDownload: $localize`:@@pdf_flatten_btn_download:Télécharger en ZIP`,
    placeholderFilter: $localize`:@@pdf_flatten_filter_placeholder:Filtrer (nom, champs…)`,

    statusLoading: $localize`:@@pdf_flatten_status_loading:Traitement…`,
    statusReady: $localize`:@@pdf_flatten_status_ready:Prêt`,
    statusError: $localize`:@@pdf_flatten_status_error:Erreur`,

    resultsTitle: $localize`:@@pdf_flatten_results_title:Résultat`,
    resultsSub: $localize`:@@pdf_flatten_results_sub:PDF aplati + mapping des champs (audit/traçabilité).`,

    jsonTitle: $localize`:@@pdf_flatten_json_title:Mapping JSON`,
    jsonSub: $localize`:@@pdf_flatten_json_sub:Champs détectés et valeurs (avant flatten).`,

    leftTitle: $localize`:@@pdf_flatten_left_title:Fichier généré`,
    emptyText: $localize`:@@pdf_flatten_empty:Aucun fichier généré.`,

    backText: $localize`:@@pdf_flatten_back:← Retour aux outils PDF`,
  };

  // ---------------- state
  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>(this.ui.tipPrivacy);

  readonly sourceFile = signal<File | null>(null);
  readonly sourceInfo = signal<SourceInfo | null>(null);

  readonly outputs = signal<FlattenOutput[]>([]);
  readonly report = signal<FlattenReport | null>(null);

  // ---------------- form
  readonly form = this.fb.nonNullable.group({
    pretty: this.fb.nonNullable.control(true),
    includeEmpty: this.fb.nonNullable.control(false),
    filter: this.fb.nonNullable.control(''),
    filePrefix: this.fb.nonNullable.control('flattened'),
  });

  // ---------------- derived
  readonly fileName = computed(() => this.sourceInfo()?.name ?? '');
  readonly fileSize = computed(() => this.sourceInfo()?.bytes ?? 0); // ✅ shell veut des bytes (number)

  readonly showResults = computed(() =>
    !!this.sourceFile() || this.status() === 'loading' || this.status() === 'ready' || this.status() === 'error'
  );

  readonly filteredOutputs = computed(() => {
    const q = (this.form.controls.filter.value || '').trim().toLowerCase();
    const all = this.outputs();
    if (!q) return all;

    return all.filter(o => {
      const nameOk = o.fileName.toLowerCase().includes(q);
      const fieldsOk = (o.fieldsCount ?? 0).toString().includes(q);
      return nameOk || fieldsOk;
    });
  });

  readonly downloadDisabled = computed(() => this.status() !== 'ready' || this.outputs().length === 0);

  readonly statsCards = computed<PdfToolStatCard[]>(() => {
    const info = this.sourceInfo();
    const rep = this.report();

    const inVal = info ? `${fmtMb(info.bytes)} • ${info.mime}` : $localize`:@@pdf_flatten_stat_in_empty:—`;
    const outVal = rep ? `${fmtMb(rep.outputBytes)} • ${rep.outputFileName}` : $localize`:@@pdf_flatten_stat_out_empty:—`;
    const fieldsVal = rep ? `${rep.fieldsDetected} / ${rep.fieldsMapped}` : '—';

    return [
      { label: $localize`:@@pdf_flatten_stat_in_label:Entrée`, value: inVal },
      { label: $localize`:@@pdf_flatten_stat_out_label:Sortie`, value: outVal },
      { label: $localize`:@@pdf_flatten_stat_fields_label:Champs (détectés/exportés)`, value: fieldsVal },
    ];
  });

  readonly jsonText = computed(() => {
    const rep = this.report();
    if (!rep) return '';

    const payload = {
      tool: 'pdf-flatten-form',
      source: rep.source,
      output: { fileName: rep.outputFileName, bytes: rep.outputBytes },
      counts: { detected: rep.fieldsDetected, mapped: rep.fieldsMapped },
      fields: rep.fields,
      notes: rep.notes,
    };

    return this.form.controls.pretty.value
      ? JSON.stringify(payload, null, 2)
      : JSON.stringify(payload);
  });

  readonly shellErrorMessage = computed(() => (this.status() === 'error' ? (this.errorMessage() || this.ui.errGeneric) : ''));

  // ---------------- handlers
  onFileSelected(file: File) {
    if (!file) return;
    this.reset(false);

    this.sourceFile.set(file);
    this.sourceInfo.set({
      name: file.name,
      bytes: file.size,
      mime: file.type || 'application/pdf',
    });

    this.tipMessage.set(this.ui.tipPrivacy);
  }

  // ---------------- main action
  async flattenNow() {
    const file = this.sourceFile();
    const info = this.sourceInfo();

    if (!file || !info) {
      this.tipMessage.set($localize`:@@pdf_flatten_need_file:Choisissez d’abord un PDF.`);
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: false });

      // 1) mapping avant flatten (lecture valeurs)
      const fields = readFormFieldsSafe(doc);

      const includeEmpty = this.form.controls.includeEmpty.value;
      const mapped = includeEmpty ? fields : fields.filter(f => !isEmptyFieldValue(f.value));

      // 2) flatten
      doc.getForm().flatten();

      // 3) sortie PDF
      const outU8 = await doc.save();

// ✅ force un ArrayBuffer classique (pas SharedArrayBuffer)
      const outBuf = Uint8Array.from(outU8).buffer;

      const outBlob = new Blob([outBuf], { type: 'application/pdf' });

      const outputFileName = buildFlattenedName(info.name, this.form.controls.filePrefix.value);

      const out: FlattenOutput = {
        index: 1,
        fileName: outputFileName,
        bytes: outU8.byteLength,
        fieldsCount: fields.length,
        blob: outBlob,
      };

      const notes: string[] = [this.ui.tipSign];
      if (fields.length === 0) {
        notes.push($localize`:@@pdf_flatten_note_no_fields:Aucun champ de formulaire détecté (PDF peut être “plat”/scanné).`);
      }

      this.outputs.set([out]);
      this.report.set({
        source: info,
        outputFileName,
        outputBytes: outU8.byteLength,
        fieldsDetected: fields.length,
        fieldsMapped: mapped.length,
        fields: mapped,
        notes,
      });

      this.status.set('ready');
      this.tipMessage.set($localize`:@@pdf_flatten_done:PDF aplati prêt. Téléchargez le PDF ou le ZIP (PDF + mapping).`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch (e: any) {
      this.errorMessage.set(e?.message || this.ui.errGeneric);
      this.status.set('error');
      this.tipMessage.set($localize`:@@pdf_flatten_fail:Impossible d’aplatir ce PDF.`);
    }
  }

  downloadOne(o: FlattenOutput) {
    if (this.status() !== 'ready') return;

    try {
      downloadBlob(o.blob, o.fileName);
      this.tipMessage.set($localize`:@@pdf_flatten_downloading_one:Téléchargement du PDF lancé.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2000);
    } catch {
      this.tipMessage.set($localize`:@@pdf_flatten_download_one_fail:Impossible de télécharger ce fichier.`);
    }
  }

  async downloadZip() {
    if (this.status() !== 'ready') return;

    const rep = this.report();
    const outs = this.outputs();
    if (!rep || outs.length === 0) return;

    try {
      const zip = new JSZip();

      // PDF
      const first = outs[0];
      zip.file(first.fileName, first.blob);

      // JSON mapping
      zip.file('mapping.json', this.jsonText());

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = buildZipName(rep.source.name, this.form.controls.filePrefix.value);
      downloadBlob(zipBlob, zipName);

      this.tipMessage.set($localize`:@@pdf_flatten_zip_downloading:Téléchargement du ZIP lancé.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2000);
    } catch (e: any) {
      this.tipMessage.set($localize`:@@pdf_flatten_zip_fail:Impossible de générer le ZIP.`);
      this.errorMessage.set(e?.message || this.ui.errGeneric);
      this.status.set('error');
    }
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_flatten_copied:Mapping JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(this.ui.tipPrivacy), 2500);
    } catch {
      this.tipMessage.set($localize`:@@pdf_flatten_copy_fail:Impossible de copier automatiquement. Copiez manuellement le JSON.`);
    }
  }

  reset(clearFile = true) {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set(this.ui.tipPrivacy);

    this.outputs.set([]);
    this.report.set(null);
    this.form.controls.filter.setValue('');

    if (clearFile) {
      this.sourceFile.set(null);
      this.sourceInfo.set(null);
    }
  }
}

// =============================================================================
// Helpers
// =============================================================================

function isEmptyFieldValue(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  return false;
}

function readFormFieldsSafe(doc: PDFDocument): FlattenField[] {
  try {
    const form = doc.getForm();
    const fields = form.getFields();

    return fields.map(f => {
      const name = f.getName();

      let type = 'unknown';
      let value: any = null;

      const anyField: any = f as any;
      const ctorName = (anyField?.constructor?.name || '').toLowerCase();

      if (ctorName.includes('text')) type = 'text';
      else if (ctorName.includes('checkbox')) type = 'checkbox';
      else if (ctorName.includes('dropdown')) type = 'dropdown';
      else if (ctorName.includes('optionlist')) type = 'optionlist';
      else if (ctorName.includes('radio')) type = 'radio';
      else if (ctorName.includes('button')) type = 'button';
      else if (ctorName.includes('signature')) type = 'signature';

      if (typeof anyField.getText === 'function') value = anyField.getText();
      else if (typeof anyField.isChecked === 'function') value = !!anyField.isChecked();
      else if (typeof anyField.getSelected === 'function') value = anyField.getSelected();
      else if (typeof anyField.getValue === 'function') value = anyField.getValue();

      if (Array.isArray(value)) value = value.join(', ');
      if (typeof value === 'object' && value != null) value = JSON.stringify(value);

      return { name, type, value: value ?? null };
    });
  } catch {
    return [];
  }
}

function buildFlattenedName(originalName: string, prefix: string): string {
  const base = stripExt(originalName);
  const safePrefix = (prefix || 'flattened').trim() || 'flattened';
  return `${safePrefix}_${sanitizeFileName(base)}.pdf`;
}

function buildZipName(originalName: string, prefix: string): string {
  const base = stripExt(originalName);
  const safePrefix = (prefix || 'flattened').trim() || 'flattened';
  return `${safePrefix}_${sanitizeFileName(base)}.zip`;
}

function stripExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i <= 0) return name;
  return name.slice(0, i);
}

function sanitizeFileName(s: string): string {
  return (s || 'file')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
