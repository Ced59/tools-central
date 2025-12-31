import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_title:À propos : % → fraction`,
  lead: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_lead:Cet outil convertit un pourcentage en fraction équivalente, puis la simplifie lorsque c’est possible, afin de retrouver une écriture mathématique exacte et exploitable dans les calculs.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc1_title:Revenir à une écriture fractionnaire`,
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc1_text:Transformer 25 % en 1/4 ou 75 % en 3/4.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc2_title:Calculs exacts`,
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc2_text:Utiliser une fraction plutôt qu’un pourcentage pour des calculs algébriques précis.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc3_title:Exercices scolaires`,
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc3_text:Vérifier ou justifier une conversion demandée dans un devoir.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc4_title:Comparer des valeurs`,
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc4_text:Comparer des pourcentages après les avoir convertis en fractions simplifiées.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc5_title:Préparer une suite d’opérations`,
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_uc5_text:Obtenir une fraction avant une addition, une multiplication ou une simplification.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fractions_percent_to_fraction_out1:La fraction correspondant au pourcentage saisi (écriture sur 100).`,
        $localize`:@@ed_math_fractions_fractions_percent_to_fraction_out2:Une fraction simplifiée (irréductible) lorsque c’est possible.`,
        $localize`:@@ed_math_fractions_fractions_percent_to_fraction_out3:Une écriture mathématique exacte, prête à être utilisée dans d’autres calculs.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_lim1:Un pourcentage est toujours interprété comme une valeur sur 100.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_lim2:Les pourcentages décimaux peuvent donner des fractions avec de grands dénominateurs.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_lim3:Un pourcentage supérieur à 100 % correspond à une fraction supérieure à 1.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_q1:Comment convertir un pourcentage en fraction ?`,
          a: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_a1:On écrit le pourcentage sur 100, puis on simplifie la fraction obtenue.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_q2:Pourquoi 25 % devient 1/4 ?`,
          a: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_a2:Parce que 25 % = 25/100, et cette fraction se simplifie en 1/4.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_q3:Que donne un pourcentage décimal comme 12,5 % ?`,
          a: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_a3:12,5 % = 12,5/100 = 125/1000, qui se simplifie en 1/8.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_q4:Quelle différence avec “Décimal → fraction” ?`,
          a: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_a4:Ici on part d’un pourcentage (sur 100). L’autre outil part d’un nombre décimal quelconque.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fractions_percent_to_fraction_tip:Si le pourcentage est un multiple de 25, 20, 10 ou 5, la fraction finale est souvent très simple après simplification.`,
    },
  ],
};
