import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  label: string;
  percent: number;
  base: number;
};

type ChangedField = 'percent' | 'base' | 'precision';

@Component({
  selector: 'app-percentage-of-number-tool',
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    MathFormulaComponent,
  ],
  templateUrl: './percentage-of-number-tool.component.html',
  styleUrl: './percentage-of-number-tool.component.scss',
})
export class PercentageOfNumberToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@pct_of_ex1:20% de 80`, percent: 20, base: 80 },
    { label: $localize`:@@pct_of_ex2:7,5% de 1 200`, percent: 7.5, base: 1200 },
    { label: $localize`:@@pct_of_ex3:15% de 199,99`, percent: 15, base: 199.99 },
    { label: $localize`:@@pct_of_ex4:2% de 5 000`, percent: 2, base: 5000 },
  ];

  form = this.fb.group({
    percent: [20, [Validators.required]],
    base: [80, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals de valeurs
  private percentSig = signal<number | null>(this.form.value.percent ?? null);
  private baseSig = signal<number | null>(this.form.value.base ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // --- Dernier champ modifié (pour auto-switch step)
  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevP = this.percentSig();
      const prevB = this.baseSig();
      const prevPrec = this.precisionSig();

      const nextP = v.percent ?? null;
      const nextB = v.base ?? null;
      const nextPrec = v.precision ?? 2;

      // Détection du champ modifié (priorité : percent > base > precision)
      if (nextP !== prevP) this.lastChanged.set('percent');
      else if (nextB !== prevB) this.lastChanged.set('base');
      else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

      // dès qu'une valeur change, on repasse en auto
      this.manualStepId.set(null);

      this.percentSig.set(nextP);
      this.baseSig.set(nextB);
      this.precisionSig.set(nextPrec);
    });
  }

  // --- Choix automatique du step affiché
  // base => step "Résultat", percent => step "Coefficient"
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'base') return 's2';
    if (last === 'percent') return 's1';
    return null;
  });


  readonly coefficient = computed(() => {
    const p = this.percentSig();
    if (p == null) return null;
    return p / 100;
  });

  readonly result = computed(() => {
    const p = this.percentSig();
    const b = this.baseSig();
    if (p == null || b == null) return null;
    return (b * p) / 100;
  });

  readonly onePercentValue = computed(() => {
    const b = this.baseSig();
    if (b == null) return null;
    return b / 100;
  });

  readonly formulaSteps = computed(() => {
    const p = this.percentSig() ?? 0;
    const y = this.baseSig() ?? 0;

    const coef = p / 100;
    const res = y * coef;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\text{Coefficient} &= \dfrac{ {{p}} }{100} \\[0.6em]
&= {{coef}}
\end{aligned}`,
        vars: { p, coef },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\text{Résultat} &= {{y}} \times {{coef}} \\[0.6em]
&= {{res}}
\end{aligned}`,
        vars: { y, coef, res },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ percent: ex.percent, base: ex.base });
  }

  reset() {
    this.form.reset({ percent: 20, base: 80, precision: 2 });
    this.lastChanged.set(null); // optionnel
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }


  protected readonly $localize = $localize;
}
