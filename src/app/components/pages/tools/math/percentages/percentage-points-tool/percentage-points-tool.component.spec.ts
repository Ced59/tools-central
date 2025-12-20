import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentagePointsToolComponent } from './percentage-points-tool.component';

describe('PercentagePointsToolComponent', () => {
  let component: PercentagePointsToolComponent;
  let fixture: ComponentFixture<PercentagePointsToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentagePointsToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentagePointsToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
