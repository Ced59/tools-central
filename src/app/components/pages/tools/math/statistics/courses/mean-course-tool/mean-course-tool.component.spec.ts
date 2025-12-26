import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeanCourseToolComponent } from './mean-course-tool.component';

describe('MeanCourseToolComponent', () => {
  let component: MeanCourseToolComponent;
  let fixture: ComponentFixture<MeanCourseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeanCourseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeanCourseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
