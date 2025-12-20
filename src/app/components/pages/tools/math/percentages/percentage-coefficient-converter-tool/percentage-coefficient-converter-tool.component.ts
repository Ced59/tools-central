import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = {
  percent: number;
  coefficient: number;
};

type Mode = 'pctToCoef' | 'coefToPct';
type ChangedField = 'mode' | 'percent' | 'coefficient' | 'precision';

@Component({
  selector: 'app-percentage-coefficient-converter-tool',
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
  templateUrl: './percentage-coefficient-converter-tool.component.html',
  styleUrl: './percentage-coefficient-converter-tool.component.scss',
})
export class PercentageCoefficientConverterToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { percent: 15, coefficient: 1.15 },
    { percent: -7.5, coefficient: 0.925 },
    { percent: 25, coefficient: 1.25 },
    { percent: -2, coefficient: 0.98 },
  ];

  form = this.fb.group({
    mode: ['pctToCoef' as Mode, [Validators.required]],
    percent: [15, [Validators.required]],
    coefficient: [1.15, [Validators.required]],
    precision: [3, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals de valeurs
  private modeSig = signal<Mode>(this.form.value.mode ?? 'pctToCoef');
  private percentSig = signal<number | null>(this.form.value.percent ?? null);
  private coefficientSig = signal<number | null>(this.form.value.coefficient ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 3);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevM = this.modeSig();
      const prevP = this.percentSig();
      const prevC = this.coefficientSig();
      const prevPrec = this.precisionSig();

      const nextM = (v.mode ?? 'pctToCoef') as Mode;
      const nextP = v.percent ?? null;
      const nextC = v.coefficient ?? null;
      const nextPrec = v.precision ?? 3;

      if (nextM !== prevM) this.lastChanged.set('mode');
      else if (nextP !== prevP) this.lastChanged.set('percent');
      else if (nextC !== prevC) this.lastChanged.set('coefficient');
      else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

      // repasse en auto
      this.manualStepId.set(null);

      this.modeSig.set(nextM);
      this.percentSig.set(nextP);
      this.coefficientSig.set(nextC);
      this.precisionSig.set(nextPrec);
    });
  }

  readonly isPctToCoef = computed(() => this.modeSig() === 'pctToCoef');

  // Quand le mode change, on veut afficher la formule correspondante
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;
    return this.isPctToCoef() ? 's1' : 's2';
  });

  /** Résultat: coefficient calculé depuis % (si mode pctToCoef) */
  readonly coefficientFromPercent = computed(() => {
    const p = this.percentSig();
    if (p == null) return null;
    return 1 + p / 100;
  });

  /** Résultat: % calculé depuis coef (si mode coefToPct) */
  readonly percentFromCoefficient = computed(() => {
    const c = this.coefficientSig();
    if (c == null) return null;
    return (c - 1) * 100;
  });

  /**
   * Valeur convertie (celle qu’on cherche) selon le mode
   * - pctToCoef => on calcule coefficient
   * - coefToPct => on calcule percent
   */
  readonly convertedValue = computed(() => {
    return this.isPctToCoef() ? this.coefficientFromPercent() : this.percentFromCoefficient();
  });

  /**
   * Synchronisation douce : si tu es en pctToCoef et que tu changes le %, on met à jour le coefficient (et inversement).
   * Ça te permet d’avoir les 2 champs visibles, mais un seul est "source".
   */
  private _syncGuard = false;

  onModeChanged() {
    // Force sync immédiat au changement de mode (pour cohérence)
    this.syncDerived();
  }

  private syncDerived() {
    if (this._syncGuard) return;
    this._syncGuard = true;

    const mode = this.modeSig();
    if (mode === 'pctToCoef') {
      const coef = this.coefficientFromPercent();
      if (coef != null) this.form.patchValue({ coefficient: coef }, { emitEvent: true });
    } else {
      const pct = this.percentFromCoefficient();
      if (pct != null) this.form.patchValue({ percent: pct }, { emitEvent: true });
    }

    this._syncGuard = false;
  }

  onSourceChanged() {
    // appelé sur input source
    this.syncDerived();
  }

  readonly formulaSteps = computed(() => {
    const p = this.percentSig() ?? 0;
    const c = this.coefficientSig() ?? 0;

    const coefFromP = 1 + p / 100;
    const pctFromC = (c - 1) * 100;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
1 + \dfrac{ {{p}} }{100} &= {{coef}}
\end{aligned}`,
        vars: { p, coef: coefFromP },
      },
      {
        id: 's2',
        latex: String.raw`\begin{aligned}
({{c}} - 1)\times 100 &= {{pct}}
\end{aligned}`,
        vars: { c, pct: pctFromC },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ percent: ex.percent, coefficient: ex.coefficient });
  }

  reset() {
    this.form.reset({ mode: 'pctToCoef', percent: 15, coefficient: 1.15, precision: 3 });
    this.lastChanged.set(null);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  fmtPct(n: number | null): string {
    if (n == null) return '—';
    const v = Number(n.toFixed(this.precisionSig()));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.precisionSig())}%`;
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }
}
