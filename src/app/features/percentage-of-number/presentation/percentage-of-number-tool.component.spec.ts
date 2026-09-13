import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PercentageOfNumberToolComponent } from './percentage-of-number-tool.component';

describe('PercentageOfNumberToolComponent', () => {
  let component: PercentageOfNumberToolComponent;
  let fixture: ComponentFixture<PercentageOfNumberToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageOfNumberToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageOfNumberToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('recomputes and resets the displayed business result', () => {
    component.form.patchValue({ percent: 12.5, base: 240, precision: 2 });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const result = host.querySelector<HTMLElement>('[data-testid="percentage-result"] .result-value');
    expect(result?.textContent.trim()).toBe('30.00');

    component.reset();
    fixture.detectChanges();
    expect(result?.textContent.trim()).toBe('16.00');
  });
});
