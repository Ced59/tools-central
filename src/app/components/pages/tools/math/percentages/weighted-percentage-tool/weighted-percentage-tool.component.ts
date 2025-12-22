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

type Row = { rate: number; weight: number };
type Example = { rows: Row[] };
type ChangedField = 'precision' | 'rows';

@Component({
  selector: 'app-weighted-percentage-tool',
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
  templateUrl: './weighted-percentage-tool.component.html',
  styleUrl: './weighted-percentage-tool.component.scss',
})
export class WeightedPercentageToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { rows: [{ rate: 10, weight: 1 }, { rate: 20, weight: 3 }] },      // 17,5%
    { rows: [{ rate: 12, weight: 2 }, { rate: 8, weight: 1 }] },       // 10,666...
    { rows: [{ rate: 5, weight: 10 }, { rate: 15, weight: 10 }] },     // 10%
    { rows: [{ rate: -2, weight: 1 }, { rate: 4, weight: 2 }, { rate: 1, weight: 1 }] },
  ];

  form = this.fb.group({
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
    rows: this.fb.array([this.newRow(10, 1), this.newRow(20, 3)]),
  });

  private precisionSig = signal<number>(this.form.value.precision ?? 2);
  private rowsSig = signal<Row[]>(this.getRowsRaw());

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevPrec = this.precisionSig();
        const prevRows = this.rowsSig();

        const nextPrec = this.form.controls.precision.value ?? 2;
        const nextRows = this.getRowsRaw();

        if (nextPrec !== prevPrec) this.lastChanged.set('precision');
        else if (JSON.stringify(nextRows) !== JSON.stringify(prevRows)) this.lastChanged.set('rows');

        this.manualStepId.set(null);

        this.precisionSig.set(nextPrec);
        this.rowsSig.set(nextRows);
      });
  }

  // --- FormArray helpers
  get rowsArray(): FormArray {
    return this.form.controls.rows as FormArray;
  }

  private newRow(rate = 0, weight = 1) {
    return this.fb.group({
      rate: [rate, [Validators.required]],
      weight: [weight, [Validators.required]],
    });
  }

  rowRateCtrlAt(i: number) {
    return (this.rowsArray.at(i) as any).controls.rate;
  }

  rowWeightCtrlAt(i: number) {
    return (this.rowsArray.at(i) as any).controls.weight;
  }

  addRow(rate = 0, weight = 1) {
    this.rowsArray.push(this.newRow(rate, weight));
    this.lastChanged.set('rows');
  }

  removeRow(i: number) {
    if (this.rowsArray.length <= 1) return;
    this.rowsArray.removeAt(i);
    this.lastChanged.set('rows');
  }

  clearRows() {
    while (this.rowsArray.length > 1) this.rowsArray.removeAt(0);
    // reset 1ère ligne
    (this.rowsArray.at(0) as any).patchValue({ rate: 0, weight: 1 });
    this.lastChanged.set('rows');
  }

  private getRowsRaw(): Row[] {
    const arr = this.rowsArray?.controls ?? [];
    return arr.map((g: any) => ({
      rate: (g.controls.rate.value ?? 0) as number,
      weight: (g.controls.weight.value ?? 0) as number,
    }));
  }

  // --- Calculs
  readonly sumWeights = computed(() => {
    const rows = this.rowsSig();
    return rows.reduce((acc, r) => acc + (r.weight ?? 0), 0);
  });

  readonly weightedSum = computed(() => {
    const rows = this.rowsSig();
    return rows.reduce((acc, r) => acc + (r.rate ?? 0) * (r.weight ?? 0), 0);
  });

  readonly weightedPercent = computed(() => {
    const wSum = this.weightedSum();
    const wTotal = this.sumWeights();
    if (wTotal === 0) return null;
    return wSum / wTotal;
  });

  // --- Active formula step
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'rows') return 's1';
    return 's2';
  });

  // --- Formule (steps)
  readonly formulaSteps = computed(() => {
    const rows = this.rowsSig();
    const wTotal = this.sumWeights();
    const wSum = this.weightedSum();

    const maxExpand = 4;
    const expandedNum =
      rows.length <= maxExpand
        ? rows
          .map(r => `(${this.numToLatex(r.rate)}\\times ${this.numToLatex(r.weight)})`)
          .join(' + ')
        : String.raw`\sum_i (p_i \times w_i)`;

    const expandedDen =
      rows.length <= maxExpand
        ? rows.map(r => `${this.numToLatex(r.weight)}`).join(' + ')
        : String.raw`\sum_i w_i`;

    const pct = wTotal === 0 ? 0 : wSum / wTotal;

    return [
      {
        id: 's1',
        latex: rows.length <= maxExpand
          ? String.raw`\begin{aligned}
\sum(p_i\times w_i) &= ${expandedNum} = {{wsum}}
\end{aligned}`
          : String.raw`\begin{aligned}
\sum_i(p_i\times w_i) &= {{wsum}}
\end{aligned}`,
        vars: { wsum: wSum },
      },
      {
        id: 's2',
        latex: rows.length <= maxExpand
          ? String.raw`\begin{aligned}
\sum w_i &= ${expandedDen} = {{wtotal}} \\
\dfrac{{{wsum}}}{{{wtotal}}} &= {{pct}}\%
\end{aligned}`
          : String.raw`\begin{aligned}
\sum_i w_i &= {{wtotal}} \\
\dfrac{\sum_i(p_i\times w_i)}{\sum_i w_i} &= {{pct}}\%
\end{aligned}`,
        vars: { wtotal: wTotal, wsum: wSum, pct },
      },
    ];
  });

  applyExample(ex: Example) {
    while (this.rowsArray.length) this.rowsArray.removeAt(0);
    for (const r of ex.rows) this.rowsArray.push(this.newRow(r.rate, r.weight));
    if (this.rowsArray.length === 0) this.rowsArray.push(this.newRow(0, 1));
    this.lastChanged.set('rows');
  }

  reset() {
    this.form.reset({ precision: 2 });
    while (this.rowsArray.length) this.rowsArray.removeAt(0);
    this.rowsArray.push(this.newRow(10, 1));
    this.rowsArray.push(this.newRow(20, 3));
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
