import { deriveToolGroupRegistry, deriveToolGroups } from './catalog/derive';
import type { CategoryId } from './categories';

// =============================================================================
// FAÇADE - Dérivé du catalogue unifié
// =============================================================================
// Ce fichier est une FAÇADE qui dérive ses données du catalogue SSOT.
// L'API reste identique pour ne pas impacter le reste de l'application.
// =============================================================================

/** ✅ Single Source of Truth : dérivé du catalogue */
export const TOOL_GROUP_REGISTRY: Record<CategoryId, Record<string, { title: string; description: string; icon: string; route: string; available: boolean }>> = deriveToolGroupRegistry();

export type GroupId<C extends CategoryId> = string;

export type ToolGroup = {
  category: CategoryId;
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  available: boolean;
};

/** ✅ Compat: l'array historique (dérivé) */
export const TOOL_GROUPS: ToolGroup[] = deriveToolGroups() as ToolGroup[];

export function getGroup<C extends CategoryId>(category: C, id: string) {
  const def = TOOL_GROUP_REGISTRY[category][id];
  return { category, id, ...def };
}
