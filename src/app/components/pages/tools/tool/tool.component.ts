import { Component, Type, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';

import { ToolRegistryService } from '../../../../core/tools/tool-registry.service';

import { CATEGORIES, type CategoryId } from '../../../../data/categories';
import { TOOL_GROUP_REGISTRY } from '../../../../data/tool-groups';
import { routes } from '../../../../data/routes';

import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';
import { ToolEditorialSectionsComponent } from '../../../shared/tool-editorial-sections/tool-editorial-sections.component';
import { ToolEditorialService } from '../../../../core/tools/toll-editorial.service';

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet, RouterLink, ToolEditorialSectionsComponent],
  templateUrl: './tool.component.html',
  styleUrl: './tool.component.scss',
})
export class ToolComponent {
  toolComponent = signal<Type<unknown> | null>(null);
  editorial = signal<ToolEditorialModel | null>(null);
  isLoading = signal(true);

  private categoryId = '';
  private groupId = '';
  private toolId = '';

  constructor(
    route: ActivatedRoute,
    registry: ToolRegistryService,
    editorialService: ToolEditorialService
  ) {
    const categoryRaw =
      route.snapshot.paramMap.get('idCategory') ??
      route.snapshot.paramMap.get('category') ??
      route.snapshot.paramMap.get('cat') ??
      '';

    const group =
      route.snapshot.paramMap.get('idGroup') ??
      route.snapshot.paramMap.get('group') ??
      '';

    const tool =
      route.snapshot.paramMap.get('idTool') ??
      route.snapshot.paramMap.get('tool') ??
      '';

    this.categoryId = categoryRaw;
    this.groupId = group;
    this.toolId = tool;

    const category = this.toCategoryId(categoryRaw);

    if (!category || !group || !tool) {
      this.toolComponent.set(null);
      this.editorial.set(null);
      this.isLoading.set(false);
      return;
    }

    Promise.all([
      registry.loadToolComponent({ category, group, tool }),
      editorialService.loadEditorial({ category, group, tool }),
    ])
      .then(([cmp, ed]) => {
        this.toolComponent.set(cmp);
        this.editorial.set(ed);
        this.isLoading.set(false);
      })
      .catch(() => {
        this.toolComponent.set(null);
        this.editorial.set(null);
        this.isLoading.set(false);
      });
  }

  backLink(): string {
    if (this.categoryId && this.groupId) {
      return routes.group(this.categoryId, this.groupId);
    }
    if (this.categoryId) {
      return routes.category(this.categoryId);
    }
    return '/';
  }

  backLabel(): string {
    // Essaie de récupérer le titre du groupe pour un label contextuel
    if (this.categoryId && this.groupId) {
      const catId = this.toCategoryId(this.categoryId);
      if (catId) {
        const groupRegistry = TOOL_GROUP_REGISTRY[catId];
        const group = groupRegistry?.[this.groupId];
        if (group?.title) {
          return $localize`:@@back_to_tools:Retour aux outils ${group.title}`;
        }
      }
    }

    // Fallback sur le nom de la catégorie
    if (this.categoryId) {
      const cat = CATEGORIES.find(c => c.id === this.categoryId);
      if (cat?.title) {
        return $localize`:@@back_to_category:Retour à ${cat.title}`;
      }
    }

    return $localize`:@@back_generic:Retour`;
  }

  private toCategoryId(v: string): CategoryId | null {
    return CATEGORIES.some(c => c.id === v) ? (v as CategoryId) : null;
  }
}
