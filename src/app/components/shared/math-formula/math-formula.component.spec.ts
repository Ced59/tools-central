import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MathFormulaComponent } from './math-formula.component';

describe('MathFormulaComponent', () => {
  let component: MathFormulaComponent;
  let fixture: ComponentFixture<MathFormulaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MathFormulaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MathFormulaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
