import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

type Example = {
  label: string;
  initial: number;
  final: number;
};

@Component({
  selector: 'app-percentage-variation-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './percentage-variation-tool.component.html',
  styleUrl: './percentage-variation-tool.component.scss',
})
export class PercentageVariationToolComponent {
  private fb = new FormBuilder();

  examples: Example[] = [
    { label: $localize`:@@pct_var_ex1:Prix 80 → 100`, initial: 80, final: 100 },
    { label: $localize`:@@pct_var_ex2:Population 1 250 → 1 150`, initial: 1250, final: 1150 },
    { label: $localize`:@@pct_var_ex3:CA 12 000 → 15 600`, initial: 12000, final: 15600 },
    { label: $localize`:@@pct_var_ex4:Note 14 → 16`, initial: 14, final: 16 },
  ];

  form = this.fb.group({
    initial: [100, [Validators.required]],
    final: [120, [Validators.required]],
    precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
  });

  readonly trendLabel = computed(() => {
    const t = this.trend();
    if (t === 'up') return $localize`:@@pct_var_up:Hausse`;
    if (t === 'down') return $localize`:@@pct_var_down:Baisse`;
    return $localize`:@@pct_var_flat:Stable`;
  });

  private initialSig = signal<number | null>(this.form.value.initial ?? null);
  private finalSig = signal<number | null>(this.form.value.final ?? null);
  private precisionSig = signal<number>(this.form.value.precision ?? 2);

  constructor() {
    this.form.valueChanges.subscribe(v => {
      this.initialSig.set(v.initial ?? null);
      this.finalSig.set(v.final ?? null);
      this.precisionSig.set(v.precision ?? 2);
    });
  }

  readonly isInitialZero = computed(() => (this.initialSig() ?? 0) === 0);

  readonly delta = computed(() => {
    const a = this.initialSig();
    const b = this.finalSig();
    if (a == null || b == null) return null;
    return b - a;
  });

  readonly variationPct = computed(() => {
    const a = this.initialSig();
    const b = this.finalSig();
    if (a == null || b == null) return null;
    if (a === 0) return null;
    return ((b - a) / a) * 100;
  });

  readonly multiplier = computed(() => {
    const p = this.variationPct();
    if (p == null) return null;
    return 1 + p / 100;
  });

  readonly trend = computed<'up' | 'down' | 'flat' | null>(() => {
    const d = this.delta();
    if (d == null) return null;
    if (d > 0) return 'up';
    if (d < 0) return 'down';
    return 'flat';
  });

  readonly tagSeverity = computed<'success' | 'danger' | 'info'>(() => {
    const t = this.trend();
    if (t === 'up') return 'success';
    if (t === 'down') return 'danger';
    return 'info';
  });

  applyExample(ex: Example) {
    this.form.patchValue({ initial: ex.initial, final: ex.final });
  }

  reset() {
    this.form.reset({ initial: 100, final: 120, precision: 2 });
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
