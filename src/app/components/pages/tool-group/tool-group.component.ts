import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { CATEGORIES, ToolCategory } from '../../../data/categories';
import { TOOL_GROUPS, ToolGroup } from '../../../data/tool-groups';
import { ATOMIC_TOOLS, AtomicToolItem } from '../../../data/atomic-tools';

import { ToolCardComponent, ToolCardItem } from '../../shared/tool-card/tool-card.component';
import { SeoService } from '../../../services/seo/seo.service';

@Component({
  selector: 'app-tool-group',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, ToolCardComponent],
  templateUrl: './tool-group.component.html',
  styleUrl: './tool-group.component.scss',
})
export class ToolGroupComponent {
  private seo = inject(SeoService);

  categoryId = '';
  groupId = '';

  category?: ToolCategory;
  group?: ToolGroup;

  availableTools: ToolCardItem[] = [];
  comingSoonTools: ToolCardItem[] = [];

  constructor(route: ActivatedRoute) {
    this.categoryId =
      route.snapshot.paramMap.get('idCategory') ??
      route.snapshot.paramMap.get('category') ??
      '';

    this.groupId =
      route.snapshot.paramMap.get('idGroup') ??
      route.snapshot.paramMap.get('group') ??
      '';

    this.category = CATEGORIES.find(c => c.id === this.categoryId);
    this.group = TOOL_GROUPS.find(g => g.category === this.categoryId && g.id === this.groupId);

    const tools: AtomicToolItem[] = ATOMIC_TOOLS.filter(t =>
      t.category === this.categoryId && t.group === this.groupId
    );

    const mapTool = (t: AtomicToolItem): ToolCardItem => ({
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
    if (this.group) {
      this.seo.setPageSeo({
        title: `${this.group.title} – Tools Central`,
        description: this.group.description,
      });
    }
  }
}
