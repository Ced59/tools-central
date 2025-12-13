import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface CategoryItem {
  id: string;
  title: string;
  description: string;
  icon: string;      // ex: 'pi pi-calculator'
  route: string;     // ex: '/categories/math'
  available: boolean;
}

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [NgIf, RouterLink],
  template: `
    <article class="tool-card" [class.is-disabled]="!category.available">
      <div class="tool-icon">
        <i [class]="category.icon"></i>
      </div>

      <h3>{{ category.title }}</h3>
      <p>{{ category.description }}</p>

      <a
        *ngIf="category.available"
        class="tool-link"
        [routerLink]="category.route"
      >
        <span i18n="@@open_tool">Ouvrir</span> →
      </a>

      <span
        *ngIf="!category.available"
        class="tool-badge"
        i18n="@@coming_soon"
      >Prochainement</span>
    </article>
  `,
  styles: [`
    .tool-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.75rem;
      transition: all 0.3s ease;
      position: relative;
      min-height: 170px;
    }

    .tool-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
      border-color: var(--primary-color);
    }

    .tool-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-lighter));
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .tool-icon i {
      font-size: 1.5rem;
      color: white;
    }

    h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }

    p {
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .tool-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      background: var(--surface-ground);
      border: 1px solid var(--border-color);
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    .tool-link {
      display: inline-flex;
      gap: .35rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .tool-link:hover {
      color: var(--primary-color-lighter);
    }

    .is-disabled {
      opacity: 0.9;
    }
  `]
})
export class CategoryCardComponent {
  @Input({ required: true }) category!: CategoryItem;
}
