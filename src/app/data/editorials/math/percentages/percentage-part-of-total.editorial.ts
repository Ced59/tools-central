import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_part_of_total_title:À propos : Part sur total`,
  lead: $localize`:@@ed_math_percentages_percentage_part_of_total_lead:Ce calculateur permet de déterminer la part qu’une valeur représente dans un total, exprimée en pourcentage, afin de mesurer une proportion au sein d’un ensemble complet.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_part_of_total_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_part_of_total_uc1_title:Analyser une répartition`,
          text: $localize`:@@ed_math_percentages_percentage_part_of_total_uc1_text:Calculer la part d’une catégorie dans un ensemble, par exemple la proportion de ventes d’un produit dans le chiffre d’affaires total.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_part_of_total_uc2_title:Lire ou créer des graphiques`,
          text: $localize`:@@ed_math_percentages_percentage_part_of_total_uc2_text:Indispensable pour interpréter ou construire des diagrammes circulaires, histogrammes ou tableaux de répartition.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_part_of_total_uc3_title:Comparer des contributions`,
          text: $localize`:@@ed_math_percentages_percentage_part_of_total_uc3_text:Comparer l’importance relative de plusieurs éléments au sein d’un même total (budget, population, résultats, scores, etc.).`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_part_of_total_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_part_of_total_out1:Le pourcentage représentant la proportion de la valeur choisie par rapport au total.`,
        $localize`:@@ed_math_percentages_percentage_part_of_total_out2:Un indicateur simple et normalisé pour comparer des parts au sein d’un même ensemble.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_part_of_total_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_part_of_total_lim1:Le total doit être strictement supérieur à zéro, sinon la part ne peut pas être calculée.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_part_of_total_lim2:La valeur étudiée doit faire partie du total ; sinon, il ne s’agit pas d’une part mais d’un ratio.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_part_of_total_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_part_of_total_q1:Quelle est la différence avec un ratio en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_part_of_total_a1:Une part du total compare une valeur à un ensemble complet. Un ratio compare deux valeurs entre elles sans notion de totalité.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_part_of_total_q2:Une part peut-elle dépasser 100 % ?`,
          a: $localize`:@@ed_math_percentages_percentage_part_of_total_a2:Non. Si le résultat dépasse 100 %, cela signifie que la valeur n’appartient pas réellement au total considéré.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_part_of_total_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_part_of_total_tip:Si toutes les parts sont correctement définies, leur somme doit être égale à 100 % : c’est un bon moyen de vérifier vos calculs.`,
    },
  ],
};
