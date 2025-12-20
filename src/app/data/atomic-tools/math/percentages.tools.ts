import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const PERCENTAGES_TOOLS = {
  // =========================
  // ✅ EXISTANTS (available: true)
  // =========================
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
        '../../../components/pages/tools/math/percentages/percentage-variation-tool/percentage-variation-tool.component'
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
        '../../../components/pages/tools/math/percentages/percentage-of-number-tool/percentage-of-number-tool.component'
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
        '../../../components/pages/tools/math/percentages/x-of-y-percentage-tool/x-of-y-percentage-tool.component'
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
        '../../../components/pages/tools/math/percentages/percentage-increase-decrease-tool/percentage-increase-decrease-tool.component'
        ).then(m => m.PercentageIncreaseDecreaseToolComponent),
  },

  'percentage-relative-difference': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_relative_difference_title:Écart relatif`,
    description: $localize`:@@tool_percentage_relative_difference_desc:Mesurer l’écart relatif, symétrique, entre deux valeurs (en %).`,
    icon: 'pi pi-arrows-h',
    route: routes.tool('math', 'percentages', 'percentage-relative-difference'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/percentage-relative-difference-tool/percentage-relative-difference-tool.component'
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
        '../../../components/pages/tools/math/percentages/percentage-successive-tool/percentage-successive-tool.component'
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
        '../../../components/pages/tools/math/percentages/percentage-reverse-tool/percentage-reverse-tool.component'
        ).then(m => m.PercentageReverseToolComponent),
  },

  // =========================
  // 🟡 ROADMAP — PHASE 1
  // =========================

  // --- Essentiels (🟡)
  'percentage-applied-rate': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_applied_rate_title:Retrouver le pourcentage appliqué`,
    description: $localize`:@@tool_percentage_applied_rate_desc:Retrouver le taux (%) utilisé entre une valeur initiale et finale.`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'percentages', 'percentage-applied-rate'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/percentage-applied-tool/percentage-applied-tool.component'
        ).then(m => m.PercentageAppliedToolComponent),

  },

  'percentage-missing': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percentage_missing_title:Pourcentage manquant`,
    description: $localize`:@@tool_percentage_missing_desc:Calculer le pourcentage manquant pour atteindre une valeur cible.`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'percentages', 'percentage-missing'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/percentage-missing-tool/percentage-missing-tool.component'
        ).then(m => m.PercentageMissingToolComponent),
  },

  'percent-coefficient-converter': {
    category: 'math',
    group: 'percentages',
    subGroup: 'essential',
    title: $localize`:@@tool_percent_coefficient_converter_title:Convertisseur % ↔ coefficient`,
    description: $localize`:@@tool_percent_coefficient_converter_desc:Passer d’un taux (%) à un coefficient multiplicateur et inversement.`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('math', 'percentages', 'percent-coefficient-converter'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/percentage-coefficient-converter-tool/percentage-coefficient-converter-tool.component'
        ).then(m => m.PercentageCoefficientConverterToolComponent),
  },

  'difference-relative': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_diff_relative_title:Différence relative`,
    description: $localize`:@@tool_percentage_diff_relative_desc:Mesurer la différence relative entre deux valeurs (en %).`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('math', 'percentages', 'difference-relative'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/relative-difference-tool/relative-difference-tool.component'
        ).then(m => m.RelativeDifferenceToolComponent),
  },

  // --- Cumul & comparaisons (🟡)
  'percentage-compare': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_compare_title:Comparer deux pourcentages`,
    description: $localize`:@@tool_percentage_compare_desc:Comparer deux taux (%) appliqués à une même base et visualiser l’écart réel.`,
    icon: 'pi pi-arrows-h',
    route: routes.tool('math', 'percentages', 'percentage-compare'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/compare-percentages-tool/compare-percentages-tool.component'
        ).then(m => m.ComparePercentagesToolComponent),
  },

  'percentage-points': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_points_title:Points de pourcentage`,
    description: $localize`:@@tool_percentage_points_desc:Distinguer variation en % et variation en points de % (pp).`,
    icon: 'pi pi-plus',
    route: routes.tool('math', 'percentages', 'percentage-points'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/percentage-points-tool/percentage-points-tool.component'
        ).then(m => m.PercentagePointsToolComponent),
  },

  'percentage-cumulative-vs-naive': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_cumulative_vs_naive_title:Effet cumulé vs somme naïve`,
    description: $localize`:@@tool_percentage_cumulative_vs_naive_desc:Comparer l’effet réel (composé) à une addition simple des pourcentages.`,
    icon: 'pi pi-sliders-v',
    route: routes.tool('math', 'percentages', 'percentage-cumulative-vs-naive'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/cumulative-vs-naive-tool/cumulative-vs-naive-tool.component'
        ).then(m => m.CumulativeVsNaiveToolComponent),
  },

  'percentage-equivalent': {
    category: 'math',
    group: 'percentages',
    subGroup: 'cumul',
    title: $localize`:@@tool_percentage_equivalent_title:Pourcentage équivalent`,
    description: $localize`:@@tool_percentage_equivalent_desc:Calculer le taux unique équivalent à plusieurs variations successives.`,
    icon: 'pi pi-sync',
    route: routes.tool('math', 'percentages', 'percentage-equivalent'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/percentages/equivalent-percentage-tool/equivalent-percentage-tool.component'
        ).then(m => m.EquivalentPercentageToolComponent),

  },

  // --- Comprendre (🟡)
  'percentage-error': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_error_title:Pourcentage d’erreur`,
    description: $localize`:@@tool_percentage_error_desc:Mesurer l’erreur relative (%) entre une valeur mesurée et une valeur de référence.`,
    icon: 'pi pi-exclamation-triangle',
    route: routes.tool('math', 'percentages', 'percentage-error'),
    available: false,
  },

  'percentage-of-total': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_of_total_title:Pourcentage d’un total`,
    description: $localize`:@@tool_percentage_of_total_desc:Calculer la part (%) d’une valeur dans un total.`,
    icon: 'pi pi-chart-pie',
    route: routes.tool('math', 'percentages', 'percentage-of-total'),
    available: false,
  },

  'percentage-part-of-total': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_part_of_total_title:Part sur total`,
    description: $localize`:@@tool_percentage_part_of_total_desc:Calculer A / (A+B+C) en % (parts relatives).`,
    icon: 'pi pi-chart-pie',
    route: routes.tool('math', 'percentages', 'percentage-part-of-total'),
    available: false,
  },

  'percentage-weighted': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_weighted_title:Pourcentage pondéré`,
    description: $localize`:@@tool_percentage_weighted_desc:Calculer un taux moyen en tenant compte de poids (pondérations).`,
    icon: 'pi pi-weight',
    route: routes.tool('math', 'percentages', 'percentage-weighted'),
    available: false,
  },

  'percentage-limits': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_limits_title:Limites des pourcentages`,
    description: $localize`:@@tool_percentage_limits_desc:Comprendre +∞ et −100% (cas limites et interprétations).`,
    icon: 'pi pi-info-circle',
    route: routes.tool('math', 'percentages', 'percentage-limits'),
    available: false,
  },

  // (tes 3 tools "share" existants → on les met en understand)
  'percentage-share-of-total': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_share_title:Proportion / part du total`,
    description: $localize`:@@tool_percentage_share_desc:Calculer une part en % et sa valeur correspondante.`,
    icon: 'pi pi-chart-pie',
    route: routes.tool('math', 'percentages', 'percentage-share-of-total'),
    available: false,
  },

  'percentage-composition': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_composition_title:Composition de pourcentages`,
    description: $localize`:@@tool_percentage_composition_desc:Combiner des pourcentages à travers plusieurs niveaux (A de B, B de C…).`,
    icon: 'pi pi-sitemap',
    route: routes.tool('math', 'percentages', 'percentage-composition'),
    available: false,
  },

  'percentage-ratio': {
    category: 'math',
    group: 'percentages',
    subGroup: 'understand',
    title: $localize`:@@tool_percentage_ratio_title:Ratio en pourcentage`,
    description: $localize`:@@tool_percentage_ratio_desc:Exprimer un ratio (A/B) sous forme de pourcentage.`,
    icon: 'pi pi-calculator',
    route: routes.tool('math', 'percentages', 'percentage-ratio'),
    available: false,
  },

  // --- Fractions & décimaux (🟡)
  'percent-to-fraction': {
    category: 'math',
    group: 'percentages',
    subGroup: 'fractions',
    title: $localize`:@@tool_percent_to_fraction_title:Pourcentage → fraction`,
    description: $localize`:@@tool_percent_to_fraction_desc:Convertir un pourcentage en fraction simplifiée.`,
    icon: 'pi pi-sort-numeric-up',
    route: routes.tool('math', 'percentages', 'percent-to-fraction'),
    available: false,
  },

  'fraction-to-percent': {
    category: 'math',
    group: 'percentages',
    subGroup: 'fractions',
    title: $localize`:@@tool_fraction_to_percent_title:Fraction → pourcentage`,
    description: $localize`:@@tool_fraction_to_percent_desc:Convertir une fraction en pourcentage.`,
    icon: 'pi pi-sort-numeric-down',
    route: routes.tool('math', 'percentages', 'fraction-to-percent'),
    available: false,
  },

  'decimal-to-percent': {
    category: 'math',
    group: 'percentages',
    subGroup: 'fractions',
    title: $localize`:@@tool_decimal_to_percent_title:Décimal → pourcentage`,
    description: $localize`:@@tool_decimal_to_percent_desc:Convertir un nombre décimal en pourcentage.`,
    icon: 'pi pi-sort-numeric-up',
    route: routes.tool('math', 'percentages', 'decimal-to-percent'),
    available: false,
  },

  'percent-to-decimal': {
    category: 'math',
    group: 'percentages',
    subGroup: 'fractions',
    title: $localize`:@@tool_percent_to_decimal_title:Pourcentage → décimal`,
    description: $localize`:@@tool_percent_to_decimal_desc:Convertir un pourcentage en décimal.`,
    icon: 'pi pi-sort-numeric-down',
    route: routes.tool('math', 'percentages', 'percent-to-decimal'),
    available: false,
  },

  // --- Exercices (🟡)
  'percentage-exercises-generator': {
    category: 'math',
    group: 'percentages',
    subGroup: 'practice',
    title: $localize`:@@tool_percentage_exercises_generator_title:Générateur d’exercices`,
    description: $localize`:@@tool_percentage_exercises_generator_desc:Générer des exercices de pourcentages (niveau, thèmes, correction).`,
    icon: 'pi pi-refresh',
    route: routes.tool('math', 'percentages', 'percentage-exercises-generator'),
    available: false,
  },

  'percentage-exercises-step-by-step': {
    category: 'math',
    group: 'percentages',
    subGroup: 'practice',
    title: $localize`:@@tool_percentage_exercises_step_by_step_title:Exercices corrigés pas à pas`,
    description: $localize`:@@tool_percentage_exercises_step_by_step_desc:Résolutions guidées étape par étape pour apprendre rapidement.`,
    icon: 'pi pi-list',
    route: routes.tool('math', 'percentages', 'percentage-exercises-step-by-step'),
    available: false,
  },

  'percentage-find-mistake': {
    category: 'math',
    group: 'percentages',
    subGroup: 'practice',
    title: $localize`:@@tool_percentage_find_mistake_title:Identifier l’erreur dans un calcul`,
    description: $localize`:@@tool_percentage_find_mistake_desc:Analyser un calcul et identifier l’étape incorrecte.`,
    icon: 'pi pi-search',
    route: routes.tool('math', 'percentages', 'percentage-find-mistake'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
