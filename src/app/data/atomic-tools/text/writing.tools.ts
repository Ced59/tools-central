import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const WRITING_TOOLS = {
  readability: {
    category: 'text',
    group: 'writing',
    subGroup: 'essential',
    title: $localize`:@@readability_tool_card_title:Lisibilité & clarté`,
    description: $localize`:@@readability_tool_card_desc:Analysez la clarté de votre texte avec un score universel, des statistiques et des conseils.`,
    icon: 'pi pi-file-edit',
    route: routes.tool('text', 'writing', 'readability'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/text/writing/readability-tool/readability-tool.component'
        ).then(m => m.ReadabilityToolComponent),
  },
} as const satisfies Record<string, AtomicToolAny>;
