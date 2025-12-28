import { CommonModule, DecimalPipe } from '@angular/common';
import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

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

  leftTitle: string; // ex: "Pages", "Polices", "Liens"
  emptyText: string; // ex: "Aucune donnée à afficher."

  backText: string;  // ex: "← Retour aux outils PDF"
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
  styleUrl: './pdf-tool-shell.component.scss',
})
export class PdfToolShellComponent {
  @Input({ required: true }) ui!: PdfToolShellUi;

  @Input() icon = 'pi pi-file-pdf';
  @Input() title = '';
  @Input() subtitle = '';

  @Input() backLink: string | null = '/categories/dev/pdf';

  @Input() accept = 'application/pdf';

  @Input() status: PdfToolStatus = 'idle';
  @Input() fileName: string | null = null;
  @Input() fileSize: number | null = null;

  @Input() tipMessage: string | null = null;
  @Input() errorMessage: string | null = null;

  @Input() stats: PdfToolStatCard[] = [];

  @Input() totalCount: number | null = null;
  @Input() filteredCount: number | null = null;

  @Input({ required: true }) filterControl!: FormControl<string>;
  @Input() jsonText = '';

  @Input() showResults = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() reset = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  readonly fileInputId = `pdf-tool-file-input-${Math.random().toString(16).slice(2)}`;

  triggerFilePick() {
    const el = document.getElementById(this.fileInputId) as HTMLInputElement | null;
    el?.click();
  }

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.fileSelected.emit(file);
  }
}
