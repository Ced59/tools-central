import { Injectable, Type, isDevMode } from '@angular/core';
import { ATOMIC_TOOL_LIST, AtomicToolItem, ToolId } from '../../data/atomic-tools';
import { CATEGORIES, ToolCategory } from '../../data/categories';
import { TOOL_GROUPS, ToolGroup } from '../../data/tool-groups';
import { routes } from '../../data/routes';

export type ToolKey = {
  category: string;
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
  private tools: AtomicToolItem[] = ATOMIC_TOOL_LIST;

  constructor() {
    if (isDevMode()) this.validate();
  }

  getCategory(id: string): ToolCategory | null {
    return this.categories.find(c => c.id === id) ?? null;
  }

  getGroup(category: string, group: string): ToolGroup | null {
    return this.groups.find(g => g.category === category && g.id === group) ?? null;
  }

  getTool(key: ToolKey): ResolvedTool | null {
    const tool = this.tools.find(t =>
      t.category === key.category &&
      t.group === key.group &&
      t.id === key.tool
    );
    if (!tool) return null;

    const categoryDef = this.getCategory(key.category);
    const groupDef = this.getGroup(key.category, key.group);

    if (!categoryDef || !groupDef) return null;

    return { ...tool, categoryDef, groupDef };
  }

  listGroupsByCategory(category: string): ToolGroup[] {
    return this.groups
      .filter(g => g.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  listToolsByGroup(category: string, group: string): AtomicToolItem[] {
    return this.tools
      .filter(t => t.category === category && t.group === group)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Résout et lazy-load un tool uniquement s'il est dispo
   */
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

  /** ----------------- DEV VALIDATIONS ----------------- */
  private validate() {
    const catIds = new Set(this.categories.map(c => c.id));
    const groupKeys = new Set(this.groups.map(g => `${g.category}/${g.id}`));

    // Categories: route non applicable ici, mais au minimum uniqueness
    {
      const seen = new Set<string>();
      for (const c of this.categories) {
        if (seen.has(c.id)) {
          console.error(`[Tools] Catégorie dupliquée id="${c.id}"`);
        }
        seen.add(c.id);
      }
    }

    // Groups: catégorie existante + route cohérente + uniqueness (category/id)
    {
      const seen = new Set<string>();
      for (const g of this.groups) {
        const key = `${g.category}/${g.id}`;
        if (seen.has(key)) {
          console.error(`[Tools] Groupe dupliqué "${key}"`);
        }
        seen.add(key);

        if (!catIds.has(g.category)) {
          console.error(`[Tools] Group "${key}" pointe vers une catégorie inconnue "${g.category}".`);
        }

        const expectedRoute = routes.group(g.category, g.id);
        if (g.route !== expectedRoute) {
          console.warn(
            `[Tools] Route group incohérente pour "${key}". Attendu="${expectedRoute}" Reçu="${g.route}"`
          );
        }
      }
    }

    // Tools: catégorie+groupe existants + route cohérente + route unique + dispo => loader obligatoire
    {
      const seenRoutes = new Map<string, string>();

      for (const t of this.tools) {
        const key = `${t.category}/${t.group}/${t.id}`;

        if (!catIds.has(t.category)) {
          console.error(`[Tools] Tool "${key}" pointe vers une catégorie inconnue "${t.category}".`);
        }

        const gk = `${t.category}/${t.group}`;
        if (!groupKeys.has(gk)) {
          console.error(`[Tools] Tool "${key}" pointe vers un groupe inexistant "${gk}".`);
        }

        const expectedRoute = routes.tool(t.category, t.group, t.id);
        if (t.route !== expectedRoute) {
          console.warn(
            `[Tools] Route tool incohérente pour "${key}". Attendu="${expectedRoute}" Reçu="${t.route}"`
          );
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
}
