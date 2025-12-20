import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const ROUNDING_TOOLS = {
  // Arrondis
  'round-tenth-hundredth': {
    category: 'math',
    group: 'rounding',
    subGroup: 'rounding',
    title: $localize`:@@tool_round_tenth_hundredth_title:Arrondi au dixième / centième`,
    description: $localize`:@@tool_round_tenth_hundredth_desc:Arrondir à un nombre de décimales (0.1, 0.01…).`,
    icon: 'pi pi-circle',
    route: routes.tool('math', 'rounding', 'round-tenth-hundredth'),
    available: false,
  },
  'significant-figures': {
    category: 'math',
    group: 'rounding',
    subGroup: 'rounding',
    title: $localize`:@@tool_significant_figures_title:Arrondi significatif`,
    description: $localize`:@@tool_significant_figures_desc:Arrondir à n chiffres significatifs.`,
    icon: 'pi pi-hashtag',
    route: routes.tool('math', 'rounding', 'significant-figures'),
    available: false,
  },
  truncate: {
    category: 'math',
    group: 'rounding',
    subGroup: 'rounding',
    title: $localize`:@@tool_truncate_title:Troncature`,
    description: $localize`:@@tool_truncate_desc:Tronquer un nombre sans arrondir.`,
    icon: 'pi pi-minus',
    route: routes.tool('math', 'rounding', 'truncate'),
    available: false,
  },

  // Erreurs & estimation
  'order-of-magnitude': {
    category: 'math',
    group: 'rounding',
    subGroup: 'errors',
    title: $localize`:@@tool_order_of_magnitude_title:Ordre de grandeur`,
    description: $localize`:@@tool_order_of_magnitude_desc:Estimer un ordre de grandeur (approximation rapide).`,
    icon: 'pi pi-compass',
    route: routes.tool('math', 'rounding', 'order-of-magnitude'),
    available: false,
  },
  'rounding-error': {
    category: 'math',
    group: 'rounding',
    subGroup: 'errors',
    title: $localize`:@@tool_rounding_error_title:Erreur d’arrondi`,
    description: $localize`:@@tool_rounding_error_desc:Mesurer l’écart introduit par un arrondi.`,
    icon: 'pi pi-exclamation-triangle',
    route: routes.tool('math', 'rounding', 'rounding-error'),
    available: false,
  },
  'absolute-vs-relative-difference': {
    category: 'math',
    group: 'rounding',
    subGroup: 'errors',
    title: $localize`:@@tool_absolute_vs_relative_difference_title:Écart absolu vs relatif`,
    description: $localize`:@@tool_absolute_vs_relative_difference_desc:Comparer un écart en valeur et en pourcentage.`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('math', 'rounding', 'absolute-vs-relative-difference'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
