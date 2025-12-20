import { routes } from './routes';
import type { CategoryId } from './categories';

/** ✅ Single Source of Truth (registry imbriqué) */
export const TOOL_GROUP_REGISTRY = {
  math: {
    percentages: {
      title: $localize`:@@group_percentages_title:Pourcentages`,
      description: $localize`:@@group_percentages_desc:Augmentation, remise, variation, taux inversé...`,
      icon: 'pi pi-percentage',
      route: routes.group('math', 'percentages'),
      available: true,
    },
    vat: {
      title: $localize`:@@group_vat_title:TVA`,
      description: $localize`:@@group_vat_desc:HT/TTC, taux personnalisés, calculs rapides...`,
      icon: 'pi pi-receipt',
      route: routes.group('math', 'vat'),
      available: false,
    },
  },
  text: {
    case: {
      title: $localize`:@@group_text_case_title:Casse du texte`,
      description: $localize`:@@group_text_case_desc:Majuscules, minuscules, inversion, capitalisation…`,
      icon: 'pi pi-sort-alpha-down',
      route: routes.group('text', 'case'),
      available: true,
    },
    writing: {
      title: $localize`:@@group_text_writing_title:Écriture`,
      description: $localize`:@@group_text_writing_desc:Lisibilité, clarté, style et amélioration de texte…`,
      icon: 'pi pi-pencil',
      route: routes.group('text', 'writing'),
      available: true,
    },
  },
  image: {},
} as const;

export type GroupId<C extends CategoryId> = keyof (typeof TOOL_GROUP_REGISTRY)[C];

export type ToolGroup = {
  [C in CategoryId]: {
    [G in keyof (typeof TOOL_GROUP_REGISTRY)[C]]: {
    category: C;
    id: G;
  } & (typeof TOOL_GROUP_REGISTRY)[C][G];
  }[keyof (typeof TOOL_GROUP_REGISTRY)[C]];
}[CategoryId];

/** ✅ Compat: l’array historique (dérivé) */
export const TOOL_GROUPS: ToolGroup[] =
  (Object.entries(TOOL_GROUP_REGISTRY) as [CategoryId, any][])
    .flatMap(([category, groups]) =>
      (Object.entries(groups) as [string, any][]).map(([id, v]) => ({
        category,
        id: id as GroupId<typeof category>,
        ...v,
      }))
    );

export function getGroup<C extends CategoryId, G extends GroupId<C>>(category: C, id: G) {
  const def = (TOOL_GROUP_REGISTRY[category] as any)[id] as (typeof TOOL_GROUP_REGISTRY)[C][G];
  return { category, id, ...def };
}
