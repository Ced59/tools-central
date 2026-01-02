import type { CatalogCategoryDefinition } from './types';

// =============================================================================
// IMAGE - Single Source of Truth
// =============================================================================

export const IMAGE_CATEGORY: CatalogCategoryDefinition = {
  title: $localize`:@@cat_image_title:Image`,
  description: $localize`:@@cat_image_desc:Compression, redimensionnement, optimisation...`,
  icon: 'pi pi-image',
  available: false,
  groups: {},
};
