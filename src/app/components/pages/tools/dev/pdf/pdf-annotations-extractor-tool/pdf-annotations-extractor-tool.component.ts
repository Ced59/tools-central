import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

import {
  extractPdfAnnotations,
  type PdfAnnotationItem,
  type PdfAnnotSubtype,
} from './pdf-annotations-extractor';

@Component({
  selector: 'app-pdf-annotations-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent],
  templateUrl: './pdf-annotations-extractor-tool.component.html',
  styleUrl: './pdf-annotations-extractor-tool.component.scss',
})
export class PdfAnnotationsToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  // Tool texts
  readonly ui = {
    title: $localize`:@@pdf_ann_title:Annotations PDF → JSON`,
    subtitle: $localize`:@@pdf_ann_subtitle:Exportez les annotations d’un PDF (commentaires, surlignages, notes, dessins, liens…) au format JSON, localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_ann_err_title:Impossible d’extraire les annotations.`,
    tipFormOnly: $localize`:@@pdf_ann_tip_form_only:Ce PDF ne contient pas de commentaires, surlignages ou autres annotations “utilisateur”. Il s’agit probablement d’un formulaire interactif : utilisez l’outil “Champs PDF → JSON” pour extraire les champs.`,
  };

  // Shell texts
  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_ann_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_ann_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_ann_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_ann_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_ann_filter_placeholder:Filtrer (type, page, auteur, contenu…)`,

    statusLoading: $localize`:@@pdf_ann_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_ann_status_ready:Prêt`,
    statusError: $localize`:@@pdf_ann_status_error:Erreur`,

    importTitle: $localize`:@@pdf_ann_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_ann_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_ann_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_ann_card_results_sub:Aperçu des annotations et export JSON.`,

    jsonTitle: $localize`:@@pdf_ann_json_title:JSON`,
    jsonSub: $localize`:@@pdf_ann_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_ann_list_title:Annotations`,
    emptyText: $localize`:@@pdf_ann_empty:Aucune annotation à afficher.`,
    backText: $localize`:@@pdf_ann_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly annotations = signal<PdfAnnotationItem[]>([]);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    includeRect: this.fb.nonNullable.control(true),
    includeQuadPoints: this.fb.nonNullable.control(true),
    includeRaw: this.fb.nonNullable.control(false),
  });

  readonly filter = controlToSignal(this.form.controls.filter);
  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly includeRect = controlToSignal(this.form.controls.includeRect);
  readonly includeQuadPoints = controlToSignal(this.form.controls.includeQuadPoints);
  readonly includeRaw = controlToSignal(this.form.controls.includeRaw);

  trackById = (_: number, it: PdfAnnotationItem) => it.id;

  readonly filteredAnnotations = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.annotations();
    if (!f) return all;

    return all.filter(a => {
      const blob = [
        a.subtype,
        `${a.pageNumber}`,
        a.author ?? '',
        a.contents ?? '',
        a.name ?? '',
        a.objectId ?? '',
      ].join(' ').toLowerCase();
      return blob.includes(f);
    });
  });

  readonly stats = computed(() => {
    const all = this.annotations();
    const byType = new Map<string, number>();
    for (const a of all) byType.set(a.subtype, (byType.get(a.subtype) ?? 0) + 1);

    const highlight = byType.get('Highlight') ?? 0;
    const text = byType.get('Text') ?? 0;
    const freetext = byType.get('FreeText') ?? 0;
    const ink = byType.get('Ink') ?? 0;

    return {
      pages: this.pageCount(),
      total: all.length,
      highlight,
      text,
      freetext,
      ink,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_ann_stat_pages:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_ann_stat_total:Annotations`, value: this.stats().total },
    { label: $localize`:@@pdf_ann_stat_highlight:Surlignages`, value: this.stats().highlight },
    { label: $localize`:@@pdf_ann_stat_text:Notes`, value: this.stats().text },
  ]);

  readonly jsonObject = computed(() => {
    const items = this.filteredAnnotations().map(a => {
      const base: Record<string, unknown> = {
        id: a.id,
        objectId: a.objectId ?? null,
        pageNumber: a.pageNumber,
        subtype: a.subtype,
        author: a.author ?? null,
        modified: a.modified ?? null,
        name: a.name ?? null,
        contents: a.contents ?? null,
        flags: a.flags ?? null,
      };

      if (this.includeRect()) base['rect'] = a.rect ?? null;
      if (this.includeQuadPoints()) base['quadPoints'] = a.quadPoints ?? null;
      base['color'] = a.color ?? null;

      if (this.includeRaw()) base['raw'] = a.raw ?? null;

      return base;
    });

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      annotations: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  typeLabel(t: PdfAnnotSubtype): string {
    // simple mapping (SEO-friendly)
    switch (t) {
      case 'Highlight': return $localize`:@@pdf_ann_type_highlight:Surlignage`;
      case 'Underline': return $localize`:@@pdf_ann_type_underline:Souligné`;
      case 'StrikeOut': return $localize`:@@pdf_ann_type_strikeout:Barré`;
      case 'Squiggly': return $localize`:@@pdf_ann_type_squiggly:Ondulé`;
      case 'Text': return $localize`:@@pdf_ann_type_text:Note`;
      case 'FreeText': return $localize`:@@pdf_ann_type_freetext:Texte libre`;
      case 'Ink': return $localize`:@@pdf_ann_type_ink:Dessin (Ink)`;
      case 'Stamp': return $localize`:@@pdf_ann_type_stamp:Tampon`;
      case 'Link': return $localize`:@@pdf_ann_type_link:Lien`;
      case 'Widget': return $localize`:@@pdf_ann_type_widget:Widget`;
      default: return t === 'Unknown'
        ? $localize`:@@pdf_ann_type_unknown:Autre`
        : t;
    }
  }

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.annotations.set([]);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const res = await extractPdfAnnotations(doc, {
        includeRect: true,          // we store full data once; export toggles will decide
        includeQuadPoints: true,
        includeRaw: this.includeRaw(),
      });

      this.pageCount.set(res.pageCount);
      this.annotations.set(res.annotations);

      this.status.set('ready');

      if (res.annotations.length === 0) {
        this.tipMessage.set(this.ui.tipFormOnly);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_ann_err_generic:Impossible de lire ce PDF.`;

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
    this.annotations.set([]);
    this.form.patchValue({
      filter: '',
      pretty: true,
      includeRect: true,
      includeQuadPoints: true,
      includeRaw: false,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_ann_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_ann_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-annotations') + '.json';
    a.click();

    URL.revokeObjectURL(url);
  }
}
