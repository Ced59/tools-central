import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fraction_to_decimal_title:À propos : Fraction → décimal`,
  lead: $localize`:@@ed_math_fractions_fraction_to_decimal_lead:Cet outil convertit une fraction en nombre décimal afin de faciliter la lecture, la comparaison et l’utilisation pratique de valeurs fractionnaires.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_to_decimal_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fraction_to_decimal_uc1_title:Lire une valeur plus facilement`,
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_uc1_text:Transformer 3/4 en 0,75 ou 1/8 en 0,125 pour une lecture immédiate.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_decimal_uc2_title:Comparer des fractions`,
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_uc2_text:Comparer rapidement des fractions en les visualisant sous forme décimale.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_decimal_uc3_title:Mesures et calculs concrets`,
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_uc3_text:Utiliser une fraction dans des calculs de longueurs, de durées ou de quantités.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_decimal_uc4_title:Passer vers des pourcentages`,
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_uc4_text:Convertir une fraction en décimal avant de l’exprimer en pourcentage.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fraction_to_decimal_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fraction_to_decimal_out1:La valeur décimale correspondant à la fraction saisie.`,
        $localize`:@@ed_math_fractions_fraction_to_decimal_out2:Un nombre décimal fini lorsque c’est possible (ex. 1/4 = 0,25).`,
        $localize`:@@ed_math_fractions_fraction_to_decimal_out3:Une écriture décimale périodique lorsque la fraction ne peut pas être finie (ex. 1/3 = 0,333…).`,
        $localize`:@@ed_math_fractions_fraction_to_decimal_out4:Un résultat directement exploitable dans des calculs pratiques.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_to_decimal_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_lim1:Certaines fractions donnent un décimal infini périodique.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_lim2:Un décimal affiché avec un nombre limité de chiffres peut être une approximation.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_to_decimal_lim3:Le dénominateur de la fraction ne doit jamais être égal à zéro.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fraction_to_decimal_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fraction_to_decimal_q1:Pourquoi certaines fractions n’ont pas de décimal fini ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_decimal_a1:Parce que leur dénominateur contient des facteurs autres que 2 ou 5 (ex. 1/3).`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_decimal_q2:1/3 vaut-il exactement 0,33 ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_decimal_a2:Non, 1/3 = 0,333… à l’infini. 0,33 est seulement une approximation.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_decimal_q3:Dois-je simplifier la fraction avant de convertir ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_decimal_a3:Ce n’est pas obligatoire, mais cela permet souvent d’obtenir un décimal plus simple.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_decimal_q4:Quelle différence avec “Décimal → fraction” ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_decimal_a4:Ici on interprète une fraction sous forme décimale, alors que l’autre outil reconstruit une fraction exacte à partir d’un décimal.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fraction_to_decimal_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fraction_to_decimal_tip:Si le dénominateur ne contient que des facteurs 2 et/ou 5, la fraction donnera toujours un décimal fini.`,
    },
  ],
};
