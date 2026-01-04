import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
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
 a: number;
 b: number;
};

type ChangedField = 'a' | 'b' | 'precision';

@Component({
 selector: 'app-percentage-relative-difference-tool',
 standalone: true,
 imports: [
 NgIf,
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
 templateUrl: './percentage-relative-difference-tool.component.html',
 styleUrl: './percentage-relative-difference-tool.component.scss',
})
export class PercentageRelativeDifferenceToolComponent {
 private fb = new FormBuilder();

 // ✅ pas de $localize runtime (SSR/prerender friendly)
 examples: Example[] = [
 { label: 'Mesures 98 et 102', a: 98, b: 102 },
 { label: 'Prix 80 et 100', a: 80, b: 100 },
 { label: 'Scores 45 et 60', a: 45, b: 60 },
 { label: 'Valeurs -12 et 8', a: -12, b: 8 },
 ];

 form = this.fb.group({
 a: [98, [Validators.required]],
 b: [102, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 // --- Signals
 private aSig = signal<number | null>(this.form.value.a ?? null);
 private bSig = signal<number | null>(this.form.value.b ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 // --- Dernier champ modifié + override manuel step
 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges.subscribe(v => {
 const prevA = this.aSig();
 const prevB = this.bSig();
 const prevP = this.precisionSig();

 const nextA = v.a ?? null;
 const nextB = v.b ?? null;
 const nextP = v.precision ?? 2;

 if (nextA !== prevA) this.lastChanged.set('a');
 else if (nextB !== prevB) this.lastChanged.set('b');
 else if (nextP !== prevP) this.lastChanged.set('precision');

 // retour auto sur changement
 this.manualStepId.set(null);

 this.aSig.set(nextA);
 this.bSig.set(nextB);
 this.precisionSig.set(nextP);
 });
 }

 // --- Calculs
 readonly absA = computed(() => {
 const a = this.aSig();
 if (a == null) return null;
 return Math.abs(a);
 });

 readonly absB = computed(() => {
 const b = this.bSig();
 if (b == null) return null;
 return Math.abs(b);
 });

 readonly absDiff = computed(() => {
 const a = this.aSig();
 const b = this.bSig();
 if (a == null || b == null) return null;
 return Math.abs(a - b);
 });

 readonly meanAbs = computed(() => {
 const aa = this.absA();
 const bb = this.absB();
 if (aa == null || bb == null) return null;
 return (aa + bb) / 2;
 });

 readonly isMeanZero = computed(() => (this.meanAbs() ?? 0) === 0);

 readonly relativeDiffPct = computed(() => {
 const d = this.absDiff();
 const m = this.meanAbs();
 if (d == null || m == null) return null;
 if (m === 0) return null;
 return (d / m) * 100;
 });

 // --- Step auto
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'a' || last === 'b') return 's1'; // écart
 return null;
 });

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
 }

 // --- Steps KaTeX
 readonly formulaSteps = computed(() => {
 const a = this.aSig() ?? 0;
 const b = this.bSig() ?? 0;

 const d = Math.abs(a - b);
 const aa = Math.abs(a);
 const bb = Math.abs(b);
 const m = (aa + bb) / 2;

 const divOk = m !== 0;
 const pct = divOk ? (d / m) * 100 : 0;

 return [
 // Step 1 : |A-B|
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
|{{a}}-{{b}}| &= {{d}}
\end{aligned}`,
 vars: { a, b, d },
 },
 // Step 2 : moyenne des valeurs absolues
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\dfrac{|{{a}}|+|{{b}}|}{2} &= {{m}}
\end{aligned}`,
 vars: { a, b, m },
 },
 // Step 3 : écart relatif %
 {
 id: 's3',
 latex: divOk
 ? String.raw`\begin{aligned}
\dfrac{{{d}}}{{{m}}}\times 100 &= {{pct}}
\end{aligned}`
 : String.raw`\begin{aligned}
\dfrac{{{d}}}{0}\times 100 &= \text{?}
\end{aligned}`,
 vars: { d, m, pct },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ a: ex.a, b: ex.b });
 }

 reset() {
 this.form.reset({ a: 98, b: 102, precision: 2 });
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
