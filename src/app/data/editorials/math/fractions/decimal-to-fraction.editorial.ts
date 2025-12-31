import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_decimal_to_fraction_title:À propos : Décimal → fraction`,
  lead: $localize`:@@ed_math_fractions_decimal_to_fraction_lead:Ce convertisseur transforme un nombre décimal en fraction, en fournissant une écriture exacte et simplifiée lorsque c’est possible, afin de faciliter les calculs et la compréhension des proportions.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_decimal_to_fraction_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_decimal_to_fraction_uc1_title:Exercices scolaires et révisions`,
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_uc1_text:Convertir 0,25 en 1/4, 0,125 en 1/8 ou 0,75 en 3/4 pour vérifier une réponse.`,
        },
        {
          title: $localize`:@@ed_math_fractions_decimal_to_fraction_uc2_title:Calculs exacts`,
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_uc2_text:Obtenir une fraction exacte plutôt qu’une valeur décimale arrondie.`,
        },
        {
          title: $localize`:@@ed_math_fractions_decimal_to_fraction_uc3_title:Passer d’une écriture à une autre`,
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_uc3_text:Travailler plus facilement avec des fractions dans des calculs algébriques ou des équations.`,
        },
        {
          title: $localize`:@@ed_math_fractions_decimal_to_fraction_uc4_title:Comprendre les décimaux périodiques`,
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_uc4_text:Identifier la fraction correspondant à un décimal infini périodique (ex. 0,333… = 1/3).`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_decimal_to_fraction_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_decimal_to_fraction_out1:La fraction correspondant au nombre décimal saisi.`,
        $localize`:@@ed_math_fractions_decimal_to_fraction_out2:Une fraction simplifiée (irréductible) lorsque c’est mathématiquement possible.`,
        $localize`:@@ed_math_fractions_decimal_to_fraction_out3:Une écriture exacte, utile pour les démonstrations et les calculs précis.`,
        $localize`:@@ed_math_fractions_decimal_to_fraction_out4:Un résultat prêt à être utilisé dans des opérations avec des fractions.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_decimal_to_fraction_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_lim1:Les décimaux issus d’arrondis peuvent ne pas correspondre à une fraction “simple”.`,
        },
        {
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_lim2:Un décimal périodique doit être correctement identifié pour obtenir la fraction exacte.`,
        },
        {
          text: $localize`:@@ed_math_fractions_decimal_to_fraction_lim3:Ce convertisseur transforme une écriture : il ne calcule pas une proportion ou un pourcentage.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_decimal_to_fraction_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_decimal_to_fraction_q1:Comment convertir un décimal fini en fraction ?`,
          a: $localize`:@@ed_math_fractions_decimal_to_fraction_a1:On écrit le décimal sur une puissance de 10 (ex. 0,25 = 25/100) puis on simplifie.`,
        },
        {
          q: $localize`:@@ed_math_fractions_decimal_to_fraction_q2:Pourquoi 0,125 devient 1/8 ?`,
          a: $localize`:@@ed_math_fractions_decimal_to_fraction_a2:Parce que 0,125 = 125/1000, et cette fraction se simplifie en 1/8.`,
        },
        {
          q: $localize`:@@ed_math_fractions_decimal_to_fraction_q3:Comment traiter un décimal périodique comme 0,333… ?`,
          a: $localize`:@@ed_math_fractions_decimal_to_fraction_a3:Un décimal périodique correspond à une fraction exacte : 0,333… = 1/3.`,
        },
        {
          q: $localize`:@@ed_math_fractions_decimal_to_fraction_q4:Quelle différence avec “% ↔ fraction” ?`,
          a: $localize`:@@ed_math_fractions_decimal_to_fraction_a4:Ici on convertit un décimal en fraction. L’outil “% ↔ fraction” passe par une écriture sur 100.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_decimal_to_fraction_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_decimal_to_fraction_tip:Pour un décimal fini, comptez le nombre de chiffres après la virgule : cela indique directement la puissance de 10 à utiliser pour former la fraction.`,
    },
  ],
};
