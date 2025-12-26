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
  selector: 'app-rule-of-three-table-tool',
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
  templateUrl: './rule-of-three-table-tool.component.html',
  styleUrl: './rule-of-three-table-tool.component.scss',
})
export class RuleOfThreeTableToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@rot3_table_ex1:10 → 25, 4 → x`, a: 10, b: 25, c: 4 },
    { label: $localize`:@@rot3_table_ex2:3 → 120, 5 → x`, a: 3, b: 120, c: 5 },
    { label: $localize`:@@rot3_table_ex3:8 → 1.6, 2 → x`, a: 8, b: 1.6, c: 2 },
  ];

  form = this.fb.group({
    a: [10, Validators.required],
    b: [25, Validators.required],
    c: [4, Validators.required],
    precision: [2, [Validators.min(0), Validators.max(6)]],
  });

  private aSig = signal<number | null>(this.form.value.a ?? null);
  private bSig = signal<number | null>(this.form.value.b ?? null);
  private cSig = signal<number | null>(this.form.value.c ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  readonly a = computed(() => this.aSig());
  readonly b = computed(() => this.bSig());
  readonly c = computed(() => this.cSig());

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      if (v.a !== this.aSig()) this.lastChanged.set('a');
      else if (v.b !== this.bSig()) this.lastChanged.set('b');
      else if (v.c !== this.cSig()) this.lastChanged.set('c');
      else this.lastChanged.set('precision');

      this.manualStepId.set(null);

      this.aSig.set(v.a ?? null);
      this.bSig.set(v.b ?? null);
      this.cSig.set(v.c ?? null);
      this.precisionSig.set(v.precision ?? 2);
    });
  }

  readonly aIsZero = computed(() => (this.aSig() ?? 0) === 0);

  readonly x = computed(() => {
    const a = this.aSig();
    const b = this.bSig();
    const c = this.cSig();
    if (a == null || b == null || c == null || a === 0) return null;
    return (b * c) / a;
  });

  readonly activeFormulaStepId = computed(() => {
    if (this.manualStepId()) return this.manualStepId();
    return 's3';
  });

  readonly formulaSteps = computed(() => {
    const a = this.aSig() ?? 0;
    const b = this.bSig() ?? 0;
    const c = this.cSig() ?? 0;
    const x = a === 0 ? 0 : (b * c) / a;

    return [
      {
        id: 's1',
        latex: String.raw`a \neq 0`,
        vars: {},
      },
      {
        id: 's2',
        latex: String.raw`\dfrac{b}{a}`,
        vars: { a, b },
      },
      {
        id: 's3',
        latex: String.raw`
x = \dfrac{b \times c}{a}
= \dfrac{ {{b}} \times {{c}} }{ {{a}} }
= {{x}}
        `,
        vars: { a, b, c, x },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue(ex);
  }

  reset() {
    this.form.reset({ a: 10, b: 25, c: 4, precision: 2 });
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return Number(n.toFixed(this.precisionSig())).toFixed(this.precisionSig());
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
