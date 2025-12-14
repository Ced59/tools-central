import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { CATEGORIES, ToolCategory } from '../../../data/categories';
import { TOOL_GROUPS, ToolGroup } from '../../../data/tool-groups';
import { ToolCardComponent, ToolCardItem } from '../../shared/tool-card/tool-card.component';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ToolCardComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent {
  private seo = inject(SeoService);

  categoryId = '';
  category?: ToolCategory;

  availableTools: ToolCardItem[] = [];
  comingSoonTools: ToolCardItem[] = [];

  constructor(route: ActivatedRoute) {
    this.categoryId =
      route.snapshot.paramMap.get('idCategory') ??
      route.snapshot.paramMap.get('category') ??
      '';

    this.category = CATEGORIES.find(c => c.id === this.categoryId);

    const groups: ToolGroup[] = TOOL_GROUPS.filter(g => g.category === this.categoryId);

    const mapGroup = (g: ToolGroup): ToolCardItem => ({
      id: g.id,
      title: g.title,
      description: g.description,
      icon: g.icon ?? 'pi pi-wrench',
      route: g.route,
      available: g.available,
    });

    this.availableTools = groups.filter(g => g.available).map(mapGroup);
    this.comingSoonTools = groups.filter(g => !g.available).map(mapGroup);
  }

  ngOnInit() {
    if (this.category) {
      this.seo.setPageSeo({
        title: `${this.category.title} – Tools Central`,
        description: this.category.description,
      });
    }
  }
}
