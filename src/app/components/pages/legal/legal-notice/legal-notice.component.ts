import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import {LocalePathService} from "../../../../services/locale-path.service";

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './legal-notice.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './legal-notice.component.scss',
})
export class LegalNoticeComponent {
  localePath = inject(LocalePathService);
}
