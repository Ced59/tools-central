import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor } from '@angular/common';
import { CATEGORIES, ToolCategory } from '../../../data/categories';
import { TOOLS, ToolItem } from '../../../data/tools';
import { ToolCardComponent, ToolCardItem } from '../../shared/tool-card/tool-card.component';

@Component({
  standalone: true,
  imports: [NgFor, ToolCardComponent],
  template: `
    <section class="tools-section">
      <div class="container">

        <header class="page-header">
          <h1>{{ category?.title }}</h1>
          <p>{{ category?.description }}</p>
        </header>

        <div class="section-header">
          <h2 i18n="@@tools_available_title">Outils disponibles</h2>
          <p i18n="@@tools_available_subtitle">Accédez aux outils déjà utilisables</p>
        </div>

        <div class="tools-grid">
          <app-tool-card *ngFor="let t of availableTools" [tool]="t" />
        </div>

        <div class="section-header" style="margin-top: 3.5rem;">
          <h2 i18n="@@tools_soon_title">Outils à venir</h2>
          <p i18n="@@tools_soon_subtitle">De nouveaux outils arrivent bientôt</p>
        </div>

        <div class="tools-grid">
          <app-tool-card *ngFor="let t of comingSoonTools" [tool]="t" />
        </div>

      </div>
    </section>
  `,
  styles: [`
    .tools-section { padding: 3.5rem 0 5rem; }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .page-header h1 {
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 800;
      color: var(--text-color);
      margin-bottom: .5rem;
    }

    .page-header p {
      color: var(--text-color-secondary);
      font-size: 1.05rem;
      max-width: 720px;
    }

    .section-header {
      text-align: center;
      margin: 2.25rem 0 1.75rem;
    }

    .section-header h2 {
      font-size: clamp(1.5rem, 3vw, 2.1rem);
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: .5rem;
    }

    .section-header p {
      color: var(--text-color-secondary);
      font-size: 1.05rem;
      max-width: 680px;
      margin: 0 auto;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
  `],
})
export class CategoryComponent {
  categoryId = '';
  category?: ToolCategory;

  availableTools: ToolCardItem[] = [];
  comingSoonTools: ToolCardItem[] = [];

  constructor(route: ActivatedRoute) {
    this.categoryId = route.snapshot.paramMap.get('idCategory') ?? route.snapshot.paramMap.get('category') ?? '';

    this.category = CATEGORIES.find(c => c.id === this.categoryId);

    const tools: ToolItem[] = TOOLS.filter(t => t.category === this.categoryId);

    const mapTool = (t: ToolItem): ToolCardItem => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon ?? 'pi pi-wrench',
      route: t.route,
      available: t.available,
    });

    this.availableTools = tools.filter(t => t.available).map(mapTool);
    this.comingSoonTools = tools.filter(t => !t.available).map(mapTool);
  }
}
