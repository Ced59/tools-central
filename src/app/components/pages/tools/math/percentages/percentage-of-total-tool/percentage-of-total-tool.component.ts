import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  value: number;
  total: number;
  expected: string;
};

type ChangedField = 'value' | 'total' | 'precision';

@Component({
  selector: 'app-percentage-of-total-tool',
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
  templateUrl: './percentage-of-total-tool.component.html',
  styleUrl: './percentage-of-total-tool.component.scss',
})
export class PercentageOfTotalToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { value: 25, total: 200, expected: '12,5%' },
    { value: 50, total: 80, expected: '62,5%' },
    { value: 300, total: 1200, expected: '25%' },
    { value: 7, total: 12, expected: '58,33%' },
  ];

  form = this.fb.group({
    value: [25, [Validators.required]],
    total: [200, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals
  private valueSig = signal<number | null>(this.form.value.value ?? null);
  private totalSig = signal<number | null>(this.form.value.total ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevV = this.valueSig();
        const prevT = this.totalSig();
        const prevP = this.precisionSig();

        const nextV = this.form.controls.value.value ?? null;
        const nextT = this.form.controls.total.value ?? null;
        const nextP = this.form.controls.precision.value ?? 2;

        if (nextV !== prevV) this.lastChanged.set('value');
        else if (nextT !== prevT) this.lastChanged.set('total');
        else if (nextP !== prevP) this.lastChanged.set('precision');

        // dès qu'une valeur change, on repasse en auto
        this.manualStepId.set(null);

        this.valueSig.set(nextV);
        this.totalSig.set(nextT);
        this.precisionSig.set(nextP);
      });
  }

  // --- Calculs
  readonly ratio = computed(() => {
    const v = this.valueSig();
    const t = this.totalSig();
    if (v == null || t == null || t === 0) return null;
    return v / t;
  });

  readonly percent = computed(() => {
    const r = this.ratio();
    if (r == null) return null;
    return r * 100;
  });

  readonly remaining = computed(() => {
    const v = this.valueSig();
    const t = this.totalSig();
    if (v == null || t == null) return null;
    return t - v;
  });

  readonly remainingPercent = computed(() => {
    const p = this.percent();
    if (p == null) return null;
    return 100 - p;
  });

  readonly showWarning = computed(() => {
    const v = this.valueSig();
    const t = this.totalSig();
    if (v == null || t == null) return false;
    return t !== 0 && v > t;
  });

  // --- Active formula step
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'value' || last === 'total') return 's1';
    return 's2';
  });

  // --- Formule (steps)
  readonly formulaSteps = computed(() => {
    const v = this.valueSig() ?? 0;
    const t = this.totalSig() ?? 0;

    const safeRatio = t === 0 ? null : v / t;
    const safePct = safeRatio == null ? null : safeRatio * 100;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\dfrac{{{value}}}{{{total}}} &= {{ratio}}
\end{aligned}`,
        vars: {
          value: v,
          total: t,
          ratio: safeRatio ?? 0,
        },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
{{ratio}}\times 100 &= {{pct}}\%
\end{aligned}`,
        vars: {
          ratio: safeRatio ?? 0,
          pct: safePct ?? 0,
        },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ value: ex.value, total: ex.total });
    this.lastChanged.set('value');
  }

  reset() {
    this.form.reset({ value: 25, total: 200, precision: 2 });
    this.lastChanged.set(null);
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  fmtPct(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    const v = Number(n.toFixed(p));
    return `${v.toFixed(p)}%`;
  }
}
