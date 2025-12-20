import { CategoryId, GroupId, SubGroupId } from './ids';

/**
 * Union discriminée de tous les couples (category, group) possibles,
 * avec le bon type de subGroup id associé.
 *
 * => IDE + TS : 100% contents
 */
export type ToolSubGroup = {
  [C in CategoryId]: {
    [G in GroupId<C>]: {
      category: C;
      group: G;
      id: SubGroupId<C, G>;
      title: string;
      description?: string;
      order: number;
    };
  }[GroupId<C>];
}[CategoryId];

export const TOOL_SUBGROUPS = [
  {
    category: 'math',
    group: 'percentages',
    id: 'essential',
    title: $localize`:@@pct_sg_essential_title:Essentiels`,
    description: $localize`:@@pct_sg_essential_desc:Les calculs les plus courants.`,
    order: 1,
  },
  {
    category: 'math',
    group: 'percentages',
    id: 'cumul',
    title: $localize`:@@pct_sg_cumul_title:Cumul & comparaisons`,
    description: $localize`:@@pct_sg_cumul_desc:Effet cumulé, différences, comparaisons.`,
    order: 2,
  },
  {
    category: 'math',
    group: 'percentages',
    id: 'share',
    title: $localize`:@@pct_sg_share_title:Parts & ratios`,
    description: $localize`:@@pct_sg_share_desc:Répartition d’un total, ratio en %, composition…`,
    order: 3,
  },
] as const satisfies readonly ToolSubGroup[];
