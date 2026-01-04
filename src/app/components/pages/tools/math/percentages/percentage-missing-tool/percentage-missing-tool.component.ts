import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Example = {
 base: number; // valeur de départ
 target: number; // valeur cible
};

type ChangedField = 'base' | 'target' | 'precision';

@Component({
 selector: 'app-percentage-missing-tool',
 standalone: true,
 imports: [
 
 NgFor,
 ReactiveFormsModule,
 RouterLink,
 InputNumberModule,
 DividerModule,
 ButtonModule,
 MathFormulaComponent,
 MathToolShellComponent,
 ],
 templateUrl: './percentage-missing-tool.component.html',
 styleUrl: './percentage-missing-tool.component.scss',
})
export class PercentageMissingToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { base: 80, target: 100 }, // +25%
 { base: 1200, target: 1110 }, // -7.5%
 { base: 200, target: 170 }, // -15%
 { base: 5000, target: 6000 }, // +20%
 ];

 form = this.fb.group({
 base: [80, [Validators.required]],
 target: [100, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 // --- Signals de valeurs
 private baseSig = signal<number | null>(this.form.value.base ?? null);
 private targetSig = signal<number | null>(this.form.value.target ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 // --- Dernier champ modifié (pour auto-switch step)
 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevB = this.baseSig();
 const prevT = this.targetSig();
 const prevPrec = this.precisionSig();

 const nextB = v.base ?? null;
 const nextT = v.target ?? null;
 const nextPrec = v.precision ?? 2;

 if (nextB !== prevB) this.lastChanged.set('base');
 else if (nextT !== prevT) this.lastChanged.set('target');
 else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.baseSig.set(nextB);
 this.targetSig.set(nextT);
 this.precisionSig.set(nextPrec);
 });
 }

 // base => step "Coefficient", target => step "Pourcentage"
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'base') return 's1';
 if (last === 'target') return 's2';
 return null;
 });

 /** Coefficient multiplicateur nécessaire = target / base */
 readonly coefficient = computed(() => {
 const b = this.baseSig();
 const t = this.targetSig();
 if (b == null || t == null) return null;
 if (b === 0) return null;
 return t / b;
 });

 /**
 * Pourcentage manquant (taux à appliquer) :
 * (target / base - 1) * 100
 */
 readonly missingPercent = computed(() => {
 const coef = this.coefficient();
 if (coef == null) return null;
 return (coef - 1) * 100;
 });

 /** Écart absolu = target - base */
 readonly difference = computed(() => {
 const b = this.baseSig();
 const t = this.targetSig();
 if (b == null || t == null) return null;
 return t - b;
 });

 readonly formulaSteps = computed(() => {
 const b = this.baseSig() ?? 0;
 const t = this.targetSig() ?? 0;

 const coef = b === 0 ? 0 : t / b;
 const p = (coef - 1) * 100;

 return [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\dfrac{ {{t}} }{ {{b}} } &= {{coef}}
\end{aligned}`,
 vars: { b, t, coef },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
({{coef}} - 1)\times 100 &= {{p}}
\end{aligned}`,
 vars: { coef, p },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ base: ex.base, target: ex.target });
 }

 reset() {
 this.form.reset({ base: 80, target: 100, precision: 2 });
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
