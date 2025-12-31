import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_variation_title:Comprendre la variation en pourcentage`,
  lead: $localize`:@@ed_math_percentages_percentage_variation_lead:La variation en pourcentage mesure l’évolution relative entre une valeur initiale et une valeur finale. Elle est idéale pour comparer des évolutions sur des bases différentes (prix, population, performance, budget).`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_variation_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_variation_uc1_title:Prix, promotions, inflation`,
          text: $localize`:@@ed_math_percentages_percentage_variation_uc1_text:Calculer la hausse ou la baisse d’un prix entre deux périodes (ex : 80 → 100).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_variation_uc2_title:Statistiques et indicateurs`,
          text: $localize`:@@ed_math_percentages_percentage_variation_uc2_text:Comparer des évolutions même si les valeurs de départ sont différentes (audience, taux, scores, volumes).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_variation_uc3_title:Business et finances`,
          text: $localize`:@@ed_math_percentages_percentage_variation_uc3_text:Mesurer un écart relatif (CA, marge, budget) et le communiquer clairement dans un rapport.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_variation_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_variation_out1:L’outil calcule l’écart (final − initial), la variation en % et le coefficient multiplicateur (final ÷ initial).`,
        $localize`:@@ed_math_percentages_percentage_variation_out2:Le pourcentage sert à “normaliser” l’évolution, tandis que le coefficient permet d’enchaîner facilement plusieurs évolutions (ex : ×1,20 puis ×0,90).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_variation_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_variation_lim1:Si la valeur initiale est 0, la variation en % n’est pas définie (division par zéro). Dans ce cas, on parle plutôt d’écart absolu.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_variation_lim2:Une baisse de 20% suivie d’une hausse de 20% ne “revient” pas au point de départ : les pourcentages s’appliquent sur des bases différentes.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_variation_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_variation_q1:Quelle différence entre “écart” et “variation (%)” ?`,
          a: $localize`:@@ed_math_percentages_percentage_variation_a1:L’écart est une différence brute (ex : +20). La variation (%) exprime cette différence relativement à la valeur initiale (ex : +20% si on part de 100).`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_variation_q2:Pourquoi utiliser aussi le coefficient ?`,
          a: $localize`:@@ed_math_percentages_percentage_variation_a2:Le coefficient (final ÷ initial) est pratique pour chaîner des évolutions : une hausse de 20% = ×1,20. Deux évolutions successives se multiplient.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_variation_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_variation_tip:Pour “annuler” une hausse, ne soustrayez pas le même % : utilisez le coefficient. Exemple : +20% = ×1,20, donc pour revenir il faut ÷1,20 (soit −16,67%).`,
    },
  ],
};
