export const CATEGORY_IDS = ['math', 'text', 'image'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const GROUP_IDS = {
  math: ['percentages', 'vat'] as const,
  text: ['case', 'writing'] as const,
  image: [] as const,
} as const;

export type GroupId<C extends CategoryId> = (typeof GROUP_IDS)[C][number];

export const SUBGROUP_IDS = {
  math: {
    percentages: ['essential', 'cumul', 'share'] as const,
    vat: ['essential'] as const,
  },
  text: {
    case: ['essential'] as const,
    writing: ['essential'] as const,
  },
  image: {},
} as const;

// ✅ version robuste (fix TS2536)
export type SubGroupId<
  C extends CategoryId,
  G extends GroupId<C>
> =
  C extends keyof typeof SUBGROUP_IDS
    ? G extends keyof (typeof SUBGROUP_IDS)[C]
      ? (typeof SUBGROUP_IDS)[C][G] extends readonly (infer SG)[]
        ? SG
        : never
      : never
    : never;
