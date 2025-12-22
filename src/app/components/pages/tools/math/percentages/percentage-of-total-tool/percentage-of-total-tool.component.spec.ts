import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageOfTotalToolComponent } from './percentage-of-total-tool.component';

describe('PercentageOfTotalToolComponent', () => {
  let component: PercentageOfTotalToolComponent;
  let fixture: ComponentFixture<PercentageOfTotalToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageOfTotalToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageOfTotalToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
