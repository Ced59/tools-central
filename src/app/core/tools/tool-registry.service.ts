import { Injectable, Type, isDevMode } from '@angular/core';
import { ATOMIC_TOOL_LIST, AtomicToolItem } from '../../data/atomic-tools';
import { CATEGORIES, type CategoryId, type ToolCategory } from '../../data/categories';
import { TOOL_GROUPS, type ToolGroup } from '../../data/tool-groups';
import { routes } from '../../data/routes';

export type ToolKey = {
  category: CategoryId;
  group: string;
  tool: string;
};

export type ResolvedTool = AtomicToolItem & {
  categoryDef: ToolCategory;
  groupDef: ToolGroup;
};

@Injectable({ providedIn: 'root' })
export class ToolRegistryService {
  private readonly categories = CATEGORIES;
  private readonly groups = TOOL_GROUPS;
  private readonly tools: AtomicToolItem[] = ATOMIC_TOOL_LIST;

  constructor() {
    if (isDevMode()) this.validate();
  }

  getCategory(id: CategoryId): ToolCategory | null {
    return this.categories.find(c => c.id === id) ?? null;
  }

  getGroup(category: CategoryId, group: string): ToolGroup | null {
    return this.groups.find(g => g.category === category && String(g.id) === String(group)) ?? null;
  }

  getTool(key: ToolKey): ResolvedTool | null {
    const tool = this.tools.find(
      t => t.category === key.category && t.group === key.group && t.id === key.tool
    );
    if (!tool) return null;

    const categoryDef = this.getCategory(key.category);
    const groupDef = this.getGroup(key.category, key.group);
    if (!categoryDef || !groupDef) return null;

    return { ...tool, categoryDef, groupDef };
  }

  listGroupsByCategory(category: CategoryId): ToolGroup[] {
    return this.groups
      .filter(g => g.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  listToolsByGroup(category: CategoryId, group: string): AtomicToolItem[] {
    return this.tools
      .filter(t => t.category === category && t.group === group)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async loadToolComponent(key: ToolKey): Promise<Type<unknown> | null> {
    const tool = this.getTool(key);
    if (!tool || !tool.available || !tool.loadComponent) return null;

    try {
      return await tool.loadComponent();
    } catch (e) {
      console.error(`[Tools] Echec loadComponent pour "${tool.category}/${tool.group}/${tool.id}"`, e);
      return null;
    }
  }

  private validate() {
    const catIds = new Set(this.categories.map(c => c.id));
    const groupKeys = new Set(this.groups.map(g => `${g.category}/${String(g.id)}`));

    // groups coherence
    for (const g of this.groups) {
      if (!catIds.has(g.category)) {
        console.error(`[Tools] Group "${g.category}/${String(g.id)}" catégorie inconnue "${g.category}"`);
      }
      const expectedRoute = routes.group(g.category, String(g.id));
      if (g.route !== expectedRoute) {
        console.warn(
          `[Tools] Route group incohérente "${g.category}/${String(g.id)}" attendu="${expectedRoute}" reçu="${g.route}"`
        );
      }
    }

    // tools coherence
    const seenRoutes = new Map<string, string>();
    for (const t of this.tools) {
      const key = `${t.category}/${t.group}/${t.id}`;

      if (!catIds.has(t.category)) {
        console.error(`[Tools] Tool "${key}" catégorie inconnue "${t.category}"`);
      }
      const gk = `${t.category}/${t.group}`;
      if (!groupKeys.has(gk)) {
        console.error(`[Tools] Tool "${key}" groupe inexistant "${gk}"`);
      }

      const expectedRoute = routes.tool(t.category, t.group, t.id);
      if (t.route !== expectedRoute) {
        console.warn(`[Tools] Route tool incohérente "${key}" attendu="${expectedRoute}" reçu="${t.route}"`);
      }

      if (t.available && !t.loadComponent) {
        console.error(`[Tools] Tool dispo sans loadComponent: "${key}"`);
      }

      const prev = seenRoutes.get(t.route);
      if (prev) {
        console.error(`[Tools] Route dupliquée "${t.route}" entre "${prev}" et "${key}"`);
      } else {
        seenRoutes.set(t.route, key);
      }
    }
  }
}
