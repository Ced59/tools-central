import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type ChangedField = 'a' | 'b' | 'precision';

@Component({
  selector: 'app-ratio-to-percentage-tool',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    MathFormulaComponent,
  ],
  templateUrl: './ratio-to-percentage-tool.component.html',
  styleUrl: './ratio-to-percentage-tool.component.scss',
})
export class RatioToPercentageToolComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    a: [25, [Validators.required]],
    b: [200, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevA = this.aSig();
        const prevB = this.bSig();
        const prevP = this.precisionSig();

        const nextA = this.form.controls.a.value ?? null;
        const nextB = this.form.controls.b.value ?? null;
        const nextP = this.form.controls.precision.value ?? 2;

        if (nextA !== prevA) this.lastChanged.set('a');
        else if (nextB !== prevB) this.lastChanged.set('b');
        else if (nextP !== prevP) this.lastChanged.set('precision');

        this.manualStepId.set(null);

        this.aSig.set(nextA);
        this.bSig.set(nextB);
        this.precisionSig.set(nextP);
      });
  }

  readonly pctAB = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null || b === 0) return null;
    return (a / b) * 100;
  });

  readonly pctBA = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null || a === 0) return null;
    return (b / a) * 100;
  });

  readonly ratioReduced = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;

    // réduction uniquement si "presque entiers"
    const ai = this.toSafeInt(a);
    const bi = this.toSafeInt(b);
    if (ai == null || bi == null) return null;

    const g = this.gcd(Math.abs(ai), Math.abs(bi));
    if (g === 0) return null;
    return { a: ai / g, b: bi / g };
  });

  readonly shareA = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    const s = a + b;
    if (s === 0) return null;
    return (a / s) * 100;
  });

  readonly shareB = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    const s = a + b;
    if (s === 0) return null;
    return (b / s) * 100;
  });

  warning = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    if (b === 0) return $localize`:@@ratio_pct_warn_b_zero:B vaut 0 : A/B n’est pas défini.`;
    if (a === 0) return $localize`:@@ratio_pct_warn_a_zero:A vaut 0 : B/A n’est pas défini.`;
    return null;
  });

  ratioText(): string {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return '—';

    const r = this.ratioReduced();
    if (r) return `${r.a}:${r.b}`;
    return `${this.fmt(a)}:${this.fmt(b)}`;
  }

  shareText(): string {
    const sa = this.shareA();
    const sb = this.shareB();
    if (sa == null || sb == null) return '—';
    return `A ${this.fmtPct(sa)} • B ${this.fmtPct(sb)}`;
  }

  // formula steps
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'a' || last === 'b') return 's1';
    return 's2';
  });

  readonly formulaSteps = computed(() => {
    const a = this.aSig() ?? 0;
    const b = this.bSig() ?? 0;
    const p1 = this.pctAB() ?? 0;
    const p2 = this.pctBA() ?? 0;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\dfrac{A}{B}\times 100 &= \dfrac{${a}}{${b}}\times 100 = {{p}}\%
\end{aligned}`,
        vars: { p: p1 },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\dfrac{B}{A}\times 100 &= \dfrac{${b}}{${a}}\times 100 = {{p}}\%
\end{aligned}`,
        vars: { p: p2 },
      },
    ];
  });

  applyExample(a: number, b: number) {
    this.form.patchValue({ a, b });
  }

  reset() {
    this.form.reset({ a: 25, b: 200, precision: 2 });
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

  private toSafeInt(v: number): number | null {
    if (!Number.isFinite(v)) return null;
    const r = Math.round(v);
    // tolérance : 1e-9
    if (Math.abs(v - r) < 1e-9) return r;
    return null;
  }

  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
}
