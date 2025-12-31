import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_min_max_title:À propos : Minimum et maximum`,
  lead: $localize`:@@ed_math_statistics_min_max_lead:Identifier rapidement les valeurs extrêmes d’une série grâce au minimum et au maximum.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_min_max_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_min_max_uc1_title:Définir une plage de valeurs`,
          text: $localize`:@@ed_math_statistics_min_max_uc1_text:Connaître les bornes d’une série de données.`,
        },
        {
          title: $localize`:@@ed_math_statistics_min_max_uc2_title:Détecter des anomalies`,
          text: $localize`:@@ed_math_statistics_min_max_uc2_text:Repérer rapidement des valeurs aberrantes ou incohérentes.`,
        },
        {
          title: $localize`:@@ed_math_statistics_min_max_uc3_title:Analyse rapide`,
          text: $localize`:@@ed_math_statistics_min_max_uc3_text:Obtenir une première lecture simple d’un ensemble de données.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_min_max_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_min_max_out1:La plus petite et la plus grande valeur de la série.`,
        $localize`:@@ed_math_statistics_min_max_out2:Une information immédiate sur l’étendue brute des données.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_min_max_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_min_max_lim1:Très sensibles aux valeurs extrêmes.` },
        { text: $localize`:@@ed_math_statistics_min_max_lim2:Ne décrivent pas la distribution interne des données.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_min_max_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_min_max_tip:Utilisez minimum et maximum avec la médiane ou les quartiles pour une analyse plus fiable.`,
    },
  ],
};
