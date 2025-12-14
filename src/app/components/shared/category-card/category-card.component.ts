import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from "primeng/button";

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
  imports: [RouterLink, ButtonModule],
  template: `
    <article
      class="tool-card"
      [class.is-disabled]="!category.available"
      [class.is-clickable]="category.available"
    >
      <!-- ✅ Overlay cliquable sur toute la card si dispo -->
      @if (category.available) {
        <a
          class="card-overlay"
          [routerLink]="category.route"
          [attr.aria-label]="getAriaLabel()"
        ></a>
      }

      <div class="tool-icon">
        <i [class]="category.icon"></i>
      </div>

      <h3>{{ category.title }}</h3>
      <p>{{ category.description }}</p>

      <div class="actions">
        @if (category.available) {
          <p-button
            class="open-btn"
            [routerLink]="category.route"
            icon="pi pi-arrow-right"
            iconPos="right"
            size="small"
            severity="secondary"
            [outlined]="true"
            label="Ouvrir"
            i18n-label="@@open_tool"
          ></p-button>
        } @else {
          <span class="tool-badge" i18n="@@coming_soon">Prochainement</span>
        }
      </div>
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
      overflow: hidden;
    }

    .tool-card.is-clickable:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
      border-color: var(--primary-color);
    }

    /* ✅ Overlay pour rendre toute la carte cliquable */
    .card-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: 16px;
      text-decoration: none;
      outline: none;
    }

    /* focus clavier visible */
    .card-overlay:focus-visible {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
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
      position: relative;
      z-index: 2;
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
      position: relative;
      z-index: 2;
    }

    p {
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1rem;
      position: relative;
      z-index: 2;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: .75rem;
      position: relative;
      z-index: 2; /* ✅ au-dessus de l'overlay */
    }

    /* ✅ Important: bouton cliquable au-dessus de l'overlay */
    .open-btn {
      position: relative;
      z-index: 3;
    }

    .tool-badge {
      padding: 0.25rem 0.75rem;
      background: var(--surface-ground);
      border: 1px solid var(--border-color);
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-color-secondary);
    }

    .is-disabled {
      opacity: 0.9;
    }
  `]
})
export class CategoryCardComponent {
  @Input({ required: true }) category!: CategoryItem;

  getAriaLabel(): string {
    return $localize`:@@open_category_aria:Ouvrir la catégorie ${this.category.title}`;
  }
}
