import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { ToolEditorialSectionsComponent } from '../../../../../shared/tool-editorial-sections/tool-editorial-sections.component';
import { percentageVariationEditorial } from './percentage-variation-tool.editorial';

type Example = {
  label: string; // ⚠️ i18n template, pas $localize
  initial: number;
  final: number;
};

type ChangedField = 'initial' | 'final' | 'precision';

@Component({
  selector: 'app-percentage-variation-tool',
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
    ToolEditorialSectionsComponent,
  ],
  templateUrl: './percentage-variation-tool.component.html',
  styleUrl: './percentage-variation-tool.component.scss',
})
export class PercentageVariationToolComponent {
  private fb = new FormBuilder();

  // ✅ plus de $localize ici => compatible prerender
  // Les libellés sont rendus via le template avec i18n + interpolation si besoin.
  examples: Example[] = [
    { label: 'Prix 80 → 100', initial: 80, final: 100 },
    { label: 'Population 1 250 → 1 150', initial: 1250, final: 1150 },
    { label: 'CA 12 000 → 15 600', initial: 12000, final: 15600 },
    { label: 'Note 14 → 16', initial: 14, final: 16 },
  ];

  readonly editorial = percentageVariationEditorial;

  form = this.fb.group({
    initial: [100, [Validators.required]],
    final: [120, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  // --- Signals de valeurs
  private initialSig = signal<number | null>(this.form.value.initial ?? null);
  private finalSig = signal<number | null>(this.form.value.final ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  // --- Dernier champ modifié (auto-switch step) + override manuel
  private lastChanged = signal<ChangedField | null>(null);
  private manualStepId = signal<string | null>(null);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      const prevI = this.initialSig();
      const prevF = this.finalSig();
      const prevP = this.precisionSig();

      const nextI = v.initial ?? null;
      const nextF = v.final ?? null;
      const nextP = v.precision ?? 2;

      // Détection du champ modifié (priorité : initial > final > precision)
      if (nextI !== prevI) this.lastChanged.set('initial');
      else if (nextF !== prevF) this.lastChanged.set('final');
      else if (nextP !== prevP) this.lastChanged.set('precision');

      // dès qu'une valeur change, on repasse en auto
      this.manualStepId.set(null);

      this.initialSig.set(nextI);
      this.finalSig.set(nextF);
      this.precisionSig.set(nextP);
    });
  }

  // --- Calculs
  readonly isInitialZero = computed(() => (this.initialSig() ?? 0) === 0);

  readonly delta = computed(() => {
    const a = this.initialSig();
    const b = this.finalSig();
    if (a == null || b == null) return null;
    return b - a;
  });

  readonly variationPct = computed(() => {
    const a = this.initialSig();
    const b = this.finalSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return ((b - a) / a) * 100;
  });

  // coef multiplicateur = final / initial = 1 + variation/100
  readonly multiplier = computed(() => {
    const a = this.initialSig();
    const b = this.finalSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return b / a;
  });

  readonly trend = computed<'up' | 'down' | 'flat' | null>(() => {
    const d = this.delta();
    if (d == null) return null;
    if (d > 0) return 'up';
    if (d < 0) return 'down';
    return 'flat';
  });

  readonly tagSeverity = computed<'success' | 'danger' | 'info'>(() => {
    const t = this.trend();
    if (t === 'up') return 'success';
    if (t === 'down') return 'danger';
    return 'info';
  });

  // ✅ plus de $localize : on renvoie une clé logique, le template affiche via i18n
  readonly trendKey = computed<'up' | 'down' | 'flat'>(() => {
    const t = this.trend();
    return t ?? 'flat';
  });

  // --- Choix automatique du step affiché
  // initial/final => step variation (%), precision => ne force pas
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) return manual;

    const last = this.lastChanged();
    if (last === 'initial') return 's2';
    if (last === 'final') return 's2';
    return null;
  });

  onFormulaStepChanged(id: string) {
    this.manualStepId.set(id);
  }

  // --- Steps KaTeX (sans texte localisé dans le latex)
  readonly formulaSteps = computed(() => {
    const i = this.initialSig() ?? 0;
    const f = this.finalSig() ?? 0;

    const d = f - i;
    const divOk = i !== 0;

    const pct = divOk ? (d / i) * 100 : 0;
    const m = divOk ? f / i : 0;

    return [
      // Step 1 : écart
      {
        id: 's1',
        latex: String.raw`\begin{aligned}
{{f}} - {{i}} &= {{d}}
\end{aligned}`,
        vars: { i, f, d },
      },
      // Step 2 : variation %
      {
        id: 's2',
        latex: divOk
          ? String.raw`\begin{aligned}
\dfrac{{{d}}}{{{i}}} \times 100 &= {{pct}}
\end{aligned}`
          : String.raw`\begin{aligned}
\dfrac{{{d}}}{0} \times 100 &= \text{?}
\end{aligned}`,
        vars: { d, i, pct },
      },
      // Step 3 : coefficient multiplicateur
      {
        id: 's3',
        latex: divOk
          ? String.raw`\begin{aligned}
\dfrac{{{f}}}{{{i}}} &= {{m}}
\end{aligned}`
          : String.raw`\begin{aligned}
\dfrac{{{f}}}{0} &= \text{?}
\end{aligned}`,
        vars: { f, i, m },
      },
    ];
  });

  applyExample(ex: Example) {
    this.form.patchValue({ initial: ex.initial, final: ex.final });
  }

  reset() {
    this.form.reset({ initial: 100, final: 120, precision: 2 });
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
