import { Component } from '@angular/core';
import { CoursePageComponent } from '../../../../../../shared/course/course-page/course-page.component';
import {meanCourseData} from "../../../../../../../data/courses/math/statistics/mean-course.data";


@Component({
  selector: 'app-mean-course-tool',
  standalone: true,
  imports: [CoursePageComponent],
  templateUrl: './mean-course-tool.component.html',
  styleUrl: './mean-course-tool.component.scss',
})
export class MeanCourseToolComponent {
  course = meanCourseData;
}
