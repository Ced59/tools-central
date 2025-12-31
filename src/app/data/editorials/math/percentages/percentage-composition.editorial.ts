import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_composition_title:À propos : Composition de pourcentages`,
  lead: $localize`:@@ed_math_percentages_percentage_composition_lead:Ce calculateur permet d’appliquer plusieurs pourcentages successifs à une valeur initiale, afin d’analyser l’effet étape par étape de chaque variation.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_composition_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_composition_uc1_title:Variations successives`,
          text: $localize`:@@ed_math_percentages_percentage_composition_uc1_text:Appliquer plusieurs hausses ou baisses consécutives (ex. +5 %, puis −10 %, puis +3 %).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_composition_uc2_title:Analyse financière détaillée`,
          text: $localize`:@@ed_math_percentages_percentage_composition_uc2_text:Suivre l’impact de chaque étape sur un prix, un budget ou un investissement.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_composition_uc3_title:Approche pédagogique`,
          text: $localize`:@@ed_math_percentages_percentage_composition_uc3_text:Comprendre comment les pourcentages se composent dans le temps, sans les simplifier.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_composition_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_composition_out1:La valeur finale obtenue après l’application successive de tous les pourcentages.`,
        $localize`:@@ed_math_percentages_percentage_composition_out2:Le détail de chaque étape de calcul, montrant comment la base évolue à chaque pourcentage.`,
        $localize`:@@ed_math_percentages_percentage_composition_out3:Une vision claire du mécanisme de composition, sans réduction à un seul taux global.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_composition_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_composition_lim1:Les pourcentages s’appliquent toujours sur la valeur issue de l’étape précédente.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_composition_lim2:Ce calcul n’additionne pas les pourcentages ; il les compose via des coefficients.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_composition_lim3:Si vous cherchez un seul taux global équivalent, utilisez plutôt l’outil “Pourcentage équivalent”.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_composition_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_composition_q1:Quelle est la différence avec “pourcentage équivalent” ?`,
          a: $localize`:@@ed_math_percentages_percentage_composition_a1:La composition conserve chaque étape du calcul, tandis que le pourcentage équivalent résume l’effet global en un seul taux.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_composition_q2:Pourquoi l’ordre des pourcentages est-il important ?`,
          a: $localize`:@@ed_math_percentages_percentage_composition_a2:Parce que chaque pourcentage s’applique à une base différente selon l’ordre des opérations.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_composition_q3:Est-ce la même chose qu’un cumul ?`,
          a: $localize`:@@ed_math_percentages_percentage_composition_a3:Oui, mais ici le cumul est détaillé étape par étape, pas seulement résumé.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_composition_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_composition_tip:Notez chaque pourcentage sous forme de coefficient (×1,05 ; ×0,90…) et appliquez-les dans l’ordre pour éviter toute erreur.`,
    },
  ],
};
