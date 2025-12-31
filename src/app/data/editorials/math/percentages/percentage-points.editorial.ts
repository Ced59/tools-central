import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_points_title:À propos : Points de pourcentage`,
  lead: $localize`:@@ed_math_percentages_percentage_points_lead:Ce calculateur permet de convertir la différence entre deux pourcentages en points de pourcentage, afin d’exprimer clairement l’écart entre deux taux (taux d’intérêt, chômage, TVA, réussite, etc.) sans confusion avec une variation en pourcentage.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_points_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_points_uc1_title:Comparer deux taux sans ambiguïté`,
          text: $localize`:@@ed_math_percentages_percentage_points_uc1_text:Un taux passe de 12 % à 15 % : l’écart est de +3 points de pourcentage. C’est l’expression la plus claire pour comparer des taux.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_points_uc2_title:Analyser des indicateurs publics ou économiques`,
          text: $localize`:@@ed_math_percentages_percentage_points_uc2_text:Utilisé pour le chômage, l’inflation, les sondages, les taux directeurs : on parle souvent en “points” plutôt qu’en pourcent relatif.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_points_uc3_title:Éviter la confusion “points” vs “%”`,
          text: $localize`:@@ed_math_percentages_percentage_points_uc3_text:Très utile dans les rapports, présentations et articles : “+2 points” n’est pas la même chose que “+2 %”.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_points_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_points_out1:La différence entre deux taux exprimée en points de pourcentage (écart direct entre les valeurs en %).`,
        $localize`:@@ed_math_percentages_percentage_points_out2:Un résultat conçu pour communiquer un écart entre pourcentages de manière claire, notamment dans les contextes économiques, financiers ou statistiques.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_points_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_points_lim1:Les points de pourcentage comparent deux pourcentages entre eux ; ce n’est pas une variation relative par rapport à une valeur de départ.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_points_lim2:Si vous cherchez “de combien en % le taux a augmenté”, il faut utiliser un calcul de variation en pourcentage, pas des points.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_points_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_points_q1:Quelle est la différence entre points de pourcentage et pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_points_a1:Les points de pourcentage mesurent un écart direct entre deux taux (ex : 10 % → 12 % = +2 points). Un pourcentage de variation mesure une hausse relative (ici +20 %).`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_points_q2:Dans quels cas parle-t-on en points de pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_points_a2:Quand on compare des taux : sondages, chômage, TVA, taux d’intérêt, réussite à un examen, parts de marché, etc.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_points_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_points_tip:Si les deux valeurs sont déjà des pourcentages, l’écart se donne presque toujours en points de pourcentage : c’est la formulation la plus lisible et la moins trompeuse.`,
    },
  ],
};
