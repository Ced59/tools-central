import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleOfThreeSimpleToolComponent } from './rule-of-three-simple-tool.component';

describe('RuleOfThreeSimpleToolComponent', () => {
  let component: RuleOfThreeSimpleToolComponent;
  let fixture: ComponentFixture<RuleOfThreeSimpleToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleOfThreeSimpleToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleOfThreeSimpleToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
