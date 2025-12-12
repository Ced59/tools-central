import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { CategoryCardComponent, CategoryItem } from '../../shared/category-card/category-card.component';
import { CATEGORIES } from '../../../data/categories';

@Component({
  standalone: true,
  imports: [NgFor, CategoryCardComponent],
  template: `
    <section class="tools-section">
      <div class="container">

        <div class="section-header">
          <h2 i18n>Catégories disponibles</h2>
          <p i18n>Choisissez une catégorie d’outils</p>
        </div>

        <div class="tools-grid">
          <app-category-card
            *ngFor="let c of categories"
            [category]="c"
          />
        </div>

      </div>
    </section>
  `,
})
export class CategoriesComponent {
  categories: CategoryItem[] = CATEGORIES.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: c.icon,
    route: `/categories/${c.id}`,
    available: c.available,
  }));
}
