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
  x: number;
  y: number;
};

type ChangedField = 'x' | 'y' | 'precision';

@Component({
  selector: 'app-x-of-y-percentage-tool',
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
  templateUrl: './x-of-y-percentage-tool.component.html',
  styleUrl: './x-of-y-percentage-tool.component.scss',
})
export class XOfYPercentageToolComponent {
  private fb = new FormBuilder();

  // ✅ pas de $localize runtime (SSR/prerender friendly)
  examples: Example[] = [
    { label: '25 sur 200', x: 25, y: 200 },
    { label: '45 sur 60', x: 45, y: 60 },
    { label: '12 sur 80', x: 12, y: 80 },
    { label: '150 sur 120', x: 150, y: 120 }, // > 100%
  ];

  form = this.fb.group({
    x: [25, [Validators.required]],
    y: [200, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals (valeurs)
  private xSig = signal<number | null>(this.form.value.x ?? null);
  private ySig = signal<number | null>(this.form.value.y ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // --- Dernier champ modifié + override manuel pour les steps
  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevX = this.xSig();
      const prevY = this.ySig();
      const prevP = this.precisionSig();

      const nextX = v.x ?? null;
      const nextY = v.y ?? null;
      const nextP = v.precision ?? 2;

      // Priorité : x > y > precision (comme ton autre outil)
      if (nextX !== prevX) this.lastChanged.set('x');
      else if (nextY !== prevY) this.lastChanged.set('y');
      else if (nextP !== prevP) this.lastChanged.set('precision');

      // dès qu'une valeur change => retour auto
      this.manualStepId.set(null);

      this.xSig.set(nextX);
      this.ySig.set(nextY);
      this.precisionSig.set(nextP);
    });
  }

  // --- Helpers
  readonly isYZero = computed(() => (this.ySig() ?? 0) === 0);

  readonly ratio = computed(() => {
    const x = this.xSig();
    const y = this.ySig();
    if (x == null || y == null) return null;
    if (y === 0) return null;
    return x / y;
  });

  readonly percent = computed(() => {
    const r = this.ratio();
    if (r == null) return null;
    return r * 100;
  });

  // "25 sur 100", utile et lisible même si % > 100
  readonly outOf100Label = computed(() => {
    const p = this.percent();
    if (p == null) return '—';
    return `${this.fmt(p)} / 100`;
  });

  // --- Step auto : on met le focus sur la division quand X/Y change
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'x' || last === 'y') return 's1';
    return null;
  });

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  // --- Steps KaTeX
  readonly formulaSteps = computed(() => {
    const x = this.xSig() ?? 0;
    const y = this.ySig() ?? 0;

    const divOk = y !== 0;
    const r = divOk ? x / y : 0;
    const p = divOk ? r * 100 : 0;

    return [
      // Step 1 : ratio
      {
        id: 's1',
        latex: divOk
          ? String.raw`\begin{aligned}
\dfrac{{{x}}}{{{y}}} &= {{r}}
\end{aligned}`
          : String.raw`\begin{aligned}
\dfrac{{{x}}}{0} &= \text{?}
\end{aligned}`,
        vars: { x, y, r },
      },
      // Step 2 : pourcentage
      {
        id: 's2',
        latex: divOk
          ? String.raw`\begin{aligned}
{{r}} \times 100 &= {{p}}
\end{aligned}`
          : String.raw`\begin{aligned}
\text{?} \times 100 &= \text{?}
\end{aligned}`,
        vars: { r, p },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ x: ex.x, y: ex.y });
  }

  reset() {
    this.form.reset({ x: 25, y: 200, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    return n.toFixed(p);
  }

  fmtPct(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    return `${n.toFixed(p)}%`;
  }
}
