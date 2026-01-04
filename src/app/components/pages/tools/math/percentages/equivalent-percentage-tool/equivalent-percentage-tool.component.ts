import { Component, computed, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Example = {
 base: number;
 percents: number[];
};

type ChangedField = 'base' | 'precision' | 'percents';

@Component({
 selector: 'app-equivalent-percentage-tool',
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
 templateUrl: './equivalent-percentage-tool.component.html',
 styleUrl: './equivalent-percentage-tool.component.scss',
})
export class EquivalentPercentageToolComponent {
 private fb = new FormBuilder();

 examples: Example[] = [
 { base: 1000, percents: [10, 10] }, // +21%
 { base: 1000, percents: [20, -20] }, // -4%
 { base: 200, percents: [5, 7.5, -2] },
 { base: 5000, percents: [-2, 3, 1.5, -0.5] },
 ];

 form = this.fb.group({
 base: [1000, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 percents: this.fb.array([this.fb.control(10, [Validators.required])]),
 });

 // --- Signals
 private baseSig = signal<number | null>(this.form.value.base ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);
 private percentsSig = signal<number[]>(this.getPercentsRaw());

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 // Toute modification -> refresh signals
 this.form.valueChanges.subscribe(() => {
 const prevBase = this.baseSig();
 const prevPrec = this.precisionSig();
 const prevPercents = this.percentsSig();

 const nextBase = this.form.controls.base.value ?? null;
 const nextPrec = this.form.controls.precision.value ?? 2;
 const nextPercents = this.getPercentsRaw();

 // Détection champ modifié (simple et robuste)
 if (nextBase !== prevBase) this.lastChanged.set('base');
 else if (nextPrec !== prevPrec) this.lastChanged.set('precision');
 else if (JSON.stringify(nextPercents) !== JSON.stringify(prevPercents)) this.lastChanged.set('percents');

 // dès qu'une valeur change, on repasse en auto
 this.manualStepId.set(null);

 this.baseSig.set(nextBase);
 this.precisionSig.set(nextPrec);
 this.percentsSig.set(nextPercents);
 });
 }

 // --- FormArray helpers
 get percentsArray(): FormArray {
 return this.form.controls.percents as FormArray;
 }

 percentCtrlAt(i: number) {
 return this.percentsArray.at(i);
 }

 addPercent(value = 0) {
 this.percentsArray.push(this.fb.control(value, [Validators.required]));
 this.lastChanged.set('percents');
 }

 removePercent(i: number) {
 if (this.percentsArray.length <= 1) return;
 this.percentsArray.removeAt(i);
 this.lastChanged.set('percents');
 }

 clearPercents() {
 while (this.percentsArray.length > 1) this.percentsArray.removeAt(0);
 this.percentsArray.at(0).setValue(0);
 this.lastChanged.set('percents');
 }

 private getPercentsRaw(): number[] {
 const arr = this.percentsArray?.controls ?? [];
 return arr.map(c => (c.value ?? 0) as number);
 }

 // --- Calculs
 readonly totalCoefficient = computed(() => {
 const ps = this.percentsSig();
 // produit des (1 + p/100)
 let coef = 1;
 for (const p of ps) coef *= 1 + p / 100;
 return coef;
 });

 readonly equivalentPercent = computed(() => {
 const coef = this.totalCoefficient();
 return (coef - 1) * 100;
 });

 readonly finalValue = computed(() => {
 const base = this.baseSig();
 if (base == null) return null;
 return base * this.totalCoefficient();
 });

 readonly naiveSumPercent = computed(() => {
 const ps = this.percentsSig();
 return ps.reduce((acc, v) => acc + v, 0);
 });

 // --- Active formula step
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const last = this.lastChanged();
 if (last === 'percents') return 's1';
 if (last === 'base') return 's2';
 return 's3';
 });

 // --- Formule (steps)
 readonly formulaSteps = computed(() => {
 const ps = this.percentsSig();
 const base = this.baseSig() ?? 0;

 // coefficients individuels
 const coeffs = ps.map(p => 1 + p / 100);

 let coef = 1;
 for (const c of coeffs) coef *= c;

 const peq = (coef - 1) * 100;
 const final = base * coef;

 // Latex “détaillé” si peu d’items, sinon produit
 const maxExpand = 4;
 const expanded =
 ps.length <= maxExpand
 ? coeffs.map(c => `(${this.numToLatex(c)})`).join('\\times ')
 : String.raw`\prod_{i=1}^{${ps.length}}(1+\dfrac{p_i}{100})`;

 // pour l’affichage produit, on montre quand même la liste des p_i sous forme de vecteur si long
 const pListLatex =
 ps.length <= maxExpand
 ? ps.map(p => this.numToLatex(p)).join(', ')
 : ps.slice(0, maxExpand).map(p => this.numToLatex(p)).join(', ') + ', \\dots';

 return [
 {
 id: 's1',
 latex: ps.length <= maxExpand
 ? String.raw`\begin{aligned}
(1+\dfrac{ {{p1}} }{100})\times(1+\dfrac{ {{p2}} }{100})${ps.length >= 3 ? String.raw`\times(1+\dfrac{ {{p3}} }{100})` : ''}${ps.length >= 4 ? String.raw`\times(1+\dfrac{ {{p4}} }{100})` : ''} &= {{coef}}
\end{aligned}`
 : String.raw`\begin{aligned}
p_i &: \ {{plist}} \\
\prod_{i=1}^{${ps.length}}(1+\dfrac{p_i}{100}) &= {{coef}}
\end{aligned}`,
 vars: {
 p1: ps[0] ?? 0,
 p2: ps[1] ?? 0,
 p3: ps[2] ?? 0,
 p4: ps[3] ?? 0,
 plist: pListLatex,
 coef,
 },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
{{base}}\times {{coef}} &= {{final}}
\end{aligned}`,
 vars: { base, coef, final },
 },
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
({{coef}}-1)\times 100 &= {{peq}}
\end{aligned}`,
 vars: { coef, peq },
 },
 ];
 });

 applyExample(ex: Example) {
 // Reset array then push all
 while (this.percentsArray.length) this.percentsArray.removeAt(0);
 for (const p of ex.percents) this.percentsArray.push(this.fb.control(p, [Validators.required]));
 this.form.patchValue({ base: ex.base });
 this.lastChanged.set('percents');
 }

 reset() {
 this.form.reset({ base: 1000, precision: 2 });
 while (this.percentsArray.length) this.percentsArray.removeAt(0);
 this.percentsArray.push(this.fb.control(10, [Validators.required]));
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

 fmtSigned(n: number | null): string {
 if (n == null) return '—';
 const v = Number(n.toFixed(this.precisionSig()));
 const sign = v > 0 ? '+' : '';
 return `${sign}${v.toFixed(this.precisionSig())}`;
 }

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
 }

 // Utilitaire simple pour éviter les virgules dans le latex (katex aime bien le point)
 private numToLatex(n: number): string {
 if (!Number.isFinite(n)) return '0';
 // pas d’arrondi ici: on veut montrer des valeurs "propres"
 return String(Number(n.toFixed(6)));
 }
}
