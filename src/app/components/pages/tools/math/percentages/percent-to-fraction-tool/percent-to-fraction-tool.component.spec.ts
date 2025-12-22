import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentToFractionToolComponent } from './percent-to-fraction-tool.component';

describe('PercentToFractionToolComponent', () => {
  let component: PercentToFractionToolComponent;
  let fixture: ComponentFixture<PercentToFractionToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentToFractionToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentToFractionToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
