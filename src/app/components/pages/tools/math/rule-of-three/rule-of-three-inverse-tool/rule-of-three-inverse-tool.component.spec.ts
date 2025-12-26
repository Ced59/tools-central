import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleOfThreeInverseToolComponent } from './rule-of-three-inverse-tool.component';

describe('RuleOfThreeInverseToolComponent', () => {
  let component: RuleOfThreeInverseToolComponent;
  let fixture: ComponentFixture<RuleOfThreeInverseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleOfThreeInverseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleOfThreeInverseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
