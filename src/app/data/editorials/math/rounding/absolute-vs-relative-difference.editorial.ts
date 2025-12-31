import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_weighted_mean_title:À propos : Moyenne pondérée`,
  lead: $localize`:@@ed_math_statistics_weighted_mean_lead:Calculer une moyenne lorsque toutes les valeurs n’ont pas la même importance.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_weighted_mean_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_weighted_mean_uc1_title:Notes avec coefficients`,
          text: $localize`:@@ed_math_statistics_weighted_mean_uc1_text:Calculer une moyenne scolaire ou universitaire.`,
        },
        {
          title: $localize`:@@ed_math_statistics_weighted_mean_uc2_title:Prix moyen`,
          text: $localize`:@@ed_math_statistics_weighted_mean_uc2_text:Calculer un prix moyen en fonction des quantités achetées.`,
        },
        {
          title: $localize`:@@ed_math_statistics_weighted_mean_uc3_title:Données pondérées`,
          text: $localize`:@@ed_math_statistics_weighted_mean_uc3_text:Analyser des données avec fréquences ou durées différentes.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_weighted_mean_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_weighted_mean_out1:Une moyenne tenant compte de l’importance relative des valeurs.`,
        $localize`:@@ed_math_statistics_weighted_mean_out2:Un résultat plus fidèle à la réalité que la moyenne simple.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_weighted_mean_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_weighted_mean_lim1:Les poids doivent être cohérents et correctement interprétés.` },
        { text: $localize`:@@ed_math_statistics_weighted_mean_lim2:Une erreur sur les poids fausse complètement le résultat.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_weighted_mean_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_weighted_mean_tip:Si tous les poids sont égaux, la moyenne pondérée devient une moyenne arithmétique.`,
    },
  ],
};
