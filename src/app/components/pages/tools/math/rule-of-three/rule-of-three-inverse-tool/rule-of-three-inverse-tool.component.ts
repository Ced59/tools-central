import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  selector: 'app-rule-of-three-inverse-tool',
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
  templateUrl: './rule-of-three-inverse-tool.component.html',
  styleUrl: './rule-of-three-inverse-tool.component.scss',
})
export class RuleOfThreeInverseToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@rot3_inv_ex1:10 · 20 = 5 · x`, a: 10, b: 20, c: 5 },      // x=40
    { label: $localize`:@@rot3_inv_ex2:4 · 30 = 6 · x`, a: 4, b: 30, c: 6 },        // x=20
    { label: $localize`:@@rot3_inv_ex3:12 · 8 = 3 · x`, a: 12, b: 8, c: 3 },        // x=32
  ];

  form = this.fb.group({
    a: [10, [Validators.required]],
    b: [20, [Validators.required]],
    c: [5, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private cSig = signal<number | null>(this.form.value.c ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // Expose for template (avoid TS2339)
  readonly a = computed(() => this.aSig());
  readonly b = computed(() => this.bSig());
  readonly c = computed(() => this.cSig());

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

  readonly cIsZero = computed(() => (this.cSig() ?? 0) === 0);

  readonly product = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    if (a == null || b == null) return null;
    return a * b;
  });

  readonly x = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    const c = this.cSig();
    if (a == null || b == null || c == null) return null;
    if (c === 0) return null;
    return (a * b) / c;
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

    const prod = a * b;
    const x = c === 0 ? 0 : prod / c;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
a\cdot b &= {{prod}}
\end{aligned}`,
        vars: { a, b, prod },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
a\cdot b &= c\cdot x
\end{aligned}`,
        vars: { a, b, c },
      },
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
c &\neq 0
\end{aligned}`,
        vars: {},
      },
      {
        id: 's4',
        latex: String.raw`\begin{aligned}
x &= \dfrac{a\cdot b}{c} \\
x &= \dfrac{ {{a}}\cdot {{b}} }{ {{c}} } = {{x}}
\end{aligned}`,
        vars: { a, b, c, x },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ a: ex.a, b: ex.b, c: ex.c });
  }

  reset() {
    this.form.reset({ a: 10, b: 20, c: 5, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    return Number(n.toFixed(p)).toFixed(p);
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
