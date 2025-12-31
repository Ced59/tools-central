import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_increase_decrease_title:À propos : Augmenter / diminuer de X%`,
  lead: $localize`:@@ed_math_percentages_percentage_increase_decrease_lead:Ce calculateur permet de calculer une nouvelle valeur après une augmentation ou une diminution de X %, en appliquant directement le coefficient multiplicateur correspondant.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc1_title:Prix, salaires, budgets`,
          text: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc1_text:Calculer un nouveau prix après une hausse, ou un montant après remise, sur un prix initial connu.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc2_title:Stock, quantités, objectifs`,
          text: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc2_text:Appliquer une augmentation ou diminution sur une quantité (production, stock, distance, calories, etc.).`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_increase_decrease_out1:La valeur finale après augmentation ou diminution du pourcentage indiqué, à partir de la valeur initiale.`,
        $localize`:@@ed_math_percentages_percentage_increase_decrease_out2:Un résultat cohérent avec la méthode des coefficients multiplicateurs (ex. +10 % ⇒ ×1,10 ; −20 % ⇒ ×0,80).`,
        $localize`:@@ed_math_percentages_percentage_increase_decrease_out3:Une façon simple d’appliquer un taux en une étape, sans passer par le calcul du montant intermédiaire.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_increase_decrease_lim1:Une baisse de X % puis une hausse de X % ne ramènent pas à la valeur initiale (les effets ne s’annulent pas).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_increase_decrease_lim2:Pour retrouver la valeur initiale à partir de la valeur finale, il faut utiliser un calcul de pourcentage inverse.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_increase_decrease_q1:Quelle est la formule pour augmenter ou diminuer de X % ?`,
          a: $localize`:@@ed_math_percentages_percentage_increase_decrease_a1:On multiplie la valeur initiale par un coefficient : +X % ⇒ ×(1 + X/100) et −X % ⇒ ×(1 − X/100).`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_increase_decrease_q2:Quelle différence avec “pourcentage d’un nombre” ?`,
          a: $localize`:@@ed_math_percentages_percentage_increase_decrease_a2:“Pourcentage d’un nombre” calcule une partie (ex. 20 % de 50). Ici, on calcule la valeur finale après modification (ex. 50 diminué de 20 %).`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_increase_decrease_q3:Pourquoi −50 % puis +50 % ne revient pas au départ ?`,
          a: $localize`:@@ed_math_percentages_percentage_increase_decrease_a3:Parce que la hausse s’applique sur une base devenue plus petite. Exemple : 100 → 50 (−50 %), puis 50 → 75 (+50 %).`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_increase_decrease_tip:Retenez les coefficients : +10 % = ×1,10 ; +25 % = ×1,25 ; −20 % = ×0,80. C’est souvent plus rapide (et moins risqué) que de calculer la part puis l’ajouter/retirer.`,
    },
  ],
};
