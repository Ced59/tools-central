import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageOfNumberToolComponent } from './percentage-of-number-tool.component';

describe('PercentageOfNumberToolComponent', () => {
  let component: PercentageOfNumberToolComponent;
  let fixture: ComponentFixture<PercentageOfNumberToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageOfNumberToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageOfNumberToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
