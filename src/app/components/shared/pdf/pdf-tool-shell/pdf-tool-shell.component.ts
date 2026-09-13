import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from '@ui';
import { InputTextModule } from '@ui';
import { TagModule } from '@ui';

export type PdfToolStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PdfToolStatCard {
  label: string;
  value: string | number;
}

export interface PdfToolShellUi {
  btnPick: string;
  btnReset: string;
  btnCopy: string;
  btnDownload: string;
  placeholderFilter: string;

  statusLoading: string;
  statusReady: string;
  statusError: string;

  importTitle: string;
  importSub: string;

  resultsTitle: string;
  resultsSub: string;

  jsonTitle: string;
  jsonSub: string;

  leftTitle: string;
  emptyText: string;

  backText: string;
}

@Component({
  selector: 'app-pdf-tool-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    ButtonModule,
    InputTextModule,
    TagModule,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './pdf-tool-shell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pdf-tool-shell.component.scss',
})
export class PdfToolShellComponent {
  @Input({ required: true }) ui!: PdfToolShellUi;

  @Input() icon = 'tc-icon tc-icon-file-pdf';
  @Input() title = '';
  @Input() subtitle = '';

  @Input() backLink: string | null = '/categories/dev/pdf';

  @Input() accept = 'application/pdf';
  @Input() multiple = false;
  @Input() maxFileSizeBytes = 100 * 1024 * 1024;

  /** ✅ pour désactiver “Télécharger” avant un résultat */
  @Input() downloadDisabled = false;

  @Input() status: PdfToolStatus = 'idle';
  @Input() fileName: string | null = null;
  @Input() fileSize: number | null = null;

  @Input() tipMessage: string | null = null;
  @Input() errorMessage: string | null = null;

  @Input() stats?: PdfToolStatCard[] = [];

  @Input() totalCount: number | null = null;
  @Input() filteredCount: number | null = null;

  @Input({ required: true }) filterControl!: FormControl<string>;
  @Input() jsonText = '';

  @Input() showResults = false;

  /** legacy single */
  @Output() fileSelected = new EventEmitter<File>();

  @Input() exportData: unknown | null = null;      // l’objet métier (pas string)
  @Input() exportFileBaseName: string | null = null; // ex: "pdf-fonts"
  @Input() includeMeta = true;

  @Input() siteBaseUrl = 'https://www.tools-central.com'; // idéalement: environment.siteBaseUrl
  @Input() locale: string | null = null;
  @Input() toolId: string | null = null;
  @Input() toolSlug: string | null = null;
  @Input() toolVersion: string | null = null;

  @Output() filesSelected = new EventEmitter<File[]>();

  @Output() reset = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  readonly fileInputId = `pdf-tool-file-input-${Math.random().toString(16).slice(2)}`;
  selectionError = '';

  triggerFilePick() {
    const el = document.getElementById(this.fileInputId) as HTMLInputElement | null;
    el?.click();
  }

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    input.value = ''; // permet de re-sélectionner les mêmes fichiers

    if (list.length === 0) return;

    this.selectionError = '';
    const invalidType = list.find((file) => !/\.pdf$/i.test(file.name) && file.type !== 'application/pdf');
    if (invalidType) {
      this.selectionError = $localize`:@@pdf_shell_invalid_type:Sélection refusée : seuls les fichiers PDF sont acceptés.`;
      return;
    }

    const invalidSize = list.find((file) => file.size === 0 || file.size > this.maxFileSizeBytes);
    if (invalidSize) {
      const limitMb = Math.round(this.maxFileSizeBytes / 1024 / 1024);
      this.selectionError = $localize`:@@pdf_shell_invalid_size:Sélection refusée : chaque PDF doit être non vide et ne pas dépasser ${limitMb}:LIMIT_MB: Mo.`;
      return;
    }

    // ✅ si multiple=true -> on émet filesSelected
    if (this.multiple) {
      this.filesSelected.emit(list);
      return;
    }

    // sinon legacy single
    this.fileSelected.emit(list[0]);
  }
}
