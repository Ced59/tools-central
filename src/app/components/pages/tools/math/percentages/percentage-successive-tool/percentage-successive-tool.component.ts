import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Example = {
 label: string;
 base: number;
 p1: number;
 p2: number;
 p3: number; // optionnel => 0 si non utilisé
};

type ChangedField = 'base' | 'p1' | 'p2' | 'p3' | 'precision';

@Component({
 selector: 'app-percentage-successive-tool',
 standalone: true,
 imports: [
 
 NgFor,
 ReactiveFormsModule,
 RouterLink,
 InputNumberModule,
 DividerModule,
 ButtonModule,
 TagModule,
 MathFormulaComponent,
 MathToolShellComponent,
 ],
 templateUrl: './percentage-successive-tool.component.html',
 styleUrl: './percentage-successive-tool.component.scss',
})
export class PercentageSuccessiveToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { label: '+10% puis -10%', base: 100, p1: 10, p2: -10, p3: 0 },
 { label: '+5% puis +5% puis +5%', base: 200, p1: 5, p2: 5, p3: 5 },
 { label: '-20% puis +12%', base: 150, p1: -20, p2: 12, p3: 0 },
 { label: '+50% puis -30%', base: 80, p1: 50, p2: -30, p3: 0 },
 ];

 form = this.fb.group({
 base: [100, [Validators.required]],
 p1: [10, [Validators.required]],
 p2: [-10, [Validators.required]],
 p3: [0, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 private baseSig = signal<number | null>(this.form.value.base ?? null);
 private p1Sig = signal<number | null>(this.form.value.p1 ?? null);
 private p2Sig = signal<number | null>(this.form.value.p2 ?? null);
 private p3Sig = signal<number | null>(this.form.value.p3 ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevBase = this.baseSig();
 const prevP1 = this.p1Sig();
 const prevP2 = this.p2Sig();
 const prevP3 = this.p3Sig();
 const prevPrec = this.precisionSig();

 const nextBase = v.base ?? null;
 const nextP1 = v.p1 ?? null;
 const nextP2 = v.p2 ?? null;
 const nextP3 = v.p3 ?? null;
 const nextPrec = v.precision ?? 2;

 if (nextBase !== prevBase) this.lastChanged.set('base');
 else if (nextP1 !== prevP1) this.lastChanged.set('p1');
 else if (nextP2 !== prevP2) this.lastChanged.set('p2');
 else if (nextP3 !== prevP3) this.lastChanged.set('p3');
 else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.baseSig.set(nextBase);
 this.p1Sig.set(nextP1);
 this.p2Sig.set(nextP2);
 this.p3Sig.set(nextP3);
 this.precisionSig.set(nextPrec);
 });
 }

 // Coeffs
 readonly c1 = computed(() => 1 + (this.p1Sig() ?? 0) / 100);
 readonly c2 = computed(() => 1 + (this.p2Sig() ?? 0) / 100);
 readonly c3 = computed(() => 1 + (this.p3Sig() ?? 0) / 100);

 readonly globalCoeff = computed(() => this.c1() * this.c2() * this.c3());

 readonly finalValue = computed(() => {
 const b = this.baseSig();
 if (b == null) return null;
 return b * this.globalCoeff();
 });

 readonly globalPct = computed(() => {
 const k = this.globalCoeff();
 return (k - 1) * 100;
 });

 // Step auto
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'p1' || last === 'p2' || last === 'p3') return 's1';
 if (last === 'base') return 's3';
 return null;
 });

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
 }

 readonly formulaSteps = computed(() => {
 const base = this.baseSig() ?? 0;
 const p1 = this.p1Sig() ?? 0;
 const p2 = this.p2Sig() ?? 0;
 const p3 = this.p3Sig() ?? 0;

 const c1 = 1 + p1 / 100;
 const c2 = 1 + p2 / 100;
 const c3 = 1 + p3 / 100;

 const k = c1 * c2 * c3;
 const final = base * k;
 const gp = (k - 1) * 100;

 return [
 // Step 1 : coefficients
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
c_1 &= 1+\dfrac{{{p1}}}{100} = {{c1}}\\
c_2 &= 1+\dfrac{{{p2}}}{100} = {{c2}}\\
c_3 &= 1+\dfrac{{{p3}}}{100} = {{c3}}
\end{aligned}`,
 vars: { p1, p2, p3, c1, c2, c3 },
 },
 // Step 2 : coefficient global
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
k &= c_1 \times c_2 \times c_3 \\
 &= {{c1}}\times{{c2}}\times{{c3}} = {{k}}
\end{aligned}`,
 vars: { c1, c2, c3, k },
 },
 // Step 3 : valeur finale + variation globale
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
\text{Final} &= {{base}}\times {{k}} = {{final}}\\
\text{Var}(\%) &= ({{k}}-1)\times 100 = {{gp}}
\end{aligned}`,
 vars: { base, k, final, gp },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ base: ex.base, p1: ex.p1, p2: ex.p2, p3: ex.p3 });
 }

 reset() {
 this.form.reset({ base: 100, p1: 10, p2: -10, p3: 0, precision: 2 });
 this.lastChanged.set(null);
 }

 fmt(n: number | null): string {
 if (n == null) return '—';
 return n.toFixed(this.precisionSig());
 }

 fmtPct(n: number | null): string {
 if (n == null) return '—';
 return `${n.toFixed(this.precisionSig())}%`;
 }
}
