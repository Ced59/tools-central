import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type ResultCode = 'need_data' | 'div0' | 'ok' | 'not_ok';

@Component({
  selector: 'app-proportional-table-check-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    RouterLink,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    MathFormulaComponent,
  ],
  templateUrl: './proportional-table-check-tool.component.html',
  styleUrl: './proportional-table-check-tool.component.scss',
})
export class ProportionalTableCheckToolComponent {
  readonly maxCols = 8;

  private precisionSig = signal(2);
  readonly precision = computed(() => this.precisionSig());

  private colCountSig = signal(4);
  readonly colCount = computed(() => this.colCountSig());
  readonly cols = computed(() => Array.from({ length: this.colCountSig() }, (_, i) => i));

  private r1Sig = signal<(number | null)[]>([10, 20, 30, 40]);
  private r2Sig = signal<(number | null)[]>([25, 50, 75, 100]);

  readonly r1 = computed(() => this.r1Sig());
  readonly r2 = computed(() => this.r2Sig());

  readonly gridCols = computed(() =>
    `140px repeat(${this.colCountSig()}, minmax(140px, 1fr))`
  );

  private manualStepId = signal<string | null>(null);

  setCell(row: 1 | 2, index: number, v: number | null) {
    const next = row === 1 ? [...this.r1Sig()] : [...this.r2Sig()];
    next[index] = (v === undefined ? null : v);
    if (row === 1) this.r1Sig.set(next);
    else this.r2Sig.set(next);
    this.manualStepId.set(null);
  }

  addCol() {
    if (this.colCountSig() >= this.maxCols) return;
    this.colCountSig.update(n => n + 1);
    this.r1Sig.update(arr => [...arr, null]);
    this.r2Sig.update(arr => [...arr, null]);
  }

  removeCol() {
    if (this.colCountSig() <= 2) return;
    this.colCountSig.update(n => n - 1);
    this.r1Sig.update(arr => arr.slice(0, -1));
    this.r2Sig.update(arr => arr.slice(0, -1));
  }

  reset() {
    this.precisionSig.set(2);
    this.colCountSig.set(4);
    this.r1Sig.set([10, 20, 30, 40]);
    this.r2Sig.set([25, 50, 75, 100]);
    this.manualStepId.set(null);
  }

  private completeRatios = computed(() => {
    const r1 = this.r1Sig();
    const r2 = this.r2Sig();
    const ratios: { i: number; k: number }[] = [];
    for (let i = 0; i < this.colCountSig(); i++) {
      const a = r1[i];
      const b = r2[i];
      if (a == null || b == null) continue;
      if (a === 0) return { div0: true, ratios: [] as any[] };
      ratios.push({ i, k: b / a });
    }
    return { div0: false, ratios };
  });

  readonly k = computed<number | null>(() => {
    const cr = this.completeRatios();
    if (cr.div0) return null;
    if (cr.ratios.length === 0) return null;
    return cr.ratios[0].k;
  });

  readonly badCols = computed(() => {
    const cr = this.completeRatios();
    if (cr.div0) return [];
    if (cr.ratios.length <= 1) return [];
    const k0 = cr.ratios[0].k;
    const eps = 1e-9;
    return cr.ratios
      .filter(r => Math.abs(r.k - k0) > eps * Math.max(1, Math.abs(k0)))
      .map(r => String(r.i + 1));
  });

  readonly resultCode = computed<ResultCode>(() => {
    const cr = this.completeRatios();
    if (cr.div0) return 'div0';
    if (cr.ratios.length < 2) return 'need_data';
    return this.badCols().length === 0 ? 'ok' : 'not_ok';
  });

  readonly resultLabel = computed(() => {
    const r = this.resultCode();
    if (r === 'ok') return $localize`:@@pt_check_ok:Proportionnel`;
    if (r === 'not_ok') return $localize`:@@pt_check_not_ok:Non proportionnel`;
    if (r === 'div0') return $localize`:@@pt_check_div0:Division par zéro`;
    return $localize`:@@pt_check_need_data:Données insuffisantes`;
  });

  readonly activeFormulaStepId = computed(() => this.manualStepId() ?? 's2');

  readonly formulaSteps = computed(() => {
    const k = this.k() ?? 0;

    // pick first complete ratio as reference for display
    const r1 = this.r1Sig();
    const r2 = this.r2Sig();
    let refA = 0, refB = 0;
    for (let i = 0; i < this.colCountSig(); i++) {
      if (r1[i] != null && r2[i] != null) { refA = r1[i]!, refB = r2[i]!; break; }
    }

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
k &= \dfrac{r2}{r1}
\end{aligned}`,
        vars: {},
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
k &= \dfrac{ {{refB}} }{ {{refA}} } = {{k}}
\end{aligned}`,
        vars: { refA, refB, k },
      },
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
\text{check } k \text{ is constant}
\end{aligned}`,
        vars: {},
      },
    ];
  });

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    return Number(n.toFixed(p)).toFixed(p);
  }
}
