import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { PDFDocument } from 'pdf-lib';

type ToolStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PdfMetadataItem {
  key: string;
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-pdf-metadata-to-json-tool',
  standalone: true,
  imports: [
    CommonModule, // ✅ NgIf, NgFor, number pipe
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './pdf-metadata-to-json-tool.component.html',
  styleUrl: './pdf-metadata-to-json-tool.component.scss',
})
export class PdfMetadataToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly fileInputId = 'pdf-meta-file-input';

  // ---- UI labels (pas de $localize dans le template)
  readonly ui = {
    btnPick: $localize`:@@pdf_meta_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_meta_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_meta_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_meta_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_meta_filter_placeholder:Filtrer (titre, auteur, date…)`,
    statusLoading: $localize`:@@pdf_meta_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_meta_status_ready:Prêt`,
    statusError: $localize`:@@pdf_meta_status_error:Erreur`,
    tipMissing: $localize`:@@pdf_meta_tip_missing:Certaines métadonnées sont vides : c’est normal, beaucoup de PDFs n’en définissent pas.`,
    copied: $localize`:@@pdf_meta_copied:JSON copié dans le presse-papiers.`,
    copyFail: $localize`:@@pdf_meta_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`,
    errGeneric: $localize`:@@pdf_meta_err_generic:Impossible de lire ce PDF.`,
  };

  // ---- State ----
  readonly status = signal<ToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);

  readonly pageCount = signal<number>(0);
  readonly isEncrypted = signal<boolean>(false);

  readonly metadata = signal<PdfMetadataItem[]>([]);

  // ---- Form ----
  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
  });

  readonly filter = computed(() => (this.form.value.filter ?? '').trim().toLowerCase());
  readonly pretty = computed(() => !!this.form.value.pretty);

  // ---- Derived ----
  readonly filteredMetadata = computed(() => {
    const f = this.filter();
    const items = this.metadata();
    if (!f) return items;

    return items.filter(it => {
      const v = (it.value ?? '').toLowerCase();
      return it.key.toLowerCase().includes(f) || it.label.toLowerCase().includes(f) || v.includes(f);
    });
  });

  readonly jsonObject = computed((): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};

    for (const it of this.metadata()) obj[it.key] = it.value ?? null;

    // ✅ index signature strict : accès par []
    obj['_pageCount'] = this.pageCount();
    obj['_fileName'] = this.fileName() || null;
    obj['_fileSize'] = this.fileSize();

    return obj;
  });

  readonly jsonText = computed(() => {
    return JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0);
  });

  readonly stats = computed(() => {
    const all = this.metadata().length;
    const filled = this.metadata().filter(m => (m.value ?? '').trim().length > 0).length;
    return {
      totalKeys: all,
      filledKeys: filled,
      emptyKeys: all - filled,
      pages: this.pageCount(),
    };
  });

  // ---- Actions ----
  triggerFilePick() {
    const el = document.getElementById(this.fileInputId) as HTMLInputElement | null;
    el?.click();
  }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow reselect
    if (!file) return;

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.metadata.set([]);
    this.pageCount.set(0);
    this.isEncrypted.set(false);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      this.pageCount.set(doc.getPageCount());

      const items: PdfMetadataItem[] = [
        { key: 'title', label: $localize`:@@pdf_meta_k_title:Titre`, value: safeStr(doc.getTitle?.()) },
        { key: 'author', label: $localize`:@@pdf_meta_k_author:Auteur`, value: safeStr(doc.getAuthor?.()) },
        { key: 'subject', label: $localize`:@@pdf_meta_k_subject:Sujet`, value: safeStr(doc.getSubject?.()) },
        { key: 'keywords', label: $localize`:@@pdf_meta_k_keywords:Mots-clés`, value: safeStr(doc.getKeywords?.()) },
        { key: 'creator', label: $localize`:@@pdf_meta_k_creator:Créateur`, value: safeStr(doc.getCreator?.()) },
        { key: 'producer', label: $localize`:@@pdf_meta_k_producer:Producteur`, value: safeStr(doc.getProducer?.()) },
        { key: 'creationDate', label: $localize`:@@pdf_meta_k_creation:Date de création`, value: fmtDate(doc.getCreationDate?.()) },
        { key: 'modificationDate', label: $localize`:@@pdf_meta_k_modif:Date de modification`, value: fmtDate(doc.getModificationDate?.()) },
      ];

      this.metadata.set(items);
      this.status.set('ready');

      const empty = items.filter(i => !(i.value ?? '').trim()).length;
      if (empty > 0) this.tipMessage.set(this.ui.tipMissing);
    } catch (e: any) {
      const msg = typeof e?.message === 'string' && e.message.trim() ? e.message : this.ui.errGeneric;

      if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
        this.isEncrypted.set(true);
      }

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
    this.isEncrypted.set(false);
    this.metadata.set([]);
    this.form.patchValue({ filter: '', pretty: true });
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
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-metadata') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}

function safeStr(v: any): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

function fmtDate(d: any): string | null {
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
