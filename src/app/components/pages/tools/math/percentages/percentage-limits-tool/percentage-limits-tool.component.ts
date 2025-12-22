import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type Example = { initial: number; final: number; label: string };
type ChangedField = 'initial' | 'final' | 'precision';

@Component({
  selector: 'app-percentage-limits-tool',
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
  templateUrl: './percentage-limits-tool.component.html',
  styleUrl: './percentage-limits-tool.component.scss',
})
export class PercentageLimitsToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { initial: 100, final: 0, label: 'Baisse maximale : −100% (retour à 0)' },
    { initial: 100, final: 50, label: 'Baisse : −50%' },
    { initial: 50, final: 100, label: 'Hausse : +100%' },
    { initial: 1, final: 100, label: 'Initial petit → % énorme' },
    { initial: 0, final: 10, label: 'Initial = 0 : % non défini (écart absolu)' },
  ];

  form = this.fb.group({
    initial: [100, [Validators.required]],
    final: [120, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private initialSig = signal<number | null>(this.form.value.initial ?? null);
  private finalSig = signal<number | null>(this.form.value.final ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const prevI = this.initialSig();
        const prevF = this.finalSig();
        const prevP = this.precisionSig();

        const nextI = this.form.controls.initial.value ?? null;
        const nextF = this.form.controls.final.value ?? null;
        const nextP = this.form.controls.precision.value ?? 2;

        if (nextI !== prevI) this.lastChanged.set('initial');
        else if (nextF !== prevF) this.lastChanged.set('final');
        else if (nextP !== prevP) this.lastChanged.set('precision');

        this.manualStepId.set(null);

        this.initialSig.set(nextI);
        this.finalSig.set(nextF);
        this.precisionSig.set(nextP);
      });
  }

  readonly delta = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return null;
    return f - i;
  });

  readonly coef = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null || i === 0) return null;
    return f / i;
  });

  readonly variation = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null || i === 0) return null;
    return ((f - i) / i) * 100;
  });

  readonly warning = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return null;

    if (i === 0 && f !== 0) return $localize`:@@pct_limits_warn_initial_zero:La variation % classique n’est pas définie quand l’initial vaut 0.`;
    if (i > 0 && f < 0) return $localize`:@@pct_limits_warn_negative_final:En contexte “prix/quantité”, une valeur finale négative rend l’interprétation des % délicate.`;
    return null;
  });

  readonly interpretation = computed(() => {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return '—';

    if (i === 0) {
      if (f === 0) return $localize`:@@pct_limits_interp_both_zero:0 → 0 : aucun changement (écart nul).`;
      return $localize`:@@pct_limits_interp_from_zero:0 → valeur positive : hausse “infinie” en % (non défini), préférez l’écart absolu.`;
    }

    if (i > 0 && f === 0) return $localize`:@@pct_limits_interp_minus100:Retour à 0 : baisse de −100% (plancher).`;
    if (i > 0 && f > 0) {
      const v = this.variation();
      if (v == null) return '—';
      if (v > 1000) return $localize`:@@pct_limits_interp_huge:Variation très grande : l’initial est petit comparé au final.`;
      if (v < -100) return $localize`:@@pct_limits_interp_below_minus100:En contexte standard, descendre sous −100% est impossible (valeur finale < 0).`;
      return $localize`:@@pct_limits_interp_ok:Variation calculée par rapport à l’initial.`;
    }

    return $localize`:@@pct_limits_interp_generic:Interprétation dépend du contexte (valeurs négatives, signification…).`;
  });

  // --- Affichages texte
  variationText(): string {
    const i = this.initialSig();
    const f = this.finalSig();
    if (i == null || f == null) return '—';
    if (i === 0) return '—';
    return this.fmtSignedPct(this.variation());
  }

  coefText(): string {
    const c = this.coef();
    if (c == null) return '—';
    return this.fmt(c);
  }

  // --- Active step
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'initial' || last === 'final') return 's1';
    return 's2';
  });

  // --- Steps formule
  readonly formulaSteps = computed(() => {
    const i = this.initialSig() ?? 0;
    const f = this.finalSig() ?? 0;

    const delta = f - i;
    const pct = i === 0 ? 0 : (delta / i) * 100;
    const coef = i === 0 ? 0 : f / i;

    return [
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
\Delta &= \text{final} - \text{initial} = {{f}} - {{i}} = {{d}}
\end{aligned}`,
        vars: { i, f, d: delta },
      },
      {
        id: 's2',
        latex: i === 0
          ? String.raw`\begin{aligned}
\frac{\Delta}{\text{initial}} \times 100 \quad \text{(non défini si initial = 0)}
\end{aligned}`
          : String.raw`\begin{aligned}
\text{variation} &= \dfrac{{{f}}-{{{i}}}{{}}{{}}{{}}}{{{i}}}\times 100 = {{pct}}\% \\
\text{coef} &= \dfrac{{{f}}}{{{i}}} = {{coef}}
\end{aligned}`,
        vars: { pct, coef },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ initial: ex.initial, final: ex.final });
    this.lastChanged.set('initial');
  }

  reset() {
    this.form.reset({ initial: 100, final: 120, precision: 2 });
    this.lastChanged.set(null);
  }

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  fmt(n: number | null): string {
    if (n == null) return '—';
    return n.toFixed(this.precisionSig());
  }

  private fmtSignedPct(n: number | null): string {
    if (n == null) return '—';
    const p = this.precisionSig();
    const v = Number(n.toFixed(p));
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(p)}%`;
  }
}
