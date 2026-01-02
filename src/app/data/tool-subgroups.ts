import { deriveToolSubGroupRegistry, deriveToolSubGroups } from './catalog/derive';
import type { CategoryId } from './categories';
import type { GroupId } from './tool-groups';

// =============================================================================
// FAÇADE - Dérivé du catalogue unifié
// =============================================================================
// Ce fichier est une FAÇADE qui dérive ses données du catalogue SSOT.
// L'API reste identique pour ne pas impacter le reste de l'application.
// =============================================================================

/** ✅ Single Source of Truth : dérivé du catalogue */
export const TOOL_SUBGROUP_REGISTRY = deriveToolSubGroupRegistry();

/** ✅ ID dérivé automatiquement */
export type SubGroupId<C extends CategoryId, G extends GroupId<C>> = string;

/** ✅ Type flat pour UI */
export type ToolSubGroup = {
  category: string;
  group: string;
  id: string;
  title: string;
  description: string;
  order: number;
};

/** ✅ Compat: array dérivé */
export const TOOL_SUBGROUPS: ToolSubGroup[] = deriveToolSubGroups();
