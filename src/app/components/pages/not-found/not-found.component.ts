import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.setPageSeo({
      title: $localize`:@@not_found_meta_title:Page introuvable – Tools Central`,
      description: $localize`:@@not_found_meta_description:La page demandée n’existe pas ou a été déplacée. Retrouvez tous les outils gratuits de Tools Central depuis l’accueil.`,
      robots: 'noindex,follow',
    });
  }
}
