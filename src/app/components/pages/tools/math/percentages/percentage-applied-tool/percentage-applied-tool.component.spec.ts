import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageAppliedToolComponent } from './percentage-applied-tool.component';

describe('PercentageAppliedToolComponent', () => {
  let component: PercentageAppliedToolComponent;
  let fixture: ComponentFixture<PercentageAppliedToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageAppliedToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageAppliedToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
