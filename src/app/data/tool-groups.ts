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

    // ✅ PHASE 2
    ratios: {
      title: $localize`:@@group_ratios_title:Proportions & ratios`,
      description: $localize`:@@group_ratios_desc:Ratios, simplification, proportions et parts proportionnelles.`,
      icon: 'pi pi-sliders-h',
      route: routes.group('math', 'ratios'),
      available: false,
    },

    // ✅ PHASE 3
    'rule-of-three': {
      title: $localize`:@@group_rule_of_three_title:Règle de trois`,
      description: $localize`:@@group_rule_of_three_desc:Règle de trois directe/inverse, tableaux de proportionnalité.`,
      icon: 'pi pi-table',
      route: routes.group('math', 'rule-of-three'),
      available: true,
    },

    // ✅ PHASE 4
    statistics: {
      title: $localize`:@@group_statistics_title:Statistiques`,
      description: $localize`:@@group_statistics_desc:Moyenne, médiane, mode, étendue et notions clés.`,
      icon: 'pi pi-chart-bar',
      route: routes.group('math', 'statistics'),
      available: true,
    },

    // ✅ PHASE 5
    fractions: {
      title: $localize`:@@group_fractions_title:Fractions & décimaux`,
      description: $localize`:@@group_fractions_desc:Conversions, calculs simples et simplification.`,
      icon: 'pi pi-calculator',
      route: routes.group('math', 'fractions'),
      available: false,
    },

    // ✅ PHASE 6
    rounding: {
      title: $localize`:@@group_rounding_title:Arrondis & estimation`,
      description: $localize`:@@group_rounding_desc:Arrondis, chiffres significatifs, erreurs et ordres de grandeur.`,
      icon: 'pi pi-compass',
      route: routes.group('math', 'rounding'),
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
  dev: {
    pdf: {
      title: $localize`:@@group_dev_pdf_title:PDF`,
      description: $localize`:@@group_dev_pdf_desc:Extraction et inspection : champs de formulaires, métadonnées, JSON…`,
      icon: 'pi pi-file-pdf',
      route: routes.group('dev', 'pdf'),
      available: true,
    },

    // =====================================================================
    // Office / Documents (client-side, privacy-first)
    // =====================================================================

    ooxml: {
      title: $localize`:@@group_dev_ooxml_title:Open XML (OOXML)`,
      description: $localize`:@@group_dev_ooxml_desc:Inspecter les conteneurs OOXML (ZIP/XML) : relations, content types, métadonnées…`,
      icon: 'pi pi-box',
      route: routes.group('dev', 'ooxml'),
      available: false,
    },

    word: {
      title: $localize`:@@group_dev_word_title:Word (DOCX)`,
      description: $localize`:@@group_dev_word_desc:Analyse et extraction de documents Word : texte, styles, champs, images, révisions…`,
      icon: 'pi pi-file',
      route: routes.group('dev', 'word'),
      available: false,
    },

    excel: {
      title: $localize`:@@group_dev_excel_title:Excel (XLSX)`,
      description: $localize`:@@group_dev_excel_desc:Inspecter des fichiers Excel : feuilles, formules, styles, chaînes partagées, médias…`,
      icon: 'pi pi-table',
      route: routes.group('dev', 'excel'),
      available: false,
    },

    powerpoint: {
      title: $localize`:@@group_dev_powerpoint_title:PowerPoint (PPTX)`,
      description: $localize`:@@group_dev_powerpoint_desc:Extraction et audit de slides : texte, notes, thèmes, médias, animations…`,
      icon: 'pi pi-clone',
      route: routes.group('dev', 'powerpoint'),
      available: false,
    },

    odf: {
      title: $localize`:@@group_dev_odf_title:OpenDocument (ODF)`,
      description: $localize`:@@group_dev_odf_desc:ODT/ODS/ODP : inspection ZIP/XML, texte, styles, métadonnées, médias…`,
      icon: 'pi pi-folder-open',
      route: routes.group('dev', 'odf'),
      available: false,
    },

    rtf: {
      title: $localize`:@@group_dev_rtf_title:RTF`,
      description: $localize`:@@group_dev_rtf_desc:Outils legacy sur fichiers RTF : extraction texte, audit, conversion simple.`,
      icon: 'pi pi-align-left',
      route: routes.group('dev', 'rtf'),
      available: false,
    },

    legacy: {
      title: $localize`:@@group_dev_legacy_title:Formats Office legacy`,
      description: $localize`:@@group_dev_legacy_desc:DOC/XLS/PPT (binaires) : infos, détection et conversions.`,
      icon: 'pi pi-history',
      route: routes.group('dev', 'legacy'),
      available: false,
    },
  },
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
