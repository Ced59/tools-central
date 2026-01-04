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
 base: number;
 p1: number;
 p2: number;
};

type ChangedField = 'base' | 'p1' | 'p2' | 'precision';

@Component({
 selector: 'app-cumulative-vs-naive-tool',
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
 templateUrl: './cumulative-vs-naive-tool.component.html',
 styleUrl: './cumulative-vs-naive-tool.component.scss',
})
export class CumulativeVsNaiveToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { base: 1000, p1: 10, p2: 10 }, // 1210 vs 1200
 { base: 1000, p1: 20, p2: -20 }, // 960 vs 1000
 { base: 200, p1: 5, p2: 7.5 }, // 225.75 vs 225
 { base: 5000, p1: -2, p2: 3 }, // 504? (selon ordre, ici composé fixe)
 ];

 form = this.fb.group({
 base: [1000, [Validators.required]],
 p1: [10, [Validators.required]],
 p2: [10, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 private baseSig = signal<number | null>(this.form.value.base ?? null);
 private p1Sig = signal<number | null>(this.form.value.p1 ?? null);
 private p2Sig = signal<number | null>(this.form.value.p2 ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevBase = this.baseSig();
 const prevP1 = this.p1Sig();
 const prevP2 = this.p2Sig();
 const prevPrec = this.precisionSig();

 const nextBase = v.base ?? null;
 const nextP1 = v.p1 ?? null;
 const nextP2 = v.p2 ?? null;
 const nextPrec = v.precision ?? 2;

 if (nextBase !== prevBase) this.lastChanged.set('base');
 else if (nextP1 !== prevP1) this.lastChanged.set('p1');
 else if (nextP2 !== prevP2) this.lastChanged.set('p2');
 else if (nextPrec !== prevPrec) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.baseSig.set(nextBase);
 this.p1Sig.set(nextP1);
 this.p2Sig.set(nextP2);
 this.precisionSig.set(nextPrec);
 });
 }

 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'p1') return 's1';
 if (last === 'p2') return 's2';
 return 's3';
 });

 readonly coef1 = computed(() => {
 const p1 = this.p1Sig();
 if (p1 == null) return null;
 return 1 + p1 / 100;
 });

 readonly coef2 = computed(() => {
 const p2 = this.p2Sig();
 if (p2 == null) return null;
 return 1 + p2 / 100;
 });

 readonly compounded = computed(() => {
 const base = this.baseSig();
 const c1 = this.coef1();
 const c2 = this.coef2();
 if (base == null || c1 == null || c2 == null) return null;
 return base * c1 * c2;
 });

 readonly naive = computed(() => {
 const base = this.baseSig();
 const p1 = this.p1Sig();
 const p2 = this.p2Sig();
 if (base == null || p1 == null || p2 == null) return null;
 const sum = p1 + p2;
 return base * (1 + sum / 100);
 });

 readonly diff = computed(() => {
 const comp = this.compounded();
 const nai = this.naive();
 if (comp == null || nai == null) return null;
 return comp - nai;
 });

 readonly diffPercent = computed(() => {
 const nai = this.naive();
 const d = this.diff();
 if (nai == null || d == null) return null;
 if (nai === 0) return null;
 return (d / nai) * 100;
 });

 readonly formulaSteps = computed(() => {
 const base = this.baseSig() ?? 0;
 const p1 = this.p1Sig() ?? 0;
 const p2 = this.p2Sig() ?? 0;

 const c1 = 1 + p1 / 100;
 const c2 = 1 + p2 / 100;

 const comp = base * c1 * c2;
 const nai = base * (1 + (p1 + p2) / 100);

 const d = comp - nai;
 const dp = nai === 0 ? 0 : (d / nai) * 100;

 return [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
1+\dfrac{ {{p1}} }{100} &= {{c1}}
\end{aligned}`,
 vars: { p1, c1 },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
1+\dfrac{ {{p2}} }{100} &= {{c2}}
\end{aligned}`,
 vars: { p2, c2 },
 },
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
{{base}}\times {{c1}}\times {{c2}} &= {{comp}} \\
{{base}}\times \left(1+\dfrac{ {{p1}}+{{p2}} }{100}\right) &= {{nai}} \\
{{comp}} - {{nai}} &= {{d}}
\end{aligned}`,
 vars: { base, c1, c2, comp, nai, p1, p2, d },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ base: ex.base, p1: ex.p1, p2: ex.p2 });
 }

 reset() {
 this.form.reset({ base: 1000, p1: 10, p2: 10, precision: 2 });
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
