import { Type } from '@angular/core';
import { routes } from './routes';

export interface AtomicToolItem {
  id: string;
  category: string;
  group: string;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;

  // ✅ mix A: lazy loading du composant, uniquement pour les tools dispo
  loadComponent?: () => Promise<Type<unknown>>;
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
    route: routes.tool('math', 'percentages', 'percentage-variation'),
    available: true,
    loadComponent: () =>
      import(
        '../components/pages/tools/math/percentages/percentage-variation-tool/percentage-variation-tool.component'
        ).then(m => m.PercentageVariationToolComponent),
  },
  {
    id: 'percentage-of-number',
    category: 'math',
    group: 'percentages',
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
  {
    id: 'percentage-what-percent',
    category: 'math',
    group: 'percentages',
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

  // A VENIR
  {
    id: 'percentage-increase-decrease',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_increase_decrease_title:Augmenter / diminuer de X%`,
    description: $localize`:@@tool_percentage_increase_decrease_desc:Appliquer une hausse ou une baisse en pourcentage à une valeur.`,
    icon: 'pi pi-arrow-up-right',
    route: routes.tool('math', 'percentages', 'percentage-increase-decrease'),
    available: false,
  },
  {
    id: 'percentage-relative-difference',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_relative_difference_title:Écart relatif`,
    description: $localize`:@@tool_percentage_relative_difference_desc:Mesurer l’écart relatif entre deux valeurs (en %).`,
    icon: 'pi pi-arrows-h',
    route: routes.tool('math', 'percentages', 'percentage-relative-difference'),
    available: false,
  },
  {
    id: 'percentage-successive',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_successive_title:Pourcentages successifs`,
    description: $localize`:@@tool_percentage_successive_desc:Composer plusieurs pourcentages (effet cumulé).`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('math', 'percentages', 'percentage-successive'),
    available: false,
  },
  {
    id: 'percentage-reverse',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_reverse_title:Pourcentage inverse`,
    description: $localize`:@@tool_percentage_reverse_desc:Retrouver la valeur initiale après une hausse ou une baisse.`,
    icon: 'pi pi-undo',
    route: routes.tool('math', 'percentages', 'percentage-reverse'),
    available: false,
  },
  {
    id: 'percentage-share-of-total',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_share_title:Proportion / part du total`,
    description: $localize`:@@tool_percentage_share_desc:Calculer une part en % et sa valeur correspondante.`,
    icon: 'pi pi-chart-pie',
    route: routes.tool('math', 'percentages', 'percentage-share-of-total'),
    available: false,
  },
  {
    id: 'percentage-composition',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_composition_title:Composition de pourcentages`,
    description: $localize`:@@tool_percentage_composition_desc:Combiner des pourcentages à travers plusieurs niveaux (A de B, B de C…).`,
    icon: 'pi pi-sitemap',
    route: routes.tool('math', 'percentages', 'percentage-composition'),
    available: false,
  },
  {
    id: 'percentage-ratio',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_ratio_title:Ratio en pourcentage`,
    description: $localize`:@@tool_percentage_ratio_desc:Exprimer un ratio (A/B) sous forme de pourcentage.`,
    icon: 'pi pi-calculator',
    route: routes.tool('math', 'percentages', 'percentage-ratio'),
    available: false,
  },

  // TEXT
  {
    id: 'text-case',
    category: 'text',
    group: 'case',
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
  {
    id: 'readability',
    category: 'text',
    group: 'writing',
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
];
