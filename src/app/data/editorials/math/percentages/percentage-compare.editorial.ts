import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_compare_title:À propos : Comparer deux pourcentages`,
  lead: $localize`:@@ed_math_percentages_percentage_compare_lead:Ce comparateur permet d’analyser deux pourcentages (deux taux) en affichant des indicateurs complémentaires : écart en points de pourcentage et comparaison relative, pour interpréter correctement la différence entre deux taux.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_compare_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_compare_uc1_title:Comparer des taux d’intérêt ou de rendement`,
          text: $localize`:@@ed_math_percentages_percentage_compare_uc1_text:Comparer deux taux (ex. 3,2 % vs 4,0 %) en distinguant l’écart en points et l’écart relatif.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_compare_uc2_title:Comparer des statistiques (sondages, réussite, conversion)`,
          text: $localize`:@@ed_math_percentages_percentage_compare_uc2_text:Comprendre un changement de taux de réussite, de taux de conversion ou d’intention de vote sans confusion “points” vs “%”.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_compare_uc3_title:Présenter un écart de manière claire`,
          text: $localize`:@@ed_math_percentages_percentage_compare_uc3_text:Utile dans un rapport ou une présentation : choisir l’indicateur le plus compréhensible selon le contexte.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_compare_uc4_title:Détecter les formulations trompeuses`,
          text: $localize`:@@ed_math_percentages_percentage_compare_uc4_text:Vérifier des phrases comme “le taux a augmenté de 50 %” alors qu’il s’agit parfois d’une hausse de quelques points.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_compare_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_compare_out1:L’écart en points de pourcentage entre les deux taux (différence directe entre deux %).`,
        $localize`:@@ed_math_percentages_percentage_compare_out2:La comparaison relative : combien le second taux est plus grand ou plus petit que le premier, en pourcentage.`,
        $localize`:@@ed_math_percentages_percentage_compare_out3:Une lecture “interprétation” : savoir si l’écart est faible en points mais important en relatif (ou l’inverse).`,
        $localize`:@@ed_math_percentages_percentage_compare_out4:Un résultat conçu pour communiquer correctement une différence entre deux pourcentages.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_compare_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_compare_lim1:Comparer des pourcentages suppose qu’ils portent sur le même type d’indicateur (même définition, même base de calcul).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_compare_lim2:Si l’un des taux est proche de 0 %, la comparaison relative peut devenir très grande et difficile à interpréter.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_compare_lim3:Pour une simple différence entre taux, l’outil “Points de pourcentage” peut suffire.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_compare_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_compare_q1:Pourquoi distinguer “points de pourcentage” et “pourcentage” ?`,
          a: $localize`:@@ed_math_percentages_percentage_compare_a1:Parce que 10 % → 15 % correspond à +5 points, mais aussi à +50 % en relatif. Ce sont deux lectures différentes d’un même écart.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_compare_q2:Dans quel cas faut-il parler en points ?`,
          a: $localize`:@@ed_math_percentages_percentage_compare_a2:Quand on compare des taux (sondages, chômage, intérêts…), l’écart en points est souvent la formulation la plus claire.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_compare_q3:Et si je compare deux valeurs (pas des %), je fais comment ?`,
          a: $localize`:@@ed_math_percentages_percentage_compare_a3:Dans ce cas, utilisez plutôt un outil de variation en pourcentage ou d’écart relatif entre deux valeurs.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_compare_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_compare_tip:Pour communiquer clairement, donnez d’abord l’écart en points, puis (si utile) la comparaison relative : cela évite la plupart des malentendus.`,
    },
  ],
};
