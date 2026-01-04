import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

interface PdfMetadataItem {
  key: string;
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-pdf-metadata-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-metadata-to-json-tool.component.html',
  styleUrl: './pdf-metadata-to-json-tool.component.scss',
})
export class PdfMetadataToJsonToolComponent {
  private readonly fb = new FormBuilder();
  private readonly pdfActions = inject(PdfToolActionsService);

  readonly backLink = '/categories/dev/pdf';

  // Tool texts
  readonly ui = {
    title: $localize`:@@pdf_meta_title:Métadonnées PDF → JSON`,
    subtitle: $localize`:@@pdf_meta_subtitle:Exportez les métadonnées d’un PDF (titre, auteur, dates, nombre de pages…) au format JSON, localement dans votre navigateur.`,

    errTitle: $localize`:@@pdf_meta_err_title:Impossible d’extraire les métadonnées.`,
    errEncrypted: $localize`:@@pdf_meta_err_encrypted:Il semble que le PDF soit chiffré / protégé par mot de passe.`,
  };

  // Shell texts
  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_meta_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_meta_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_meta_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_meta_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_meta_filter_placeholder:Filtrer (titre, auteur, date…)`,

    statusLoading: $localize`:@@pdf_meta_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_meta_status_ready:Prêt`,
    statusError: $localize`:@@pdf_meta_status_error:Erreur`,

    importTitle: $localize`:@@pdf_meta_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_meta_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_meta_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_meta_card_results_sub:Aperçu des métadonnées et export JSON.`,

    jsonTitle: $localize`:@@pdf_meta_json_title:JSON`,
    jsonSub: $localize`:@@pdf_meta_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_meta_list_title:Métadonnées`,
    emptyText: $localize`:@@pdf_meta_empty:Aucune métadonnée ne correspond au filtre.`,
    backText: $localize`:@@pdf_meta_back:← Retour aux outils PDF`,
  };

  // ---- State ----
  readonly status = signal<PdfToolStatus>('idle');
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

  // ✅ fix réactivité: pas de computed sur this.form.value.*
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);

  // ---- Derived ----
  readonly filteredMetadata = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
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

    obj['_pageCount'] = this.pageCount();
    obj['_fileName'] = this.fileName() || null;
    obj['_fileSize'] = this.fileSize();

    return obj;
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

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

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_meta_stat_pages_label:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_meta_stat_total_label:Clés`, value: this.stats().totalKeys },
    { label: $localize`:@@pdf_meta_stat_filled_label:Renseignées`, value: this.stats().filledKeys },
    { label: $localize`:@@pdf_meta_stat_empty_label:Vides`, value: this.stats().emptyKeys },
  ]);

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    if (!e) return '';

    // On garde le “titre” + détail, et on ajoute l’encrypted si besoin.
    const parts = [`${this.ui.errTitle} — ${e}`];
    if (this.isEncrypted()) parts.push(this.ui.errEncrypted);
    return parts.join(' ');
  });

  // ---- Actions ----
  async onFileSelected(file: File) {
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
      if (empty > 0) {
        this.tipMessage.set(
          $localize`:@@pdf_meta_tip_missing:Certaines métadonnées sont vides : c’est normal, beaucoup de PDFs n’en définissent pas.`
        );
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_meta_err_generic:Impossible de lire ce PDF.`;

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
    await this.pdfActions.copyJson(
      this.jsonText(),
      this.tipMessage,
      $localize`:@@pdf_meta_copied:JSON copié dans le presse-papiers.`,
      $localize`:@@pdf_meta_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
    );
  }

  downloadJson() {
    const baseName = this.pdfActions.getDownloadFileName(this.fileName(), 'metadata');
    this.pdfActions.downloadJson(this.jsonText(), baseName.replace('.json', ''));
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
