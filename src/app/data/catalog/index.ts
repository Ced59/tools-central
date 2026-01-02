import type { CatalogDefinition } from './types';
import { MATH_CATEGORY } from './math.catalog';
import { TEXT_CATEGORY } from './text.catalog';
import { IMAGE_CATEGORY } from './image.catalog';
import { DEV_CATEGORY } from './dev.catalog';

// =============================================================================
// CATALOGUE UNIFIÉ - SINGLE SOURCE OF TRUTH
// =============================================================================
//
// ✅ Un outil = UNE SEULE déclaration
// ✅ Catégories, groupes, sous-groupes = définis UNE FOIS
// ✅ Routes = DÉDUITES automatiquement
// ✅ ZÉRO duplication
//
// Pour ajouter un outil : l'ajouter dans le fichier *.catalog.ts correspondant
// =============================================================================

export const CATALOG: CatalogDefinition = {
  math: MATH_CATEGORY,
  text: TEXT_CATEGORY,
  image: IMAGE_CATEGORY,
  dev: DEV_CATEGORY,
};

export * from './types';
