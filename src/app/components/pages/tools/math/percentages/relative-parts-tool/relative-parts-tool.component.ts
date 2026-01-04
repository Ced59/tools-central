import { Component, computed, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Example = {
 parts: number[];
};

type ChangedField = 'precision' | 'parts';

type BreakdownItem = {
 id: string;
 label: string;
 value: number;
 percent: number | null;
};

@Component({
 selector: 'app-relative-parts-tool',
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
 templateUrl: './relative-parts-tool.component.html',
 styleUrl: './relative-parts-tool.component.scss',
})
export class RelativePartsToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { parts: [25, 75] }, // 25%
 { parts: [10, 20, 30] }, // 16,66%
 { parts: [5, 7.5, 2.5, 10] }, // 20%
 { parts: [50, 40, 10] }, // 50%
 ];

 form = this.fb.group({
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 parts: this.fb.array([
 this.fb.control(25, [Validators.required]),
 this.fb.control(75, [Validators.required]),
 ]),
 });

 // --- Signals
 private precisionSig = signal<number>(this.form.value.precision ?? 2);
 private partsSig = signal<number[]>(this.getPartsRaw());

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges
 .pipe(takeUntilDestroyed())
 .subscribe(() => {
 const prevPrec = this.precisionSig();
 const prevParts = this.partsSig();

 const nextPrec = this.form.controls.precision.value ?? 2;
 const nextParts = this.getPartsRaw();

 if (nextPrec !== prevPrec) this.lastChanged.set('precision');
 else if (JSON.stringify(nextParts) !== JSON.stringify(prevParts)) this.lastChanged.set('parts');

 this.manualStepId.set(null);

 this.precisionSig.set(nextPrec);
 this.partsSig.set(nextParts);
 });
 }

 // --- FormArray helpers
 get partsArray(): FormArray {
 return this.form.controls.parts as FormArray;
 }

 partCtrlAt(i: number) {
 return this.partsArray.at(i);
 }

 addPart(value = 0) {
 this.partsArray.push(this.fb.control(value, [Validators.required]));
 this.lastChanged.set('parts');
 }

 removePart(i: number) {
 if (this.partsArray.length <= 2) return;
 this.partsArray.removeAt(i);
 this.lastChanged.set('parts');
 }

 clearParts() {
 while (this.partsArray.length > 2) this.partsArray.removeAt(0);
 this.partsArray.at(0).setValue(0);
 this.partsArray.at(1).setValue(0);
 this.lastChanged.set('parts');
 }

 private getPartsRaw(): number[] {
 const arr = this.partsArray?.controls ?? [];
 return arr.map(c => (c.value ?? 0) as number);
 }

 // --- Calculs
 readonly sum = computed(() => {
 const ps = this.partsSig();
 return ps.reduce((acc, v) => acc + v, 0);
 });

 readonly partARatio = computed(() => {
 const ps = this.partsSig();
 const total = this.sum();
 const a = ps[0] ?? 0;
 if (total === 0) return null;
 return a / total;
 });

 readonly partAPercent = computed(() => {
 const r = this.partARatio();
 if (r == null) return null;
 return r * 100;
 });

 readonly rest = computed(() => {
 const ps = this.partsSig();
 const total = this.sum();
 const a = ps[0] ?? 0;
 return total - a;
 });

 readonly restPercent = computed(() => {
 const p = this.partAPercent();
 if (p == null) return null;
 return 100 - p;
 });

 readonly breakdown = computed<BreakdownItem[]>(() => {
 const ps = this.partsSig();
 const total = this.sum();

 return ps.map((v, i) => {
 const ratio = total === 0 ? null : v / total;
 const pct = ratio == null ? null : ratio * 100;

 return {
 id: `p${i}`,
 label: this.alphaLabel(i),
 value: v,
 percent: pct,
 };
 });
 });

 trackById(_: number, it: BreakdownItem) {
 return it.id;
 }

 // --- Active formula step
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'parts') return 's1';
 return 's2';
 });

 // --- Formule (steps)
 readonly formulaSteps = computed(() => {
 const ps = this.partsSig();
 const total = this.sum();
 const a = ps[0] ?? 0;

 const maxExpand = 6;
 const expandedSum =
 ps.length <= maxExpand
 ? ps.map(v => this.numToLatex(v)).join(' + ')
 : ps.slice(0, maxExpand).map(v => this.numToLatex(v)).join(' + ') + ' + \\dots';

 const ratio = total === 0 ? 0 : a / total;
 const pct = total === 0 ? 0 : ratio * 100;

 return [
 {
 id: 's1',
 latex: ps.length <= maxExpand
 ? String.raw`\begin{aligned}
\text{total} &= ${expandedSum} = {{total}}
\end{aligned}`
 : String.raw`\begin{aligned}
\text{total} &= A + B + C + \dots = {{total}}
\end{aligned}`,
 vars: { total },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\dfrac{A}{\text{total}}\times 100 &= \dfrac{{{a}}}{{{total}}}\times 100 = {{pct}}\%
\end{aligned}`,
 vars: { pct },
 },
 ];
 });

 applyExample(ex: Example) {
 while (this.partsArray.length) this.partsArray.removeAt(0);
 for (const p of ex.parts) this.partsArray.push(this.fb.control(p, [Validators.required]));
 // garantir au moins 2
 if (this.partsArray.length < 2) {
 this.partsArray.push(this.fb.control(0, [Validators.required]));
 }
 this.lastChanged.set('parts');
 }

 reset() {
 this.form.reset({ precision: 2 });
 while (this.partsArray.length) this.partsArray.removeAt(0);
 this.partsArray.push(this.fb.control(25, [Validators.required]));
 this.partsArray.push(this.fb.control(75, [Validators.required]));
 this.lastChanged.set(null);
 }

 fmt(n: number | null): string {
 if (n == null) return '—';
 return n.toFixed(this.precisionSig());
 }

 fmtPct(n: number | null): string {
 if (n == null) return '—';
 const p = this.precisionSig();
 const v = Number(n.toFixed(p));
 return `${v.toFixed(p)}%`;
 }

 // A, B, C... puis A1, A2... si > 26
 alphaLabel(i: number): string {
 const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 if (i < 26) return alphabet[i];
 const first = Math.floor(i / 26) - 1;
 const second = i % 26;
 return `${alphabet[first] ?? 'A'}${alphabet[second]}`;
 }

 private numToLatex(n: number): string {
 if (!Number.isFinite(n)) return '0';
 return String(Number(n.toFixed(6)));
 }

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
 }
}
