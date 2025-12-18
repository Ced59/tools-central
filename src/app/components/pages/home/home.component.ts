import { Component, inject, PLATFORM_ID } from '@angular/core';
import { NgFor, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CategoryCardComponent, CategoryItem } from '../../shared/category-card/category-card.component';
import { SeoService } from '../../../services/seo/seo.service';
import {RouterLink} from "@angular/router";
import {CATEGORIES} from "../../../data/categories";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, ButtonModule, CategoryCardComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  /** ✅ Route "relative" : Angular i18n préfixe déjà /de, /en, etc. */
  categoriesRoute = '/categories';

  private readonly allCategories: CategoryItem[] = CATEGORIES.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: c.icon,
    route: `/categories/${c.id}`,
    available: c.available,
  }));

  /** ✅ plus de duplication */
  availableCategories = this.allCategories.filter((c) => c.available);
  comingSoonCategories = this.allCategories.filter((c) => !c.available);

  ngOnInit() {
    this.seo.setPageSeo({
      title: $localize`:@@meta_title_home:Tools Central – Outils en ligne gratuits`,
      description: $localize`:@@meta_description_home:Tools Central réunit tous les outils du quotidien en un seul endroit. Compression d'image, calculateurs, conversions et bien plus encore.`,
      ogImageAbs: 'https://tools-central.com/assets/og-preview.png'
    });
  }

  scrollToCategories(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  }
}
