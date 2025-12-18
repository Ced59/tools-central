export interface ToolGroup {
  id: string;                 // ex: 'percentages'
  category: string;           // ex: 'math'
  title: string;
  description: string;
  icon?: string;
  route: string;              // ex: '/categories/math/percentages'
  available: boolean;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'percentages',
    category: 'math',
    title: $localize`:@@group_percentages_title:Pourcentages`,
    description: $localize`:@@group_percentages_desc:Augmentation, remise, variation, taux inversé...`,
    icon: 'pi pi-percentage',
    route: '/categories/math/percentages',
    available: true,
  },
  {
    id: 'vat',
    category: 'math',
    title: $localize`:@@group_vat_title:TVA`,
    description: $localize`:@@group_vat_desc:HT/TTC, taux personnalisés, calculs rapides...`,
    icon: 'pi pi-receipt',
    route: '/categories/math/vat',
    available: false,
  },
  {
    id: 'case',
    category: 'text',
    title: $localize`:@@group_text_case_title:Casse du texte`,
    description: $localize`:@@group_text_case_desc:Majuscules, minuscules, inversion, capitalisation…`,
    icon: 'pi pi-sort-alpha-down',
    route: '/categories/text/case',
    available: true,
  },
];
