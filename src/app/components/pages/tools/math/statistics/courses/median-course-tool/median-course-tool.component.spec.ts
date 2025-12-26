import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedianCourseToolComponent } from './median-course-tool.component';

describe('MedianCourseToolComponent', () => {
  let component: MedianCourseToolComponent;
  let fixture: ComponentFixture<MedianCourseToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedianCourseToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedianCourseToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
