import { Component, Type, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';

import { ToolRegistryService } from '../../../../core/tools/tool-registry.service';

import { CATEGORIES, type CategoryId } from '../../../../data/categories';
import { TOOL_GROUP_REGISTRY } from '../../../../data/tool-groups';
import { routes } from '../../../../data/routes';

import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';
import { ToolEditorialSectionsComponent } from '../../../shared/tool-editorial-sections/tool-editorial-sections.component';
import { ToolEditorialService } from '../../../../core/tools/toll-editorial.service';
import { RelatedToolsComponent } from '../../../shared/related-tools';

import { map, distinctUntilChanged } from 'rxjs/operators';

type ToolRouteParams = {
  categoryRaw: string;
  group: string;
  tool: string;
};

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet, RouterLink, ToolEditorialSectionsComponent, RelatedToolsComponent],
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

  /** Incrémente à chaque navigation pour ignorer les réponses async obsolètes */
  private requestSeq = 0;

  constructor(
    private route: ActivatedRoute,
    private registry: ToolRegistryService,
    private editorialService: ToolEditorialService
  ) {
    // ⚠️ IMPORTANT: écouter les changements de params (pas snapshot)
    this.route.paramMap
      .pipe(
        map((pm): ToolRouteParams => {
          const categoryRaw =
            pm.get('idCategory') ??
            pm.get('category') ??
            pm.get('cat') ??
            '';

          const group =
            pm.get('idGroup') ??
            pm.get('group') ??
            '';

          const tool =
            pm.get('idTool') ??
            pm.get('tool') ??
            '';

          return { categoryRaw, group, tool };
        }),
        // évite de recharger si mêmes params
        distinctUntilChanged(
          (a, b) =>
            a.categoryRaw === b.categoryRaw &&
            a.group === b.group &&
            a.tool === b.tool
        )
      )
      .subscribe((p) => {
        this.loadFromParams(p);
      });
  }

  private loadFromParams({ categoryRaw, group, tool }: ToolRouteParams): void {
    // garder les ids pour backLink/backLabel
    this.categoryId = categoryRaw;
    this.groupId = group;
    this.toolId = tool;

    const category = this.toCategoryId(categoryRaw);

    // reset UI
    this.isLoading.set(true);
    this.toolComponent.set(null);
    this.editorial.set(null);

    if (!category || !group || !tool) {
      this.isLoading.set(false);
      return;
    }

    const mySeq = ++this.requestSeq;

    Promise.all([
      this.registry.loadToolComponent({ category, group, tool }),
      this.editorialService.loadEditorial({ category, group, tool }),
    ])
      .then(([cmp, ed]) => {
        // si une navigation a eu lieu entre-temps, on ignore cette réponse
        if (mySeq !== this.requestSeq) return;

        this.toolComponent.set(cmp);
        this.editorial.set(ed);
        this.isLoading.set(false);
      })
      .catch(() => {
        if (mySeq !== this.requestSeq) return;

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
