import type { CategoryId } from './categories';
import type { GroupId } from './tool-groups';

/** ✅ Single Source of Truth (registry imbriqué) */
export const TOOL_SUBGROUP_REGISTRY = {
  math: {
    percentages: [
      {
        id: 'essential',
        title: $localize`:@@pct_sg_essential_title:Essentiels`,
        description: $localize`:@@pct_sg_essential_desc:Les calculs les plus courants.`,
        order: 1,
      },
      {
        id: 'cumul',
        title: $localize`:@@pct_sg_cumul_title:Cumul & comparaisons`,
        description: $localize`:@@pct_sg_cumul_desc:Effet cumulé, différences, comparaisons.`,
        order: 2,
      },
      {
        id: 'share',
        title: $localize`:@@pct_sg_share_title:Parts & ratios`,
        description: $localize`:@@pct_sg_share_desc:Répartition d’un total, ratio en %, composition…`,
        order: 3,
      },
    ],
    vat: [
      {
        id: 'essential',
        title: $localize`:@@vat_sg_essential_title:Essentiels`,
        description: $localize`:@@vat_sg_essential_desc:Calculs HT/TTC les plus courants.`,
        order: 1,
      },
    ],
  },
  text: {
    case: [
      {
        id: 'essential',
        title: $localize`:@@case_sg_essential_title:Essentiels`,
        description: $localize`:@@case_sg_essential_desc:Conversions de casse principales.`,
        order: 1,
      },
    ],
    writing: [
      {
        id: 'essential',
        title: $localize`:@@writing_sg_essential_title:Essentiels`,
        description: $localize`:@@writing_sg_essential_desc:Analyse et amélioration d’écriture.`,
        order: 1,
      },
    ],
  },
  image: {},
} as const;

/**
 * ✅ Helper: pour un C, les groupes qui existent vraiment dans le registry
 * (évite "G cannot be used to index ...")
 */
type RegistryGroupKey<C extends CategoryId> = Extract<keyof (typeof TOOL_SUBGROUP_REGISTRY)[C], string>;

type SubGroupArray<C extends CategoryId, G extends GroupId<C>> =
  G extends RegistryGroupKey<C>
    ? (typeof TOOL_SUBGROUP_REGISTRY)[C][G]
    : never;

type SubGroupItem<C extends CategoryId, G extends GroupId<C>> =
  SubGroupArray<C, G> extends readonly (infer SG)[] ? SG : never;

/** ✅ ID dérivé automatiquement */
export type SubGroupId<C extends CategoryId, G extends GroupId<C>> =
  SubGroupItem<C, G> extends { id: infer I } ? I : never;

/** ✅ Type flat pour UI */
export type ToolSubGroup = {
  [C in CategoryId]: {
    [G in GroupId<C>]:
    SubGroupItem<C, G> extends { id: infer I; title: string; description?: string; order: number }
      ? { category: C; group: G; id: I; title: string; description?: string; order: number }
      : never;
  }[GroupId<C>];
}[CategoryId];

/** ✅ Compat: array dérivé */
export const TOOL_SUBGROUPS = (
  Object.entries(TOOL_SUBGROUP_REGISTRY) as [CategoryId, any][]
).flatMap(([category, groups]) =>
  (Object.entries(groups) as [string, any][]).flatMap(([group, arr]) =>
    (arr as any[]).map(sg => ({
      category,
      group: group as GroupId<typeof category>,
      ...sg,
    }))
  )
) satisfies ToolSubGroup[];
