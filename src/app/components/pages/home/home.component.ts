import { Component, inject, PLATFORM_ID } from '@angular/core';
import { NgFor, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CategoryCardComponent, CategoryItem } from '../../shared/category-card/category-card.component';
import { SeoService } from '../../../services/seo/seo.service';
import {RouterLink} from "@angular/router";

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

  availableCategories: CategoryItem[] = [
    {
      id: 'math',
      title: $localize`:@@cat_math_title:Mathématiques`,
      description: $localize`:@@cat_math_desc:Pourcentages, règles de trois, conversions...`,
      icon: 'pi pi-calculator',
      route: '/categories/math',
      available: true
    }
  ];

  comingSoonCategories: CategoryItem[] = [
    {
      id: 'text',
      title: $localize`:@@cat_text_title:Texte`,
      description: $localize`:@@cat_text_desc:Compteurs, formatage, nettoyage de texte...`,
      icon: 'pi pi-file-edit',
      route: '/categories/text',
      available: false
    },
    {
      id: 'image',
      title: $localize`:@@cat_image_title:Image`,
      description: $localize`:@@cat_image_desc:Compression, redimensionnement, optimisation...`,
      icon: 'pi pi-image',
      route: '/categories/image',
      available: false
    }
  ];

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
