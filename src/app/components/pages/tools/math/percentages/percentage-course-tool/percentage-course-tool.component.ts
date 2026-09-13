import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CoursePageComponent } from '../../../../../shared/course/course-page/course-page.component';
import {percentageCourseData} from "../../../../../../data/courses/math/percentage-course.data";


@Component({
 selector: 'app-percentage-course-tool',
 standalone: true,
 imports: [CoursePageComponent],
 changeDetection: ChangeDetectionStrategy.Eager,
 templateUrl: './percentage-course-tool.component.html',
})
export class PercentageCourseToolComponent {
 course = percentageCourseData;
}
