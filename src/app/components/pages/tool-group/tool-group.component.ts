import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { CATEGORIES, ToolCategory } from '../../../data/categories';
import { TOOL_GROUPS, ToolGroup } from '../../../data/tool-groups';
import { TOOL_SUBGROUPS, ToolSubGroup } from '../../../data/tool-subgroups';
import { ATOMIC_TOOL_LIST, AtomicToolItem } from '../../../data/atomic-tools';

import { ToolCardComponent, ToolCardItem } from '../../shared/tool-card/tool-card.component';
import { SeoService } from '../../../services/seo/seo.service';

type ToolSection = {
  id: string; // subGroup id, ou '__other'
  title?: string;
  description?: string;
  order: number;

  availableTools: ToolCardItem[];
  comingSoonTools: ToolCardItem[];

  // ✅ pour le rendu “1 seule grille”
  tools: ToolCardItem[];

  availableCount: number;
  comingSoonCount: number;
};

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

  sections: ToolSection[] = [];
  hasAnyTool = false;

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

    const tools: AtomicToolItem[] = ATOMIC_TOOL_LIST.filter(t =>
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

    const subGroups = TOOL_SUBGROUPS
      .filter(sg => sg.category === this.categoryId && sg.group === this.groupId)
      .sort((a, b) => a.order - b.order);

    const bySub = new Map<string, AtomicToolItem[]>();
    for (const t of tools) {
      const k = t.subGroup || '__other';
      const arr = bySub.get(k) ?? [];
      arr.push(t);
      bySub.set(k, arr);
    }

    const mkSection = (id: string, title?: string, description?: string, order = 999): ToolSection => {
      const arr = (bySub.get(id) ?? []).map(mapTool);

      const availableTools = arr.filter(x => x.available);
      const comingSoonTools = arr.filter(x => !x.available);

      // ✅ rendu final : une seule liste, triée "dispo d'abord"
      const toolsSorted = [...availableTools, ...comingSoonTools];

      return {
        id,
        title,
        description,
        order,
        availableTools,
        comingSoonTools,
        tools: toolsSorted,
        availableCount: availableTools.length,
        comingSoonCount: comingSoonTools.length,
      };
    };

    const declaredSections = subGroups.map(sg => mkSection(sg.id, sg.title, sg.description, sg.order));

    // "__other" si jamais un tool a un subGroup non déclaré (ou vide)
    const declaredIds = new Set(subGroups.map(sg => sg.id));
    const others: AtomicToolItem[] = [];
    for (const [k, arr] of bySub.entries()) {
      if (k === '__other' || !declaredIds.has(k)) others.push(...arr);
    }
    const otherSection =
      others.length > 0
        ? (() => {
          bySub.set('__other', others);
          return mkSection('__other', undefined, undefined, 9999);
        })()
        : null;

    this.sections = otherSection
      ? [...declaredSections, otherSection].sort((a, b) => a.order - b.order)
      : declaredSections;

    this.hasAnyTool = this.sections.some(s => s.tools.length > 0);
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
