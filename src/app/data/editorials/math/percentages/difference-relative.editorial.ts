import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_difference_relative_title:À propos : Différence relative`,
  lead: $localize`:@@ed_math_percentages_difference_relative_lead:Ce calculateur permet d’exprimer la différence entre deux valeurs sous forme relative, en la rapportant à une valeur de référence, afin de comparer des écarts de manière proportionnelle.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_difference_relative_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_difference_relative_uc1_title:Comparer deux valeurs proches`,
          text: $localize`:@@ed_math_percentages_difference_relative_uc1_text:Exprimer un écart faible ou important en proportion de la valeur de référence.`,
        },
        {
          title: $localize`:@@ed_math_percentages_difference_relative_uc2_title:Analyser un écart sans notion temporelle`,
          text: $localize`:@@ed_math_percentages_difference_relative_uc2_text:Comparer deux mesures ou deux résultats sans parler d’évolution “avant/après”.`,
        },
        {
          title: $localize`:@@ed_math_percentages_difference_relative_uc3_title:Comparer des indicateurs hétérogènes`,
          text: $localize`:@@ed_math_percentages_difference_relative_uc3_text:Mettre en perspective une différence brute en la ramenant à une base commune.`,
        },
        {
          title: $localize`:@@ed_math_percentages_difference_relative_uc4_title:Rapports et analyses`,
          text: $localize`:@@ed_math_percentages_difference_relative_uc4_text:Présenter un écart de façon normalisée dans une analyse, un rapport ou une étude.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_difference_relative_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_difference_relative_out1:La différence relative entre deux valeurs, exprimée en pourcentage.`,
        $localize`:@@ed_math_percentages_difference_relative_out2:Un indicateur proportionnel qui facilite la comparaison d’écarts.`,
        $localize`:@@ed_math_percentages_difference_relative_out3:Un résultat indépendant de toute notion de chronologie ou de “valeur vraie”.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_difference_relative_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_difference_relative_lim1:La valeur de référence ne doit pas être égale à zéro.`,
        },
        {
          text: $localize`:@@ed_math_percentages_difference_relative_lim2:Le choix de la valeur de référence influence fortement le résultat.`,
        },
        {
          text: $localize`:@@ed_math_percentages_difference_relative_lim3:Ce calcul ne décrit pas une évolution dans le temps.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_difference_relative_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_difference_relative_q1:Quelle différence avec une variation en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_difference_relative_a1:La variation compare un “avant” et un “après”. La différence relative compare deux valeurs sans notion temporelle.`,
        },
        {
          q: $localize`:@@ed_math_percentages_difference_relative_q2:Quelle différence avec un pourcentage d’erreur ?`,
          a: $localize`:@@ed_math_percentages_difference_relative_a2:Le pourcentage d’erreur suppose une valeur de référence considérée comme correcte. La différence relative est neutre.`,
        },
        {
          q: $localize`:@@ed_math_percentages_difference_relative_q3:Peut-on obtenir une valeur négative ?`,
          a: $localize`:@@ed_math_percentages_difference_relative_a3:Oui, selon l’ordre des valeurs et la référence choisie.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_difference_relative_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_difference_relative_tip:Avant de calculer une différence relative, définissez clairement la valeur de référence : c’est elle qui donne du sens au résultat.`,
    },
  ],
};
