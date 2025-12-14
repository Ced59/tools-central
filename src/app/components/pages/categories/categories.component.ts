import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryCardComponent, CategoryItem } from '../../shared/category-card/category-card.component';
import { CATEGORIES } from '../../../data/categories';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, CategoryCardComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  private seo = inject(SeoService);

  availableCategories: CategoryItem[] = [];
  comingSoonCategories: CategoryItem[] = [];

  constructor() {
    const mapCategory = (c: any): CategoryItem => ({
      id: c.id,
      title: c.title,
      description: c.description,
      icon: c.icon,
      route: `/categories/${c.id}`,
      available: c.available
    });

    this.availableCategories = CATEGORIES.filter(c => c.available).map(mapCategory);
    this.comingSoonCategories = CATEGORIES.filter(c => !c.available).map(mapCategory);
  }

  ngOnInit() {
    this.seo.setPageSeo({
      title: $localize`:@@meta_title_categories:Catégories d'outils – Tools Central`,
      description: $localize`:@@meta_description_categories:Découvrez toutes les catégories d'outils disponibles sur Tools Central.`
    });
  }
}
