import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageCompositionToolComponent } from './percentage-composition-tool.component';

describe('PercentageCompositionToolComponent', () => {
  let component: PercentageCompositionToolComponent;
  let fixture: ComponentFixture<PercentageCompositionToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageCompositionToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageCompositionToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
