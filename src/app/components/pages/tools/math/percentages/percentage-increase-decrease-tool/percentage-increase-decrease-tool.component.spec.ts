import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageIncreaseDecreaseToolComponent } from './percentage-increase-decrease-tool.component';

describe('PercentageIncreaseDecreaseToolComponent', () => {
  let component: PercentageIncreaseDecreaseToolComponent;
  let fixture: ComponentFixture<PercentageIncreaseDecreaseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageIncreaseDecreaseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageIncreaseDecreaseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
