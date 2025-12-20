import { routes } from './routes';
import { CategoryId, GroupId } from './ids';

export interface ToolGroup<C extends CategoryId = CategoryId> {
  id: GroupId<C>;
  category: C;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'percentages',
    category: 'math',
    title: $localize`:@@group_percentages_title:Pourcentages`,
    description: $localize`:@@group_percentages_desc:Augmentation, remise, variation, taux inversé...`,
    icon: 'pi pi-percentage',
    route: routes.group('math', 'percentages'),
    available: true,
  },
  {
    id: 'vat',
    category: 'math',
    title: $localize`:@@group_vat_title:TVA`,
    description: $localize`:@@group_vat_desc:HT/TTC, taux personnalisés, calculs rapides...`,
    icon: 'pi pi-receipt',
    route: routes.group('math', 'vat'),
    available: false,
  },
  {
    id: 'case',
    category: 'text',
    title: $localize`:@@group_text_case_title:Casse du texte`,
    description: $localize`:@@group_text_case_desc:Majuscules, minuscules, inversion, capitalisation…`,
    icon: 'pi pi-sort-alpha-down',
    route: routes.group('text', 'case'),
    available: true,
  },
  {
    id: 'writing',
    category: 'text',
    title: $localize`:@@group_text_writing_title:Écriture`,
    description: $localize`:@@group_text_writing_desc:Lisibilité, clarté, style et amélioration de texte…`,
    icon: 'pi pi-pencil',
    route: routes.group('text', 'writing'),
    available: true,
  },
];
