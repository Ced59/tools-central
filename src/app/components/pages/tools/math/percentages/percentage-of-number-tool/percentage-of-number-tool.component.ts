import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

type Example = {
  label: string;
  percent: number;
  base: number;
};

@Component({
  selector: 'app-percentage-of-number-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    InputNumberModule,
    DividerModule,
    ButtonModule,
  ],
  templateUrl: './percentage-of-number-tool.component.html',
  styleUrl: './percentage-of-number-tool.component.scss',
})
export class PercentageOfNumberToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@pct_of_ex1:20% de 80`, percent: 20, base: 80 },
    { label: $localize`:@@pct_of_ex2:7,5% de 1 200`, percent: 7.5, base: 1200 },
    { label: $localize`:@@pct_of_ex3:15% de 199,99`, percent: 15, base: 199.99 },
    { label: $localize`:@@pct_of_ex4:2% de 5 000`, percent: 2, base: 5000 },
  ];

  form = this.fb.group({
    percent: [20, [Validators.required]],
    base: [80, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  private percentSig = signal<number | null>(this.form.value.percent ?? null);
  private baseSig = signal<number | null>(this.form.value.base ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      this.percentSig.set(v.percent ?? null);
      this.baseSig.set(v.base ?? null);
      this.precisionSig.set(v.precision ?? 2);
    });
  }

  readonly coefficient = computed(() => {
    const p = this.percentSig();
    if (p == null) return null;
    return p / 100;
  });

  readonly result = computed(() => {
    const p = this.percentSig();
    const b = this.baseSig();
    if (p == null || b == null) return null;
    return (b * p) / 100;
  });

  readonly onePercentValue = computed(() => {
    const b = this.baseSig();
    if (b == null) return null;
    return b / 100;
  });

  applyExample(ex: Example) {
    this.form.patchValue({ percent: ex.percent, base: ex.base });
  }

  reset() {
    this.form.reset({ percent: 20, base: 80, precision: 2 });
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
