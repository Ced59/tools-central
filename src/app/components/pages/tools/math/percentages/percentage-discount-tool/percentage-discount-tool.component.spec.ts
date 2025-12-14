import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageDiscountToolComponent } from './percentage-discount-tool.component';

describe('PercentageDiscountToolComponent', () => {
  let component: PercentageDiscountToolComponent;
  let fixture: ComponentFixture<PercentageDiscountToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageDiscountToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageDiscountToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
