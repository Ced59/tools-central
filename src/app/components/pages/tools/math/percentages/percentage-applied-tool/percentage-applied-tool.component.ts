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
  initial: number;
  final: number;
};

type ChangedField = 'initial' | 'final' | 'precision';

@Component({
  selector: 'app-percentage-applied-tool',
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
  templateUrl: './percentage-applied-tool.component.html',
  styleUrl: './percentage-applied-tool.component.scss',
})
export class PercentageAppliedToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { initial: 80, final: 100 },      // +25%
    { initial: 1200, final: 1110 },   // -7.5%
    { initial: 199.99, final: 229.99 }, // +15.001...
    { initial: 5000, final: 4900 },   // -2%
  ];

  form = this.fb.group({
    initial: [80, [Validators.required]],
    final: [100, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals de valeurs
  private initialSig = signal<number | null>(this.form.value.initial ?? null);
  private finalSig = signal<number | null>(this.form.value.final ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // --- Dernier champ modifié (pour auto-switch step)
  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevI = this.initialSig();
      const prevF = this.finalSig();
      const prevPrec = this.precisionSig();

      const nextI = v.initial ?? null;
      const nextF = v.final ?? null;
      const nextPrec = v.precision ?? 2;

      if (nextI !== prevI) this.lastChanged.set('initial');
      else if (nextF !== prevF) this.lastChanged.set('final');
      else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

      // dès qu'une valeur change, on repasse en auto
      this.manualStepId.set(null);

      this.initialSig.set(nextI);
      this.finalSig.set(nextF);
      this.precisionSig.set(nextPrec);
    });
  }

  // initial => step "Coefficient", final => step "Pourcentage"
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'initial') return 's1';
    if (last === 'final') return 's2';
    return null;
  });

  /** Coefficient multiplicateur = final / initial */
  readonly coefficient = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return null;
    if (i === 0) return null;
    return f / i;
  });

  /** Pourcentage appliqué = (final / initial - 1) * 100 */
  readonly appliedPercent = computed(() => {
    const coef = this.coefficient();
    if (coef == null) return null;
    return (coef - 1) * 100;
  });

  /** Écart absolu = final - initial */
  readonly difference = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return null;
    return f - i;
  });

  readonly formulaSteps = computed(() => {
    const x = this.initialSig() ?? 0;
    const y = this.finalSig() ?? 0;

    const coef = x === 0 ? 0 : y / x;
    const p = (coef - 1) * 100;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\dfrac{ {{y}} }{ {{x}} } &= {{coef}}
\end{aligned}`,
        vars: { x, y, coef },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
({{coef}} - 1)\times 100 &= {{p}}
\end{aligned}`,
        vars: { coef, p },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ initial: ex.initial, final: ex.final });
  }

  reset() {
    this.form.reset({ initial: 80, final: 100, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  /** Format spécial pour un pourcentage avec signe (+/-) */
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
