import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { ATOMIC_TOOL_LIST, ATOMIC_TOOLS, AtomicToolItem } from '../../../data/atomic-tools';

export interface RelatedToolConfig {
  /** Nombre d'outils à afficher (défaut: 6) */
  count?: number;
  /** IDs d'outils prioritaires à afficher en premier (optionnel) */
  priorityToolIds?: string[];
}

@Component({
  selector: 'app-related-tools',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './related-tools.component.html',
  styleUrl: './related-tools.component.scss',
})
export class RelatedToolsComponent implements OnInit, OnDestroy {
  @Input() config?: RelatedToolConfig;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private sub = new Subscription();

  relatedTools: AtomicToolItem[] = [];

  ngOnInit(): void {
    this.relatedTools = this.computeRelatedTools();

    // ✅ Recalcule après navigation (sinon reste figé)
    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          this.relatedTools = this.computeRelatedTools();
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private detectCurrentTool(): { toolId: string; tool: AtomicToolItem } | null {
    const toolFromRoute = this.detectFromRouteParams();
    if (toolFromRoute) return toolFromRoute;
    return this.detectFromUrl();
  }

  private detectFromRouteParams(): { toolId: string; tool: AtomicToolItem } | null {
    let currentRoute: ActivatedRoute | null = this.route;

    while (currentRoute) {
      const params = currentRoute.snapshot.paramMap;

      const toolId =
        params.get('idTool') ??
        params.get('tool') ??
        params.get('toolId');

      if (toolId) {
        const tool = ATOMIC_TOOLS[toolId];
        if (tool) {
          return {
            toolId,
            tool: { id: toolId, ...tool } as AtomicToolItem,
          };
        }
      }

      currentRoute = currentRoute.parent;
    }

    return null;
  }

  private detectFromUrl(): { toolId: string; tool: AtomicToolItem } | null {
    const url = this.router.url;
    const pathOnly = url.split('?')[0].split('#')[0];
    const segments = pathOnly.split('/').filter(Boolean);
    const cleanSegments = this.removeLocalePrefix(segments);

    if (cleanSegments.length < 4) return null;

    const potentialToolId = cleanSegments[cleanSegments.length - 1];

    const tool = ATOMIC_TOOLS[potentialToolId];
    if (tool) {
      return {
        toolId: potentialToolId,
        tool: { id: potentialToolId, ...tool } as AtomicToolItem,
      };
    }

    const routePath = cleanSegments.join('/');
    const foundTool = ATOMIC_TOOL_LIST.find((t) => {
      const toolRoute = t.route.replace(/^\/+/, '');
      return toolRoute === routePath;
    });

    if (foundTool) {
      return {
        toolId: foundTool.id as string,
        tool: foundTool,
      };
    }

    return null;
  }

  private removeLocalePrefix(segments: string[]): string[] {
    if (segments.length === 0) return segments;

    const first = segments[0];
    const isLocale = /^[a-z]{2}(-[a-zA-Z]{2,4})?$/.test(first);

    if (isLocale && segments.length > 1 && segments[1] === 'categories') {
      return segments.slice(1);
    }

    return segments;
  }

  private computeRelatedTools(): AtomicToolItem[] {
    const count = this.config?.count ?? 6;
    const priorityToolIds = this.config?.priorityToolIds;

    const current = this.detectCurrentTool();
    if (!current) {
      console.warn('[RelatedTools] Impossible de détecter l\'outil courant');
      return [];
    }

    const { toolId: currentId, tool: currentTool } = current;
    const category = currentTool.category;
    const group = currentTool.group;
    const subGroup = currentTool.subGroup;

    const availableTools = ATOMIC_TOOL_LIST.filter(
      (tool) => tool.available && tool.id !== currentId
    );

    const result: AtomicToolItem[] = [];
    const usedIds = new Set<string>();

    if (priorityToolIds && priorityToolIds.length > 0) {
      for (const priorityId of priorityToolIds) {
        if (result.length >= count) break;
        const tool = availableTools.find((t) => t.id === priorityId);
        if (tool && !usedIds.has(tool.id as string)) {
          result.push(tool);
          usedIds.add(tool.id as string);
        }
      }
    }

    if (subGroup) {
      const sameSubGroup = availableTools.filter(
        (t) =>
          t.category === category &&
          t.group === group &&
          t.subGroup === subGroup &&
          !usedIds.has(t.id as string)
      );
      for (const tool of sameSubGroup) {
        if (result.length >= count) break;
        result.push(tool);
        usedIds.add(tool.id as string);
      }
    }

    const sameGroup = availableTools.filter(
      (t) =>
        t.category === category &&
        t.group === group &&
        !usedIds.has(t.id as string)
    );
    for (const tool of sameGroup) {
      if (result.length >= count) break;
      result.push(tool);
      usedIds.add(tool.id as string);
    }

    const sameCategory = availableTools.filter(
      (t) =>
        t.category === category &&
        !usedIds.has(t.id as string)
    );
    for (const tool of sameCategory) {
      if (result.length >= count) break;
      result.push(tool);
      usedIds.add(tool.id as string);
    }

    if (result.length < count) {
      const otherCategories = availableTools.filter(
        (t) => !usedIds.has(t.id as string)
      );
      for (const tool of otherCategories) {
        if (result.length >= count) break;
        result.push(tool);
        usedIds.add(tool.id as string);
      }
    }

    return result;
  }

  getToolLink(tool: AtomicToolItem): string {
    return tool.route ?? '/';
  }

  getToolIcon(tool: AtomicToolItem): string {
    return tool.icon ?? 'pi pi-calculator';
  }
}
