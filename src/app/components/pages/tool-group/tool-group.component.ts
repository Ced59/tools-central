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
  id: string; // subgroup id or '__default'
  title?: string;
  description?: string;
  availableTools: ToolCardItem[];
  comingSoonTools: ToolCardItem[];
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

  get hasAnyTool(): boolean {
    return this.sections.some(s => s.availableTools.length > 0 || s.comingSoonTools.length > 0);
  }

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

    const tools: AtomicToolItem[] = ATOMIC_TOOL_LIST.filter(
      t => t.category === this.categoryId && t.group === this.groupId
    );

    const mapTool = (t: AtomicToolItem): ToolCardItem => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon ?? 'pi pi-wrench',
      route: t.route,
      available: t.available,
    });

    const subGroups: ToolSubGroup[] = TOOL_SUBGROUPS
      .filter(sg => sg.category === this.categoryId && sg.group === this.groupId)
      .sort((a, b) => a.order - b.order);

    const hasSubGroups = subGroups.length > 0;

    if (!hasSubGroups) {
      this.sections = [
        {
          id: '__default',
          availableTools: tools.filter(t => t.available).map(mapTool),
          comingSoonTools: tools.filter(t => !t.available).map(mapTool),
        },
      ];
      return;
    }

    const bySubGroup = new Map<string, AtomicToolItem[]>();
    for (const t of tools) {
      const key = (t.subGroup ?? '__other') as string;
      if (!bySubGroup.has(key)) bySubGroup.set(key, []);
      bySubGroup.get(key)!.push(t);
    }

    const mkSection = (id: string, title?: string, description?: string): ToolSection => {
      const list = (bySubGroup.get(id) ?? []).map(mapTool);
      return {
        id,
        title,
        description,
        availableTools: list.filter(x => x.available),
        comingSoonTools: list.filter(x => !x.available),
      };
    };

    this.sections = subGroups.map((sg: ToolSubGroup) => mkSection(sg.id as string, sg.title, sg.description));

    // "Autres" si des tools n'entrent dans aucun sous-groupe déclaré
    const declared = new Set<string>(subGroups.map(sg => sg.id as string));
    const others: AtomicToolItem[] = [];

    for (const [k, arr] of bySubGroup.entries()) {
      if (k === '__other' || !declared.has(k)) {
        others.push(...arr);
      }
    }

    if (others.length > 0) {
      const list = others.map(mapTool);
      this.sections.push({
        id: '__other',
        title: $localize`:@@tools_subgroup_other:Autres`,
        description: $localize`:@@tools_subgroup_other_desc:Outils complémentaires.`,
        availableTools: list.filter(x => x.available),
        comingSoonTools: list.filter(x => !x.available),
      });
    }
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
