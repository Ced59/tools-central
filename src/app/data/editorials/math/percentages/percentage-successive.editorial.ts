import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_successive_title:Pourcentages successifs : calculer l’effet cumulé`,
  lead: $localize`:@@ed_math_percentages_percentage_successive_lead:Les pourcentages successifs servent à calculer l’effet global de plusieurs hausses et baisses appliquées l’une après l’autre. L’idée clé : on n’additionne pas les pourcentages, on multiplie des coefficients.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_successive_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_successive_uc1_title:Prix, remises et promotions`,
          text: $localize`:@@ed_math_percentages_percentage_successive_uc1_text:Calculer un prix final après plusieurs évolutions (ex : +10% puis −15%, ou deux remises successives).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_successive_uc2_title:Finance et performance`,
          text: $localize`:@@ed_math_percentages_percentage_successive_uc2_text:Mesurer une variation cumulée sur plusieurs périodes (ex : rendements mensuels, inflation annuelle, indices).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_successive_uc3_title:Indicateurs et objectifs`,
          text: $localize`:@@ed_math_percentages_percentage_successive_uc3_text:Comprendre l’impact réel d’ajustements répétés (ex : bonus/malus, révisions de budget, taux appliqués en chaîne).`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_successive_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_successive_out1:L’outil convertit chaque pourcentage en coefficient (ex : +20% → ×1,20 ; −15% → ×0,85), puis calcule le coefficient global en les multipliant.`,
        $localize`:@@ed_math_percentages_percentage_successive_out2:Vous obtenez le résultat final (valeur après chaque étape) et la variation globale équivalente en pourcentage par rapport à la valeur de départ.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_successive_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_successive_lim1:On ne peut pas additionner des pourcentages successifs : +10% puis +10% ne fait pas +20% “au sens strict”, c’est ×1,10 ×1,10 = ×1,21 (soit +21%).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_successive_lim2:Une baisse de X% n’annule pas une hausse de X% : +20% puis −20% donne ×1,20 ×0,80 = ×0,96 (soit −4%).`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_successive_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_successive_q1:Pourquoi +20% puis −20% ne revient pas au départ ?`,
          a: $localize`:@@ed_math_percentages_percentage_successive_a1:Parce que la seconde opération s’applique sur une base différente. Après +20%, la base est plus grande ; −20% retire 20% de cette nouvelle base, pas de l’ancienne.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_successive_q2:Comment trouver le pourcentage inverse d’une hausse ?`,
          a: $localize`:@@ed_math_percentages_percentage_successive_a2:Utilisez les coefficients : si +p% = ×(1+p), alors “revenir” c’est ÷(1+p). Le pourcentage inverse vaut (1/(1+p) − 1) × 100.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_successive_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_successive_tip:Pensez “coefficient” : dès que vous enchaînez des % (remises, hausses, rendements), convertissez-les en ×1,xx puis multipliez. C’est la méthode la plus fiable.`,
    },
  ],
};
