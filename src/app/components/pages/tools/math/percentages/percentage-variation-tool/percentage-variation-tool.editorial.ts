import type { ToolEditorialModel } from '../../../../../../models/tool-editorial/tool-editorial.model';

export const percentageVariationEditorial: ToolEditorialModel = {
  title: $localize`:@@pct_var_editorial_title:Comprendre la variation en pourcentage`,
  lead: $localize`:@@pct_var_editorial_lead:La variation (%) mesure un changement relatif entre deux valeurs. Elle est idéale pour comparer des évolutions sur des bases différentes.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@pct_var_editorial_usecases:Cas concrets d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@pct_var_editorial_uc_price:Prix`,
          text: $localize`:@@pct_var_editorial_uc_price_txt:Comparer une hausse/baisse entre deux prix (ex : promotions, inflation).`,
        },
        {
          title: $localize`:@@pct_var_editorial_uc_business:Chiffre d’affaires`,
          text: $localize`:@@pct_var_editorial_uc_business_txt:Mesurer une croissance d’une période à l’autre et la comparer à d’autres années.`,
        },
        {
          title: $localize`:@@pct_var_editorial_uc_stats:Statistiques`,
          text: $localize`:@@pct_var_editorial_uc_stats_txt:Comparer des évolutions (population, audience, scores) même si les valeurs de départ diffèrent.`,
        },
      ],
    },
    {
      id: 'differences',
      kind: 'text',
      heading: $localize`:@@pct_var_editorial_differences:Écart, variation et coefficient`,
      icon: 'pi pi-sliders-h',
      paragraphs: [
        $localize`:@@pct_var_editorial_differences_p1:L’écart est la différence brute (final − initial). La variation (%) exprime ce changement par rapport à la valeur initiale. Le coefficient multiplicateur indique par combien la valeur a été multipliée (final ÷ initial).`,
        $localize`:@@pct_var_editorial_differences_p2:Exemple : 100 → 120 : écart = +20, variation = +20%, coefficient = 1,20.`,
      ],
    },
    {
      id: 'mistakes',
      kind: 'list',
      heading: $localize`:@@pct_var_editorial_mistakes:Erreurs fréquentes`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@pct_var_editorial_m1:Oublier que la base de calcul est toujours la valeur initiale.`,
        },
        {
          text: $localize`:@@pct_var_editorial_m2:Confondre variation (%) et points de pourcentage (différence entre deux taux).`,
        },
        {
          text: $localize`:@@pct_var_editorial_m3:Penser que +20% puis −20% ramène au point de départ (ce n’est pas le cas).`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@pct_var_editorial_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@pct_var_editorial_faq_q1:Que faire si la valeur initiale est 0 ?`,
          a: $localize`:@@pct_var_editorial_faq_a1:La variation en pourcentage n’est pas définie (division par zéro). Utilisez plutôt un écart brut, ou une autre référence.`,
        },
        {
          q: $localize`:@@pct_var_editorial_faq_q2:Une variation négative signifie-t-elle toujours une baisse ?`,
          a: $localize`:@@pct_var_editorial_faq_a2:Oui : une variation négative indique que la valeur finale est inférieure à la valeur initiale.`,
        },
        {
          q: $localize`:@@pct_var_editorial_faq_q3:Peut-on appliquer ce calcul à des valeurs négatives ?`,
          a: $localize`:@@pct_var_editorial_faq_a3:Oui, mais l’interprétation peut devenir contre-intuitive (le “sens” d’une hausse/baisse dépend du contexte).`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@pct_var_editorial_tip:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@pct_var_editorial_tip_txt:Utilisez la variation (%) pour comparer des évolutions, et l’écart pour connaître la différence brute.`,
    },
  ],
};
