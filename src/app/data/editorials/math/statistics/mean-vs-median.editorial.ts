import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_mean_vs_median_title:À propos : Moyenne vs médiane`,
  lead: $localize`:@@ed_math_statistics_mean_vs_median_lead:Comprendre la différence entre moyenne et médiane pour choisir l’indicateur statistique le plus pertinent selon la distribution des données.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_vs_median_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_mean_vs_median_uc1_title:Comparer des groupes`,
          text: $localize`:@@ed_math_statistics_mean_vs_median_uc1_text:Comparer des classes, des salaires ou des notes sans être trompé par quelques valeurs extrêmes.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_vs_median_uc2_title:Analyser une distribution asymétrique`,
          text: $localize`:@@ed_math_statistics_mean_vs_median_uc2_text:Identifier si la moyenne est représentative ou déformée par la distribution.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_vs_median_uc3_title:Choisir le bon indicateur`,
          text: $localize`:@@ed_math_statistics_mean_vs_median_uc3_text:Savoir quand utiliser la moyenne ou la médiane dans un exercice ou une analyse.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_mean_vs_median_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_mean_vs_median_out1:Une comparaison claire entre moyenne et médiane, avec leurs propriétés respectives.`,
        $localize`:@@ed_math_statistics_mean_vs_median_out2:Des règles simples pour choisir rapidement l’indicateur le plus pertinent.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_vs_median_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_mean_vs_median_lim1:La moyenne est sensible aux valeurs extrêmes.` },
        { text: $localize`:@@ed_math_statistics_mean_vs_median_lim2:La médiane ne tient pas compte des écarts entre valeurs.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_mean_vs_median_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_statistics_mean_vs_median_q1:Quand faut-il privilégier la médiane ?`,
          a: $localize`:@@ed_math_statistics_mean_vs_median_a1:Quand la distribution est asymétrique ou contient des valeurs extrêmes.`,
        },
        {
          q: $localize`:@@ed_math_statistics_mean_vs_median_q2:Peut-on utiliser les deux ?`,
          a: $localize`:@@ed_math_statistics_mean_vs_median_a2:Oui, moyenne et médiane sont souvent complémentaires.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_mean_vs_median_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_mean_vs_median_tip:Si la moyenne est très éloignée de la médiane, la distribution est probablement déséquilibrée.`,
    },
  ],
};
