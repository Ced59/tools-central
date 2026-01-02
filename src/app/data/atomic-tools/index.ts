import { Type } from '@angular/core';
import { deriveAtomicTools, deriveAtomicToolList, DerivedAtomicTool } from '../catalog/derive';
import type { CategoryId } from '../categories';
import type { GroupId } from '../tool-groups';
import type { SubGroupId } from '../tool-subgroups';

// =============================================================================
// FAÇADE - Dérivé du catalogue unifié
// =============================================================================
// Ce fichier est une FAÇADE qui dérive ses données du catalogue SSOT.
// L'API reste identique pour ne pas impacter le reste de l'application.
// =============================================================================

export interface AtomicTool<C extends CategoryId, G extends GroupId<C>> {
  category: C;
  group: G;
  subGroup: SubGroupId<C, G>;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
  loadComponent?: () => Promise<Type<unknown>>;
}

/** Helper: union "any valid pair" (évite never) */
export type AtomicToolAny = {
  [C in CategoryId]: {
    [G in GroupId<C>]: AtomicTool<C, G>;
  }[GroupId<C>];
}[CategoryId];

/** ✅ Registry global : dérivé du catalogue */
export const ATOMIC_TOOLS = deriveAtomicTools() as Record<string, DerivedAtomicTool>;

export type ToolId = keyof typeof ATOMIC_TOOLS;
export type AtomicToolItem = { id: ToolId } & (typeof ATOMIC_TOOLS)[ToolId];

export const ATOMIC_TOOL_LIST: AtomicToolItem[] = deriveAtomicToolList() as AtomicToolItem[];

export function getToolById(id: ToolId) {
  return ATOMIC_TOOLS[id];
}
