import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_of_total_title:À propos : Pourcentage d’un total`,
  lead: $localize`:@@ed_math_percentages_percentage_of_total_lead:Ce calculateur permet de trouver la valeur correspondant à un pourcentage d’un total, par exemple calculer une remise, une commission, une taxe ou une proportion d’une quantité.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_of_total_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_of_total_uc1_title:Calculer une remise ou une réduction`,
          text: $localize`:@@ed_math_percentages_percentage_of_total_uc1_text:Vous avez un prix total et un taux de remise : ce calcul donne le montant de la remise (ex. 20 % de 50 €).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_of_total_uc2_title:Calculer une taxe ou une commission`,
          text: $localize`:@@ed_math_percentages_percentage_of_total_uc2_text:Utile pour déterminer une TVA, des frais, une commission ou un pourboire à partir d’un total et d’un pourcentage.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_of_total_uc3_title:Extraire une proportion d’une quantité`,
          text: $localize`:@@ed_math_percentages_percentage_of_total_uc3_text:En cuisine, logistique, sport ou gestion : calculer 35 % d’un stock, 12 % d’un volume, 60 % d’un objectif…`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_of_total_uc4_title:Vérifier rapidement un calcul mental`,
          text: $localize`:@@ed_math_percentages_percentage_of_total_uc4_text:Pratique pour contrôler un montant annoncé (réduction, frais, part) sans sortir une calculette scientifique.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_of_total_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_of_total_out1:Le montant correspondant au pourcentage indiqué, calculé à partir du total.`,
        $localize`:@@ed_math_percentages_percentage_of_total_out2:Un résultat direct pour appliquer un taux à une base : réduction, taxe, commission, proportion d’une quantité, etc.`,
        $localize`:@@ed_math_percentages_percentage_of_total_out3:Une lecture simple qui évite les confusions entre “pourcentage du total” et “part sur total”.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_of_total_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_of_total_lim1:Le total peut être nul, mais le résultat sera alors forcément nul (0 % d’un total de 0 reste 0).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_of_total_lim2:Vérifiez l’unité du total (€, kg, personnes, points…) : le résultat est dans la même unité.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_of_total_lim3:Si vous cherchez le pourcentage que représente une valeur dans un total (ex. 80 sur 240), utilisez plutôt l’outil “Part sur total”.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_of_total_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_of_total_q1:Quelle différence avec “Part sur total” ?`,
          a: $localize`:@@ed_math_percentages_percentage_of_total_a1:Ici, vous connaissez le total et le taux, et vous voulez le montant correspondant. “Part sur total” fait l’inverse : vous connaissez la part et le total, et vous voulez le pourcentage.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_of_total_q2:Est-ce que je peux calculer un prix après remise avec cet outil ?`,
          a: $localize`:@@ed_math_percentages_percentage_of_total_a2:Oui : calculez d’abord le montant de la remise (pourcentage du prix), puis soustrayez-le au total pour obtenir le prix final.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_of_total_q3:Et pour une TVA, je fais comment ?`,
          a: $localize`:@@ed_math_percentages_percentage_of_total_a3:Vous pouvez calculer le montant de TVA comme un pourcentage du hors taxe, puis l’ajouter. Pour retrouver le hors taxe à partir du TTC, utilisez plutôt un outil de pourcentage inverse.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_of_total_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_of_total_tip:Pensez “appliquer un taux à une base” : si votre question ressemble à “combien fait X % de …”, alors c’est exactement le bon outil.`,
    },
  ],
};
