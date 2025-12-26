import { Component } from '@angular/core';
import { CoursePageComponent } from '../../../../../../shared/course/course-page/course-page.component';
import {medianCourseData} from "../../../../../../../data/courses/math/statistics/median-course-data";

@Component({
  selector: 'app-median-course-tool',
  imports: [CoursePageComponent],
  templateUrl: './median-course-tool.component.html',
  styleUrl: './median-course-tool.component.scss',
  standalone: true
})
export class MedianCourseToolComponent {

  course = medianCourseData;
}
