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

type Mode = 'decToPct' | 'pctToDec';
type ChangedField = 'mode' | 'input' | 'precision';

@Component({
  selector: 'app-decimal-to-percentage-tool',
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
  templateUrl: './decimal-to-percentage-tool.component.html',
  styleUrl: './decimal-to-percentage-tool.component.scss',
})
export class DecimalToPercentageToolComponent {
  private fb = new FormBuilder();

  modeOptions = [
    { label: $localize`:@@dec_pct_mode_dec:Décimal → %`, value: 'decToPct' as Mode },
    { label: $localize`:@@dec_pct_mode_pct:% → décimal`, value: 'pctToDec' as Mode },
  ];

  form = this.fb.group({
    mode: ['decToPct' as Mode, [Validators.required]],
    input: [0.125, [Validators.required]],
    precision: [6, [Validators.required, Validators.min(0), Validators.max(12)]],
  });

  private modeSig = signal<Mode>(this.form.value.mode ?? 'decToPct');
  private inputSig = signal<number | null>(this.form.value.input ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 6);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevMode = this.modeSig();
        const prevIn = this.inputSig();
        const prevP = this.precisionSig();

        const nextMode = (this.form.controls.mode.value ?? 'decToPct') as Mode;
        const nextIn = this.form.controls.input.value ?? null;
        const nextP = this.form.controls.precision.value ?? 6;

        if (nextMode !== prevMode) this.lastChanged.set('mode');
        else if (nextIn !== prevIn) this.lastChanged.set('input');
        else if (nextP !== prevP) this.lastChanged.set('precision');

        this.manualStepId.set(null);

        this.modeSig.set(nextMode);
        this.inputSig.set(nextIn);
        this.precisionSig.set(nextP);
      });
  }

  mode = computed(() => this.modeSig());

  readonly result = computed(() => {
    const m = this.modeSig();
    const x = this.inputSig();
    if (x == null) return null;
    return m === 'decToPct' ? x * 100 : x / 100;
  });

  // approx fraction + 1/N
  private approxFraction = computed(() => {
    const x = this.result();
    if (x == null) return null;

    // On approxime la valeur *originale* en décimal pour donner une fraction lisible :
    // - en mode decToPct: la valeur de départ est input
    // - en mode pctToDec: la valeur décimale est result
    const dec = this.modeSig() === 'decToPct' ? (this.inputSig() ?? 0) : x;
    if (!Number.isFinite(dec)) return null;

    const maxDen = 1000;
    const best = this.bestRationalApprox(dec, maxDen);
    if (!best) return null;
    return best; // { num, den }
  });

  fractionText(): string {
    const f = this.approxFraction();
    if (!f) return '—';
    return `${f.num}/${f.den}`;
  }

  oneOverText(): string {
    const f = this.approxFraction();
    if (!f) return '—';
    if (f.num === 1) return `1/${f.den}`;
    return '—';
  }

  resultText(): string {
    const m = this.modeSig();
    const r = this.result();
    if (r == null) return '—';

    const p = this.precisionSig();
    const v = Number(r.toFixed(p));

    return m === 'decToPct'
      ? `${v.toFixed(p)}%`
      : `${v.toFixed(p)}`;
  }

  // formula steps
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;
    return this.modeSig() === 'decToPct' ? 's1' : 's2';
  });

  readonly formulaSteps = computed(() => {
    const x = this.inputSig() ?? 0;
    const r = this.result() ?? 0;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\text{pct} &= \text{décimal}\times 100 = ${x}\times 100 = {{r}}\%
\end{aligned}`,
        vars: { r },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\text{décimal} &= \dfrac{\text{pct}}{100} = \dfrac{${x}}{100} = {{r}}
\end{aligned}`,
        vars: { r },
      },
    ];
  });

  applyExample(mode: Mode, input: number) {
    this.form.patchValue({ mode, input });
  }

  reset() {
    this.form.reset({ mode: 'decToPct', input: 0.125, precision: 6 });
    this.lastChanged.set(null);
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  // --- Rational approximation (simple & robuste)
  private bestRationalApprox(x: number, maxDen: number): { num: number; den: number } | null {
    if (!Number.isFinite(x)) return null;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    // Limites
    if (x === 0) return { num: 0, den: 1 };

    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Infinity;

    for (let den = 1; den <= maxDen; den++) {
      const num = Math.round(x * den);
      const err = Math.abs(x - num / den);
      if (err < bestErr) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
        if (bestErr < 1e-12) break;
      }
    }

    const g = this.gcd(bestNum, bestDen);
    return { num: sign * (bestNum / g), den: bestDen / g };
  }

  private gcd(a: number, b: number): number {
    a = Math.abs(a); b = Math.abs(b);
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }
}
