import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fraction_add_title:À propos : Addition de fractions`,
  lead: $localize`:@@ed_math_fractions_fraction_add_lead:Ce calculateur additionne des fractions (y compris avec des dénominateurs différents) et fournit un résultat simplifié, avec une méthode claire pour trouver un dénominateur commun.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_add_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fraction_add_uc1_title:Vérifier un exercice`,
          text: $localize`:@@ed_math_fractions_fraction_add_uc1_text:Contrôler rapidement une addition du type 1/4 + 3/8 ou 2/3 + 5/6.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_add_uc2_title:Additionner des fractions avec dénominateurs différents`,
          text: $localize`:@@ed_math_fractions_fraction_add_uc2_text:Obtenir un résultat correct sans se tromper dans la recherche du dénominateur commun.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_add_uc3_title:Travailler avec des fractions négatives`,
          text: $localize`:@@ed_math_fractions_fraction_add_uc3_text:Additionner des fractions positives et négatives en conservant le signe correctement.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_add_uc4_title:Recettes, mesures et proportions`,
          text: $localize`:@@ed_math_fractions_fraction_add_uc4_text:Additionner des parts (ex. 1/3 de litre + 1/6 de litre) pour retrouver une quantité totale.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_add_uc5_title:Préparer une suite de calculs`,
          text: $localize`:@@ed_math_fractions_fraction_add_uc5_text:Obtenir une fraction simplifiée et exploitable avant de multiplier, diviser ou comparer.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fraction_add_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fraction_add_out1:Le résultat exact de l’addition sous forme de fraction.`,
        $localize`:@@ed_math_fractions_fraction_add_out2:Une fraction simplifiée (irréductible) lorsque c’est possible.`,
        $localize`:@@ed_math_fractions_fraction_add_out3:Un dénominateur commun cohérent (souvent basé sur le PPCM) pour éviter les fractions inutilement grandes.`,
        $localize`:@@ed_math_fractions_fraction_add_out4:Un résultat prêt à être réutilisé dans d’autres opérations sur les fractions.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_add_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fraction_add_lim1:Le dénominateur ne doit jamais être égal à zéro.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_add_lim2:Selon les valeurs saisies, un dénominateur commun peut devenir grand (c’est normal mathématiquement).`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_add_lim3:Si vous avez des décimaux, convertissez-les d’abord en fractions pour garder un résultat exact.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fraction_add_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fraction_add_q1:Pourquoi ne peut-on pas additionner directement les dénominateurs ?`,
          a: $localize`:@@ed_math_fractions_fraction_add_a1:Parce que 1/2 + 1/2 = 1, alors que (1+1)/(2+2) donnerait 2/4 = 1/2 : ce serait faux.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_add_q2:C’est quoi un dénominateur commun ?`,
          a: $localize`:@@ed_math_fractions_fraction_add_a2:C’est un même dénominateur pour toutes les fractions, permettant d’additionner correctement les numérateurs.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_add_q3:Le résultat est-il toujours simplifié ?`,
          a: $localize`:@@ed_math_fractions_fraction_add_a3:Oui, lorsque c’est possible, la fraction est réduite à sa forme irréductible.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_add_q4:Et si j’ai plus de deux fractions à additionner ?`,
          a: $localize`:@@ed_math_fractions_fraction_add_a4:Vous pouvez additionner plusieurs fractions : l’outil applique la même logique de dénominateur commun et de simplification.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fraction_add_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fraction_add_tip:Pour aller plus vite à la main, cherchez d’abord un dénominateur commun simple (souvent le PPCM) : vous évitez des fractions “gonflées” inutiles.`,
    },
  ],
};
