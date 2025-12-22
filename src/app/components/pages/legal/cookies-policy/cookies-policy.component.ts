import {Component, inject} from '@angular/core';
import {RouterLink} from "@angular/router";
import {LocalePathService} from "../../../../services/local-path.service";

@Component({
  selector: 'app-cookies-policy',
  imports: [RouterLink],
  templateUrl: './cookies-policy.component.html',
  styleUrl: './cookies-policy.component.scss',
})
export class CookiesPolicyComponent {
  localePath = inject(LocalePathService)
}
