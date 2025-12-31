import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_ratio_title:À propos : Ratio en pourcentage`,
  lead: $localize`:@@ed_math_percentages_percentage_ratio_lead:Ce calculateur permet d’exprimer un rapport entre deux quantités sous forme de pourcentage, afin de comparer leur importance relative sans référence à un total global.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_ratio_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_ratio_uc1_title:Comparer deux catégories`,
          text: $localize`:@@ed_math_percentages_percentage_ratio_uc1_text:Exprimer la part d’une catégorie par rapport à une autre, par exemple le nombre de femmes par rapport au nombre d’hommes.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_ratio_uc2_title:Analyser un indicateur de performance`,
          text: $localize`:@@ed_math_percentages_percentage_ratio_uc2_text:Utilisé pour calculer des ratios comme le taux de réussite, le taux d’erreur ou le nombre de cas positifs par rapport aux cas totaux observés.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_ratio_uc3_title:Comparer des volumes ou des flux`,
          text: $localize`:@@ed_math_percentages_percentage_ratio_uc3_text:Utile pour comparer deux grandeurs mesurées indépendamment, par exemple des ventes en ligne par rapport aux ventes en magasin.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_ratio_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_ratio_out1:Le pourcentage représentant le rapport entre la première valeur et la seconde.`,
        $localize`:@@ed_math_percentages_percentage_ratio_out2:Un indicateur synthétique pour comparer deux quantités, quelle que soit leur unité ou leur ordre de grandeur.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_ratio_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_ratio_lim1:La seconde valeur du ratio ne doit pas être égale à zéro, sinon le calcul est impossible.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_ratio_lim2:Un ratio en pourcentage peut dépasser 100 %, ce qui est normal et n’indique pas une erreur.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_ratio_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_ratio_q1:Quelle est la différence avec une part du total ?`,
          a: $localize`:@@ed_math_percentages_percentage_ratio_a1:Une part du total compare une valeur à un ensemble complet, tandis qu’un ratio compare directement deux valeurs entre elles.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_ratio_q2:Un ratio peut-il être supérieur à 100 % ?`,
          a: $localize`:@@ed_math_percentages_percentage_ratio_a2:Oui, si la première valeur est plus grande que la seconde, le ratio dépasse 100 % sans que cela soit incorrect.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_ratio_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_ratio_tip:Si vous hésitez entre ratio et part du total, vérifiez s’il existe un “ensemble complet” clairement défini : sinon, le ratio est plus approprié.`,
    },
  ],
};
