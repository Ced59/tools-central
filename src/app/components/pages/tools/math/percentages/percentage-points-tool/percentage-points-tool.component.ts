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
  a: number; // taux initial (%)
  b: number; // taux final (%)
};

type ChangedField = 'a' | 'b' | 'precision';

@Component({
  selector: 'app-percentage-points-tool',
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
  templateUrl: './percentage-points-tool.component.html',
  styleUrl: './percentage-points-tool.component.scss',
})
export class PercentagePointsToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { a: 10, b: 12 },      // +2 pp ; +20%
    { a: 50, b: 40 },      // -10 pp ; -20%
    { a: 2, b: 3 },        // +1 pp ; +50%
    { a: 0.5, b: 1.2 },    // +0.7 pp ; +140%
  ];

  form = this.fb.group({
    a: [10, [Validators.required]],
    b: [12, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevA = this.aSig();
      const prevB = this.bSig();
      const prevPrec = this.precisionSig();

      const nextA = v.a ?? null;
      const nextB = v.b ?? null;
      const nextPrec = v.precision ?? 2;

      if (nextA !== prevA) this.lastChanged.set('a');
      else if (nextB !== prevB) this.lastChanged.set('b');
      else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

      this.manualStepId.set(null);

      this.aSig.set(nextA);
      this.bSig.set(nextB);
      this.precisionSig.set(nextPrec);
    });
  }

  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'a' || last === 'b') return 's1';
    return 's2';
  });

  /** Différence en points de pourcentage (pp) = B - A */
  readonly points = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    return b - a;
  });

  /** Variation relative (%) = (B - A) / A * 100 */
  readonly relativeVariation = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return ((b - a) / a) * 100;
  });

  /** Petit rappel utile : ratio B/A (si A != 0) */
  readonly ratio = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return b / a;
  });

  readonly formulaSteps = computed(() => {
    const a = this.aSig() ?? 0;
    const b = this.bSig() ?? 0;

    const pp = b - a;
    const rel = a === 0 ? 0 : (pp / a) * 100;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
{{b}} - {{a}} &= {{pp}}
\end{aligned}`,
        vars: { a, b, pp },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\dfrac{ {{pp}} }{ {{a}} }\times 100 &= {{rel}}
\end{aligned}`,
        vars: { pp, a, rel },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ a: ex.a, b: ex.b });
  }

  reset() {
    this.form.reset({ a: 10, b: 12, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  fmtSigned(n: number | null): string {
    if (n == null) return '—';
    const v = Number(n.toFixed(this.precisionSig()));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.precisionSig())}`;
  }

  fmtPct(n: number | null): string {
    if (n == null) return '—';
    const v = Number(n.toFixed(this.precisionSig()));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.precisionSig())}%`;
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
