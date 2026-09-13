import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {RouterLink} from "@angular/router";
import {LocalePathService} from "../../../../services/locale-path.service";

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  localePath = inject(LocalePathService);
}
