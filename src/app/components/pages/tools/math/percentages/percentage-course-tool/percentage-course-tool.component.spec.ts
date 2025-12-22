import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercentageCourseToolComponent } from './percentage-course-tool.component';

describe('PercentageCourseToolComponent', () => {
  let component: PercentageCourseToolComponent;
  let fixture: ComponentFixture<PercentageCourseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercentageCourseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercentageCourseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
