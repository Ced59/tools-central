import type { CatalogCategoryDefinition } from './types';

// =============================================================================
// MATH - Single Source of Truth
// =============================================================================

export const MATH_CATEGORY: CatalogCategoryDefinition = {
  title: $localize`:@@cat_math_title:Mathématiques`,
  description: $localize`:@@cat_math_desc:Pourcentages, règles de trois, conversions...`,
  icon: 'pi pi-calculator',
  available: true,
  groups: {
    // -------------------------------------------------------------------------
    // POURCENTAGES
    // -------------------------------------------------------------------------
    percentages: {
      title: $localize`:@@group_percentages_title:Pourcentages`,
      description: $localize`:@@group_percentages_desc:Augmentation, remise, variation, taux inversé...`,
      icon: 'pi pi-percentage',
      available: true,
      subGroups: {
        learn: {
          title: $localize`:@@pct_subgroup_learn_title:Cours`,
          description: $localize`:@@pct_subgroup_learn_desc:Leçons complètes, exemples et quiz pour apprendre vite.`,
          order: 1,
          tools: {
            'percentage-course': {
              title: $localize`:@@tool_percentage_course_title:Cours complet sur les pourcentages`,
              description: $localize`:@@tool_percentage_course_desc:Leçons structurées, formules, exemples et quiz (QCM + numérique) pour maîtriser les pourcentages.`,
              icon: 'pi pi-book',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-course-tool/percentage-course-tool.component')
                  .then(m => m.PercentageCourseToolComponent),
            },
          },
        },
        essential: {
          title: $localize`:@@pct_sg_essential_title:Essentiels`,
          description: $localize`:@@pct_sg_essential_desc:Les calculs les plus courants.`,
          order: 2,
          tools: {
            'percentage-variation': {
              title: $localize`:@@tool_percentage_variation_title:Variation en pourcentage`,
              description: $localize`:@@tool_percentage_variation_desc:Calculer l'évolution entre deux valeurs (hausse/baisse).`,
              icon: 'pi pi-chart-line',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-variation-tool/percentage-variation-tool.component')
                  .then(m => m.PercentageVariationToolComponent),
            },
            'percentage-of-number': {
              title: $localize`:@@tool_percentage_of_number_title:Pourcentage d'un nombre`,
              description: $localize`:@@tool_percentage_of_number_desc:Calculer X% d'une valeur (X% de Y).`,
              icon: 'pi pi-percentage',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-of-number-tool/percentage-of-number-tool.component')
                  .then(m => m.PercentageOfNumberToolComponent),
            },
            'percentage-what-percent': {
              title: $localize`:@@tool_percentage_what_percent_title:X est quel % de Y`,
              description: $localize`:@@tool_percentage_what_percent_desc:Calculer le pourcentage que représente X par rapport à Y.`,
              icon: 'pi pi-percentage',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/x-of-y-percentage-tool/x-of-y-percentage-tool.component')
                  .then(m => m.XOfYPercentageToolComponent),
            },
            'percentage-increase-decrease': {
              title: $localize`:@@tool_percentage_increase_decrease_title:Augmenter / diminuer de X%`,
              description: $localize`:@@tool_percentage_increase_decrease_desc:Appliquer une hausse ou une baisse en pourcentage à une valeur.`,
              icon: 'pi pi-arrow-up-right',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-increase-decrease-tool/percentage-increase-decrease-tool.component')
                  .then(m => m.PercentageIncreaseDecreaseToolComponent),
            },
            'percentage-reverse': {
              title: $localize`:@@tool_percentage_reverse_title:Pourcentage inverse`,
              description: $localize`:@@tool_percentage_reverse_desc:Retrouver la valeur initiale après une hausse ou une baisse.`,
              icon: 'pi pi-undo',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-reverse-tool/percentage-reverse-tool.component')
                  .then(m => m.PercentageReverseToolComponent),
            },
            'percentage-applied-rate': {
              title: $localize`:@@tool_percentage_applied_rate_title:Retrouver le pourcentage appliqué`,
              description: $localize`:@@tool_percentage_applied_rate_desc:Retrouver le taux (%) utilisé entre une valeur initiale et finale.`,
              icon: 'pi pi-percentage',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-applied-tool/percentage-applied-tool.component')
                  .then(m => m.PercentageAppliedToolComponent),
            },
            'percentage-missing': {
              title: $localize`:@@tool_percentage_missing_title:Pourcentage manquant`,
              description: $localize`:@@tool_percentage_missing_desc:Calculer le pourcentage manquant pour atteindre une valeur cible.`,
              icon: 'pi pi-percentage',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-missing-tool/percentage-missing-tool.component')
                  .then(m => m.PercentageMissingToolComponent),
            },
            'percent-coefficient-converter': {
              title: $localize`:@@tool_percent_coefficient_converter_title:Convertisseur % ↔ coefficient`,
              description: $localize`:@@tool_percent_coefficient_converter_desc:Passer d'un taux (%) à un coefficient multiplicateur et inversement.`,
              icon: 'pi pi-sliders-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-coefficient-converter-tool/percentage-coefficient-converter-tool.component')
                  .then(m => m.PercentageCoefficientConverterToolComponent),
            },
          },
        },
        cumul: {
          title: $localize`:@@pct_sg_cumul_title:Cumul & comparaisons`,
          description: $localize`:@@pct_sg_cumul_desc:Effet cumulé, différences, comparaisons.`,
          order: 3,
          tools: {
            'percentage-relative-difference': {
              title: $localize`:@@tool_percentage_relative_difference_title:Écart relatif`,
              description: $localize`:@@tool_percentage_relative_difference_desc:Mesurer l'écart relatif, symétrique, entre deux valeurs (en %).`,
              icon: 'pi pi-arrows-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-relative-difference-tool/percentage-relative-difference-tool.component')
                  .then(m => m.PercentageRelativeDifferenceToolComponent),
            },
            'percentage-successive': {
              title: $localize`:@@tool_percentage_successive_title:Pourcentages successifs`,
              description: $localize`:@@tool_percentage_successive_desc:Composer plusieurs pourcentages (effet cumulé).`,
              icon: 'pi pi-sliders-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-successive-tool/percentage-successive-tool.component')
                  .then(m => m.PercentageSuccessiveToolComponent),
            },
            'difference-relative': {
              title: $localize`:@@tool_percentage_diff_relative_title:Différence relative`,
              description: $localize`:@@tool_percentage_diff_relative_desc:Mesurer la différence relative entre deux valeurs (en %).`,
              icon: 'pi pi-sliders-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/relative-difference-tool/relative-difference-tool.component')
                  .then(m => m.RelativeDifferenceToolComponent),
            },
            'percentage-compare': {
              title: $localize`:@@tool_percentage_compare_title:Comparer deux pourcentages`,
              description: $localize`:@@tool_percentage_compare_desc:Comparer deux taux (%) appliqués à une même base et visualiser l'écart réel.`,
              icon: 'pi pi-chart-line',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/compare-percentages-tool/compare-percentages-tool.component')
                  .then(m => m.ComparePercentagesToolComponent),
            },
            'percentage-cumulative-vs-naive': {
              title: $localize`:@@tool_percentage_cumulative_vs_naive_title:Cumulé vs naïf`,
              description: $localize`:@@tool_percentage_cumulative_vs_naive_desc:Comparer l'effet de plusieurs variations cumulées versus la somme naïve.`,
              icon: 'pi pi-chart-bar',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/cumulative-vs-naive-tool/cumulative-vs-naive-tool.component')
                  .then(m => m.CumulativeVsNaiveToolComponent),
            },
            'percentage-points': {
              title: $localize`:@@tool_percentage_points_title:Points de pourcentage`,
              description: $localize`:@@tool_percentage_points_desc:Comprendre la différence entre % et points de pourcentage.`,
              icon: 'pi pi-percentage',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-points-tool/percentage-points-tool.component')
                  .then(m => m.PercentagePointsToolComponent),
            },
            'percentage-equivalent': {
              title: $localize`:@@tool_percentage_equivalent_title:Pourcentages équivalents`,
              description: $localize`:@@tool_percentage_equivalent_desc:Retrouver les variations équivalentes selon la direction.`,
              icon: 'pi pi-arrows-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/equivalent-percentage-tool/equivalent-percentage-tool.component')
                  .then(m => m.EquivalentPercentageToolComponent),
            },
          },
        },
        understand: {
          title: $localize`:@@pct_sg_understand_title:Comprendre`,
          description: $localize`:@@pct_sg_understand_desc:Notions clés, pièges, interprétation et limites.`,
          order: 4,
          tools: {
            'percentage-error': {
              title: $localize`:@@tool_percentage_error_title:Erreur de pourcentage`,
              description: $localize`:@@tool_percentage_error_desc:Calculer l'erreur relative entre une valeur mesurée et une valeur exacte.`,
              icon: 'pi pi-exclamation-triangle',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-error-tool/percentage-error-tool.component')
                  .then(m => m.PercentageErrorToolComponent),
            },
            'percentage-of-total': {
              title: $localize`:@@tool_percentage_of_total_title:Pourcentage d'un total`,
              description: $localize`:@@tool_percentage_of_total_desc:Calculer la part (%) d'une valeur dans un total.`,
              icon: 'pi pi-chart-pie',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-of-total-tool/percentage-of-total-tool.component')
                  .then(m => m.PercentageOfTotalToolComponent),
            },
            'percentage-part-of-total': {
              title: $localize`:@@tool_percentage_part_of_total_title:Part sur total`,
              description: $localize`:@@tool_percentage_part_of_total_desc:Calculer A / (A+B+C) en % (parts relatives).`,
              icon: 'pi pi-chart-pie',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/relative-parts-tool/relative-parts-tool.component')
                  .then(m => m.RelativePartsToolComponent),
            },
            'percentage-weighted': {
              title: $localize`:@@tool_percentage_weighted_title:Pourcentage pondéré`,
              description: $localize`:@@tool_percentage_weighted_desc:Calculer un taux moyen en tenant compte de poids (pondérations).`,
              icon: 'pi pi-sliders-h',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/weighted-percentage-tool/weighted-percentage-tool.component')
                  .then(m => m.WeightedPercentageToolComponent),
            },
            'percentage-limits': {
              title: $localize`:@@tool_percentage_limits_title:Limites des pourcentages`,
              description: $localize`:@@tool_percentage_limits_desc:Comprendre +∞ et −100% (cas limites et interprétations).`,
              icon: 'pi pi-info-circle',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-limits-tool/percentage-limits-tool.component')
                  .then(m => m.PercentageLimitsToolComponent),
            },
            'percentage-share-of-total': {
              title: $localize`:@@tool_percentage_share_title:Proportion / part du total`,
              description: $localize`:@@tool_percentage_share_desc:Calculer une part en % et sa valeur correspondante.`,
              icon: 'pi pi-chart-pie',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/proportion-part-total-tool/proportion-part-total-tool.component')
                  .then(m => m.ProportionPartTotalToolComponent),
            },
            'percentage-composition': {
              title: $localize`:@@tool_percentage_composition_title:Composition de pourcentages`,
              description: $localize`:@@tool_percentage_composition_desc:Combiner des pourcentages à travers plusieurs niveaux (A de B, B de C…).`,
              icon: 'pi pi-sitemap',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-composition-tool/percentage-composition-tool.component')
                  .then(m => m.PercentageCompositionToolComponent),
            },
            'percentage-ratio': {
              title: $localize`:@@tool_percentage_ratio_title:Ratio en pourcentage`,
              description: $localize`:@@tool_percentage_ratio_desc:Exprimer un ratio (A/B) sous forme de pourcentage.`,
              icon: 'pi pi-calculator',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/ratio-to-percentage-tool/ratio-to-percentage-tool.component')
                  .then(m => m.RatioToPercentageToolComponent),
            },
          },
        },
        fractions: {
          title: $localize`:@@pct_sg_fractions_title:Fractions & décimaux`,
          description: $localize`:@@pct_sg_fractions_desc:Conversions entre %, fractions et décimaux.`,
          order: 5,
          tools: {
            'percent-to-fraction': {
              title: $localize`:@@tool_percent_to_fraction_title:Pourcentage ↔ fraction`,
              description: $localize`:@@tool_percent_to_fraction_desc:Convertir un pourcentage en fraction simplifiée et inversement.`,
              icon: 'pi pi-sort-numeric-up',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percent-to-fraction-tool/percent-to-fraction-tool.component')
                  .then(m => m.PercentToFractionToolComponent),
            },
            'decimal-to-percent': {
              title: $localize`:@@tool_decimal_to_percent_title:Décimal → pourcentage`,
              description: $localize`:@@tool_decimal_to_percent_desc:Convertir un nombre décimal en pourcentage.`,
              icon: 'pi pi-sort-numeric-up',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/decimal-to-percentage-tool/decimal-to-percentage-tool.component')
                  .then(m => m.DecimalToPercentageToolComponent),
            },
          },
        },
        practice: {
          title: $localize`:@@pct_sg_practice_title:Exercices`,
          description: $localize`:@@pct_sg_practice_desc:Générateurs et exercices corrigés pas à pas.`,
          order: 6,
          tools: {
            'percentage-exercises-generator': {
              title: $localize`:@@tool_percentage_exercises_generator_title:Générateur d'exercices`,
              description: $localize`:@@tool_percentage_exercises_generator_desc:Générer des exercices de pourcentages (niveau, thèmes, correction).`,
              icon: 'pi pi-refresh',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/percentages/percentage-exercises-generator-tool/percentage-exercises-generator-tool.component')
                  .then(m => m.PercentageExercisesGeneratorToolComponent),
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // TVA
    // -------------------------------------------------------------------------
    vat: {
      title: $localize`:@@group_vat_title:TVA`,
      description: $localize`:@@group_vat_desc:HT/TTC, taux personnalisés, calculs rapides...`,
      icon: 'pi pi-receipt',
      available: false,
      subGroups: {
        essential: {
          title: $localize`:@@vat_sg_essential_title:Essentiels`,
          description: $localize`:@@vat_sg_essential_desc:Calculs HT/TTC les plus courants.`,
          order: 1,
          tools: {},
        },
      },
    },

    // -------------------------------------------------------------------------
    // RATIOS
    // -------------------------------------------------------------------------
    ratios: {
      title: $localize`:@@group_ratios_title:Proportions & ratios`,
      description: $localize`:@@group_ratios_desc:Ratios, simplification, proportions et parts proportionnelles.`,
      icon: 'pi pi-sliders-h',
      available: false,
      subGroups: {
        essential: {
          title: $localize`:@@ratios_sg_essential_title:Essentiels`,
          description: $localize`:@@ratios_sg_essential_desc:Ratios, simplification, conversions.`,
          order: 1,
          tools: {
            'ratio-calculator': {
              title: $localize`:@@tool_ratio_calculator_title:Calcul de ratio (A:B)`,
              description: $localize`:@@tool_ratio_calculator_desc:Calculer et interpréter un ratio A:B.`,
              icon: 'pi pi-sliders-h',
              available: false,
            },
            'ratio-simplifier': {
              title: $localize`:@@tool_ratio_simplifier_title:Simplifier un ratio`,
              description: $localize`:@@tool_ratio_simplifier_desc:Réduire un ratio à sa forme la plus simple.`,
              icon: 'pi pi-filter',
              available: false,
            },
            'ratio-to-fraction': {
              title: $localize`:@@tool_ratio_to_fraction_title:Ratio → fraction`,
              description: $localize`:@@tool_ratio_to_fraction_desc:Convertir un ratio en fraction.`,
              icon: 'pi pi-sort-numeric-up',
              available: false,
            },
            'ratio-to-percent': {
              title: $localize`:@@tool_ratio_to_percent_title:Ratio → pourcentage`,
              description: $localize`:@@tool_ratio_to_percent_desc:Convertir un ratio en pourcentage.`,
              icon: 'pi pi-percentage',
              available: false,
            },
            'ratio-compare': {
              title: $localize`:@@tool_ratio_compare_title:Comparer deux ratios`,
              description: $localize`:@@tool_ratio_compare_desc:Comparer deux ratios et visualiser lequel est le plus grand.`,
              icon: 'pi pi-arrows-h',
              available: false,
            },
          },
        },
        advanced: {
          title: $localize`:@@ratios_sg_advanced_title:Avancés`,
          description: $localize`:@@ratios_sg_advanced_desc:Ratios équivalents, valeurs manquantes, proportions.`,
          order: 2,
          tools: {
            'ratio-equivalent': {
              title: $localize`:@@tool_ratio_equivalent_title:Ratio équivalent`,
              description: $localize`:@@tool_ratio_equivalent_desc:Générer/valider des ratios équivalents.`,
              icon: 'pi pi-sync',
              available: false,
            },
            'ratio-missing': {
              title: $localize`:@@tool_ratio_missing_title:Ratio manquant`,
              description: $localize`:@@tool_ratio_missing_desc:Compléter un ratio à partir d'une contrainte (valeur manquante).`,
              icon: 'pi pi-question',
              available: false,
            },
            'proportion-a-over-b-equals-c-over-d': {
              title: $localize`:@@tool_proportion_ab_cd_title:Proportion A/B = C/D`,
              description: $localize`:@@tool_proportion_ab_cd_desc:Résoudre une proportion avec une valeur manquante.`,
              icon: 'pi pi-calculator',
              available: false,
            },
            'proportional-share': {
              title: $localize`:@@tool_proportional_share_title:Part proportionnelle`,
              description: $localize`:@@tool_proportional_share_desc:Répartir une quantité selon un ratio (parts proportionnelles).`,
              icon: 'pi pi-chart-pie',
              available: false,
            },
          },
        },
        understand: {
          title: $localize`:@@ratios_sg_understand_title:Comprendre`,
          description: $localize`:@@ratios_sg_understand_desc:Proportionnalité directe/inverse, reconnaître une situation proportionnelle.`,
          order: 3,
          tools: {
            'direct-proportionality': {
              title: $localize`:@@tool_direct_proportionality_title:Proportionnalité directe`,
              description: $localize`:@@tool_direct_proportionality_desc:Comprendre et résoudre des situations de proportionnalité directe.`,
              icon: 'pi pi-arrow-up-right',
              available: false,
            },
            'inverse-proportionality': {
              title: $localize`:@@tool_inverse_proportionality_title:Proportionnalité inverse`,
              description: $localize`:@@tool_inverse_proportionality_desc:Comprendre et résoudre des situations de proportionnalité inverse.`,
              icon: 'pi pi-arrow-down-right',
              available: false,
            },
            'proportionality-check': {
              title: $localize`:@@tool_proportionality_check_title:Reconnaître une situation proportionnelle`,
              description: $localize`:@@tool_proportionality_check_desc:Déterminer si une situation est proportionnelle ou non.`,
              icon: 'pi pi-check-circle',
              available: false,
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // RÈGLE DE TROIS
    // -------------------------------------------------------------------------
    'rule-of-three': {
      title: $localize`:@@group_rule_of_three_title:Règle de trois`,
      description: $localize`:@@group_rule_of_three_desc:Règle de trois directe/inverse, tableaux de proportionnalité.`,
      icon: 'pi pi-table',
      available: true,
      subGroups: {
        course: {
          title: $localize`:@@rot_sg_course_title:Cours`,
          description: $localize`:@@rot_sg_course_desc:Cours complet + quiz pour maîtriser la règle de trois.`,
          order: 1,
          tools: {
            'rule-of-three-course': {
              title: $localize`:@@tool_rot_course_title:Cours règle de trois`,
              description: $localize`:@@tool_rot_course_desc:Directe, inverse, tableaux + quiz pour apprendre rapidement.`,
              icon: 'pi pi-book',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/rule-of-three-course-tool/rule-of-three-course-tool.component')
                  .then(m => m.RuleOfThreeCourseToolComponent),
            },
          },
        },
        direct: {
          title: $localize`:@@rot_sg_direct_title:Directe`,
          description: $localize`:@@rot_sg_direct_desc:Règle de trois simple, tableau, valeur manquante.`,
          order: 2,
          tools: {
            'rule-of-three-simple': {
              title: $localize`:@@tool_rule_of_three_simple_title:Règle de trois simple`,
              description: $localize`:@@tool_rule_of_three_simple_desc:Calculer une valeur manquante en proportionnalité directe.`,
              icon: 'pi pi-calculator',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/rule-of-three-simple-tool/rule-of-three-simple-tool.component')
                  .then(m => m.RuleOfThreeSimpleToolComponent),
            },
            'rule-of-three-table': {
              title: $localize`:@@tool_rule_of_three_table_title:Règle de trois avec tableau`,
              description: $localize`:@@tool_rule_of_three_table_desc:Résoudre une règle de trois via un tableau de proportionnalité.`,
              icon: 'pi pi-table',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/rule-of-three-table-tool/rule-of-three-table-tool.component')
                  .then(m => m.RuleOfThreeTableToolComponent),
            },
            'rule-of-three-missing-value': {
              title: $localize`:@@tool_rule_of_three_missing_value_title:Valeur manquante`,
              description: $localize`:@@tool_rule_of_three_missing_value_desc:Trouver rapidement la valeur inconnue (directe).`,
              icon: 'pi pi-question',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/rule-of-three-missing-value-tool/rule-of-three-missing-value-tool.component')
                  .then(m => m.RuleOfThreeMissingValueToolComponent),
            },
          },
        },
        inverse: {
          title: $localize`:@@rot_sg_inverse_title:Inverse`,
          description: $localize`:@@rot_sg_inverse_desc:Règle de trois inversée et situations d'inverse proportion.`,
          order: 3,
          tools: {
            'rule-of-three-inverse': {
              title: $localize`:@@tool_rule_of_three_inverse_title:Règle de trois inversée`,
              description: $localize`:@@tool_rule_of_three_inverse_desc:Résoudre un problème de proportionnalité inverse.`,
              icon: 'pi pi-replay',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/rule-of-three-inverse-tool/rule-of-three-inverse-tool.component')
                  .then(m => m.RuleOfThreeInverseToolComponent),
            },
          },
        },
        tables: {
          title: $localize`:@@rot_sg_tables_title:Tableaux`,
          description: $localize`:@@rot_sg_tables_desc:Compléter / vérifier un tableau de proportionnalité.`,
          order: 4,
          tools: {
            'proportion-table-complete': {
              title: $localize`:@@tool_proportion_table_complete_title:Compléter un tableau de proportionnalité`,
              description: $localize`:@@tool_proportion_table_complete_desc:Compléter les valeurs manquantes d'un tableau.`,
              icon: 'pi pi-table',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/proportional-table-complete-tool/proportional-table-complete-tool.component')
                  .then(m => m.ProportionalTableCompleteToolComponent),
            },
            'proportion-table-check': {
              title: $localize`:@@tool_proportion_table_check_title:Vérifier si un tableau est proportionnel`,
              description: $localize`:@@tool_proportion_table_check_desc:Tester si les lignes/colonnes sont proportionnelles.`,
              icon: 'pi pi-verified',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/rule-of-three/proportional-table-check-tool/proportional-table-check-tool.component')
                  .then(m => m.ProportionalTableCheckToolComponent),
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // STATISTIQUES
    // -------------------------------------------------------------------------
    statistics: {
      title: $localize`:@@group_statistics_title:Statistiques`,
      description: $localize`:@@group_statistics_desc:Moyenne, médiane, mode, étendue et notions clés.`,
      icon: 'pi pi-chart-bar',
      available: true,
      subGroups: {
        courses: {
          title: $localize`:@@stats_sg_course_title:Cours`,
          description: $localize`:@@stats_sg_course_desc:Différents cours pour les notions de statistiques`,
          order: 1,
          tools: {
            'mean-course': {
              title: $localize`:@@tool_mean_course_title:Cours Moyennes`,
              description: $localize`:@@tool_mean_course_desc:Cours sur les notions de moyennes.`,
              icon: 'pi pi-chart-bar',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/statistics/courses/mean-course-tool/mean-course-tool.component')
                  .then(m => m.MeanCourseToolComponent),
            },
            'median-course': {
              title: $localize`:@@tool_median_course_title:Cours Médiane`,
              description: $localize`:@@tool_median_course_desc:Cours sur les notions de médianes.`,
              icon: 'pi pi-chart-bar',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/math/statistics/courses/median-course-tool/median-course-tool.component')
                  .then(m => m.MedianCourseToolComponent),
            },
          },
        },
        basic: {
          title: $localize`:@@stats_sg_basic_title:Essentiels`,
          description: $localize`:@@stats_sg_basic_desc:Moyenne, médiane, mode, étendue.`,
          order: 2,
          tools: {
            mean: {
              title: $localize`:@@tool_mean_title:Moyenne`,
              description: $localize`:@@tool_mean_desc:Calculer la moyenne d'une série de valeurs.`,
              icon: 'pi pi-chart-bar',
              available: false,
            },
            'weighted-mean': {
              title: $localize`:@@tool_weighted_mean_title:Moyenne pondérée`,
              description: $localize`:@@tool_weighted_mean_desc:Calculer une moyenne avec coefficients/poids.`,
              icon: 'pi pi-weight',
              available: false,
            },
            median: {
              title: $localize`:@@tool_median_title:Médiane`,
              description: $localize`:@@tool_median_desc:Trouver la médiane (valeur centrale).`,
              icon: 'pi pi-sort-amount-up',
              available: false,
            },
            mode: {
              title: $localize`:@@tool_mode_title:Mode`,
              description: $localize`:@@tool_mode_desc:Trouver la valeur la plus fréquente (mode).`,
              icon: 'pi pi-star',
              available: false,
            },
            range: {
              title: $localize`:@@tool_range_title:Étendue`,
              description: $localize`:@@tool_range_desc:Calculer l'étendue (max − min).`,
              icon: 'pi pi-arrows-v',
              available: false,
            },
          },
        },
        distribution: {
          title: $localize`:@@stats_sg_distribution_title:Distribution`,
          description: $localize`:@@stats_sg_distribution_desc:Min/max, amplitude, lecture de données.`,
          order: 3,
          tools: {
            'min-max': {
              title: $localize`:@@tool_min_max_title:Valeur minimale / maximale`,
              description: $localize`:@@tool_min_max_desc:Identifier min et max d'une série.`,
              icon: 'pi pi-arrow-up',
              available: false,
            },
            amplitude: {
              title: $localize`:@@tool_amplitude_title:Amplitude`,
              description: $localize`:@@tool_amplitude_desc:Mesurer l'amplitude d'une série (dispersion simple).`,
              icon: 'pi pi-wave-pulse',
              available: false,
            },
          },
        },
        understand: {
          title: $localize`:@@stats_sg_understand_title:Comprendre`,
          description: $localize`:@@stats_sg_understand_desc:Quand la moyenne trompe, effet des valeurs extrêmes, moyenne vs médiane.`,
          order: 4,
          tools: {
            'mean-vs-median': {
              title: $localize`:@@tool_mean_vs_median_title:Différence moyenne / médiane`,
              description: $localize`:@@tool_mean_vs_median_desc:Comparer moyenne et médiane et comprendre quand les utiliser.`,
              icon: 'pi pi-info-circle',
              available: false,
            },
            'outliers-effect': {
              title: $localize`:@@tool_outliers_effect_title:Effet des valeurs extrêmes`,
              description: $localize`:@@tool_outliers_effect_desc:Voir comment les extrêmes influencent la moyenne.`,
              icon: 'pi pi-exclamation-circle',
              available: false,
            },
            'misleading-mean': {
              title: $localize`:@@tool_misleading_mean_title:Quand la moyenne est trompeuse`,
              description: $localize`:@@tool_misleading_mean_desc:Comprendre les cas où la moyenne n'est pas représentative.`,
              icon: 'pi pi-shield',
              available: false,
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // FRACTIONS
    // -------------------------------------------------------------------------
    fractions: {
      title: $localize`:@@group_fractions_title:Fractions & décimaux`,
      description: $localize`:@@group_fractions_desc:Conversions, calculs simples et simplification.`,
      icon: 'pi pi-calculator',
      available: false,
      subGroups: {
        convert: {
          title: $localize`:@@fractions_sg_convert_title:Conversions`,
          description: $localize`:@@fractions_sg_convert_desc:Fraction ↔ décimal ↔ pourcentage.`,
          order: 1,
          tools: {
            'fraction-to-decimal': {
              title: $localize`:@@tool_fraction_to_decimal_title:Fraction → décimal`,
              description: $localize`:@@tool_fraction_to_decimal_desc:Convertir une fraction en décimal.`,
              icon: 'pi pi-sort-numeric-up',
              available: false,
            },
            'decimal-to-fraction': {
              title: $localize`:@@tool_decimal_to_fraction_title:Décimal → fraction`,
              description: $localize`:@@tool_decimal_to_fraction_desc:Convertir un décimal en fraction (si possible simplifiée).`,
              icon: 'pi pi-sort-numeric-down',
              available: false,
            },
            'fraction-to-percent': {
              title: $localize`:@@tool_fraction_to_percent_title:Fraction → %`,
              description: $localize`:@@tool_fraction_to_percent_desc:Convertir une fraction en pourcentage.`,
              icon: 'pi pi-percentage',
              available: false,
            },
            'fractions-percent-to-fraction': {
              title: $localize`:@@tool_percent_to_fraction_title:% → fraction`,
              description: $localize`:@@tool_percent_to_fraction_desc:Convertir un pourcentage en fraction simplifiée.`,
              icon: 'pi pi-percentage',
              available: false,
            },
          },
        },
        compute: {
          title: $localize`:@@fractions_sg_compute_title:Calculs simples`,
          description: $localize`:@@fractions_sg_compute_desc:Simplification, addition, comparaison.`,
          order: 2,
          tools: {
            'fraction-simplify': {
              title: $localize`:@@tool_fraction_simplify_title:Simplification de fractions`,
              description: $localize`:@@tool_fraction_simplify_desc:Réduire une fraction au maximum.`,
              icon: 'pi pi-filter',
              available: false,
            },
            'fraction-add': {
              title: $localize`:@@tool_fraction_add_title:Addition de fractions`,
              description: $localize`:@@tool_fraction_add_desc:Additionner deux fractions (avec étapes).`,
              icon: 'pi pi-plus',
              available: false,
            },
            'fraction-compare': {
              title: $localize`:@@tool_fraction_compare_title:Comparaison de fractions`,
              description: $localize`:@@tool_fraction_compare_desc:Comparer deux fractions et déterminer la plus grande.`,
              icon: 'pi pi-arrows-h',
              available: false,
            },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // ARRONDIS
    // -------------------------------------------------------------------------
    rounding: {
      title: $localize`:@@group_rounding_title:Arrondis & estimation`,
      description: $localize`:@@group_rounding_desc:Arrondis, chiffres significatifs, erreurs et ordres de grandeur.`,
      icon: 'pi pi-compass',
      available: false,
      subGroups: {
        rounding: {
          title: $localize`:@@rounding_sg_rounding_title:Arrondis`,
          description: $localize`:@@rounding_sg_rounding_desc:Arrondis, chiffres significatifs, troncature.`,
          order: 1,
          tools: {
            'round-tenth-hundredth': {
              title: $localize`:@@tool_round_tenth_hundredth_title:Arrondi au dixième / centième`,
              description: $localize`:@@tool_round_tenth_hundredth_desc:Arrondir à un nombre de décimales (0.1, 0.01…).`,
              icon: 'pi pi-circle',
              available: false,
            },
            'significant-figures': {
              title: $localize`:@@tool_significant_figures_title:Arrondi significatif`,
              description: $localize`:@@tool_significant_figures_desc:Arrondir à n chiffres significatifs.`,
              icon: 'pi pi-hashtag',
              available: false,
            },
            truncate: {
              title: $localize`:@@tool_truncate_title:Troncature`,
              description: $localize`:@@tool_truncate_desc:Tronquer un nombre sans arrondir.`,
              icon: 'pi pi-minus',
              available: false,
            },
          },
        },
        errors: {
          title: $localize`:@@rounding_sg_errors_title:Erreurs & estimation`,
          description: $localize`:@@rounding_sg_errors_desc:Ordre de grandeur, erreur d'arrondi, écart absolu vs relatif.`,
          order: 2,
          tools: {
            'order-of-magnitude': {
              title: $localize`:@@tool_order_of_magnitude_title:Ordre de grandeur`,
              description: $localize`:@@tool_order_of_magnitude_desc:Estimer un ordre de grandeur (approximation rapide).`,
              icon: 'pi pi-compass',
              available: false,
            },
            'rounding-error': {
              title: $localize`:@@tool_rounding_error_title:Erreur d'arrondi`,
              description: $localize`:@@tool_rounding_error_desc:Mesurer l'écart introduit par un arrondi.`,
              icon: 'pi pi-exclamation-triangle',
              available: false,
            },
            'absolute-vs-relative-difference': {
              title: $localize`:@@tool_absolute_vs_relative_difference_title:Écart absolu vs relatif`,
              description: $localize`:@@tool_absolute_vs_relative_difference_desc:Comparer un écart en valeur et en pourcentage.`,
              icon: 'pi pi-sliders-h',
              available: false,
            },
          },
        },
      },
    },
  },
};
