import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  label: string;
  a: number;
  b: number;
  c: number;
};

type ChangedField = 'a' | 'b' | 'c' | 'precision';

@Component({
  selector: 'app-rule-of-three-simple-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    ReactiveFormsModule,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    MathFormulaComponent,
  ],
  templateUrl: './rule-of-three-simple-tool.component.html',
  styleUrl: './rule-of-three-simple-tool.component.scss',
})
export class RuleOfThreeSimpleToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@rot3_ex1:10 → 25, 4 → x`, a: 10, b: 25, c: 4 },         // x=10
    { label: $localize`:@@rot3_ex2:3 → 120, 5 → x`, a: 3, b: 120, c: 5 },          // x=200
    { label: $localize`:@@rot3_ex3:8 → 1.6, 2 → x`, a: 8, b: 1.6, c: 2 },          // x=0.4
    { label: $localize`:@@rot3_ex4:250 → 19.99, 1000 → x`, a: 250, b: 19.99, c: 1000 }, // x=79.96
  ];

  form = this.fb.group({
    a: [10, [Validators.required]],
    b: [25, [Validators.required]],
    c: [4, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private cSig = signal<number | null>(this.form.value.c ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevA = this.aSig();
      const prevB = this.bSig();
      const prevC = this.cSig();
      const prevP = this.precisionSig();

      const nextA = v.a ?? null;
      const nextB = v.b ?? null;
      const nextC = v.c ?? null;
      const nextP = v.precision ?? 2;

      if (nextA !== prevA) this.lastChanged.set('a');
      else if (nextB !== prevB) this.lastChanged.set('b');
      else if (nextC !== prevC) this.lastChanged.set('c');
      else if (nextP !== prevP) this.lastChanged.set('precision');

      this.manualStepId.set(null);

      this.aSig.set(nextA);
      this.bSig.set(nextB);
      this.cSig.set(nextC);
      this.precisionSig.set(nextP);
    });
  }

  readonly aIsZero = computed(() => (this.aSig() ?? 0) === 0);

  readonly ratio = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return b / a;
  });

  readonly x = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    const c = this.cSig();
    if (a == null || b == null || c == null) return null;
    if (a === 0) return null;
    return (b * c) / a;
  });

  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'a') return 's1';
    if (last === 'b') return 's2';
    if (last === 'c') return 's3';
    return 's4';
  });

  readonly formulaSteps = computed(() => {
    const a = this.aSig() ?? 0;
    const b = this.bSig() ?? 0;
    const c = this.cSig() ?? 0;

    const r = a === 0 ? 0 : b / a;
    const x = a === 0 ? 0 : (b * c) / a;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
a &\neq 0
\end{aligned}`,
        vars: {},
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
\dfrac{b}{a} &= {{r}}
\end{aligned}`,
        vars: { a, b, r },
      },
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
\dfrac{b}{a} &= \dfrac{x}{c}
\end{aligned}`,
        vars: { a, b, c },
      },
      {
        id: 's4',
        latex: String.raw`\begin{aligned}
x &= \dfrac{b\times c}{a} \\
x &= \dfrac{ {{b}}\times {{c}} }{ {{a}} } = {{x}}
\end{aligned}`,
        vars: { a, b, c, x },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ a: ex.a, b: ex.b, c: ex.c });
  }

  reset() {
    this.form.reset({ a: 10, b: 25, c: 4, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return Number(n.toFixed(this.precisionSig())).toFixed(this.precisionSig());
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
