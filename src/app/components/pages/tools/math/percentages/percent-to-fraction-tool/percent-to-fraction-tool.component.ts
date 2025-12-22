import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Mode = 'pctToFrac' | 'fracToPct';
type ChangedField = 'mode' | 'pct' | 'num' | 'den' | 'precision';

@Component({
  selector: 'app-percent-to-fraction-tool',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    SelectButtonModule,
    MathFormulaComponent,
  ],
  templateUrl: './percent-to-fraction-tool.component.html',
  styleUrl: './percent-to-fraction-tool.component.scss',
})
export class PercentToFractionToolComponent {
  private fb = new FormBuilder();

  modeOptions = [
    { label: $localize`:@@pct_frac_mode_pct:% → fraction`, value: 'pctToFrac' as Mode },
    { label: $localize`:@@pct_frac_mode_frac:fraction → %`, value: 'fracToPct' as Mode },
  ];

  form = this.fb.group({
    mode: ['pctToFrac' as Mode, [Validators.required]],
    pct: [12.5, [Validators.required]],
    num: [1, [Validators.required]],
    den: [8, [Validators.required, Validators.min(1)]],
    precision: [6, [Validators.required, Validators.min(0), Validators.max(12)]],
  });

  private modeSig = signal<Mode>(this.form.value.mode ?? 'pctToFrac');
  private pctSig = signal<number | null>(this.form.value.pct ?? null);
  private numSig = signal<number | null>(this.form.value.num ?? null);
  private denSig = signal<number | null>(this.form.value.den ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 6);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prev = {
          mode: this.modeSig(),
          pct: this.pctSig(),
          num: this.numSig(),
          den: this.denSig(),
          prec: this.precisionSig(),
        };

        const nextMode = (this.form.controls.mode.value ?? 'pctToFrac') as Mode;
        const nextPct = this.form.controls.pct.value ?? null;
        const nextNum = this.form.controls.num.value ?? null;
        const nextDen = this.form.controls.den.value ?? null;
        const nextPrec = this.form.controls.precision.value ?? 6;

        if (nextMode !== prev.mode) this.lastChanged.set('mode');
        else if (nextPct !== prev.pct) this.lastChanged.set('pct');
        else if (nextNum !== prev.num) this.lastChanged.set('num');
        else if (nextDen !== prev.den) this.lastChanged.set('den');
        else if (nextPrec !== prev.prec) this.lastChanged.set('precision');

        this.manualStepId.set(null);

        this.modeSig.set(nextMode);
        this.pctSig.set(nextPct);
        this.numSig.set(nextNum);
        this.denSig.set(nextDen);
        this.precisionSig.set(nextPrec);
      });
  }

  mode = computed(() => this.modeSig());

  // --- canonical decimal value of the proportion
  readonly decimal = computed(() => {
    const m = this.modeSig();
    if (m === 'pctToFrac') {
      const p = this.pctSig();
      if (p == null) return null;
      return p / 100;
    }
    const a = this.numSig();
    const b = this.denSig();
    if (a == null || b == null || b === 0) return null;
    return a / b;
  });

  readonly percent = computed(() => {
    const d = this.decimal();
    if (d == null) return null;
    return d * 100;
  });

  readonly fraction = computed(() => {
    const m = this.modeSig();

    if (m === 'pctToFrac') {
      const p = this.pctSig();
      if (p == null) return null;
      // p/100 -> fraction, handle decimals by scaling
      return this.fractionFromDecimal(p / 100);
    }

    const a = this.numSig();
    const b = this.denSig();
    if (a == null || b == null || b === 0) return null;
    const g = this.gcd(Math.abs(a), Math.abs(b));
    return { num: a / g, den: b / g };
  });

  warning = computed(() => {
    const m = this.modeSig();
    if (m === 'fracToPct') {
      const den = this.denSig();
      if (den === 0) return $localize`:@@pct_frac_warn_den0:Le dénominateur ne peut pas être 0.`;
    }
    return null;
  });

  fractionText(): string {
    const f = this.fraction();
    if (!f) return '—';
    return `${f.num}/${f.den}`;
  }

  decimalText(): string {
    const d = this.decimal();
    if (d == null) return '—';
    const p = this.precisionSig();
    return Number(d.toFixed(p)).toFixed(p);
  }

  percentText(): string {
    const p = this.percent();
    if (p == null) return '—';
    const prec = this.precisionSig();
    return `${Number(p.toFixed(prec)).toFixed(prec)}%`;
  }

  // --- Formula steps
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;
    return this.modeSig() === 'pctToFrac' ? 's1' : 's2';
  });

  readonly formulaSteps = computed(() => {
    const mode = this.modeSig();

    const pct = this.pctSig() ?? 0;
    const num = this.numSig() ?? 0;
    const den = this.denSig() ?? 1;

    const frac = this.fraction();
    const dec = this.decimal() ?? 0;
    const per = this.percent() ?? 0;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\dfrac{p}{100} &= \dfrac{${pct}}{100} = {{dec}} \\
{{dec}} &= \dfrac{{{fracNum}}}{{{fracDen}}}
\end{aligned}`,
        vars: { dec, fracNum: frac?.num ?? 0, fracDen: frac?.den ?? 1 },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\dfrac{a}{b}\times 100 &= \dfrac{${num}}{${den}}\times 100 = {{per}}\%
\end{aligned}`,
        vars: { per },
      },
    ];
  });

  // --- examples
  applyExamplePct(pct: number) {
    this.form.patchValue({ mode: 'pctToFrac', pct });
  }

  applyExampleFrac(num: number, den: number) {
    this.form.patchValue({ mode: 'fracToPct', num, den });
  }

  reset() {
    this.form.reset({ mode: 'pctToFrac', pct: 12.5, num: 1, den: 8, precision: 6 });
    this.lastChanged.set(null);
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  // --- Helpers
  private fractionFromDecimal(x: number): { num: number; den: number } | null {
    if (!Number.isFinite(x)) return null;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    if (x === 0) return { num: 0, den: 1 };

    // Convert decimal to fraction by scaling (limit digits)
    const maxDigits = 12;
    const s = x.toString();
    const idx = s.indexOf('.');
    if (idx < 0) return { num: sign * Math.round(x), den: 1 };

    const digits = Math.min(maxDigits, s.length - idx - 1);
    const scale = Math.pow(10, digits);
    const num = Math.round(x * scale);
    const den = scale;

    const g = this.gcd(num, den);
    return { num: sign * (num / g), den: den / g };
  }

  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  onModeChangedCleanup() {
    // pas nécessaire : on gère via computed, mais tu peux y mettre des patchValue selon mode si tu veux.
  }
}
