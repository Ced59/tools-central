import {Component, inject} from '@angular/core';
import {RouterLink} from "@angular/router";
import {LocalePathService} from "../../../../services/local-path.service";

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  localePath = inject(LocalePathService);
}
