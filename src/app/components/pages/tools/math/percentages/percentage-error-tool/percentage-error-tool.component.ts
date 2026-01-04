import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Example = {
 measured: number;
 reference: number;
};

type ChangedField = 'measured' | 'reference' | 'precision';

@Component({
 selector: 'app-percentage-error-tool',
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
 MathToolShellComponent,
 ],
 templateUrl: './percentage-error-tool.component.html',
 styleUrl: './percentage-error-tool.component.scss',
})
export class PercentageErrorToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { measured: 102, reference: 100 }, // 2%
 { measured: 98, reference: 100 }, // 2%
 { measured: 1.02, reference: 1 }, // 2%
 { measured: 45, reference: 60 }, // 25%
 ];

 form = this.fb.group({
 measured: [102, [Validators.required]],
 reference: [100, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 private measuredSig = signal<number | null>(this.form.value.measured ?? null);
 private referenceSig = signal<number | null>(this.form.value.reference ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevM = this.measuredSig();
 const prevR = this.referenceSig();
 const prevP = this.precisionSig();

 const nextM = v.measured ?? null;
 const nextR = v.reference ?? null;
 const nextP = v.precision ?? 2;

 if (nextM !== prevM) this.lastChanged.set('measured');
 else if (nextR !== prevR) this.lastChanged.set('reference');
 else if (nextP !== prevP) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.measuredSig.set(nextM);
 this.referenceSig.set(nextR);
 this.precisionSig.set(nextP);
 });
 }

 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'measured' || last === 'reference') return 's1';
 return 's3';
 });

 /** Écart signé = mesuré - référence (utile pour sur/sous-estimation) */
 readonly signedDifference = computed(() => {
 const m = this.measuredSig();
 const r = this.referenceSig();
 if (m == null || r == null) return null;
 return m - r;
 });

 /** Erreur absolue = |mesuré - référence| */
 readonly absoluteError = computed(() => {
 const d = this.signedDifference();
 if (d == null) return null;
 return Math.abs(d);
 });

 /** Erreur relative (%) = |mesuré - référence| / |référence| * 100 */
 readonly relativeErrorPercent = computed(() => {
 const absErr = this.absoluteError();
 const r = this.referenceSig();
 if (absErr == null || r == null) return null;
 const denom = Math.abs(r);
 if (denom === 0) return null;
 return (absErr / denom) * 100;
 });

 /** Ratio mesuré / référence (utile pour “combien de fois”) */
 readonly ratio = computed(() => {
 const m = this.measuredSig();
 const r = this.referenceSig();
 if (m == null || r == null) return null;
 if (r === 0) return null;
 return m / r;
 });

 readonly formulaSteps = computed(() => {
 const m = this.measuredSig() ?? 0;
 const r = this.referenceSig() ?? 0;

 const d = m - r;
 const absErr = Math.abs(d);
 const denom = Math.abs(r);
 const rel = denom === 0 ? 0 : (absErr / denom) * 100;

 return [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
{{m}} - {{r}} &= {{d}}
\end{aligned}`,
 vars: { m, r, d },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
|{{d}}| &= {{absErr}}
\end{aligned}`,
 vars: { d, absErr },
 },
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
\dfrac{ {{absErr}} }{ |{{r}}| }\times 100 &= {{rel}}
\end{aligned}`,
 vars: { absErr, r, rel },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ measured: ex.measured, reference: ex.reference });
 }

 reset() {
 this.form.reset({ measured: 102, reference: 100, precision: 2 });
 this.lastChanged.set(null);
 }

 fmt(n: number | null): string {
 if (n == null) return '—';
 return n.toFixed(this.precisionSig());
 }

 fmtSigned(n: number | null): string {
 if (n == null) return '—';
 const v = Number(n.toFixed(this.precisionSig()));
 const sign = v > 0 ? '+' : '';
 return `${sign}${v.toFixed(this.precisionSig())}`;
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
