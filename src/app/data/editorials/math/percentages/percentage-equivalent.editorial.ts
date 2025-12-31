import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_equivalent_title:À propos : Pourcentage équivalent`,
  lead: $localize`:@@ed_math_percentages_percentage_equivalent_lead:Ce calculateur permet de déterminer le pourcentage équivalent produisant le même effet qu’un ou plusieurs calculs successifs, afin de comparer ou simplifier des variations.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_equivalent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_equivalent_uc1_title:Remises ou hausses successives`,
          text: $localize`:@@ed_math_percentages_percentage_equivalent_uc1_text:Transformer plusieurs augmentations ou diminutions successives en un seul pourcentage équivalent (ex. −10 % puis −20 %).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_equivalent_uc2_title:Comparer des offres ou des scénarios`,
          text: $localize`:@@ed_math_percentages_percentage_equivalent_uc2_text:Comparer deux situations différentes en les ramenant à un même pourcentage global.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_equivalent_uc3_title:Passer d’un coefficient à un pourcentage`,
          text: $localize`:@@ed_math_percentages_percentage_equivalent_uc3_text:Exprimer un coefficient multiplicateur sous forme de pourcentage équivalent pour une lecture plus intuitive.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_equivalent_uc4_title:Analyse financière ou commerciale`,
          text: $localize`:@@ed_math_percentages_percentage_equivalent_uc4_text:Évaluer l’effet réel de variations successives sur un prix, un budget ou une performance.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_equivalent_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_equivalent_out1:Le pourcentage équivalent correspondant à l’effet global des calculs appliqués.`,
        $localize`:@@ed_math_percentages_percentage_equivalent_out2:Un résultat unique permettant de résumer plusieurs variations en une seule.`,
        $localize`:@@ed_math_percentages_percentage_equivalent_out3:Un outil de simplification et de comparaison entre situations complexes.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_equivalent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_equivalent_lim1:Les pourcentages successifs ne s’additionnent pas : l’équivalence passe par des coefficients multiplicateurs.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_equivalent_lim2:Un pourcentage équivalent dépend de l’ordre et de la nature des variations appliquées.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_equivalent_lim3:Ce calcul ne décrit pas une évolution dans le temps, mais un effet global.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_equivalent_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_equivalent_q1:Quelle différence avec une variation en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_equivalent_a1:La variation décrit un changement entre deux valeurs. Le pourcentage équivalent résume l’effet combiné de plusieurs calculs.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_equivalent_q2:Pourquoi deux baisses ne s’additionnent-elles pas ?`,
          a: $localize`:@@ed_math_percentages_percentage_equivalent_a2:Parce que chaque pourcentage s’applique à une base différente. Le pourcentage équivalent permet de retrouver l’effet réel.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_equivalent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_equivalent_tip:Pensez toujours en coefficients (×0,9 ; ×1,2…) puis convertissez le résultat en pourcentage équivalent : c’est la méthode la plus fiable.`,
    },
  ],
};
