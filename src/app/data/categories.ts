import { deriveCategoryRegistry, deriveCategories } from './catalog/derive';

// =============================================================================
// FAÇADE - Dérivé du catalogue unifié
// =============================================================================
// Ce fichier est une FAÇADE qui dérive ses données du catalogue SSOT.
// L'API reste identique pour ne pas impacter le reste de l'application.
// =============================================================================

/** ✅ Single Source of Truth : dérivé du catalogue */
export const CATEGORY_REGISTRY = deriveCategoryRegistry();

export type CategoryId = keyof typeof CATEGORY_REGISTRY;

export type ToolCategory = {
  id: CategoryId;
} & (typeof CATEGORY_REGISTRY)[CategoryId];

/** ✅ Compat: l'array historique (dérivé) */
export const CATEGORIES: ToolCategory[] = deriveCategories() as ToolCategory[];

export function getCategory(id: CategoryId): ToolCategory {
  return { id, ...CATEGORY_REGISTRY[id] };
}
