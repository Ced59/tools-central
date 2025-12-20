import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const TEXT_CASE_TOOLS = {
  'text-case': {
    category: 'text',
    group: 'case',
    subGroup: 'essential',
    title: $localize`:@@tool_text_case_title:Mettre en majuscule / minuscule`,
    description: $localize`:@@tool_text_case_desc:Convertir la casse du texte selon la langue (locale).`,
    icon: 'pi pi-sort-alpha-down',
    route: routes.tool('text', 'case', 'text-case'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/text/case/text-case-tool/text-case-tool.component'
        ).then(m => m.TextCaseToolComponent),
  },
} as const satisfies Record<string, AtomicToolAny>;
