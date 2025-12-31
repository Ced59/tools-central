import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percent_coefficient_converter_title:À propos : Convertisseur % ↔ coefficient`,
  lead: $localize`:@@ed_math_percentages_percent_coefficient_converter_lead:Ce convertisseur permet de passer d’un pourcentage à un coefficient multiplicateur (et inversement), afin d’appliquer correctement des variations, des cumuls ou des compositions.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percent_coefficient_converter_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc1_title:Appliquer une variation`,
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc1_text:Transformer +15 % en ×1,15 ou −20 % en ×0,80 pour effectuer un calcul direct.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc2_title:Composer plusieurs pourcentages`,
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc2_text:Utiliser des coefficients pour enchaîner des variations successives sans erreur.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc3_title:Comprendre un calcul avancé`,
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc3_text:Lire et interpréter des formules utilisant des coefficients multiplicateurs.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc4_title:Passer d’une écriture “humaine” à une écriture mathématique`,
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_uc4_text:Un pourcentage est intuitif, un coefficient est opérationnel : ce convertisseur fait le lien entre les deux.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percent_coefficient_converter_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percent_coefficient_converter_out1:La conversion d’un pourcentage en coefficient multiplicateur prêt à être utilisé dans un calcul.`,
        $localize`:@@ed_math_percentages_percent_coefficient_converter_out2:La conversion inverse : retrouver le pourcentage correspondant à un coefficient.`,
        $localize`:@@ed_math_percentages_percent_coefficient_converter_out3:Un outil de base pour les calculs de cumul, de composition et de pourcentage équivalent.`,
        $localize`:@@ed_math_percentages_percent_coefficient_converter_out4:Une représentation claire du lien entre “+X %” et “×(1 + X/100)”.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percent_coefficient_converter_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_lim1:Un coefficient inférieur à 1 correspond à une baisse, supérieur à 1 à une hausse.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_lim2:Ce convertisseur ne calcule pas de valeur finale : il fournit uniquement la forme multiplicative.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percent_coefficient_converter_lim3:Pour appliquer plusieurs coefficients successifs, utilisez un outil de composition ou de cumul.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percent_coefficient_converter_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percent_coefficient_converter_q1:Pourquoi convertir un pourcentage en coefficient ?`,
          a: $localize`:@@ed_math_percentages_percent_coefficient_converter_a1:Parce que les calculs successifs se font par multiplication, pas par addition de pourcentages.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percent_coefficient_converter_q2:Comment passer de −30 % à un coefficient ?`,
          a: $localize`:@@ed_math_percentages_percent_coefficient_converter_a2:On calcule 1 − 0,30, soit un coefficient de 0,70.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percent_coefficient_converter_q3:Est-ce la même chose qu’un pourcentage équivalent ?`,
          a: $localize`:@@ed_math_percentages_percent_coefficient_converter_a3:Non. Le coefficient est une forme intermédiaire. Le pourcentage équivalent est une interprétation finale.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percent_coefficient_converter_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percent_coefficient_converter_tip:Dès qu’il y a plusieurs étapes, pensez “coefficient d’abord, pourcentage ensuite” : c’est la méthode la plus fiable.`,
    },
  ],
};
