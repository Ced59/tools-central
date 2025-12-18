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

  resolvedLatex = computed(() => {
    const mode = this.mode();
    const step = this.activeStep();

    const raw = mode === 'steps' ? step?.latex : this.latex();
    if (!raw) return null;

    const vars = (mode === 'steps' ? step?.vars : this.vars()) ?? {};
    const injected = this.injectVars(raw, vars, this.precision());

    // ✅ Normalisation i18n (ICU) + échappements avant KaTeX
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

  private injectVars(
    latex: string,
    vars: Record<string, number | string | null | undefined>,
    precision: number
  ): string {
    return latex.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const v = vars[key];

      if (v === null || v === undefined || v === '') {
        return String.raw`\text{${key}}`;
      }

      if (typeof v === 'number') {
        const s = this.formatNumber(v, precision);
        return s === '-0' ? '0' : s;
      }

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

  /**
   * ✅ Corrige les effets de bord Angular i18n sur les formules KaTeX
   * - ICU: protège/restaure les accolades { } via entités HTML
   * - \t: possible TAB si \text a été interprété comme séquence d'échappement
   * - \\text: sur-échappement => \text
   */
  private normalizeLatex(input: string): string {
    let s = input;

    // 1) Restaure accolades encodées (pour éviter ICU Angular i18n)
    s = s
      .replace(/&#123;/g, '{')
      .replace(/&#125;/g, '}')
      .replace(/&lbrace;/g, '{')
      .replace(/&rbrace;/g, '}');

    // 2) Répare le cas où \text a été mangé en TAB + "ext"
    //    (ici "\t" dans la regex = caractère TAB)
    s = s.replace(/\text\b/g, '\\text').replace(/\times\b/g, '\\times');

    // 3) Réduit les commandes sur-échappées : \\text, \\\text... => \text
    const collapseCmd = (cmd: string) => {
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
      collapseCmd(cmd);
    }

    // 4) Pourcentages sur-échappés (\\% => \%)
    s = s.replace(/\\{2,}%/g, '\\%');

    return s;
  }
}
