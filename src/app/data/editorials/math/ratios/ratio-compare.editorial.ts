import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratio_compare_title:À propos : Comparer des ratios`,
  lead: $localize`:@@ed_math_ratio_compare_lead:Comparer deux ratios pour déterminer lequel représente la plus grande proportion ou la situation la plus favorable.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_compare_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratio_compare_uc1_title:Comparaisons équitables`,
          text: $localize`:@@ed_math_ratio_compare_uc1_text:Comparer des performances, des rendements ou des densités indépendamment des quantités totales.`,
        },
        {
          title: $localize`:@@ed_math_ratio_compare_uc2_title:Choix optimal`,
          text: $localize`:@@ed_math_ratio_compare_uc2_text:Décider entre deux options exprimées sous forme de ratios.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratio_compare_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratio_compare_out1:Une méthode fiable pour comparer deux ratios.`,
        $localize`:@@ed_math_ratio_compare_out2:Une interprétation correcte sans se laisser tromper par les valeurs brutes.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_compare_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_ratio_compare_lim1:Les ratios doivent être exprimés sur des bases comparables.` },
        { text: $localize`:@@ed_math_ratio_compare_lim2:Comparer des ratios n’indique pas la taille réelle des groupes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratio_compare_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratio_compare_tip:Transforme les ratios sous la même forme (fraction ou décimal) avant de comparer.`,
    },
  ],
};
