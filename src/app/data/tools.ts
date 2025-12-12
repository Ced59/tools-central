export interface ToolItem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
}

export const TOOLS: ToolItem[] = [
  {
    id: 'percentages',
    category: 'math',
    title: $localize`:@@tool_percentages_title:Pourcentages`,
    description: $localize`:@@tool_percentages_desc:Calculer une augmentation, une remise, une variation...`,
    icon: 'pi pi-percentage',
    route: '/categories/math/percentages',
    available: true,
  },
  {
    id: 'vat',
    category: 'math',
    title: $localize`:@@tool_vat_title:TVA`,
    description: $localize`:@@tool_vat_desc:Calcul TVA incluse / hors taxe, taux personnalisés...`,
    icon: 'pi pi-receipt',
    route: '/categories/math/vat',
    available: false,
  },
];
