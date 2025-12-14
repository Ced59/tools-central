export interface AtomicToolItem {
  id: string;                 // ex: 'percentage-variation'
  category: string;           // ex: 'math'
  group: string;              // ex: 'percentages'
  title: string;
  description: string;
  icon?: string;
  route: string;              // ex: '/categories/math/percentages/percentage-variation'
  available: boolean;
}

export const ATOMIC_TOOLS: AtomicToolItem[] = [
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
  {
    id: 'percentage-discount',
    category: 'math',
    group: 'percentages',
    title: $localize`:@@tool_percentage_discount_title:Remise`,
    description: $localize`:@@tool_percentage_discount_desc:Calculer un prix remisé et le pourcentage de réduction.`,
    icon: 'pi pi-tag',
    route: '/categories/math/percentages/percentage-discount',
    available: false,
  },
];
