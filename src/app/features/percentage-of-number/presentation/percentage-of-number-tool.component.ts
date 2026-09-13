import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

// Primitives UI internes
import { InputNumberModule } from '@ui';
import { DividerModule } from '@ui';
import { ButtonModule } from '@ui';

import { MathFormulaComponent } from '../../../components/shared/math-formula/math-formula.component';
import { MathToolShellComponent } from '../../../components/shared/math/math-tool-shell/math-tool-shell.component';
import { CalculatePercentageOfNumberUseCase } from '../application/calculate-percentage-of-number.use-case';

type Example = {
 percent: number;
 base: number;
};

@Component({
 selector: 'app-percentage-of-number-tool',
 standalone: true,
 imports: [
 ReactiveFormsModule,
 RouterLink,
 InputNumberModule,
 DividerModule,
 ButtonModule,
 MathFormulaComponent,
 MathToolShellComponent,
 ],
 templateUrl: './percentage-of-number-tool.component.html',
 changeDetection: ChangeDetectionStrategy.OnPush,
 styleUrl: './percentage-of-number-tool.component.scss',
})
export class PercentageOfNumberToolComponent {
 private readonly formBuilder = inject(FormBuilder);
 private readonly calculatePercentage = new CalculatePercentageOfNumberUseCase();

 examples: Example[] = [
 { percent: 20, base: 80 },
 { percent: 7.5, base: 1200 },
 { percent: 15, base: 199.99 },
 { percent: 2, base: 5000 },
 ];

 readonly form = this.formBuilder.group({
 percent: [20, [Validators.required]],
 base: [80, [Validators.required]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 });

 private readonly formValue = toSignal(this.form.valueChanges, {
 initialValue: this.form.getRawValue(),
 });
 private readonly manualStepId = signal<string | null>(null);
 private readonly calculation = computed(() =>
 this.calculatePercentage.execute({
 percent: this.formValue().percent ?? null,
 base: this.formValue().base ?? null,
 }),
 );

 readonly activeFormulaStepId = computed(() => {
 return this.manualStepId();
 });

 readonly coefficient = computed(() => {
 return this.calculation()?.coefficient ?? null;
 });

 readonly result = computed(() => {
 return this.calculation()?.value ?? null;
 });

 readonly onePercentValue = computed(() => {
 return this.calculation()?.onePercentValue ?? null;
 });

 readonly formulaSteps = computed(() => {
 const values = this.formValue();
 const p = values.percent ?? 0;
 const y = values.base ?? 0;

 const coef = p / 100;
 const res = y * coef;

 // ⚠️ IMPORTANT: pas de texte localisé ici (pas de "Coefficient"/"Résultat" dans le latex),
 // sinon ça pousserait à refaire du $localize runtime.
 // On reste sur une écriture "cours de maths" purement math.
 return [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\dfrac{ {{p}} }{100} &= {{coef}}
\end{aligned}`,
 vars: { p, coef },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
{{y}} \times {{coef}} &= {{res}}
\end{aligned}`,
 vars: { y, coef, res },
 },
 ];
 });

 applyExample(ex: Example) {
 this.form.patchValue({ percent: ex.percent, base: ex.base });
 }

 reset() {
 this.form.reset({ percent: 20, base: 80, precision: 2 });
 this.manualStepId.set(null);
 }

 fmt(n: number | null): string {
 if (n == null) return '—';
 return n.toFixed(this.formValue().precision ?? 2);
 }

 onFormulaStepChanged(id: string) {
 this.manualStepId.set(id);
 }
}
