import {Component, computed, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import {LocalePathService} from "../../../../services/local-path.service";

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss',
})
export class LegalNoticeComponent {
  localePath = inject(LocalePathService);
}
