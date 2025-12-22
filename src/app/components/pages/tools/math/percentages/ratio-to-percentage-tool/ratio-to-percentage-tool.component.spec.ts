import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatioToPercentageToolComponent } from './ratio-to-percentage-tool.component';

describe('RatioToPercentageToolComponent', () => {
  let component: RatioToPercentageToolComponent;
  let fixture: ComponentFixture<RatioToPercentageToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatioToPercentageToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatioToPercentageToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
