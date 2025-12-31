import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_outliers_effect_title:À propos : Effet des valeurs extrêmes`,
  lead: $localize`:@@ed_math_statistics_outliers_effect_lead:Comprendre comment les valeurs extrêmes influencent les indicateurs statistiques.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_outliers_effect_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_outliers_effect_uc1_title:Analyse de données réelles`,
          text: $localize`:@@ed_math_statistics_outliers_effect_uc1_text:Données économiques, capteurs, notes ou mesures bruitées.`,
        },
        {
          title: $localize`:@@ed_math_statistics_outliers_effect_uc2_title:Nettoyage de données`,
          text: $localize`:@@ed_math_statistics_outliers_effect_uc2_text:Identifier des erreurs de saisie ou de mesure.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_outliers_effect_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_outliers_effect_out1:Une compréhension claire de l’impact des outliers.`,
        $localize`:@@ed_math_statistics_outliers_effect_out2:Des indicateurs plus robustes à privilégier.`,
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_outliers_effect_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_outliers_effect_tip:Comparez moyenne et médiane pour détecter rapidement la présence d’outliers.`,
    },
  ],
};
