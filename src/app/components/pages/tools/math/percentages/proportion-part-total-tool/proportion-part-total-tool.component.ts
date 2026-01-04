import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../../../shared/math/math-tool-shell/math-tool-shell.component';

type Mode = 'pctFromPart' | 'valueFromPct' | 'totalFromPartPct';
type ChangedField = 'mode' | 'part' | 'pct' | 'total' | 'precision';

@Component({
 selector: 'app-proportion-part-total-tool',
 standalone: true,
 imports: [
 NgIf,
 ReactiveFormsModule,
 RouterLink,
 InputNumberModule,
 DividerModule,
 ButtonModule,
 SelectButtonModule,
 MathFormulaComponent,
 MathToolShellComponent,
 ],
 templateUrl: './proportion-part-total-tool.component.html',
 styleUrl: './proportion-part-total-tool.component.scss',
})
export class ProportionPartTotalToolComponent {
 private fb = new FormBuilder();

 modeOptions = [
 { label: $localize`:@@prop_part_mode_pct:Trouver %`, value: 'pctFromPart' as Mode },
 { label: $localize`:@@prop_part_mode_value:Trouver la part`, value: 'valueFromPct' as Mode },
 { label: $localize`:@@prop_part_mode_total:Trouver le total`, value: 'totalFromPartPct' as Mode },
 ];

 form = this.fb.group({
 mode: ['pctFromPart' as Mode, [Validators.required]],
 part: [25, [Validators.required]],
 pct: [12.5, [Validators.required]],
 total: [200, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 // signals
 private modeSig = signal<Mode>(this.form.value.mode ?? 'pctFromPart');
 private partSig = signal<number | null>(this.form.value.part ?? null);
 private pctSig = signal<number | null>(this.form.value.pct ?? null);
 private totalSig = signal<number | null>(this.form.value.total ?? null);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);

 private lastChanged = signal<ChangedField | null>(null);
 private manualStepId = signal<string | null>(null);

 constructor() {
 this.form.valueChanges
 .pipe(takeUntilDestroyed())
 .subscribe(() => {
 const prev = {
 mode: this.modeSig(),
 part: this.partSig(),
 pct: this.pctSig(),
 total: this.totalSig(),
 prec: this.precisionSig(),
 };

 const nextMode = (this.form.controls.mode.value ?? 'pctFromPart') as Mode;
 const nextPart = this.form.controls.part.value ?? null;
 const nextPct = this.form.controls.pct.value ?? null;
 const nextTotal = this.form.controls.total.value ?? null;
 const nextPrec = this.form.controls.precision.value ?? 2;

 if (nextMode !== prev.mode) this.lastChanged.set('mode');
 else if (nextPart !== prev.part) this.lastChanged.set('part');
 else if (nextPct !== prev.pct) this.lastChanged.set('pct');
 else if (nextTotal !== prev.total) this.lastChanged.set('total');
 else if (nextPrec !== prev.prec) this.lastChanged.set('precision');

 this.manualStepId.set(null);

 this.modeSig.set(nextMode);
 this.partSig.set(nextPart);
 this.pctSig.set(nextPct);
 this.totalSig.set(nextTotal);
 this.precisionSig.set(nextPrec);
 });
 }

 // getters
 mode = computed(() => this.modeSig());

 // Results
 readonly resultPct = computed(() => {
 const part = this.partSig();
 const total = this.totalSig();
 if (part == null || total == null || total === 0) return null;
 return (part / total) * 100;
 });

 readonly resultPart = computed(() => {
 const pct = this.pctSig();
 const total = this.totalSig();
 if (pct == null || total == null) return null;
 return (pct / 100) * total;
 });

 readonly resultTotal = computed(() => {
 const pct = this.pctSig();
 const part = this.partSig();
 if (pct == null || part == null || pct === 0) return null;
 return part / (pct / 100);
 });

 readonly rest = computed(() => {
 const m = this.modeSig();
 if (m === 'pctFromPart') {
 const total = this.totalSig();
 const part = this.partSig();
 if (total == null || part == null) return null;
 return total - part;
 }
 if (m === 'valueFromPct') {
 const total = this.totalSig();
 const part = this.resultPart();
 if (total == null || part == null) return null;
 return total - part;
 }
 // totalFromPartPct: total calculé - part
 const total = this.resultTotal();
 const part = this.partSig();
 if (total == null || part == null) return null;
 return total - part;
 });

 readonly warning = computed(() => {
 const m = this.modeSig();
 if (m === 'pctFromPart') {
 const total = this.totalSig();
 if (total === 0) return $localize`:@@prop_part_warn_total_zero:Le total ne peut pas être 0.`;
 }
 if (m === 'totalFromPartPct') {
 const pct = this.pctSig();
 if (pct === 0) return $localize`:@@prop_part_warn_pct_zero:Le pourcentage ne peut pas être 0 pour calculer un total.`;
 }
 return null;
 });

 // Formula steps
 readonly activeFormulaStepId = computed(() => {
 const manual = this.manualStepId();
 if (manual) return manual;

 const m = this.modeSig();
 if (m === 'pctFromPart') return 's_pct';
 if (m === 'valueFromPct') return 's_val';
 return 's_total';
 });

 readonly formulaSteps = computed(() => {
 const m = this.modeSig();
 const part = this.partSig() ?? 0;
 const pct = this.pctSig() ?? 0;
 const total = this.totalSig() ?? 0;

 const resPct = this.resultPct() ?? 0;
 const resPart = this.resultPart() ?? 0;
 const resTotal = this.resultTotal() ?? 0;

 return [
 {
 id: 's_pct',
 latex: String.raw`\begin{aligned}
p &= \dfrac{\text{part}}{\text{total}}\times 100
= \dfrac{${part}}{${total}}\times 100
= {{p}}\%
\end{aligned}`,
 vars: { p: resPct },
 },
 {
 id: 's_val',
 latex: String.raw`\begin{aligned}
\text{part} &= \dfrac{p}{100}\times \text{total}
= \dfrac{${pct}}{100}\times ${total}
= {{v}}
\end{aligned}`,
 vars: { v: resPart },
 },
 {
 id: 's_total',
 latex: String.raw`\begin{aligned}
\text{total} &= \dfrac{\text{part}}{p/100}
= \dfrac{${part}}{${pct}/100}
= {{t}}
\end{aligned}`,
 vars: { t: resTotal },
 },
 ].filter(s => {
 if (m === 'pctFromPart') return s.id === 's_pct';
 if (m === 'valueFromPct') return s.id === 's_val';
 return s.id === 's_total';
 });
 });

 reset() {
 this.form.reset({ mode: 'pctFromPart', part: 25, total: 200, pct: 12.5, precision: 2 });
 this.lastChanged.set(null);
 }

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
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
}
