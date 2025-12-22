import { Component, computed, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  base: number | null;
  percents: number[];
};

type ChangedField = 'base' | 'precision' | 'percents';

@Component({
  selector: 'app-percentage-composition-tool',
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
  templateUrl: './percentage-composition-tool.component.html',
  styleUrl: './percentage-composition-tool.component.scss',
})
export class PercentageCompositionToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { base: 1000, percents: [20, 30, 50] },      // 3% => 30
    { base: 500, percents: [10, 25] },           // 2,5% => 12,5
    { base: 2000, percents: [60, 40] },          // 24% => 480
    { base: null, percents: [12.5, 8, 15] },     // % global sans valeur finale
  ];

  form = this.fb.group({
    base: [1000],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
    percents: this.fb.array([this.fb.control(20, [Validators.required])]),
  });

  // --- Signals
  private baseSig = signal<number | null>(this.form.value.base ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);
  private percentsSig = signal<number[]>(this.getPercentsRaw());

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevBase = this.baseSig();
        const prevPrec = this.precisionSig();
        const prevPercents = this.percentsSig();

        const nextBase = this.form.controls.base.value ?? null;
        const nextPrec = this.form.controls.precision.value ?? 2;
        const nextPercents = this.getPercentsRaw();

        if (nextBase !== prevBase) this.lastChanged.set('base');
        else if (nextPrec !== prevPrec) this.lastChanged.set('precision');
        else if (JSON.stringify(nextPercents) !== JSON.stringify(prevPercents)) this.lastChanged.set('percents');

        this.manualStepId.set(null);

        this.baseSig.set(nextBase);
        this.precisionSig.set(nextPrec);
        this.percentsSig.set(nextPercents);
      });
  }

  // --- FormArray helpers
  get percentsArray(): FormArray {
    return this.form.controls.percents as FormArray;
  }

  percentCtrlAt(i: number) {
    return this.percentsArray.at(i);
  }

  addPercent(value = 0) {
    this.percentsArray.push(this.fb.control(value, [Validators.required]));
    this.lastChanged.set('percents');
  }

  removePercent(i: number) {
    if (this.percentsArray.length <= 1) return;
    this.percentsArray.removeAt(i);
    this.lastChanged.set('percents');
  }

  clearPercents() {
    while (this.percentsArray.length > 1) this.percentsArray.removeAt(0);
    this.percentsArray.at(0).setValue(0);
    this.lastChanged.set('percents');
  }

  private getPercentsRaw(): number[] {
    const arr = this.percentsArray?.controls ?? [];
    return arr.map(c => (c.value ?? 0) as number);
  }

  // --- Calculs
  readonly coef = computed(() => {
    const ps = this.percentsSig();
    let c = 1;
    for (const p of ps) c *= p / 100;
    return c;
  });

  readonly globalPercent = computed(() => this.coef() * 100);

  readonly finalValue = computed(() => {
    const base = this.baseSig();
    if (base == null) return null;
    return base * this.coef();
  });

  // --- Active formula step
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'percents') return 's1';
    if (last === 'base') return 's2';
    return 's3';
  });

  // --- Formule (steps)
  readonly formulaSteps = computed(() => {
    const ps = this.percentsSig();
    const base = this.baseSig() ?? 0;

    const maxExpand = 4;

    const expanded =
      ps.length <= maxExpand
        ? ps.map(p => `(${this.numToLatex(p)}/100)`).join('\\times ')
        : String.raw`\prod_{i=1}^{${ps.length}} \frac{p_i}{100}`;

    const coef = this.coef();
    const pct = coef * 100;
    const final = base * coef;

    return [
      {
        id: 's1',
        latex: ps.length <= maxExpand
          ? String.raw`\begin{aligned}
${expanded} &= {{coef}}
\end{aligned}`
          : String.raw`\begin{aligned}
\prod_{i=1}^{${ps.length}} \frac{p_i}{100} &= {{coef}}
\end{aligned}`,
        vars: { coef },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
{{base}}\times {{coef}} &= {{final}}
\end{aligned}`,
        vars: { base, coef, final },
      },
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
{{coef}}\times 100 &= {{pct}}\%
\end{aligned}`,
        vars: { coef, pct },
      },
    ];
  });

  applyExample(ex: Example) {
    while (this.percentsArray.length) this.percentsArray.removeAt(0);
    for (const p of ex.percents) this.percentsArray.push(this.fb.control(p, [Validators.required]));
    this.form.patchValue({ base: ex.base });
    this.lastChanged.set('percents');
  }

  reset() {
    this.form.reset({ base: 1000, precision: 2 });
    while (this.percentsArray.length) this.percentsArray.removeAt(0);
    this.percentsArray.push(this.fb.control(20, [Validators.required]));
    this.lastChanged.set(null);
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

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  private numToLatex(n: number): string {
    if (!Number.isFinite(n)) return '0';
    return String(Number(n.toFixed(6)));
  }
}
