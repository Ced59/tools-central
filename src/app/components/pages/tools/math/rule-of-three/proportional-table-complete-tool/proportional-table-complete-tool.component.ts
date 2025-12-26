import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type FilledCell = { row: 'R1' | 'R2'; index: number; value: number };

type StatusCode =
  | 'ok_ready'
  | 'need_one_empty'
  | 'no_reference'
  | 'division_by_zero'
  | 'not_proportional';

@Component({
  selector: 'app-proportional-table-complete-tool',
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
  templateUrl: './proportional-table-complete-tool.component.html',
  styleUrl: './proportional-table-complete-tool.component.scss',
})
export class ProportionalTableCompleteToolComponent {
  readonly maxCols = 8;

  private precisionSig = signal(2);
  readonly precision = computed(() => this.precisionSig());

  private colCountSig = signal(4);
  readonly colCount = computed(() => this.colCountSig());
  readonly cols = computed(() => Array.from({ length: this.colCountSig() }, (_, i) => i));

  private r1Sig = signal<(number | null)[]>([10, 20, 30, null]);
  private r2Sig = signal<(number | null)[]>([25, 50, null, 100]);

  readonly r1 = computed(() => this.r1Sig());
  readonly r2 = computed(() => this.r2Sig());

  readonly gridCols = computed(() =>
    `140px repeat(${this.colCountSig()}, minmax(140px, 1fr))`
  );

  private lastChanged = signal<string | null>(null);
  private manualStepId = signal<string | null>(null);

  setCell(row: 1 | 2, index: number, v: number | null) {
    const next = row === 1 ? [...this.r1Sig()] : [...this.r2Sig()];
    next[index] = (v === undefined ? null : v);
    if (row === 1) this.r1Sig.set(next);
    else this.r2Sig.set(next);

    this.lastChanged.set(`${row}_${index}`);
    this.manualStepId.set(null);
  }

  addCol() {
    if (this.colCountSig() >= this.maxCols) return;
    this.colCountSig.update(n => n + 1);
    this.r1Sig.update(arr => [...arr, null]);
    this.r2Sig.update(arr => [...arr, null]);
    this.lastChanged.set('add');
  }

  removeCol() {
    if (this.colCountSig() <= 2) return;
    this.colCountSig.update(n => n - 1);
    this.r1Sig.update(arr => arr.slice(0, -1));
    this.r2Sig.update(arr => arr.slice(0, -1));
    this.lastChanged.set('remove');
  }

  reset() {
    this.precisionSig.set(2);
    this.colCountSig.set(4);
    this.r1Sig.set([10, 20, 30, null]);
    this.r2Sig.set([25, 50, null, 100]);
    this.lastChanged.set(null);
    this.manualStepId.set(null);
  }

  private completePairs = computed(() => {
    const r1 = this.r1Sig();
    const r2 = this.r2Sig();
    const pairs: { i: number; r1: number; r2: number; k: number }[] = [];

    for (let i = 0; i < this.colCountSig(); i++) {
      const a = r1[i];
      const b = r2[i];
      if (a == null || b == null) continue;
      if (a === 0) return { div0: true, pairs: [] as any[] };
      pairs.push({ i, r1: a, r2: b, k: b / a });
    }
    return { div0: false, pairs };
  });

  readonly k = computed<number | null>(() => {
    const cp = this.completePairs();
    if (cp.div0) return null;
    if (cp.pairs.length === 0) return null;
    // take first ratio as reference
    return cp.pairs[0].k;
  });

  private proportionalOk = computed(() => {
    const cp = this.completePairs();
    if (cp.div0) return false;
    if (cp.pairs.length <= 1) return true; // not enough info to contradict
    const k0 = cp.pairs[0].k;
    // strict-ish compare (avoid floating issues)
    const eps = 1e-9;
    return cp.pairs.every(p => Math.abs(p.k - k0) <= eps * Math.max(1, Math.abs(k0)));
  });

  private emptyCells = computed(() => {
    const r1 = this.r1Sig();
    const r2 = this.r2Sig();
    const empties: { row: 1 | 2; i: number }[] = [];
    for (let i = 0; i < this.colCountSig(); i++) {
      if (r1[i] == null) empties.push({ row: 1, i });
      if (r2[i] == null) empties.push({ row: 2, i });
    }
    return empties;
  });

  readonly statusCode = computed<StatusCode>(() => {
    const cp = this.completePairs();
    if (cp.div0) return 'division_by_zero';

    const empties = this.emptyCells();
    if (empties.length !== 1) return 'need_one_empty';

    if (cp.pairs.length === 0) return 'no_reference';
    if (!this.proportionalOk()) return 'not_proportional';

    // must also be able to compute with reference ratio
    const k = this.k();
    if (k == null) return 'no_reference';

    const e = empties[0];
    // if missing r1 and k==0 => division by zero (because r1 = r2/k)
    if (e.row === 1 && k === 0) return 'division_by_zero';

    return 'ok_ready';
  });

  readonly statusLabel = computed(() => {
    const s = this.statusCode();
    if (s === 'ok_ready') return $localize`:@@pt_status_ok:OK`;
    if (s === 'need_one_empty') return $localize`:@@pt_status_need:Entrées incomplètes`;
    if (s === 'no_reference') return $localize`:@@pt_status_ref:Aucune référence`;
    if (s === 'division_by_zero') return $localize`:@@pt_status_div0:Division par zéro`;
    return $localize`:@@pt_status_not_prop:Non proportionnel`;
  });

  readonly filledCell = computed<FilledCell | null>(() => {
    if (this.statusCode() !== 'ok_ready') return null;

    const k = this.k()!;
    const e = this.emptyCells()[0];
    const r1 = this.r1Sig();
    const r2 = this.r2Sig();

    if (e.row === 2) {
      // r2 = k * r1
      const base = r1[e.i] ?? 0;
      return { row: 'R2', index: e.i, value: k * base };
    } else {
      // r1 = r2 / k
      const top = r2[e.i] ?? 0;
      return { row: 'R1', index: e.i, value: top / k };
    }
  });

  readonly canApplyFill = computed(() => this.filledCell() != null);

  applyFill() {
    const fc = this.filledCell();
    if (!fc) return;

    if (fc.row === 'R1') {
      const next = [...this.r1Sig()];
      next[fc.index] = fc.value;
      this.r1Sig.set(next);
    } else {
      const next = [...this.r2Sig()];
      next[fc.index] = fc.value;
      this.r2Sig.set(next);
    }

    this.lastChanged.set('apply');
    this.manualStepId.set(null);
  }

  readonly activeFormulaStepId = computed(() => this.manualStepId() ?? 's3');

  readonly formulaSteps = computed(() => {
    const k = this.k() ?? 0;
    const fc = this.filledCell();

    // Find a reference column (first complete pair)
    const cp = this.completePairs();
    const ref = (!cp.div0 && cp.pairs.length > 0) ? cp.pairs[0] : null;

    const refR1 = ref?.r1 ?? 0;
    const refR2 = ref?.r2 ?? 0;

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
k &= \dfrac{ {{refR2}} }{ {{refR1}} } = {{k}}
\end{aligned}`,
        vars: { refR1, refR2, k },
      },
      {
        id: 's3',
        latex: fc
          ? (fc.row === 'R2'
            ? String.raw`\begin{aligned}
r2 &= k\cdot r1 \\
x &= {{k}}\cdot {{r1}} = {{x}}
\end{aligned}`
            : String.raw`\begin{aligned}
r1 &= \dfrac{r2}{k} \\
x &= \dfrac{ {{r2}} }{ {{k}} } = {{x}}
\end{aligned}`)
          : String.raw`\begin{aligned}
\text{(fill one empty cell)}
\end{aligned}`,
        vars: fc
          ? (fc.row === 'R2'
            ? { k, r1: this.r1Sig()[fc.index] ?? 0, x: fc.value }
            : { k, r2: this.r2Sig()[fc.index] ?? 0, x: fc.value })
          : {},
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
