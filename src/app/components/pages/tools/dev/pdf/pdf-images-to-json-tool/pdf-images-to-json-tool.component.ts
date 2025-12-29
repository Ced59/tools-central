import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';

import { PdfToolShellComponent } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import type { PdfToolShellUi, PdfToolStatCard, PdfToolStatus } from '../../../../../shared/pdf/pdf-tool-shell/pdf-tool-shell.component';
import { controlToSignal } from '../../../../../shared/pdf/pdf-tool-signals';

import { extractPdfImages, type PdfExtractedImage } from './pdf-images-extractor';
import { buildZipStore } from './zip-store';
import {ButtonDirective} from "primeng/button";

@Component({
  selector: 'app-pdf-images-to-json-tool',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfToolShellComponent, ButtonDirective],
  templateUrl: './pdf-images-to-json-tool.component.html',
  styleUrl: './pdf-images-to-json-tool.component.scss',
})
export class PdfImagesToJsonToolComponent {
  private readonly fb = new FormBuilder();

  readonly backLink = '/categories/dev/pdf';

  readonly ui = {
    title: $localize`:@@pdf_images_title:Images PDF → JSON`,
    subtitle: $localize`:@@pdf_images_subtitle:Extrayez les images intégrées dans un PDF (XObject /Image) et exportez la liste en JSON, localement dans votre navigateur.`,
    errTitle: $localize`:@@pdf_images_err_title:Impossible d’extraire les images.`,
    tipBin: $localize`:@@pdf_images_tip_bin:Certaines “images” sont exportées en .bin (flux compressé PDF : CCITT/Flate/JPX…). Pour les ouvrir, utilisez un outil comme GIMP ou ImageMagick, ou exportez d’abord en image via un logiciel PDF.`,
  };

  readonly uiShell: PdfToolShellUi = {
    btnPick: $localize`:@@pdf_images_btn_pick:Choisir un PDF`,
    btnReset: $localize`:@@pdf_images_btn_reset:Réinitialiser`,
    btnCopy: $localize`:@@pdf_images_btn_copy:Copier`,
    btnDownload: $localize`:@@pdf_images_btn_download:Télécharger`,
    placeholderFilter: $localize`:@@pdf_images_filter_placeholder:Filtrer (nom, page, filtre, taille…)`,

    statusLoading: $localize`:@@pdf_images_status_loading:Analyse…`,
    statusReady: $localize`:@@pdf_images_status_ready:Prêt`,
    statusError: $localize`:@@pdf_images_status_error:Erreur`,

    importTitle: $localize`:@@pdf_images_card_import_title:Importer un PDF`,
    importSub: $localize`:@@pdf_images_card_import_sub:Aucune donnée n’est envoyée sur un serveur : tout se fait dans votre navigateur.`,

    resultsTitle: $localize`:@@pdf_images_card_results_title:Résultats`,
    resultsSub: $localize`:@@pdf_images_card_results_sub:Aperçu des images détectées et export JSON.`,

    jsonTitle: $localize`:@@pdf_images_json_title:JSON`,
    jsonSub: $localize`:@@pdf_images_json_sub:Exportable`,

    leftTitle: $localize`:@@pdf_images_list_title:Images`,
    emptyText: $localize`:@@pdf_images_empty:Aucune image à afficher.`,
    backText: $localize`:@@pdf_images_back:← Retour aux outils PDF`,
  };

  readonly status = signal<PdfToolStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly tipMessage = signal<string>('');

  readonly fileName = signal<string>('');
  readonly fileSize = signal<number>(0);
  readonly pageCount = signal<number>(0);

  readonly images = signal<PdfExtractedImage[]>([]);
  readonly selectedId = signal<string | null>(null);

  readonly form = this.fb.group({
    pretty: this.fb.nonNullable.control(true),
    filter: this.fb.nonNullable.control(''),
    uniqueOnly: this.fb.nonNullable.control(true),
    includeRaw: this.fb.nonNullable.control(false),
    includeBase64: this.fb.nonNullable.control(false),
    zipIncludeBin: this.fb.nonNullable.control(true),
  });

  readonly pretty = controlToSignal(this.form.controls.pretty);
  readonly filter = controlToSignal(this.form.controls.filter);
  readonly uniqueOnly = controlToSignal(this.form.controls.uniqueOnly);
  readonly includeRaw = controlToSignal(this.form.controls.includeRaw);
  readonly includeBase64 = controlToSignal(this.form.controls.includeBase64);
  readonly zipIncludeBin = controlToSignal(this.form.controls.zipIncludeBin);

  readonly filteredImages = computed(() => {
    const f = (this.filter() ?? '').trim().toLowerCase();
    const all = this.images();
    if (!f) return all;

    return all.filter(it => {
      const parts = [
        it.name ?? '',
        it.objectId ?? '',
        it.extension ?? '',
        (it.filters ?? []).join(','),
        `${it.width ?? ''}x${it.height ?? ''}`,
        `${it.byteLength ?? ''}`,
        (it.pages ?? []).join(','),
      ]
        .join(' ')
        .toLowerCase();

      return parts.includes(f);
    });
  });

  readonly selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.images().find(x => x.id === id) ?? null;
  });

  readonly jsonObject = computed(() => {
    const items = this.filteredImages().map(it => ({
      id: it.id,
      objectId: it.objectId ?? null,
      name: it.name ?? null,
      width: it.width ?? null,
      height: it.height ?? null,
      bitsPerComponent: it.bitsPerComponent ?? null,
      colorSpace: it.colorSpace ?? null,
      filters: it.filters ?? [],
      extension: it.extension ?? 'bin',
      byteLength: it.byteLength ?? (it.bytes ? it.bytes.length : 0),
      occurrences: it.occurrences ?? 1,
      pages: it.pages ?? [],
      raw: this.includeRaw() ? (it.raw ?? null) : null,
      base64: this.includeBase64() ? (it.base64 ?? null) : null,
    }));

    return {
      _fileName: this.fileName() || null,
      _fileSize: this.fileSize(),
      _pageCount: this.pageCount(),
      images: items,
    };
  });

  readonly jsonText = computed(() => JSON.stringify(this.jsonObject(), null, this.pretty() ? 2 : 0));

  readonly stats = computed(() => {
    const all = this.images();
    const jpg = all.filter(x => x.extension === 'jpg').length;
    const jp2 = all.filter(x => x.extension === 'jp2').length;
    const bin = all.filter(x => x.extension === 'bin').length;

    return {
      pages: this.pageCount(),
      total: all.length,
      jpg,
      jp2,
      bin,
    };
  });

  readonly statsCards = computed((): PdfToolStatCard[] => [
    { label: $localize`:@@pdf_images_stat_pages:Pages`, value: this.stats().pages },
    { label: $localize`:@@pdf_images_stat_total:Images`, value: this.stats().total },
    { label: $localize`:@@pdf_images_stat_jpg:JPG`, value: this.stats().jpg },
    { label: $localize`:@@pdf_images_stat_bin:BIN`, value: this.stats().bin },
  ]);

  readonly shellErrorMessage = computed(() => {
    const e = (this.errorMessage() ?? '').trim();
    return e ? `${this.ui.errTitle} — ${e}` : '';
  });

  trackById = (_: number, it: PdfExtractedImage) => it.id;

  displayTitle(it: PdfExtractedImage): string {
    const wh = it.width && it.height ? `${it.width}×${it.height}` : '—';
    const ext = it.extension ?? 'bin';
    const size = this.formatBytes(it.byteLength ?? (it.bytes?.length ?? 0));
    return `${wh} • .${ext} • ${size}`;
  }

  select(it: PdfExtractedImage) {
    this.selectedId.set(it.id);
  }

  async onFileSelected(file: File) {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.images.set([]);
    this.selectedId.set(null);
    this.pageCount.set(0);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const opts = {
        includeBytes: true,              // needed for download/zip
        includeRaw: this.includeRaw(),
        includeBase64: this.includeBase64(),
        uniqueOnly: this.uniqueOnly(),
      };

      const res = await extractPdfImages(doc, opts);

      this.pageCount.set(res.pageCount);
      this.images.set(res.images);
      this.status.set('ready');

      if (res.images.length === 0) {
        this.tipMessage.set($localize`:@@pdf_images_tip_none:Aucune image détectée dans ce PDF.`);
        return;
      }

      // si bin présent -> on avertit
      if (res.images.some(x => x.extension === 'bin')) {
        this.tipMessage.set(this.ui.tipBin);
      }
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : $localize`:@@pdf_images_err_generic:Impossible de lire ce PDF.`;

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
    this.images.set([]);
    this.selectedId.set(null);
    this.form.patchValue({
      filter: '',
      pretty: true,
      uniqueOnly: true,
      includeRaw: false,
      includeBase64: false,
      zipIncludeBin: true,
    });
  }

  async copyJson() {
    try {
      await navigator.clipboard.writeText(this.jsonText());
      this.tipMessage.set($localize`:@@pdf_images_copied:JSON copié dans le presse-papiers.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
    } catch {
      this.tipMessage.set(
        $localize`:@@pdf_images_copy_fail:Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.`
      );
    }
  }

  downloadJson() {
    const blob = new Blob([this.jsonText()], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, (this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-images') + '.json');
  }

  downloadSelectedImage() {
    const it = this.selected();
    if (!it?.bytes) return;

    const ext = it.extension ?? 'bin';
    const base = this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf';
    const filename = `${base}.image-${it.index}.${ext}`;

    const mime =
      ext === 'jpg' ? 'image/jpeg' :
        ext === 'jp2' ? 'image/jp2' :
          'application/octet-stream';

    const ab = toArrayBuffer(it.bytes);
    this.downloadBlob(new Blob([ab], { type: mime }), filename);
  }

  downloadAllZip() {
    const imgs = this.images().filter(it => !!it.bytes && it.bytes.length > 0);

    const includeBin = this.zipIncludeBin();
    const keep = imgs.filter(it => (it.extension === 'bin' ? includeBin : true));

    if (!keep.length) {
      this.tipMessage.set($localize`:@@pdf_images_zip_none:Aucune image à inclure dans le ZIP.`);
      window.setTimeout(() => this.tipMessage.set(''), 2500);
      return;
    }

    const base = this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf';
    const files = keep.map(it => ({
      name: `${base}.image-${it.index}.${it.extension ?? 'bin'}`,
      data: it.bytes as Uint8Array,
    }));

    const zip = buildZipStore(files);
    const ab = toArrayBuffer(zip);
    const blob = new Blob([ab], { type: 'application/zip' });
    this.downloadBlob(blob, `${base}.images.zip`);
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private formatBytes(n: number): string {
    if (!n || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }
}

/** Corrige ArrayBufferLike => ArrayBuffer (Blob compat strict) */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}
