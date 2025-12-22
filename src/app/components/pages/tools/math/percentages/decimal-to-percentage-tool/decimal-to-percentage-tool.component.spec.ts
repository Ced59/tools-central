import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecimalToPercentageToolComponent } from './decimal-to-percentage-tool.component';

describe('DecimalToPercentageToolComponent', () => {
  let component: DecimalToPercentageToolComponent;
  let fixture: ComponentFixture<DecimalToPercentageToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecimalToPercentageToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecimalToPercentageToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
