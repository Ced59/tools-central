export interface AtomicToolItem {
  id: string;
  category: string;
  group: string;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
}

export const ATOMIC_TOOLS: AtomicToolItem[] = [
  // EXISTANT
  {
    id: 'percentage-variation',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_variation_title:Variation en pourcentage`,
    description: $localize`:@@tool_percentage_variation_desc:Calculer l’évolution entre deux valeurs (hausse/baisse).`,
    icon: 'pi pi-chart-line',
    route: '/categories/math/percentages/percentage-variation',
    available: true,
  },

  // NOUVEAU #1 (DISPO)
  {
    id: 'percentage-of-number',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_of_number_title:Pourcentage d’un nombre`,
    description: $localize`:@@tool_percentage_of_number_desc:Calculer X% d’une valeur (X% de Y).`,
    icon: 'pi pi-percentage',
    route: '/categories/math/percentages/percentage-of-number',
    available: true,
  },

  // À VENIR (non dispo pour l’instant)
  {
    id: 'percentage-what-percent',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_what_percent_title:X est quel % de Y`,
    description: $localize`:@@tool_percentage_what_percent_desc:Calculer le pourcentage que représente X par rapport à Y.`,
    icon: 'pi pi-percentage',
    route: '/categories/math/percentages/percentage-what-percent',
    available: false,
  },
  {
    id: 'percentage-increase-decrease',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_increase_decrease_title:Augmenter / diminuer de X%`,
    description: $localize`:@@tool_percentage_increase_decrease_desc:Appliquer une hausse ou une baisse en pourcentage à une valeur.`,
    icon: 'pi pi-arrow-up-right',
    route: '/categories/math/percentages/percentage-increase-decrease',
    available: false,
  },
  {
    id: 'percentage-relative-difference',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_relative_difference_title:Écart relatif`,
    description: $localize`:@@tool_percentage_relative_difference_desc:Mesurer l’écart relatif entre deux valeurs (en %).`,
    icon: 'pi pi-arrows-h',
    route: '/categories/math/percentages/percentage-relative-difference',
    available: false,
  },
  {
    id: 'percentage-successive',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_successive_title:Pourcentages successifs`,
    description: $localize`:@@tool_percentage_successive_desc:Composer plusieurs pourcentages (effet cumulé).`,
    icon: 'pi pi-sliders-h',
    route: '/categories/math/percentages/percentage-successive',
    available: false,
  },
  {
    id: 'percentage-reverse',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_reverse_title:Pourcentage inverse`,
    description: $localize`:@@tool_percentage_reverse_desc:Retrouver la valeur initiale après une hausse ou une baisse.`,
    icon: 'pi pi-undo',
    route: '/categories/math/percentages/percentage-reverse',
    available: false,
  },
  {
    id: 'percentage-share-of-total',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_share_title:Proportion / part du total`,
    description: $localize`:@@tool_percentage_share_desc:Calculer une part en % et sa valeur correspondante.`,
    icon: 'pi pi-chart-pie',
    route: '/categories/math/percentages/percentage-share-of-total',
    available: false,
  },
  {
    id: 'percentage-composition',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_composition_title:Composition de pourcentages`,
    description: $localize`:@@tool_percentage_composition_desc:Combiner des pourcentages à travers plusieurs niveaux (A de B, B de C…).`,
    icon: 'pi pi-sitemap',
    route: '/categories/math/percentages/percentage-composition',
    available: false,
  },
  {
    id: 'percentage-ratio',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_ratio_title:Ratio en pourcentage`,
    description: $localize`:@@tool_percentage_ratio_desc:Exprimer un ratio (A/B) sous forme de pourcentage.`,
    icon: 'pi pi-calculator',
    route: '/categories/math/percentages/percentage-ratio',
    available: false,
  },
];
