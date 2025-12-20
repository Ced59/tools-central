import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageCoefficientConverterToolComponent } from './percentage-coefficient-converter-tool.component';

describe('PercentageCoefficientConverterToolComponent', () => {
  let component: PercentageCoefficientConverterToolComponent;
  let fixture: ComponentFixture<PercentageCoefficientConverterToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageCoefficientConverterToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageCoefficientConverterToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
