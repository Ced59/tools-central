export interface ToolCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  available: boolean;
}

export const CATEGORIES: ToolCategory[] = [
  {
    id: 'math',
    title: $localize`:@@cat_math_title:Mathématiques`,
    description: $localize`:@@cat_math_desc:Pourcentages, règles de trois, conversions...`,
    icon: 'pi pi-calculator',
    available: true,
  },
  {
    id: 'text',
    title: $localize`:@@cat_text_title:Texte`,
    description: $localize`:@@cat_text_desc:Compteurs, formatage, nettoyage de texte...`,
    icon: 'pi pi-file-edit',
    available: true,
  },
  {
    id: 'image',
    title: $localize`:@@cat_image_title:Image`,
    description: $localize`:@@cat_image_desc:Compression, redimensionnement, optimisation...`,
    icon: 'pi pi-image',
    available: false,
  },
];
