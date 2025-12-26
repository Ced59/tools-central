import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleOfThreeCourseToolComponent } from './rule-of-three-course-tool.component';

describe('RuleOfThreeCourseToolComponent', () => {
  let component: RuleOfThreeCourseToolComponent;
  let fixture: ComponentFixture<RuleOfThreeCourseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleOfThreeCourseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleOfThreeCourseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
