import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as katex from 'katex';

export type MathFormulaMode = 'plain' | 'katex' | 'steps';

export interface MathFormulaStep {
  id: string;
  title?: string;
  subtitle?: string;
  latex?: string;
  plain?: string;
  vars?: Record<string, number | string | null | undefined>;
}

@Component({
  selector: 'tc-math-formula',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './math-formula.component.html',
  styleUrl: './math-formula.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathFormulaComponent implements AfterViewInit, OnChanges {
  mode = input<MathFormulaMode>('katex');

  label = input<string | null>(null);

  latex = input<string | null>(null);
  plain = input<string | null>(null);

  vars = input<Record<string, number | string | null | undefined> | null>(null);
  precision = input<number>(2);

  steps = input<MathFormulaStep[] | null>(null);

  showStepsNav = input<boolean>(true);
  displayMode = input<boolean>(true);

  activeStepId = input<string | null>(null);

  stepChange = output<string>({ alias: 'stepChange' });

  activeIndex = signal(0);
  katexOk = signal(false);

  @ViewChild('katexHost', { static: false })
  katexHost?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      const forcedId = this.activeStepId();
      const s = this.steps();
      if (forcedId && s?.length) {
        const idx = s.findIndex(x => x.id === forcedId);
        if (idx >= 0) this.activeIndex.set(idx);
      }
    });

    effect(() => {
      void this.resolvedLatex();
      void this.displayMode();
      void this.mode();
      void this.activeIndex();
      queueMicrotask(() => this.renderKatex());
    });
  }

  activeStep = computed(() => {
    const s = this.steps();
    if (!s?.length) return null;
    const i = this.activeIndex();
    return s[Math.min(Math.max(i, 0), s.length - 1)];
  });

  /**
   * ✅ Important : on normalise le LaTeX i18n avant rendu KaTeX.
   * - corrige "\\text" -> "\text" (sinon KaTeX affiche "text")
   * - corrige TAB réel "\t" + "ext" -> "\text" (cas build/i18n)
   */
  resolvedLatex = computed(() => {
    const mode = this.mode();
    const step = this.activeStep();

    const raw = mode === 'steps' ? step?.latex : this.latex();
    if (!raw) return null;

    const vars = (mode === 'steps' ? step?.vars : this.vars()) ?? {};
    const injected = this.injectVars(raw, vars, this.precision());

    return this.normalizeLatex(injected);
  });

  resolvedPlain = computed(() => {
    const mode = this.mode();
    const step = this.activeStep();
    return mode === 'steps' ? (step?.plain ?? null) : this.plain();
  });

  stepCount = computed(() => this.steps()?.length ?? 0);

  ngAfterViewInit(): void {
    this.renderKatex();
  }

  ngOnChanges(_: SimpleChanges): void {
    queueMicrotask(() => this.renderKatex());
  }

  setStep(i: number) {
    this.activeIndex.set(i);

    const s = this.steps();
    const step = s?.[i];
    if (step?.id) this.stepChange.emit(step.id);

    queueMicrotask(() => this.renderKatex());
  }

  private renderKatex(): void {
    const host = this.katexHost?.nativeElement;
    if (!host) return;

    host.innerHTML = '';
    this.katexOk.set(false);

    const expr = this.resolvedLatex();
    if (!expr) return;

    try {
      katex.render(expr, host, {
        throwOnError: false,
        displayMode: this.displayMode(),
        strict: 'ignore',
        trust: true,
      });

      this.katexOk.set(host.childNodes.length > 0);
    } catch {
      host.innerHTML = '';
      this.katexOk.set(false);
    }
  }

  /**
   * Normalisation KaTeX / i18n :
   * - Si ton XLF contient "\\text{...}", KaTeX lit "\\" comme retour à la ligne => il reste "text".
   * - Si une string JS contient "\text", le "\t" peut devenir un TAB réel.
   * On harmonise tout vers "\text", "\times", etc.
   */
  private normalizeLatex(input: string): string {
    let s = input;

    // 1) Convertit les TAB réels + "ext"/"imes" en commandes (cas "\text" mangé en "\t")
    //    Ici, \t dans la regex = caractère TAB.
    s = s
      .replace(/\text\b/g, '\\text')
      .replace(/\times\b/g, '\\times');

    // 2) Réduit les commandes sur-échappées : \\text, \\\text, etc. => \text
    //    (on collapse toute séquence de 2+ backslashes devant la commande)
    const collapse = (cmd: string) => {
      const re = new RegExp(String.raw`\\{2,}${cmd}\b`, 'g');
      s = s.replace(re, `\\${cmd}`);
    };

    for (const cmd of [
      'text',
      'times',
      'dfrac',
      'frac',
      'mathrm',
      'left',
      'right',
      'begin',
      'end',
    ]) {
      collapse(cmd);
    }

    // 3) Pourcentages sur-échappés (\\% => \%)
    s = s.replace(/\\{2,}%/g, '\\%');

    return s;
  }

  private injectVars(
    latex: string,
    vars: Record<string, number | string | null | undefined>,
    precision: number
  ): string {
    return latex.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const v = vars[key];

      if (v === null || v === undefined || v === '') {
        // ✅ String.raw évite le piège "\t" => TAB
        return String.raw`\text{${key}}`;
      }

      if (typeof v === 'number') {
        const s = this.formatNumber(v, precision);
        return s === '-0' ? '0' : s;
      }

      // Texte injecté : on protège KaTeX
      return String(v)
        .replace(/\\/g, '\\\\')
        .replace(/_/g, '\\_')
        .replace(/%/g, '\\%');
    });
  }

  private formatNumber(n: number, precision: number): string {
    if (!Number.isFinite(n)) return String.raw`\text{?}`;

    const p = Math.min(Math.max(precision, 0), 10);

    const factor = Math.pow(10, p);
    const rounded = Math.round((n + Number.EPSILON) * factor) / factor;

    const s = rounded.toFixed(p);
    return s.replace(/\.?0+$/, (m) => (m.startsWith('.') ? '' : m));
  }
}
