import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_misleading_mean_title:À propos : Moyenne trompeuse`,
  lead: $localize`:@@ed_math_statistics_misleading_mean_lead:Comprendre pourquoi une moyenne peut être mathématiquement correcte mais statistiquement trompeuse.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_misleading_mean_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_misleading_mean_uc1_title:Salaires et revenus`,
          text: $localize`:@@ed_math_statistics_misleading_mean_uc1_text:Éviter les interprétations biaisées causées par quelques très hauts revenus.`,
        },
        {
          title: $localize`:@@ed_math_statistics_misleading_mean_uc2_title:Comparaisons injustes`,
          text: $localize`:@@ed_math_statistics_misleading_mean_uc2_text:Comparer des groupes sans masquer les inégalités internes.`,
        },
        {
          title: $localize`:@@ed_math_statistics_misleading_mean_uc3_title:Analyse critique`,
          text: $localize`:@@ed_math_statistics_misleading_mean_uc3_text:Développer un regard critique sur les chiffres présentés.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_misleading_mean_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_misleading_mean_out1:Des exemples concrets de moyennes trompeuses.`,
        $localize`:@@ed_math_statistics_misleading_mean_out2:Des alternatives plus représentatives comme la médiane.`,
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_misleading_mean_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_misleading_mean_tip:Une moyenne élevée ne signifie pas que la majorité des valeurs sont élevées.`,
    },
  ],
};
