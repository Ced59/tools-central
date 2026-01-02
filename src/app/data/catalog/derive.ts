import { Type } from '@angular/core';
import { CATALOG } from './index';
import { routes } from '../routes';

// =============================================================================
// FONCTIONS DE DÉRIVATION
// =============================================================================
// Ces fonctions dérivent les anciennes structures (registries/arrays) à partir
// du catalogue unifié. L'application utilise ces fonctions dérivées, donc
// ZÉRO changement de code nécessaire.
// =============================================================================

// -----------------------------------------------------------------------------
// CATEGORIES
// -----------------------------------------------------------------------------

export function deriveCategoryRegistry() {
  const registry: Record<string, {
    title: string;
    description: string;
    icon: string;
    available: boolean;
  }> = {};

  for (const [catId, cat] of Object.entries(CATALOG)) {
    registry[catId] = {
      title: cat.title,
      description: cat.description,
      icon: cat.icon,
      available: cat.available,
    };
  }

  return registry;
}

export function deriveCategories() {
  return Object.entries(CATALOG).map(([id, cat]) => ({
    id,
    title: cat.title,
    description: cat.description,
    icon: cat.icon,
    available: cat.available,
  }));
}

// -----------------------------------------------------------------------------
// TOOL GROUPS
// -----------------------------------------------------------------------------

export function deriveToolGroupRegistry() {
  const registry: Record<string, Record<string, {
    title: string;
    description: string;
    icon: string;
    route: string;
    available: boolean;
  }>> = {};

  for (const [catId, cat] of Object.entries(CATALOG)) {
    registry[catId] = {};
    for (const [groupId, group] of Object.entries(cat.groups)) {
      registry[catId][groupId] = {
        title: group.title,
        description: group.description,
        icon: group.icon,
        route: routes.group(catId, groupId),
        available: group.available,
      };
    }
  }

  return registry;
}

export function deriveToolGroups() {
  const result: Array<{
    category: string;
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
    available: boolean;
  }> = [];

  for (const [catId, cat] of Object.entries(CATALOG)) {
    for (const [groupId, group] of Object.entries(cat.groups)) {
      result.push({
        category: catId,
        id: groupId,
        title: group.title,
        description: group.description,
        icon: group.icon,
        route: routes.group(catId, groupId),
        available: group.available,
      });
    }
  }

  return result;
}

// -----------------------------------------------------------------------------
// TOOL SUBGROUPS
// -----------------------------------------------------------------------------

export function deriveToolSubGroupRegistry() {
  const registry: Record<string, Record<string, Array<{
    id: string;
    title: string;
    description: string;
    order: number;
  }>>> = {};

  for (const [catId, cat] of Object.entries(CATALOG)) {
    registry[catId] = {};
    for (const [groupId, group] of Object.entries(cat.groups)) {
      registry[catId][groupId] = Object.entries(group.subGroups).map(
        ([sgId, sg]) => ({
          id: sgId,
          title: sg.title,
          description: sg.description,
          order: sg.order,
        })
      );
    }
  }

  return registry;
}

export function deriveToolSubGroups() {
  const result: Array<{
    category: string;
    group: string;
    id: string;
    title: string;
    description: string;
    order: number;
  }> = [];

  for (const [catId, cat] of Object.entries(CATALOG)) {
    for (const [groupId, group] of Object.entries(cat.groups)) {
      for (const [sgId, sg] of Object.entries(group.subGroups)) {
        result.push({
          category: catId,
          group: groupId,
          id: sgId,
          title: sg.title,
          description: sg.description,
          order: sg.order,
        });
      }
    }
  }

  return result;
}

// -----------------------------------------------------------------------------
// ATOMIC TOOLS
// -----------------------------------------------------------------------------

export interface DerivedAtomicTool {
  category: string;
  group: string;
  subGroup: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  available: boolean;
  loadComponent?: () => Promise<Type<unknown>>;
}

export function deriveAtomicTools(): Record<string, DerivedAtomicTool> {
  const result: Record<string, DerivedAtomicTool> = {};

  for (const [catId, cat] of Object.entries(CATALOG)) {
    for (const [groupId, group] of Object.entries(cat.groups)) {
      for (const [sgId, sg] of Object.entries(group.subGroups)) {
        for (const [toolId, tool] of Object.entries(sg.tools)) {
          result[toolId] = {
            category: catId,
            group: groupId,
            subGroup: sgId,
            title: tool.title,
            description: tool.description,
            icon: tool.icon,
            route: routes.tool(catId, groupId, toolId),
            available: tool.available,
            loadComponent: tool.loadComponent,
          };
        }
      }
    }
  }

  return result;
}

export function deriveAtomicToolList() {
  const tools = deriveAtomicTools();
  return Object.entries(tools).map(([id, tool]) => ({
    id,
    ...tool,
  }));
}
