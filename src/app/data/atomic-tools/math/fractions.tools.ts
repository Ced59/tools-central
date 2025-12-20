import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const FRACTIONS_TOOLS = {
  // Conversions
  'fraction-to-decimal': {
    category: 'math',
    group: 'fractions',
    subGroup: 'convert',
    title: $localize`:@@tool_fraction_to_decimal_title:Fraction → décimal`,
    description: $localize`:@@tool_fraction_to_decimal_desc:Convertir une fraction en décimal.`,
    icon: 'pi pi-sort-numeric-up',
    route: routes.tool('math', 'fractions', 'fraction-to-decimal'),
    available: false,
  },
  'decimal-to-fraction': {
    category: 'math',
    group: 'fractions',
    subGroup: 'convert',
    title: $localize`:@@tool_decimal_to_fraction_title:Décimal → fraction`,
    description: $localize`:@@tool_decimal_to_fraction_desc:Convertir un décimal en fraction (si possible simplifiée).`,
    icon: 'pi pi-sort-numeric-down',
    route: routes.tool('math', 'fractions', 'decimal-to-fraction'),
    available: false,
  },
  'fraction-to-percent': {
    category: 'math',
    group: 'fractions',
    subGroup: 'convert',
    title: $localize`:@@tool_fraction_to_percent_title:Fraction → %`,
    description: $localize`:@@tool_fraction_to_percent_desc:Convertir une fraction en pourcentage.`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'fractions', 'fraction-to-percent'),
    available: false,
  },
  'percent-to-fraction': {
    category: 'math',
    group: 'fractions',
    subGroup: 'convert',
    title: $localize`:@@tool_percent_to_fraction_title:% → fraction`,
    description: $localize`:@@tool_percent_to_fraction_desc:Convertir un pourcentage en fraction simplifiée.`,
    icon: 'pi pi-percentage',
    route: routes.tool('math', 'fractions', 'percent-to-fraction'),
    available: false,
  },

  // Calculs simples
  'fraction-simplify': {
    category: 'math',
    group: 'fractions',
    subGroup: 'compute',
    title: $localize`:@@tool_fraction_simplify_title:Simplification de fractions`,
    description: $localize`:@@tool_fraction_simplify_desc:Réduire une fraction au maximum.`,
    icon: 'pi pi-filter',
    route: routes.tool('math', 'fractions', 'fraction-simplify'),
    available: false,
  },
  'fraction-add': {
    category: 'math',
    group: 'fractions',
    subGroup: 'compute',
    title: $localize`:@@tool_fraction_add_title:Addition de fractions`,
    description: $localize`:@@tool_fraction_add_desc:Additionner deux fractions (avec étapes).`,
    icon: 'pi pi-plus',
    route: routes.tool('math', 'fractions', 'fraction-add'),
    available: false,
  },
  'fraction-compare': {
    category: 'math',
    group: 'fractions',
    subGroup: 'compute',
    title: $localize`:@@tool_fraction_compare_title:Comparaison de fractions`,
    description: $localize`:@@tool_fraction_compare_desc:Comparer deux fractions et déterminer la plus grande.`,
    icon: 'pi pi-arrows-h',
    route: routes.tool('math', 'fractions', 'fraction-compare'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
