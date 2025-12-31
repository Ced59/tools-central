import type { CategoryId } from './categories';
import type { GroupId } from './tool-groups';

/** ✅ Single Source of Truth (registry imbriqué) */
export const TOOL_SUBGROUP_REGISTRY = {
  math: {
    // 🟦 PHASE 1 — Pourcentages
    percentages: [
      {
        id: 'essential',
        title: $localize`:@@pct_sg_essential_title:Essentiels`,
        description: $localize`:@@pct_sg_essential_desc:Les calculs les plus courants.`,
        order: 2,
      },
      {
        id: 'cumul',
        title: $localize`:@@pct_sg_cumul_title:Cumul & comparaisons`,
        description: $localize`:@@pct_sg_cumul_desc:Effet cumulé, différences, comparaisons.`,
        order: 3,
      },
      {
        id: 'understand',
        title: $localize`:@@pct_sg_understand_title:Comprendre`,
        description: $localize`:@@pct_sg_understand_desc:Notions clés, pièges, interprétation et limites.`,
        order: 4,
      },
      {
        id: 'fractions',
        title: $localize`:@@pct_sg_fractions_title:Fractions & décimaux`,
        description: $localize`:@@pct_sg_fractions_desc:Conversions entre %, fractions et décimaux.`,
        order: 5,
      },
      {
        id: 'practice',
        title: $localize`:@@pct_sg_practice_title:Exercices`,
        description: $localize`:@@pct_sg_practice_desc:Générateurs et exercices corrigés pas à pas.`,
        order: 6,
      },
      {
        id: 'learn',
        title: $localize`:@@pct_subgroup_learn_title:Cours`,
        description: $localize`:@@pct_subgroup_learn_desc:Leçons complètes, exemples et quiz pour apprendre vite.`,
        order: 1,
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

    // 🟩 PHASE 2 — Proportions & ratios
    ratios: [
      {
        id: 'essential',
        title: $localize`:@@ratios_sg_essential_title:Essentiels`,
        description: $localize`:@@ratios_sg_essential_desc:Ratios, simplification, conversions.`,
        order: 1,
      },
      {
        id: 'advanced',
        title: $localize`:@@ratios_sg_advanced_title:Avancés`,
        description: $localize`:@@ratios_sg_advanced_desc:Ratios équivalents, valeurs manquantes, proportions.`,
        order: 2,
      },
      {
        id: 'understand',
        title: $localize`:@@ratios_sg_understand_title:Comprendre`,
        description: $localize`:@@ratios_sg_understand_desc:Proportionnalité directe/inverse, reconnaître une situation proportionnelle.`,
        order: 3,
      },
    ],

    // 🟨 PHASE 3 — Règle de trois
    'rule-of-three': [
      {
        id: 'course',
        title: $localize`:@@rot_sg_course_title:Cours`,
        description: $localize`:@@rot_sg_course_desc:Cours complet + quiz pour maîtriser la règle de trois.`,
        order: 1,
      },
      {
        id: 'direct',
        title: $localize`:@@rot_sg_direct_title:Directe`,
        description: $localize`:@@rot_sg_direct_desc:Règle de trois simple, tableau, valeur manquante.`,
        order: 2,
      },
      {
        id: 'inverse',
        title: $localize`:@@rot_sg_inverse_title:Inverse`,
        description: $localize`:@@rot_sg_inverse_desc:Règle de trois inversée et situations d’inverse proportion.`,
        order: 3,
      },
      {
        id: 'tables',
        title: $localize`:@@rot_sg_tables_title:Tableaux`,
        description: $localize`:@@rot_sg_tables_desc:Compléter / vérifier un tableau de proportionnalité.`,
        order: 4,
      },
    ],

    // 🟧 PHASE 4 — Statistiques simples
    statistics: [
      {
        id: 'courses',
        title: $localize`:@@stats_sg_course_title:Cours`,
        description: $localize`:@@stats_sg_course_desc:Différents cours pour les notions de statistiques`,
        order: 1,
      },
      {
        id: 'basic',
        title: $localize`:@@stats_sg_basic_title:Essentiels`,
        description: $localize`:@@stats_sg_basic_desc:Moyenne, médiane, mode, étendue.`,
        order: 2,
      },
      {
        id: 'distribution',
        title: $localize`:@@stats_sg_distribution_title:Distribution`,
        description: $localize`:@@stats_sg_distribution_desc:Min/max, amplitude, lecture de données.`,
        order: 3,
      },
      {
        id: 'understand',
        title: $localize`:@@stats_sg_understand_title:Comprendre`,
        description: $localize`:@@stats_sg_understand_desc:Quand la moyenne trompe, effet des valeurs extrêmes, moyenne vs médiane.`,
        order: 4,
      },
    ],

    // 🟥 PHASE 5 — Fractions & décimaux
    fractions: [
      {
        id: 'convert',
        title: $localize`:@@fractions_sg_convert_title:Conversions`,
        description: $localize`:@@fractions_sg_convert_desc:Fraction ↔ décimal ↔ pourcentage.`,
        order: 1,
      },
      {
        id: 'compute',
        title: $localize`:@@fractions_sg_compute_title:Calculs simples`,
        description: $localize`:@@fractions_sg_compute_desc:Simplification, addition, comparaison.`,
        order: 2,
      },
    ],

    // 🟪 PHASE 6 — Arrondis & ordres de grandeur
    rounding: [
      {
        id: 'rounding',
        title: $localize`:@@rounding_sg_rounding_title:Arrondis`,
        description: $localize`:@@rounding_sg_rounding_desc:Arrondis, chiffres significatifs, troncature.`,
        order: 1,
      },
      {
        id: 'errors',
        title: $localize`:@@rounding_sg_errors_title:Erreurs & estimation`,
        description: $localize`:@@rounding_sg_errors_desc:Ordre de grandeur, erreur d’arrondi, écart absolu vs relatif.`,
        order: 2,
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
        order: 2,
      },
    ],
  },

  image: {},
  dev: {
    pdf: [
      {
        id: 'inspect',
        title: $localize`:@@dev_pdf_sg_inspect_title:Inspection & extraction`,
        description: $localize`:@@dev_pdf_sg_inspect_desc:Analyser et exporter la structure interne d’un PDF (métadonnées, pages, liens, polices, images, annotations, pièces jointes…).`,
        order: 1,
      },
      {
        id: 'validate',
        title: $localize`:@@dev_pdf_sg_validate_title:Validation & diagnostic`,
        description: $localize`:@@dev_pdf_sg_validate_desc:Vérifier l’état d’un PDF (scan, chiffrement, permissions, conformité…) et exporter le diagnostic.`,
        order: 2,
      },
      {
        id: 'transform',
        title: $localize`:@@dev_pdf_sg_transform_title:Transformation`,
        description: $localize`:@@dev_pdf_sg_transform_desc:Convertir / modifier un PDF (fusion, split, flatten, nettoyage…).`,
        order: 3,
      },
      {
        id: 'debug',
        title: $localize`:@@dev_pdf_sg_debug_title:Internals & debug`,
        description: $localize`:@@dev_pdf_sg_debug_desc:Explorer les objets bas niveau (xref, streams, opérateurs, ToUnicode…).`,
        order: 4,
      },
    ],
  },
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
