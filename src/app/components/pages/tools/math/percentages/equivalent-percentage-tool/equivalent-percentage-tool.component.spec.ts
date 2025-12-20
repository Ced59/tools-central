import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquivalentPercentageToolComponent } from './equivalent-percentage-tool.component';

describe('EquivalentPercentageToolComponent', () => {
  let component: EquivalentPercentageToolComponent;
  let fixture: ComponentFixture<EquivalentPercentageToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquivalentPercentageToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquivalentPercentageToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
