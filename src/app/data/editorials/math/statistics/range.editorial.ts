import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_range_title:À propos : Étendue`,
  lead: $localize`:@@ed_math_statistics_range_lead:Mesurez l’étendue d’une série, c’est-à-dire l’écart entre sa valeur maximale et sa valeur minimale.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_range_usecases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        { title: $localize`:@@ed_math_statistics_range_uc1_title:Variations de température`, text: $localize`:@@ed_math_statistics_range_uc1_text:Calculer l’écart entre la température la plus basse et la plus haute d’une période.` },
        { title: $localize`:@@ed_math_statistics_range_uc2_title:Contrôle qualité`, text: $localize`:@@ed_math_statistics_range_uc2_text:Comparer la dispersion totale de dimensions ou de durées mesurées.` },
        { title: $localize`:@@ed_math_statistics_range_uc3_title:Repérage d’anomalies`, text: $localize`:@@ed_math_statistics_range_uc3_text:Détecter une étendue inhabituelle avant d’examiner les valeurs extrêmes.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_range_output:Ce que vous obtenez`,
      icon: 'tc-icon tc-icon-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_range_out1:Le minimum, le maximum et leur différence calculée selon la formule étendue = maximum − minimum.`,
        $localize`:@@ed_math_statistics_range_out2:Pour 4, 7, 10 et 18, le minimum vaut 4, le maximum 18 et l’étendue 14.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_range_limits:Limites et points d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_range_lim1:L’étendue dépend uniquement de deux valeurs : une seule observation atypique peut donc la modifier fortement.` },
        { text: $localize`:@@ed_math_statistics_range_lim2:Deux séries de même étendue peuvent avoir des distributions très différentes ; complétez l’analyse avec la médiane ou l’écart interquartile.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_range_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        { q: $localize`:@@ed_math_statistics_range_q1:L’étendue peut-elle être négative ?`, a: $localize`:@@ed_math_statistics_range_a1:Non. Le maximum est toujours supérieur ou égal au minimum, donc leur différence est positive ou nulle.` },
        { q: $localize`:@@ed_math_statistics_range_q2:Quelle est l’étendue d’une série dont toutes les valeurs sont égales ?`, a: $localize`:@@ed_math_statistics_range_a2:Elle vaut zéro, car le minimum et le maximum sont identiques.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_range_tip_title:Astuce`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_range_tip:Affichez toujours le minimum et le maximum avec l’étendue : la différence seule ne permet pas de connaître le niveau des valeurs.`,
    },
  ],
};
