import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_relative_difference_title:À propos : Écart relatif`,
  lead: $localize`:@@ed_math_percentages_percentage_relative_difference_lead:Ce calculateur permet de mesurer l’écart entre deux valeurs en pourcentage par rapport à une valeur de référence, afin de comparer des résultats sans notion de hausse ou de baisse dans le temps.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_relative_difference_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_relative_difference_uc1_title:Comparer deux résultats`,
          text: $localize`:@@ed_math_percentages_percentage_relative_difference_uc1_text:Comparer une valeur mesurée à une valeur attendue ou théorique, par exemple un résultat réel par rapport à un objectif.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_relative_difference_uc2_title:Évaluer un écart de performance`,
          text: $localize`:@@ed_math_percentages_percentage_relative_difference_uc2_text:Mesurer l’écart relatif entre deux performances, scores ou indicateurs sans supposer qu’une valeur succède à l’autre.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_relative_difference_uc3_title:Analyse statistique ou scientifique`,
          text: $localize`:@@ed_math_percentages_percentage_relative_difference_uc3_text:Fréquemment utilisé pour exprimer un écart entre une mesure observée et une valeur de référence en pourcentage.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_relative_difference_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_relative_difference_out1:Le pourcentage représentant l’écart entre les deux valeurs par rapport à la valeur de référence choisie.`,
        $localize`:@@ed_math_percentages_percentage_relative_difference_out2:Un indicateur clair pour quantifier une différence relative, indépendamment des unités ou des ordres de grandeur.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_relative_difference_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_relative_difference_lim1:La valeur de référence ne doit pas être égale à zéro, sinon l’écart relatif est indéfini.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_relative_difference_lim2:Ce calcul n’indique pas une évolution dans le temps, seulement une différence relative entre deux valeurs.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_relative_difference_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_relative_difference_q1:Quelle est la différence avec un pourcentage de variation ?`,
          a: $localize`:@@ed_math_percentages_percentage_relative_difference_a1:Une variation suppose une valeur initiale et une valeur finale dans le temps. L’écart relatif compare simplement deux valeurs sans notion d’évolution.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_relative_difference_q2:À quoi sert le choix de la valeur de référence ?`,
          a: $localize`:@@ed_math_percentages_percentage_relative_difference_a2:La valeur de référence sert de base de comparaison et influence directement le pourcentage obtenu.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_relative_difference_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_relative_difference_tip:Si vous hésitez entre écart relatif et variation, demandez-vous s’il existe un “avant” et un “après” : sinon, l’écart relatif est le bon choix.`,
    },
  ],
};
