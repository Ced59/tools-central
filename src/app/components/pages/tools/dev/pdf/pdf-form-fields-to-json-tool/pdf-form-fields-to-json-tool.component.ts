import { Component, computed, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import {
  PDFDocument,
  PDFField,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFButton,
  PDFSignature,
} from 'pdf-lib';

/** Export JSON complet + enrichissement dans Extra */
export type DotNetIsoField = {
  Name: string;
  PartialName: string;
  Type: string; // "e_text" etc.
  Value: string | boolean | string[];
  DefaultValue: string;
  Tooltip: string;
  Flags: {
    ReadOnly: boolean;
    Required: boolean;
  };
  Justification: string; // "e_left_justified" etc.
  MaxLen: number; // -1 if unknown
  Widget: {
    Page: number; // 1-based, -1 if unknown
    Rect: [number, number, number, number] | null;
  };
  Extra?: {
    FullyQualifiedName: string;
    FieldTypeRaw: string | null;
    Ff: number | null;
    Q: number | null;
    DA: string | null;
    KidsCount: number | null;

    Widgets: Array<{
      Page: number;
      Rect: [number, number, number, number] | null;
    }>;

    Options?: string[];
    ExportDiagnostics?: {
      HasAcroFieldDict: boolean;
      HasKids: boolean;
      HasRect: boolean;
      HasPageRef: boolean;
    };
  };
};

type UiStatus = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-pdf-form-fields-to-json-tool',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DividerModule,
    TagModule,
  ],
  templateUrl: './pdf-form-fields-to-json-tool.component.html',
  styleUrl: './pdf-form-fields-to-json-tool.component.scss',
})
export class PdfFormFieldsToJsonToolComponent {
  private fb = new FormBuilder();

  // UI state
  status = signal<UiStatus>('idle');
  errorMessage = signal<string>('');
  tipMessage = signal<string>('');

  fileName = signal<string>('');
  fileSize = signal<number>(0);
  lastUpdated = signal<number | null>(null);

  // Data
  fields = signal<DotNetIsoField[]>([]);
  jsonText = signal<string>('');

  // Hidden file input handle (template)
  fileInputId = 'pdf-upload-input';

  // Form controls
  form = this.fb.nonNullable.group({
    filter: this.fb.nonNullable.control(''),
    pretty: this.fb.nonNullable.control(true),
    includeEmpty: this.fb.nonNullable.control(true),
    showAdvanced: this.fb.nonNullable.control(false),
  });

  // ✅ Make form changes reactive for signals/computed
  private filterSig = toSignal(this.form.controls.filter.valueChanges, {
    initialValue: this.form.controls.filter.value,
  });

  private prettySig = toSignal(this.form.controls.pretty.valueChanges, {
    initialValue: this.form.controls.pretty.value,
  });

  private includeEmptySig = toSignal(this.form.controls.includeEmpty.valueChanges, {
    initialValue: this.form.controls.includeEmpty.value,
  });

  /** ✅ IMPORTANT: must be PUBLIC because template uses it */
  showAdvancedSig = toSignal(this.form.controls.showAdvanced.valueChanges, {
    initialValue: this.form.controls.showAdvanced.value,
  });

  // Dynamic labels (i18n-safe)
  prettyLabel = computed(() =>
    this.prettySig()
      ? $localize`:@@pdf_fields_pretty_indented:Indenté`
      : $localize`:@@pdf_fields_pretty_minified:Minifié`
  );

  emptyLabel = computed(() =>
    this.includeEmptySig()
      ? $localize`:@@pdf_fields_empty_included:Inclus`
      : $localize`:@@pdf_fields_empty_excluded:Exclus`
  );

  advancedLabel = computed(() =>
    this.showAdvancedSig()
      ? $localize`:@@pdf_fields_adv_shown:Détails visibles`
      : $localize`:@@pdf_fields_adv_hidden:Détails masqués`
  );

  // Derived lists
  filteredFields = computed(() => {
    const q = (this.filterSig() ?? '').trim().toLowerCase();
    const includeEmpty = this.includeEmptySig();

    let list = this.fields();

    if (!includeEmpty) {
      list = list.filter(f => {
        const v = f.Value;
        if (typeof v === 'boolean') return true; // keep bools
        if (typeof v === 'string') return v.trim().length > 0;
        if (Array.isArray(v)) return v.length > 0;
        return true;
      });
    }

    if (!q) return list;

    return list.filter(f => {
      const valueStr =
        typeof f.Value === 'string'
          ? f.Value
          : Array.isArray(f.Value)
            ? f.Value.join(' ')
            : String(f.Value);

      const hay = [
        f.Name,
        f.PartialName,
        f.Type,
        f.Tooltip,
        f.Justification,
        String(f.MaxLen),
        valueStr,
      ].join(' ').toLowerCase();

      return hay.includes(q);
    });
  });

  counts = computed(() => {
    const all = this.fields().length;
    const shown = this.filteredFields().length;

    const byType = new Map<string, number>();
    for (const f of this.fields()) {
      byType.set(f.Type, (byType.get(f.Type) ?? 0) + 1);
    }

    const typeStats = Array.from(byType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { all, shown, typeStats };
  });

  // Keep JSON output in sync with pretty/minify (and when fields change)
  private syncJson = effect(() => {
    const pretty = this.prettySig();
    const data = this.fields();
    this.jsonText.set(pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  });

  // ---- UI actions ----

  triggerFilePick() {
    const el = document.getElementById(this.fileInputId) as HTMLInputElement | null;
    el?.click();
  }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];

    // allow re-select same file
    input.value = '';

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.fail($localize`:@@pdf_fields_err_not_pdf:Veuillez sélectionner un fichier PDF (.pdf).`);
      return;
    }

    this.status.set('loading');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.fields.set([]);

    this.fileName.set(file.name);
    this.fileSize.set(file.size);

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });

      const form = doc.getForm();
      const pdfFields = form.getFields();

      const exported = pdfFields.map(f => this.exportField(doc, f));
      exported.sort((a, b) => a.Name.localeCompare(b.Name));

      this.fields.set(exported);
      this.lastUpdated.set(Date.now());
      this.status.set('ready');
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim().length > 0
          ? e.message
          : $localize`:@@pdf_fields_err_generic:Impossible de lire ce PDF.`;
      this.fail(msg);
    }
  }

  reset() {
    this.status.set('idle');
    this.errorMessage.set('');
    this.tipMessage.set('');
    this.fileName.set('');
    this.fileSize.set(0);
    this.lastUpdated.set(null);
    this.fields.set([]);

    this.form.patchValue({
      filter: '',
      pretty: true,
      includeEmpty: true,
      showAdvanced: false,
    });
  }

  async copyJson() {
    const txt = this.jsonText();
    if (!txt) return;

    try {
      await navigator.clipboard.writeText(txt);
      this.flashTip($localize`:@@pdf_fields_copied:JSON copié dans le presse-papiers.`);
    } catch {
      this.flashTip($localize`:@@pdf_fields_copy_failed:Copie impossible (permissions navigateur).`);
    }
  }

  downloadJson() {
    const txt = this.jsonText();
    if (!txt) return;

    const baseName = this.fileName() ? this.fileName().replace(/\.pdf$/i, '') : 'pdf-fields';
    const blob = new Blob([txt], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.fields.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  togglePretty() {
    this.form.controls.pretty.setValue(!this.form.controls.pretty.value);
  }

  toggleIncludeEmpty() {
    this.form.controls.includeEmpty.setValue(!this.form.controls.includeEmpty.value);
  }

  toggleAdvanced() {
    this.form.controls.showAdvanced.setValue(!this.form.controls.showAdvanced.value);
  }

  optionsText(f: DotNetIsoField): string {
    const opts = f.Extra?.Options;
    return opts && opts.length ? opts.join(', ') : '';
  }

  // ---- Extraction ----

  private exportField(doc: PDFDocument, f: PDFField): DotNetIsoField {
    const name = f.getName();
    const anyField = f as any;
    const acroField = anyField?.acroField;
    const dict = acroField?.dict;

    const ftRaw = this.readName(dict, 'FT'); // Tx/Btn/Ch/Sig
    const ff = this.readNumber(dict, 'Ff');
    const q = this.readNumber(dict, 'Q');
    const maxLen = this.readNumber(dict, 'MaxLen');

    const readOnly = ff !== null ? (ff & 1) !== 0 : false;
    const required = ff !== null ? (ff & 2) !== 0 : false;

    const justification =
      q === 0 ? 'e_left_justified'
        : q === 1 ? 'e_centered'
          : q === 2 ? 'e_right_justified'
            : 'e_left_justified';

    const partialName = this.readText(dict, 'T') ?? name;
    const tooltip = this.readText(dict, 'TU') ?? partialName;
    const defaultValue = this.readText(dict, 'DV') ?? '';

    const { widgets, diag } = this.extractWidgets(doc, dict);
    const mainWidget = widgets[0] ?? { Page: -1, Rect: null };

    const type = this.mapTypeToEnum(ftRaw, f);
    const value = this.readValue(f, type);

    const da = this.readText(dict, 'DA');
    const kidsCount = this.getKidsCount(dict);
    const options = this.extractOptionsBestEffort(f, dict);

    return {
      Name: name,
      PartialName: partialName,
      Type: type,
      Value: value,
      DefaultValue: defaultValue,
      Tooltip: tooltip,
      Flags: { ReadOnly: readOnly, Required: required },
      Justification: justification,
      MaxLen: maxLen ?? -1,
      Widget: mainWidget,
      Extra: {
        FullyQualifiedName: name,
        FieldTypeRaw: ftRaw,
        Ff: ff,
        Q: q,
        DA: da,
        KidsCount: kidsCount,
        Widgets: widgets,
        ...(options ? { Options: options } : {}),
        ExportDiagnostics: diag,
      },
    };
  }

  private mapTypeToEnum(ftRaw: string | null, f: PDFField): string {
    if (f instanceof PDFTextField) return 'e_text';
    if (f instanceof PDFSignature) return 'e_signature';

    if (f instanceof PDFCheckBox) return 'e_check';
    if (f instanceof PDFRadioGroup) return 'e_check';
    if (f instanceof PDFButton) return 'e_button';

    if (f instanceof PDFDropdown) return 'e_choice';
    if (f instanceof PDFOptionList) return 'e_choice';

    if (ftRaw === 'Tx') return 'e_text';
    if (ftRaw === 'Btn') return 'e_button';
    if (ftRaw === 'Ch') return 'e_choice';
    if (ftRaw === 'Sig') return 'e_signature';
    return 'e_unknown';
  }

  private readValue(f: PDFField, dotType: string): string | boolean | string[] {
    if (f instanceof PDFTextField) return f.getText() ?? '';
    if (f instanceof PDFCheckBox) return f.isChecked();
    if (f instanceof PDFRadioGroup) return f.getSelected() ?? '';
    if (f instanceof PDFDropdown) return (f.getSelected() ?? []).map(String);
    if (f instanceof PDFOptionList) return (f.getSelected() ?? []).map(String);

    if (dotType === 'e_text') return '';
    return '';
  }

  private extractWidgets(
    doc: PDFDocument,
    dict: any
  ): { widgets: Array<{ Page: number; Rect: [number, number, number, number] | null }>; diag: any } {
    const widgets: Array<{ Page: number; Rect: [number, number, number, number] | null }> = [];

    let hasKids = false;
    let hasRect = false;
    let hasPageRef = false;

    const pushFromWidgetDict = (wDict: any) => {
      const rect = this.readRect(wDict);
      if (rect) hasRect = true;

      const page = this.resolveWidgetPageIndex(doc, wDict);
      if (page !== -1) hasPageRef = true;

      widgets.push({ Page: page, Rect: rect });
    };

    try {
      const kids = dict?.get?.('Kids');
      if (kids) {
        const arr = this.asArrayBestEffort(kids);
        if (arr?.length) {
          hasKids = true;
          for (const kid of arr) pushFromWidgetDict(kid);
        }
      }
    } catch { /* ignore */ }

    if (widgets.length === 0) {
      try { pushFromWidgetDict(dict); } catch { /* ignore */ }
    }

    if (widgets.length === 0) widgets.push({ Page: -1, Rect: null });

    return {
      widgets,
      diag: {
        HasAcroFieldDict: !!dict,
        HasKids: hasKids,
        HasRect: hasRect,
        HasPageRef: hasPageRef,
      },
    };
  }

  private extractOptionsBestEffort(f: PDFField, dict: any): string[] | null {
    if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
      try {
        const any = f as any;
        const opts = typeof any.getOptions === 'function' ? any.getOptions() : null;
        if (Array.isArray(opts) && opts.length) return opts.map(String);
      } catch { /* ignore */ }
      return null;
    }

    try {
      const opt = dict?.get?.('Opt');
      const arr = opt ? this.asArrayBestEffort(opt) : null;
      if (arr?.length) return arr.map((x: any) => this.pdfObjToText(x) ?? String(x));
    } catch { /* ignore */ }

    return null;
  }

  // ---- low-level readers (best-effort) ----

  private readText(dict: any, key: string): string | null {
    try {
      const v = dict?.get?.(key);
      return this.pdfObjToText(v);
    } catch { return null; }
  }

  private readName(dict: any, key: string): string | null {
    try {
      const v = dict?.get?.(key);
      if (!v) return null;
      if (typeof v?.name === 'string') return v.name;
      return this.pdfObjToText(v);
    } catch { return null; }
  }

  private readNumber(dict: any, key: string): number | null {
    try {
      const v = dict?.get?.(key);
      if (!v) return null;
      if (typeof v?.asNumber === 'function') return v.asNumber();
      if (typeof v?.numberValue === 'function') return v.numberValue();
      if (typeof v?.value === 'number') return v.value;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    } catch { return null; }
  }

  private readRect(wDict: any): [number, number, number, number] | null {
    try {
      const r = wDict?.get?.('Rect');
      const arr = r ? this.asArrayBestEffort(r) : null;
      if (!arr || arr.length !== 4) return null;

      const nums = arr.map((x: any) => {
        if (typeof x?.asNumber === 'function') return x.asNumber();
        if (typeof x?.numberValue === 'function') return x.numberValue();
        if (typeof x?.value === 'number') return x.value;
        return Number(x);
      });

      if (nums.some(n => !Number.isFinite(n))) return null;
      return [nums[0], nums[1], nums[2], nums[3]];
    } catch { return null; }
  }

  private getKidsCount(dict: any): number | null {
    try {
      const kids = dict?.get?.('Kids');
      const arr = kids ? this.asArrayBestEffort(kids) : null;
      return arr ? arr.length : null;
    } catch { return null; }
  }

  private asArrayBestEffort(obj: any): any[] | null {
    if (!obj) return null;
    if (typeof obj.asArray === 'function') return obj.asArray();
    if (Array.isArray(obj)) return obj;
    return null;
  }

  private pdfObjToText(v: any): string | null {
    if (!v) return null;
    try {
      if (typeof v.decodeText === 'function') return v.decodeText();
      if (typeof v.asString === 'function') return v.asString();
      if (typeof v.value === 'string') return v.value;
      if (typeof v.name === 'string') return v.name;
      return String(v);
    } catch { return null; }
  }

  private resolveWidgetPageIndex(doc: PDFDocument, wDict: any): number {
    try {
      const p = wDict?.get?.('P');
      if (!p) return -1;

      const pages = doc.getPages();
      const pRef = p?.ref ?? p;

      for (let i = 0; i < pages.length; i++) {
        const anyPage = pages[i] as any;
        const pageRef = anyPage?.ref ?? anyPage?.node?.ref;
        if (pageRef && pRef && String(pageRef) === String(pRef)) return i + 1;
      }
      return -1;
    } catch {
      return -1;
    }
  }

  // ---- misc ----
  private fail(message: string) {
    this.status.set('error');
    this.errorMessage.set(message);
  }

  private flashTip(message: string) {
    this.tipMessage.set(message);
    window.setTimeout(() => this.tipMessage.set(''), 2600);
  }

  formatBytes(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  protected readonly JSON = JSON;
}
