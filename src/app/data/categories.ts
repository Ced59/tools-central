/** ✅ Single Source of Truth (registry) */
export const CATEGORY_REGISTRY = {
  math: {
    title: $localize`:@@cat_math_title:Mathématiques`,
    description: $localize`:@@cat_math_desc:Pourcentages, règles de trois, conversions...`,
    icon: 'pi pi-calculator',
    available: true,
  },
  text: {
    title: $localize`:@@cat_text_title:Texte`,
    description: $localize`:@@cat_text_desc:Compteurs, formatage, nettoyage de texte...`,
    icon: 'pi pi-file-edit',
    available: true,
  },
  image: {
    title: $localize`:@@cat_image_title:Image`,
    description: $localize`:@@cat_image_desc:Compression, redimensionnement, optimisation...`,
    icon: 'pi pi-image',
    available: false,
  },
} as const;

export type CategoryId = keyof typeof CATEGORY_REGISTRY;

export type ToolCategory = {
  id: CategoryId;
} & (typeof CATEGORY_REGISTRY)[CategoryId];

/** ✅ Compat: l’array historique (dérivé, pas une 2e source) */
export const CATEGORIES: ToolCategory[] = Object.entries(CATEGORY_REGISTRY).map(([id, v]) => ({
  id: id as CategoryId,
  ...v,
}));

export function getCategory(id: CategoryId): ToolCategory {
  return { id, ...CATEGORY_REGISTRY[id] };
}
