import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageLimitsToolComponent } from './percentage-limits-tool.component';

describe('PercentageLimitsToolComponent', () => {
  let component: PercentageLimitsToolComponent;
  let fixture: ComponentFixture<PercentageLimitsToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageLimitsToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageLimitsToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
