import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageRelativeDifferenceToolComponent } from './percentage-relative-difference-tool.component';

describe('PercentageRelativeDifferenceToolComponent', () => {
  let component: PercentageRelativeDifferenceToolComponent;
  let fixture: ComponentFixture<PercentageRelativeDifferenceToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageRelativeDifferenceToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageRelativeDifferenceToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
