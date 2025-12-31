import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_weighted_title:Calculer un pourcentage pondéré (moyenne pondérée de taux)`,
  lead: $localize`:@@ed_math_percentages_percentage_weighted_lead:Un pourcentage pondéré sert à calculer un taux global quand plusieurs sous-ensembles n’ont pas le même poids (effectifs, volumes, montants). C’est la méthode correcte pour obtenir un pourcentage “réel” sur un ensemble mixte.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_weighted_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_weighted_uc1_title:Taux de réussite, satisfaction, conformité`,
          text: $localize`:@@ed_math_percentages_percentage_weighted_uc1_text:Obtenir un taux global à partir de plusieurs groupes ayant des tailles différentes (ex : classes, équipes, sondages).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_weighted_uc2_title:Mix de ventes, marges, remises`,
          text: $localize`:@@ed_math_percentages_percentage_weighted_uc2_text:Calculer une remise moyenne ou une marge moyenne pondérée par le chiffre d’affaires (pas une simple moyenne des %).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_weighted_uc3_title:Finance et portefeuille`,
          text: $localize`:@@ed_math_percentages_percentage_weighted_uc3_text:Calculer une performance globale pondérée par les montants investis (ou une exposition par catégorie).`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_weighted_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_weighted_out1:L’outil calcule le pourcentage pondéré via la formule : somme(taux × poids) ÷ somme(poids).`,
        $localize`:@@ed_math_percentages_percentage_weighted_out2:C’est l’approche correcte dès que les groupes n’ont pas le même poids : elle évite les biais d’une moyenne simple des pourcentages.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_weighted_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_weighted_lim1:Les poids doivent être cohérents avec ce que vous voulez représenter (effectifs, volumes, montants). Changer le poids change la signification du résultat.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_weighted_lim2:Ne faites pas une “moyenne de pourcentages” si les bases diffèrent. Exemple : 90% sur 10 cas et 10% sur 100 cas ne donnent pas 50% global.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_weighted_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_weighted_q1:Quelle différence entre moyenne simple et pourcentage pondéré ?`,
          a: $localize`:@@ed_math_percentages_percentage_weighted_a1:La moyenne simple donne le même poids à chaque pourcentage, même si les groupes n’ont pas la même taille. Le pondéré tient compte des bases (poids), donc reflète le taux global réel.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_weighted_q2:Que prendre comme “poids” ?`,
          a: $localize`:@@ed_math_percentages_percentage_weighted_a2:Le poids est la base du pourcentage : effectif total, nombre d’éléments, montant de vente, heures, volume… Choisissez ce qui représente l’impact réel de chaque sous-ensemble.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_weighted_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_weighted_tip:Si vous avez les “succès” et les “totaux”, vous pouvez aussi calculer le taux global directement : (somme des succès) ÷ (somme des totaux). C’est équivalent au pondéré et souvent plus intuitif.`,
    },
  ],
};
