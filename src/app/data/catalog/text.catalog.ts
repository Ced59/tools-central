import type { CatalogCategoryDefinition } from './types';

// =============================================================================
// TEXT - Single Source of Truth
// =============================================================================

export const TEXT_CATEGORY: CatalogCategoryDefinition = {
  title: $localize`:@@cat_text_title:Texte`,
  description: $localize`:@@cat_text_desc:Compteurs, formatage, nettoyage de texte...`,
  icon: 'pi pi-file-edit',
  available: true,
  groups: {
    case: {
      title: $localize`:@@group_text_case_title:Casse du texte`,
      description: $localize`:@@group_text_case_desc:Majuscules, minuscules, inversion, capitalisation…`,
      icon: 'pi pi-sort-alpha-down',
      available: true,
      subGroups: {
        essential: {
          title: $localize`:@@case_sg_essential_title:Essentiels`,
          description: $localize`:@@case_sg_essential_desc:Conversions de casse principales.`,
          order: 1,
          tools: {
            'text-case': {
              title: $localize`:@@tool_text_case_title:Mettre en majuscule / minuscule`,
              description: $localize`:@@tool_text_case_desc:Convertir la casse du texte selon la langue (locale).`,
              icon: 'pi pi-sort-alpha-down',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/text/case/text-case-tool/text-case-tool.component')
                  .then(m => m.TextCaseToolComponent),
            },
          },
        },
      },
    },
    writing: {
      title: $localize`:@@group_text_writing_title:Écriture`,
      description: $localize`:@@group_text_writing_desc:Lisibilité, clarté, style et amélioration de texte…`,
      icon: 'pi pi-pencil',
      available: true,
      subGroups: {
        essential: {
          title: $localize`:@@writing_sg_essential_title:Essentiels`,
          description: $localize`:@@writing_sg_essential_desc:Analyse et amélioration d'écriture.`,
          order: 2,
          tools: {
            readability: {
              title: $localize`:@@readability_tool_card_title:Lisibilité & clarté`,
              description: $localize`:@@readability_tool_card_desc:Analysez la clarté de votre texte avec un score universel, des statistiques et des conseils.`,
              icon: 'pi pi-file-edit',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/text/writing/readability-tool/readability-tool.component')
                  .then(m => m.ReadabilityToolComponent),
            },
          },
        },
      },
    },
  },
};
