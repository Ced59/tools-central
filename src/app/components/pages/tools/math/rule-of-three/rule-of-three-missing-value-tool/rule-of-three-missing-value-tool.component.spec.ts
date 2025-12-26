import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleOfThreeMissingValueToolComponent } from './rule-of-three-missing-value-tool.component';

describe('RuleOfThreeMissingValueToolComponent', () => {
  let component: RuleOfThreeMissingValueToolComponent;
  let fixture: ComponentFixture<RuleOfThreeMissingValueToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleOfThreeMissingValueToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleOfThreeMissingValueToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
