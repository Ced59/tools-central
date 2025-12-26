import { Component } from '@angular/core';
import { CoursePageComponent } from '../../../../../shared/course/course-page/course-page.component';
import {ruleOfThreeCourseData} from "../../../../../../data/courses/math/rule-of-three.data";


@Component({
  selector: 'app-rule-of-three-course-tool',
  standalone: true,
  imports: [CoursePageComponent],
  templateUrl: './rule-of-three-course-tool.component.html',
})
export class RuleOfThreeCourseToolComponent {
  course = ruleOfThreeCourseData;
}
