import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XOfYPercentageToolComponent } from './x-of-y-percentage-tool.component';

describe('XOfYPercentageToolComponent', () => {
  let component: XOfYPercentageToolComponent;
  let fixture: ComponentFixture<XOfYPercentageToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XOfYPercentageToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XOfYPercentageToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
