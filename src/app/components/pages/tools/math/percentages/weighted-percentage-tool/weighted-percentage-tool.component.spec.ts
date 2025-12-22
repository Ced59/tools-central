import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightedPercentageToolComponent } from './weighted-percentage-tool.component';

describe('WeightedPercentageToolComponent', () => {
  let component: WeightedPercentageToolComponent;
  let fixture: ComponentFixture<WeightedPercentageToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeightedPercentageToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeightedPercentageToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
