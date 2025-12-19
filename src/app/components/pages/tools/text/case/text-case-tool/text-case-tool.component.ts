import { Component, computed, signal } from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import {RouterLink} from "@angular/router";

type CaseMode = 'upper' | 'lower' | 'invert' | 'sentence' | 'title';

type TextCaseExample = {
  label: string;
  text: string;
  mode: CaseMode;
};

@Component({
  selector: 'app-text-case-tool',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    CardModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    TagModule,
    NgForOf,
    RouterLink,
  ],
  templateUrl: './text-case-tool.component.html',
  styleUrl: './text-case-tool.component.scss',
})
export class TextCaseToolComponent {
  private fb = new FormBuilder();

  protected readonly locale =
    (typeof document !== 'undefined' ? document.documentElement.lang : 'en') || 'en';

  form = this.fb.group({
    input: ['', [Validators.required]],
    mode: ['upper' as CaseMode, [Validators.required]],
  });

  private inputSig = signal<string>('');
  private modeSig = signal<CaseMode>('upper');

  input = computed(() => this.inputSig());
  mode = computed(() => this.modeSig());

  output = computed(() => this.transform(this.input(), this.mode()));

  actionHasEffect = computed(() => {
    const i = this.input();
    if (!i) return false;
    return this.output() !== i;
  });

  probablyNoCaseScript = computed(() => {
    const text = this.input();
    if (!text) return false;
    return text.toLocaleUpperCase(this.locale) === text.toLocaleLowerCase(this.locale);
  });

  /** ✅ Label SEO/UX de l’action courante */
  modeLabel = computed(() => this.modeLabelOf(this.mode()));

  /** ✅ Labels par mode (i18n build-time via $localize, OK prerender) */
  private readonly modeLabels: Record<CaseMode, string> = {
    upper: $localize`:@@text_case_mode_upper:MAJUSCULES`,
    lower: $localize`:@@text_case_mode_lower:minuscules`,
    invert: $localize`:@@text_case_mode_invert:Inverser la casse`,
    sentence: $localize`:@@text_case_mode_sentence:Casse “phrase”`,
    title: $localize`:@@text_case_mode_title:Casse “titre”`,
  };

  modeLabelOf(mode: CaseMode): string {
    return this.modeLabels[mode];
  }

  examples: TextCaseExample[] = [
    {
      label: $localize`:@@text_case_ex_1:bonjour tout le monde`,
      text: 'bonjour tout le monde',
      mode: 'title',
    },
    {
      label: $localize`:@@text_case_ex_2:JE SUIS LÀ`,
      text: 'JE SUIS LÀ',
      mode: 'lower',
    },
    {
      label: $localize`:@@text_case_ex_3:Déjà En MAJUSCULES`,
      text: 'Déjà En MAJUSCULES',
      mode: 'upper',
    },
    {
      label: $localize`:@@text_case_ex_4:uNe CaSSe bIzArRe`,
      text: 'uNe CaSSe bIzArRe',
      mode: 'invert',
    },
    {
      label: $localize`:@@text_case_ex_5:Phrases automatiques`,
      text: 'ceci est une phrase. en voici une autre !',
      mode: 'sentence',
    },
    {
      label: $localize`:@@text_case_ex_6:istanbul I i (turc)`,
      text: 'istanbul I i',
      mode: 'upper',
    },
    {
      label: $localize`:@@text_case_ex_7:hello-world_from tools`,
      text: 'hello-world_from tools',
      mode: 'title',
    },
    {
      label: $localize`:@@text_case_ex_8:日本語 ひらがな (sans casse)`,
      text: '日本語 ひらがな',
      mode: 'upper',
    },
  ];

  constructor() {
    this.form.controls.input.valueChanges.subscribe((v) =>
      this.inputSig.set((v ?? '').toString())
    );
    this.form.controls.mode.valueChanges.subscribe((v) =>
      this.modeSig.set(((v ?? 'upper') as CaseMode) ?? 'upper')
    );

    this.inputSig.set((this.form.controls.input.value ?? '').toString());
    this.modeSig.set((this.form.controls.mode.value ?? 'upper') as CaseMode);
  }

  applyMode(mode: CaseMode) {
    this.form.patchValue({ mode }, { emitEvent: true });
    this.modeSig.set(mode);
  }

  clear() {
    this.form.reset({ input: '', mode: 'upper' });
    this.inputSig.set('');
    this.modeSig.set('upper');
  }

  copy() {
    const text = this.output();
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  applyExample(example: TextCaseExample) {
    this.form.setValue({ input: example.text, mode: example.mode });
    this.inputSig.set(example.text);
    this.modeSig.set(example.mode);
  }

  private transform(text: string, mode: CaseMode): string {
    if (!text) return '';

    switch (mode) {
      case 'upper':
        return text.toLocaleUpperCase(this.locale);
      case 'lower':
        return text.toLocaleLowerCase(this.locale);
      case 'invert':
        return this.invertCase(text);
      case 'sentence':
        return this.sentenceCase(text);
      case 'title':
        return this.titleCase(text);
      default:
        return text;
    }
  }

  private invertCase(text: string): string {
    return Array.from(text)
      .map((ch) => {
        const up = ch.toLocaleUpperCase(this.locale);
        const low = ch.toLocaleLowerCase(this.locale);
        if (ch === up && ch !== low) return low;
        if (ch === low && ch !== up) return up;
        return ch;
      })
      .join('');
  }

  private sentenceCase(text: string): string {
    const lower = text.toLocaleLowerCase(this.locale);
    let result = '';
    let capNext = true;

    for (const ch of Array.from(lower)) {
      if (capNext && this.isLetter(ch)) {
        result += ch.toLocaleUpperCase(this.locale);
        capNext = false;
        continue;
      }
      result += ch;

      // Déclenche capitalisation après ponctuation / nouvelle ligne
      if (/[.!?…]/.test(ch)) capNext = true;
      if (ch === '\n') capNext = true;
    }

    return result;
  }

  private titleCase(text: string): string {
    const lower = text.toLocaleLowerCase(this.locale);

    // Capitalise la première lettre après séparateurs courants
    return lower.replace(
      /(^|[\s\-’'("]+)(\p{L})/gu,
      (_full, sep, letter) => `${sep}${letter.toLocaleUpperCase(this.locale)}`
    );
  }

  private isLetter(ch: string): boolean {
    return /\p{L}/u.test(ch);
  }
}
