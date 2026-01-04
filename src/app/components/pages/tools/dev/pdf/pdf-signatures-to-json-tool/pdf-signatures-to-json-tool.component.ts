import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

import {
  extractPdfSignatures,
  type PdfSignatureItem,
} from './pdf-signatures-extractor';

@Component({
  selector: 'app-pdf-signatures-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-signatures-to-json-tool.component.html',
  styleUrl: './pdf-signatures-to-json-tool.component.scss',
})
export class PdfSignaturesToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_sig_title:Signatures PDF → JSON`,
    subtitle: $localize`:@@pdf_sig_subtitle:Détectez les signatures d’un PDF (PAdES / PKCS#7), récupérez les informations techniques (ByteRange, SubFilter…) et exportez-les en JSON, localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_sig_err_title:Impossible d’extraire les signatures.`,
    tipNone: $localize`:@@pdf_sig_tip_none:Aucune signature détectée dans ce PDF.`,
    tipExplain: $localize`:@@pdf_sig_tip_explain:Astuce : cet outil extrait des informations techniques de signature (sans valider cryptographiquement le certificat).`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_sig_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_sig_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_sig_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_sig_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_sig_filter_placeholder:Filtrer (field, page, subfilter, reason…)`,

    statusLoading: $localize`:@@pdf_sig_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_sig_status_ready:Prêt`,
    statusError: $localize`:@@pdf_sig_status_error:Erreur`,

    importTitle: $localize`:@@pdf_sig_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_sig_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_sig_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_sig_card_results_sub:Aperçu des signatures et export JSON.`,

    jsonTitle: $localize`:@@pdf_sig_json_title:JSON`,
    jsonSub: $localize`:@@pdf_sig_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_sig_list_title:Signatures`,
    emptyText: $localize`:@@pdf_sig_empty:Aucune signature à afficher.`,
    backText: $localize`:@@pdf_sig_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly hasAcroForm = signal<boolean>(false);
  readonly signatures = signal<PdfSignatureItem[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeRect: this.fb.nonNullable.control(true),
    includeRawSigDict: this.fb.nonNullable.control(false),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly includeRect = controlToSignal(this.form.controls.includeRect);
  readonly includeRawSigDict = controlToSignal(this.form.controls.includeRawSigDict);

  trackById = (_: number, it: PdfSignatureItem) => it.id;

  readonly filtered = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.signatures();
    if (!f) return all;

    return all.filter(s => {
      const blob = [
        s.fieldName ?? '',
        s.partialName ?? '',
        s.filter ?? '',
        s.subFilter ?? '',
        s.reason ?? '',
        s.location ?? '',
        s.contactInfo ?? '',
        s.name ?? '',
        s.sigObjectId ?? '',
        `${s.pageNumber ?? ''}`,
        (s.byteRange ?? []).join(','),
      ].join(' ').toLowerCase();

      return blob.includes(f);
    });
  });

  readonly jsonObject = computed(() => {
    const items = this.filtered().map(s => {
      const o: Record<string, unknown> = {
        id: s.id,
        kind: s.kind,
        fieldName: s.fieldName ?? null,
        partialName: s.partialName ?? null,
        pageNumber: s.pageNumber ?? null,
        filter: s.filter ?? null,
        subFilter: s.subFilter ?? null,
        name: s.name ?? null,
        reason: s.reason ?? null,
        location: s.location ?? null,
        contactInfo: s.contactInfo ?? null,
        modified: s.m ?? null,
        sigObjectId: s.sigObjectId ?? null,
        byteRange: s.byteRange ?? null,
        hasContents: s.hasContents ?? false,
        contentsLength: s.contentsLength ?? null,
      };

      if (this.includeRect()) o['rect'] = s.rect ?? null;

      return o;
    });

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      _hasAcroForm: this.hasAcroForm(),
      signatures: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly stats = computed(() => {
    const all = this.signatures();
    const withByteRange = all.filter(s => (s.byteRange?.length ?? 0) >= 4).length;
    const pades = all.filter(s => (s.subFilter ?? '').toLowerCase().includes('etsi')).length;
    const pkcs7 = all.filter(s => (s.subFilter ?? '').toLowerCase().includes('pkcs7')).length;

    return {
      pages: this.pageCount(),
      total: all.length,
      withByteRange,
      pades,
      pkcs7,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_sig_stat_pages:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_sig_stat_total:Signatures`, value: this.stats().total },
    { label: $localize`:@@pdf_sig_stat_byterange:ByteRange`, value: this.stats().withByteRange },
    { label: $localize`:@@pdf_sig_stat_pades:PAdES`, value: this.stats().pades },
  ]);

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  typeLabel(s: PdfSignatureItem): string {
    const sf = (s.subFilter ?? '').trim();
    if (sf) return sf;
    return $localize`:@@pdf_sig_type_signature:Signature`;
  }

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.signatures.set([]);
    this.pageCount.set(0);
    this.hasAcroForm.set(false);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const res = await extractPdfSignatures(doc, {
        includeRect: true, // store once; export toggle decides
        includeRawSigDict: this.includeRawSigDict(),
      });

      this.pageCount.set(res.pageCount);
      this.hasAcroForm.set(res.hasAcroForm);
      this.signatures.set(res.signatures);

      this.status.set('ready');

      if (res.signatures.length === 0) {
        this.tipMessage.set(this.ui.tipNone);
      } else {
        this.tipMessage.set(this.ui.tipExplain);
        window.setTimeout(() => this.tipMessage.set(''), 3500);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_sig_err_generic:Impossible de lire ce PDF.`;

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
    this.hasAcroForm.set(false);
    this.signatures.set([]);
    this.form.patchValue({ filter: '', pretty: true, includeRect: true, includeRawSigDict: false });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_sig_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_sig_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-signatures') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}
