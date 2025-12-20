import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  a: number;     // taux A (%)
  b: number;     // taux B (%)
  base: number;  // valeur de base
};

type ChangedField = 'a' | 'b' | 'base' | 'precision';

@Component({
  selector: 'app-compare-percentages-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    MathFormulaComponent,
  ],
  templateUrl: './compare-percentages-tool.component.html',
  styleUrl: './compare-percentages-tool.component.scss',
})
export class ComparePercentagesToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { a: 10, b: 20, base: 1000 },
    { a: 5, b: 7.5, base: 200 },
    { a: -2, b: 3, base: 5000 },
    { a: 15, b: 12, base: 1200 },
  ];

  form = this.fb.group({
    a: [10, [Validators.required]],
    b: [20, [Validators.required]],
    base: [1000, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals
  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private baseSig = signal<number | null>(this.form.value.base ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevA = this.aSig();
      const prevB = this.bSig();
      const prevBase = this.baseSig();
      const prevPrec = this.precisionSig();

      const nextA = v.a ?? null;
      const nextB = v.b ?? null;
      const nextBase = v.base ?? null;
      const nextPrec = v.precision ?? 2;

      if (nextA !== prevA) this.lastChanged.set('a');
      else if (nextB !== prevB) this.lastChanged.set('b');
      else if (nextBase !== prevBase) this.lastChanged.set('base');
      else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

      this.manualStepId.set(null);

      this.aSig.set(nextA);
      this.bSig.set(nextB);
      this.baseSig.set(nextBase);
      this.precisionSig.set(nextPrec);
    });
  }

  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'a' || last === 'base') return 's1';
    if (last === 'b') return 's2';
    return 's3';
  });

  // Coefficients multiplicateurs
  readonly coefA = computed(() => {
    const a = this.aSig();
    if (a == null) return null;
    return 1 + a / 100;
  });

  readonly coefB = computed(() => {
    const b = this.bSig();
    if (b == null) return null;
    return 1 + b / 100;
  });

  // Valeurs finales après application du taux sur la base
  readonly valueA = computed(() => {
    const base = this.baseSig();
    const coef = this.coefA();
    if (base == null || coef == null) return null;
    return base * coef;
  });

  readonly valueB = computed(() => {
    const base = this.baseSig();
    const coef = this.coefB();
    if (base == null || coef == null) return null;
    return base * coef;
  });

  // Écart d'impact (absolu)
  readonly impactDiff = computed(() => {
    const va = this.valueA();
    const vb = this.valueB();
    if (va == null || vb == null) return null;
    return vb - va;
  });

  // Écart relatif d'impact (par rapport à la valeur obtenue avec A)
  readonly impactDiffPercent = computed(() => {
    const va = this.valueA();
    const d = this.impactDiff();
    if (va == null || d == null) return null;
    if (va === 0) return null;
    return (d / va) * 100;
  });

  readonly formulaSteps = computed(() => {
    const a = this.aSig() ?? 0;
    const b = this.bSig() ?? 0;
    const base = this.baseSig() ?? 0;

    const ca = 1 + a / 100;
    const cb = 1 + b / 100;

    const va = base * ca;
    const vb = base * cb;

    const d = vb - va;
    const dp = va === 0 ? 0 : (d / va) * 100;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
{{base}}\times (1+\dfrac{ {{a}} }{100}) &= {{va}}
\end{aligned}`,
        vars: { base, a, va },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
{{base}}\times (1+\dfrac{ {{b}} }{100}) &= {{vb}}
\end{aligned}`,
        vars: { base, b, vb },
      },
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
{{vb}} - {{va}} &= {{d}} \\
\dfrac{ {{d}} }{ {{va}} }\times 100 &= {{dp}}
\end{aligned}`,
        vars: { va, vb, d, dp },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ a: ex.a, b: ex.b, base: ex.base });
  }

  reset() {
    this.form.reset({ a: 10, b: 20, base: 1000, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  fmtPct(n: number | null): string {
    if (n == null) return '—';
    const v = Number(n.toFixed(this.precisionSig()));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.precisionSig())}%`;
  }

  fmtSigned(n: number | null): string {
    if (n == null) return '—';
    const v = Number(n.toFixed(this.precisionSig()));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.precisionSig())}`;
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
