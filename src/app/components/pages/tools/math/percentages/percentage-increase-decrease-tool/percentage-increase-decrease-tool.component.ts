import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
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
  base: number;
  rate: number; // X (en %). Peut être négatif.
};

type ChangedField = 'base' | 'rate' | 'precision';

@Component({
  selector: 'app-percentage-increase-decrease-tool',
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
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
  ],
  templateUrl: './percentage-increase-decrease-tool.component.html',
  styleUrl: './percentage-increase-decrease-tool.component.scss',
})
export class PercentageIncreaseDecreaseToolComponent {
  private fb = new FormBuilder();

  // ✅ pas de $localize runtime (prerender friendly)
  examples: Example[] = [
    { label: 'Prix 80, +10%', base: 80, rate: 10 },
    { label: 'Salaire 2 000, +3%', base: 2000, rate: 3 },
    { label: 'Remise 120, -15%', base: 120, rate: -15 },
    { label: 'Population 1 250, -8%', base: 1250, rate: -8 },
  ];

  form = this.fb.group({
    base: [80, [Validators.required]],
    rate: [10, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals
  private baseSig = signal<number | null>(this.form.value.base ?? null);
  private rateSig = signal<number | null>(this.form.value.rate ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // --- Dernier champ modifié + override manuel step
  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevB = this.baseSig();
      const prevR = this.rateSig();
      const prevP = this.precisionSig();

      const nextB = v.base ?? null;
      const nextR = v.rate ?? null;
      const nextP = v.precision ?? 2;

      // priorité base > rate > precision
      if (nextB !== prevB) this.lastChanged.set('base');
      else if (nextR !== prevR) this.lastChanged.set('rate');
      else if (nextP !== prevP) this.lastChanged.set('precision');

      // changement => retour auto
      this.manualStepId.set(null);

      this.baseSig.set(nextB);
      this.rateSig.set(nextR);
      this.precisionSig.set(nextP);
    });
  }

  // --- Calculs
  readonly coeff = computed(() => {
    const r = this.rateSig();
    if (r == null) return null;
    return 1 + r / 100;
  });

  readonly finalValue = computed(() => {
    const b = this.baseSig();
    const c = this.coeff();
    if (b == null || c == null) return null;
    return b * c;
  });

  readonly delta = computed(() => {
    const b = this.baseSig();
    const f = this.finalValue();
    if (b == null || f == null) return null;
    return f - b;
  });

  readonly trendKey = computed<'up' | 'down' | 'flat' | null>(() => {
    const d = this.delta();
    if (d == null) return null;
    if (d > 0) return 'up';
    if (d < 0) return 'down';
    return 'flat';
  });

  readonly tagSeverity = computed<'success' | 'danger' | 'info'>(() => {
    const t = this.trendKey();
    if (t === 'up') return 'success';
    if (t === 'down') return 'danger';
    return 'info';
  });

  // --- Step auto
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'rate') return 's1'; // calc coefficient
    if (last === 'base') return 's2'; // calc final
    return null;
  });

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  // --- Steps KaTeX
  readonly formulaSteps = computed(() => {
    const base = this.baseSig() ?? 0;
    const rate = this.rateSig() ?? 0;

    const c = 1 + rate / 100;
    const f = base * c;
    const d = f - base;

    return [
      // Step 1 : coefficient
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
1 + \dfrac{{{rate}}}{100} &= {{c}}
\end{aligned}`,
        vars: { rate, c },
      },
      // Step 2 : valeur finale
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
{{base}} \times {{c}} &= {{f}}
\end{aligned}`,
        vars: { base, c, f },
      },
      // Step 3 : variation en valeur
      {
        id: 's3',
        latex: String.raw`\begin{aligned}
{{f}} - {{base}} &= {{d}}
\end{aligned}`,
        vars: { f, base, d },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ base: ex.base, rate: ex.rate });
  }

  reset() {
    this.form.reset({ base: 80, rate: 10, precision: 2 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    return n.toFixed(p);
  }
}
