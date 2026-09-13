import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursePageComponent } from './course-page.component';

describe('CoursePageComponent', () => {
  let component: CoursePageComponent;
  let fixture: ComponentFixture<CoursePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursePageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('course', {
      heroTitle: 'Cours de test',
      heroSubtitle: 'Sous-titre',
      backLink: '/',
      lessons: [
        {
          id: 'intro',
          title: 'Introduction',
          subtitle: 'Bases',
          tags: [],
          sections: [],
          quizzes: [],
        },
      ],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
