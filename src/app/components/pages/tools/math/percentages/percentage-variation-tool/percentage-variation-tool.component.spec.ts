import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageVariationToolComponent } from './percentage-variation-tool.component';

describe('PercentageVariationToolComponent', () => {
  let component: PercentageVariationToolComponent;
  let fixture: ComponentFixture<PercentageVariationToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageVariationToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageVariationToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
