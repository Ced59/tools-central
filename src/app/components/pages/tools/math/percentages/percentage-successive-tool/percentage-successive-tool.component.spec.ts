import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageSuccessiveToolComponent } from './percentage-successive-tool.component';

describe('PercentageSuccessiveToolComponent', () => {
  let component: PercentageSuccessiveToolComponent;
  let fixture: ComponentFixture<PercentageSuccessiveToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageSuccessiveToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageSuccessiveToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
