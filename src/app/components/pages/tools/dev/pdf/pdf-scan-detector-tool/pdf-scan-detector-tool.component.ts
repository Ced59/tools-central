import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';
import { PdfToolActionsService } from '../../../../../../services/pdf-tool-actions.service';

import { detectScannedPdf } from './pdf-scan-detector';

@Component({
  selector: 'app-pdf-scan-detector-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-scan-detector-tool.component.html',
  styleUrl: './pdf-scan-detector-tool.component.scss',
})
export class PdfScanDetectorToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_scan_title:Détecter si un PDF est scanné`,
    subtitle: $localize`:@@pdf_scan_subtitle:Analysez un PDF pour estimer s’il provient d’un scan (images sur les pages, absence de polices, indices CCITT/JBIG2) et exportez le diagnostic en JSON, localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_scan_err_title:Impossible d’analyser ce PDF.`,
    tipScanYes: $localize`:@@pdf_scan_tip_yes:Ce PDF semble provenir d’un scan (forte probabilité).`,
    tipScanNo: $localize`:@@pdf_scan_tip_no:Ce PDF ne semble pas être un scan (il contient des ressources de texte).`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_scan_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_scan_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_scan_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_scan_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_scan_filter_placeholder:Filtrer (page, raisons…)`,

    statusLoading: $localize`:@@pdf_scan_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_scan_status_ready:Prêt`,
    statusError: $localize`:@@pdf_scan_status_error:Erreur`,

    importTitle: $localize`:@@pdf_scan_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_scan_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_scan_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_scan_card_results_sub:Score “scan” + indices détectés + détails par page.`,


    jsonTitle: $localize`:@@pdf_scan_json_title:JSON`,
    jsonSub: $localize`:@@pdf_scan_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_scan_list_title:Pages`,
    emptyText: $localize`:@@pdf_scan_empty:Aucune page à afficher.`,
    backText: $localize`:@@pdf_scan_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);

  readonly result = signal<ReturnType<typeof detectScannedPdf> | null>(null);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includePages: this.fb.nonNullable.control(true),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly includePages = controlToSignal(this.form.controls.includePages);

  trackByPage = (_: number, it: any) => it.pageNumber;

  readonly filteredPages = computed(() => {
    const r = this.result();
    const pages = r?.pages ?? [];
    const f = (this.filter() ?? '').trim().toLowerCase();
    if (!f) return pages;

    return pages.filter(p => {
      const blob = [
        `${p.pageNumber}`,
        (p.reasons ?? []).join(' '),
        `fonts:${p.fontCount}`,
        `images:${p.imageCount}`,
        p.has1BitFaxLikeImage ? 'fax' : '',
      ].join(' ').toLowerCase();
      return blob.includes(f);
    });
  });

  readonly statsCards = computed((): PdfToolStatCard[] => {
    const r = this.result();
    if (!r) return [];

    return [
      { label: $localize`:@@pdf_scan_stat_pages:Pages`, value: r.pageCount },
      { label: $localize`:@@pdf_scan_stat_score:Score`, value: `${r.scanScore}/100` },
      { label: $localize`:@@pdf_scan_stat_fonts:Pages avec polices`, value: r.pagesWithFonts },
      { label: $localize`:@@pdf_scan_stat_images:Pages avec images`, value: r.pagesWithImages },
    ];
  });

  readonly jsonObject = computed(() => {
    const r = this.result();
    if (!r) {
      return {
        _fileName: this.fileName() || null,
        _fileSize: this.fileSize(),
        scan: null,
      };
    }

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      scan: {
        pageCount: r.pageCount,
        scanScore: r.scanScore,
        isLikelyScanned: r.isLikelyScanned,
        summaryReasons: r.summaryReasons,
        fontsTotal: r.fontsTotal,
        pagesWithFonts: r.pagesWithFonts,
        imagesTotal: r.imagesTotal,
        pagesWithImages: r.pagesWithImages,
        pagesFaxLike: r.pagesFaxLike,
        pages: this.includePages() ? r.pages : undefined,
      },
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
    this.result.set(null);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const r = detectScannedPdf(doc);
      this.result.set(r);
      this.status.set('ready');

      this.tipMessage.set(r.isLikelyScanned ? this.ui.tipScanYes : this.ui.tipScanNo);
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_scan_err_generic:Impossible de lire ce PDF.`;

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
    this.result.set(null);
    this.form.patchValue({ filter: '', pretty: true, includePages: true });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_scan_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_scan_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-scan') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}
