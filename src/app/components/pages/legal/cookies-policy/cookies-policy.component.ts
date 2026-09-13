import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import {RouterLink} from "@angular/router";
import {LocalePathService} from "../../../../services/locale-path.service";

@Component({
  selector: 'app-cookies-policy',
  imports: [RouterLink],
  templateUrl: './cookies-policy.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './cookies-policy.component.scss',
})
export class CookiesPolicyComponent {
  localePath = inject(LocalePathService)
}
