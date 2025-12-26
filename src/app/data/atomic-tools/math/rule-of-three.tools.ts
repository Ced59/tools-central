import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const RULE_OF_THREE_TOOLS = {
  'rule-of-three-course': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'course',
    title: $localize`:@@tool_rot_course_title:Cours règle de trois`,
    description: $localize`:@@tool_rot_course_desc:Directe, inverse, tableaux + quiz pour apprendre rapidement.`,
    icon: 'pi pi-book',
    route: routes.tool('math', 'rule-of-three', 'rule-of-three-course'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/rule-of-three-course-tool/rule-of-three-course-tool.component'
        ).then(m => m.RuleOfThreeCourseToolComponent),
  },

  // Directe
  'rule-of-three-simple': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'direct',
    title: $localize`:@@tool_rule_of_three_simple_title:Règle de trois simple`,
    description: $localize`:@@tool_rule_of_three_simple_desc:Calculer une valeur manquante en proportionnalité directe.`,
    icon: 'pi pi-calculator',
    route: routes.tool('math', 'rule-of-three', 'rule-of-three-simple'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/rule-of-three-simple-tool/rule-of-three-simple-tool.component'
        ).then(m => m.RuleOfThreeSimpleToolComponent),
  },
  'rule-of-three-table': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'direct',
    title: $localize`:@@tool_rule_of_three_table_title:Règle de trois avec tableau`,
    description: $localize`:@@tool_rule_of_three_table_desc:Résoudre une règle de trois via un tableau de proportionnalité.`,
    icon: 'pi pi-table',
    route: routes.tool('math', 'rule-of-three', 'rule-of-three-table'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/rule-of-three-table-tool/rule-of-three-table-tool.component'
        ).then(m => m.RuleOfThreeTableToolComponent),
  },
  'rule-of-three-missing-value': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'direct',
    title: $localize`:@@tool_rule_of_three_missing_value_title:Valeur manquante`,
    description: $localize`:@@tool_rule_of_three_missing_value_desc:Trouver rapidement la valeur inconnue (directe).`,
    icon: 'pi pi-question',
    route: routes.tool('math', 'rule-of-three', 'rule-of-three-missing-value'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/rule-of-three-missing-value-tool/rule-of-three-missing-value-tool.component'
        ).then(m => m.RuleOfThreeMissingValueToolComponent),
  },

  // Inverse
  'rule-of-three-inverse': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'inverse',
    title: $localize`:@@tool_rule_of_three_inverse_title:Règle de trois inversée`,
    description: $localize`:@@tool_rule_of_three_inverse_desc:Résoudre un problème de proportionnalité inverse.`,
    icon: 'pi pi-replay',
    route: routes.tool('math', 'rule-of-three', 'rule-of-three-inverse'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/rule-of-three-inverse-tool/rule-of-three-inverse-tool.component'
        ).then(m => m.RuleOfThreeInverseToolComponent),
  },


  // Tableaux
  'proportion-table-complete': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'tables',
    title: $localize`:@@tool_proportion_table_complete_title:Compléter un tableau de proportionnalité`,
    description: $localize`:@@tool_proportion_table_complete_desc:Compléter les valeurs manquantes d’un tableau.`,
    icon: 'pi pi-table',
    route: routes.tool('math', 'rule-of-three', 'proportion-table-complete'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/proportional-table-complete-tool/proportional-table-complete-tool.component'
        ).then(m => m.ProportionalTableCompleteToolComponent),
  },
  'proportion-table-check': {
    category: 'math',
    group: 'rule-of-three',
    subGroup: 'tables',
    title: $localize`:@@tool_proportion_table_check_title:Vérifier si un tableau est proportionnel`,
    description: $localize`:@@tool_proportion_table_check_desc:Tester si les lignes/colonnes sont proportionnelles.`,
    icon: 'pi pi-verified',
    route: routes.tool('math', 'rule-of-three', 'proportion-table-check'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/math/rule-of-three/proportional-table-check-tool/proportional-table-check-tool.component'
        ).then(m => m.ProportionalTableCheckToolComponent),
  },
} as const satisfies Record<string, AtomicToolAny>;
