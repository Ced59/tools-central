import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { CATEGORIES, ToolCategory } from '../../../data/categories';
import { TOOLS, ToolItem } from '../../../data/tools';
import { ToolCardComponent, ToolCardItem } from '../../shared/tool-card/tool-card.component';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ToolCardComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {
  private seo = inject(SeoService);

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

  ngOnInit() {
    if (this.category) {
      this.seo.setPageSeo({
        title: `${this.category.title} – Tools Central`,
        description: this.category.description
      });
    }
  }
}
