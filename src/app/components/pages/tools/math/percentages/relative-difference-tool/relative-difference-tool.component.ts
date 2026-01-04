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

type RefMode = 'a' | 'b';
type ChangedField = 'a' | 'b' | 'ref' | 'precision';

type Example = {
 a: number;
 b: number;
 ref: RefMode;
};

@Component({
 selector: 'app-relative-difference-tool',
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
 templateUrl: './relative-difference-tool.component.html',
 styleUrl: './relative-difference-tool.component.scss',
})
export class RelativeDifferenceToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { a: 80, b: 100, ref: 'a' }, // +25% vs A
 { a: 100, b: 80, ref: 'a' }, // -20% vs A
 { a: 1200, b: 1110, ref: 'a' }, // -7.5% vs A
 { a: 80, b: 100, ref: 'b' }, // +20% vs B (même écart, autre référence)
 ];

 form = this.fb.group({
 a: [80, [Validators.required]],
 b: [100, [Validators.required]],
 ref: ['a' as RefMode, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 private aSig = signal<number | null>(this.form.value.a ?? null);
 private bSig = signal<number | null>(this.form.value.b ?? null);
 private refSig = signal<RefMode>(this.form.value.ref ?? 'a');
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevA = this.aSig();
 const prevB = this.bSig();
 const prevR = this.refSig();
 const prevP = this.precisionSig();

 const nextA = v.a ?? null;
 const nextB = v.b ?? null;
 const nextR = (v.ref ?? 'a') as RefMode;
 const nextP = v.precision ?? 2;

 if (nextA !== prevA) this.lastChanged.set('a');
 else if (nextB !== prevB) this.lastChanged.set('b');
 else if (nextR !== prevR) this.lastChanged.set('ref');
 else if (nextP !== prevP) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.aSig.set(nextA);
 this.bSig.set(nextB);
 this.refSig.set(nextR);
 this.precisionSig.set(nextP);
 });
 }

 readonly referenceValue = computed(() => {
 const a = this.aSig();
 const b = this.bSig();
 const r = this.refSig();
 if (r === 'a') return a;
 return b;
 });

 readonly difference = computed(() => {
 const a = this.aSig();
 const b = this.bSig();
 if (a == null || b == null) return null;
 return b - a;
 });

 readonly relativeDifferencePercent = computed(() => {
 const diff = this.difference();
 const ref = this.referenceValue();
 if (diff == null || ref == null) return null;
 if (ref === 0) return null;
 return (diff / ref) * 100;
 });

 readonly ratio = computed(() => {
 const a = this.aSig();
 const b = this.bSig();
 const r = this.refSig();
 if (a == null || b == null) return null;

 // petit "plus" cohérent : ratio dans le même sens que la référence
 // ref=a => ratio = b/a ; ref=b => ratio = a/b
 const denom = r === 'a' ? a : b;
 const numer = r === 'a' ? b : a;
 if (denom === 0) return null;
 return numer / denom;
 });

 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'a' || last === 'b') return 's1';
 if (last === 'ref') return 's2';
 return null;
 });

 readonly formulaSteps = computed(() => {
 const a = this.aSig() ?? 0;
 const b = this.bSig() ?? 0;
 const refMode = this.refSig();

 const d = b - a;
 const ref = refMode === 'a' ? a : b;
 const p = ref === 0 ? 0 : (d / ref) * 100;

 return [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
{{b}} - {{a}} &= {{d}}
\end{aligned}`,
 vars: { a, b, d },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\dfrac{ {{d}} }{ {{ref}} }\times 100 &= {{p}}
\end{aligned}`,
 vars: { d, ref, p },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ a: ex.a, b: ex.b, ref: ex.ref });
 }

 reset() {
 this.form.reset({ a: 80, b: 100, ref: 'a', precision: 2 });
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
