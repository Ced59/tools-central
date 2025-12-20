import { Type } from '@angular/core';
import { routes } from './routes';
import { CategoryId, GroupId, SubGroupId } from './ids';

export interface AtomicTool<
  C extends CategoryId = CategoryId,
  G extends GroupId<C> = GroupId<C>
> {
  category: C;
  group: G;
  subGroup: SubGroupId<C, G>;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
  loadComponent?: () => Promise<Type<unknown>>;
}

// ✅ Single Source of Truth : clé = id (doublons impossibles)
export const ATOMIC_TOOLS = {
  // ==========================
  // MATH / PERCENTAGES (DISPO)
  // ==========================
  'percentage-variation': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_variation_title:Variation en pourcentage`,
    description: $localize`:@@tool_percentage_variation_desc:Calculer l’évolution entre deux valeurs (hausse/baisse).`,
    icon: 'pi pi-chart-line',
    route: routes.tool('math', 'percentages', 'percentage-variation'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-variation-tool/percentage-variation-tool.component'
        ).then(m => m.PercentageVariationToolComponent),
  },

  'percentage-of-number': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_of_number_title:Pourcentage d’un nombre`,
    description: $localize`:@@tool_percentage_of_number_desc:Calculer X% d’une valeur (X% de Y).`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'percentages', 'percentage-of-number'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-of-number-tool/percentage-of-number-tool.component'
        ).then(m => m.PercentageOfNumberToolComponent),
  },

  'percentage-what-percent': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_what_percent_title:X est quel % de Y`,
    description: $localize`:@@tool_percentage_what_percent_desc:Calculer le pourcentage que représente X par rapport à Y.`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'percentages', 'percentage-what-percent'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/x-of-y-percentage-tool/x-of-y-percentage-tool.component'
        ).then(m => m.XOfYPercentageToolComponent),
  },

  'percentage-increase-decrease': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_increase_decrease_title:Augmenter / diminuer de X%`,
    description: $localize`:@@tool_percentage_increase_decrease_desc:Appliquer une hausse ou une baisse en pourcentage à une valeur.`,
    icon: 'pi pi-arrow-up-right',
    route: routes.tool('math', 'percentages', 'percentage-increase-decrease'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-increase-decrease-tool/percentage-increase-decrease-tool.component'
        ).then(m => m.PercentageIncreaseDecreaseToolComponent),
  },

  'percentage-relative-difference': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_relative_difference_title:Écart relatif`,
    description: $localize`:@@tool_percentage_relative_difference_desc:Mesurer l’écart relatif entre deux valeurs (en %).`,
    icon: 'pi pi-arrows-h',
    route: routes.tool('math', 'percentages', 'percentage-relative-difference'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-relative-difference-tool/percentage-relative-difference-tool.component'
        ).then(m => m.PercentageRelativeDifferenceToolComponent),
  },

  'percentage-successive': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_successive_title:Pourcentages successifs`,
    description: $localize`:@@tool_percentage_successive_desc:Composer plusieurs pourcentages (effet cumulé).`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('math', 'percentages', 'percentage-successive'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-successive-tool/percentage-successive-tool.component'
        ).then(m => m.PercentageSuccessiveToolComponent),
  },

  'percentage-reverse': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_reverse_title:Pourcentage inverse`,
    description: $localize`:@@tool_percentage_reverse_desc:Retrouver la valeur initiale après une hausse ou une baisse.`,
    icon: 'pi pi-undo',
    route: routes.tool('math', 'percentages', 'percentage-reverse'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-reverse-tool/percentage-reverse-tool.component'
        ).then(m => m.PercentageReverseToolComponent),
  },

  // ==========================
  // MATH / PERCENTAGES (A VENIR)
  // ==========================
  'percentage-share-of-total': {
    category: 'math',
    group: 'percentages',
    subGroup: 'share',
    title: $localize`:@@tool_percentage_share_title:Proportion / part du total`,
    description: $localize`:@@tool_percentage_share_desc:Calculer une part en % et sa valeur correspondante.`,
    icon: 'pi pi-chart-pie',
    route: routes.tool('math', 'percentages', 'percentage-share-of-total'),
    available: false,
  },

  'percentage-composition': {
    category: 'math',
    group: 'percentages',
    subGroup: 'share',
    title: $localize`:@@tool_percentage_composition_title:Composition de pourcentages`,
    description: $localize`:@@tool_percentage_composition_desc:Combiner des pourcentages à travers plusieurs niveaux (A de B, B de C…).`,
    icon: 'pi pi-sitemap',
    route: routes.tool('math', 'percentages', 'percentage-composition'),
    available: false,
  },

  'percentage-ratio': {
    category: 'math',
    group: 'percentages',
    subGroup: 'share',
    title: $localize`:@@tool_percentage_ratio_title:Ratio en pourcentage`,
    description: $localize`:@@tool_percentage_ratio_desc:Exprimer un ratio (A/B) sous forme de pourcentage.`,
    icon: 'pi pi-calculator',
    route: routes.tool('math', 'percentages', 'percentage-ratio'),
    available: false,
  },

  // ==========================
  // TEXT
  // ==========================
  'text-case': {
    category: 'text',
    group: 'case',
    subGroup: 'essential',
    title: $localize`:@@tool_text_case_title:Mettre en majuscule / minuscule`,
    description: $localize`:@@tool_text_case_desc:Convertir la casse du texte selon la langue (locale).`,
    icon: 'pi pi-sort-alpha-down',
    route: routes.tool('text', 'case', 'text-case'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/text/case/text-case-tool/text-case-tool.component'
        ).then(m => m.TextCaseToolComponent),
  },

  readability: {
    category: 'text',
    group: 'writing',
    subGroup: 'essential',
    title: $localize`:@@readability_tool_card_title:Lisibilité & clarté`,
    description: $localize`:@@readability_tool_card_desc:Analysez la clarté de votre texte avec un score universel, des statistiques et des conseils.`,
    icon: 'pi pi-file-edit',
    route: routes.tool('text', 'writing', 'readability'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/text/writing/readability-tool/readability-tool.component'
        ).then(m => m.ReadabilityToolComponent),
  },
} as const satisfies Record<string, AtomicTool>;

// Types dérivés automatiquement
export type ToolId = keyof typeof ATOMIC_TOOLS;
export type AtomicToolItem = { id: ToolId } & (typeof ATOMIC_TOOLS)[ToolId];

// Liste pour *ngFor / filter
export const ATOMIC_TOOL_LIST: AtomicToolItem[] = Object.entries(ATOMIC_TOOLS).map(
  ([id, tool]) => ({
    id: id as ToolId,
    ...tool,
  })
);

// Anti-doublon “dev” : ici inutile car objet => clés uniques,
// mais ça détecte si quelqu'un fait une fusion incorrecte via spreads.
function assertUniqueToolIds(list: { id: string }[]) {
  const seen = new Set<string>();
  for (const t of list) {
    if (seen.has(t.id)) {
      throw new Error(`[ATOMIC_TOOL_LIST] Duplicate tool id detected: "${t.id}"`);
    }
    seen.add(t.id);
  }
}
if (typeof ngDevMode !== 'undefined' && ngDevMode) {
  assertUniqueToolIds(ATOMIC_TOOL_LIST);
}
