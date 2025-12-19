import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  label: string;
  final: number;
  rate: number; // X en %, peut être négatif
};

type ChangedField = 'final' | 'rate' | 'precision';

@Component({
  selector: 'app-percentage-reverse-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    TagModule,
    MathFormulaComponent,
  ],
  templateUrl: './percentage-reverse-tool.component.html',
  styleUrl: './percentage-reverse-tool.component.scss',
})
export class PercentageReverseToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: 'Après -20% : 80', final: 80, rate: -20 },
    { label: 'Après +10% : 110', final: 110, rate: 10 },
    { label: 'Après -15% : 255', final: 255, rate: -15 },
    { label: 'Après +25% : 500', final: 500, rate: 25 },
  ];

  form = this.fb.group({
    final: [80, [Validators.required]],
    rate: [-20, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private finalSig = signal<number | null>(this.form.value.final ?? null);
  private rateSig = signal<number | null>(this.form.value.rate ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevF = this.finalSig();
      const prevR = this.rateSig();
      const prevP = this.precisionSig();

      const nextF = v.final ?? null;
      const nextR = v.rate ?? null;
      const nextP = v.precision ?? 2;

      if (nextF !== prevF) this.lastChanged.set('final');
      else if (nextR !== prevR) this.lastChanged.set('rate');
      else if (nextP !== prevP) this.lastChanged.set('precision');

      this.manualStepId.set(null);

      this.finalSig.set(nextF);
      this.rateSig.set(nextR);
      this.precisionSig.set(nextP);
    });
  }

  readonly coeff = computed(() => {
    const r = this.rateSig();
    if (r == null) return null;
    return 1 + r / 100;
  });

  readonly isCoeffZero = computed(() => (this.coeff() ?? 0) === 0);

  readonly initial = computed(() => {
    const f = this.finalSig();
    const c = this.coeff();
    if (f == null || c == null) return null;
    if (c === 0) return null;
    return f / c;
  });

  readonly checkLabel = computed(() => {
    const f = this.finalSig();
    const i = this.initial();
    const c = this.coeff();
    if (f == null || i == null || c == null) return '—';
    const back = i * c;
    return `${this.fmt(back)} → ${this.fmt(f)}`;
  });

  // Step auto
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'rate') return 's1';
    if (last === 'final') return 's2';
    return null;
  });

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  readonly formulaSteps = computed(() => {
    const final = this.finalSig() ?? 0;
    const rate = this.rateSig() ?? 0;

    const c = 1 + rate / 100;
    const divOk = c !== 0;

    const init = divOk ? final / c : 0;
    const back = divOk ? init * c : 0;

    return [
      // Step 1 : coefficient
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
1 + \dfrac{{{rate}}}{100} &= {{c}}
\end{aligned}`,
        vars: { rate, c },
      },
      // Step 2 : inversion
      {
        id: 's2',
        latex: divOk
          ? String.raw`\begin{aligned}
\dfrac{{{final}}}{{{c}}} &= {{init}}
\end{aligned}`
          : String.raw`\begin{aligned}
\dfrac{{{final}}}{0} &= \text{?}
\end{aligned}`,
        vars: { final, c, init },
      },
      // Step 3 : vérification
      {
        id: 's3',
        latex: divOk
          ? String.raw`\begin{aligned}
{{init}}\times{{c}} &= {{back}}
\end{aligned}`
          : String.raw`\begin{aligned}
\text{?}\times 0 &= \text{?}
\end{aligned}`,
        vars: { init, c, back },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ final: ex.final, rate: ex.rate });
  }

  reset() {
    this.form.reset({ final: 80, rate: -20, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }
}
