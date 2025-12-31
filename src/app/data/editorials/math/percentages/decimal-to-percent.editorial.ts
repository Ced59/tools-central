import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_decimal_to_percent_title:À propos : Décimal → pourcentage`,
  lead: $localize`:@@ed_math_percentages_decimal_to_percent_lead:Ce convertisseur permet de transformer un nombre décimal en pourcentage (ex. 0,125 → 12,5 %), pour lire et communiquer plus facilement un taux ou une proportion.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_decimal_to_percent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_decimal_to_percent_uc1_title:Probabilités et statistiques`,
          text: $localize`:@@ed_math_percentages_decimal_to_percent_uc1_text:Convertir une probabilité (0,03 ; 0,5 ; 0,875…) en pourcentage pour une interprétation immédiate.`,
        },
        {
          title: $localize`:@@ed_math_percentages_decimal_to_percent_uc2_title:Tableurs (Excel / Google Sheets)`,
          text: $localize`:@@ed_math_percentages_decimal_to_percent_uc2_text:Comprendre une valeur affichée sous forme décimale et la convertir en pourcentage lisible.`,
        },
        {
          title: $localize`:@@ed_math_percentages_decimal_to_percent_uc3_title:Taux et ratios`,
          text: $localize`:@@ed_math_percentages_decimal_to_percent_uc3_text:Transformer un taux sous forme 0,xx en % (taux de conversion, rendement, marge, etc.).`,
        },
        {
          title: $localize`:@@ed_math_percentages_decimal_to_percent_uc4_title:Vérifier un résultat`,
          text: $localize`:@@ed_math_percentages_decimal_to_percent_uc4_text:Contrôler rapidement une conversion avant de l’utiliser dans un calcul ou un rapport.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_decimal_to_percent_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_decimal_to_percent_out1:Le pourcentage correspondant au nombre décimal saisi (multiplication par 100).`,
        $localize`:@@ed_math_percentages_decimal_to_percent_out2:Un résultat lisible, utile pour communiquer un taux ou une proportion sans ambiguïté.`,
        $localize`:@@ed_math_percentages_decimal_to_percent_out3:Une conversion fiable, en particulier quand les décimales et les arrondis peuvent prêter à confusion.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_decimal_to_percent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_decimal_to_percent_lim1:Un décimal supérieur à 1 correspond à un pourcentage supérieur à 100 % (ex. 1,2 → 120 %).`,
        },
        {
          text: $localize`:@@ed_math_percentages_decimal_to_percent_lim2:Certains décimaux sont des approximations (ex. 0,333…): l’arrondi peut modifier légèrement le pourcentage affiché.`,
        },
        {
          text: $localize`:@@ed_math_percentages_decimal_to_percent_lim3:Ce convertisseur ne calcule pas une variation : il transforme uniquement une écriture en une autre.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_decimal_to_percent_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_decimal_to_percent_q1:Comment convertir un décimal en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_decimal_to_percent_a1:On multiplie le nombre par 100 et on ajoute le symbole % (ex. 0,07 → 7 %).`,
        },
        {
          q: $localize`:@@ed_math_percentages_decimal_to_percent_q2:Pourquoi 0,5 correspond à 50 % ?`,
          a: $localize`:@@ed_math_percentages_decimal_to_percent_a2:Parce que 0,5 représente la moitié de 1 : multiplié par 100, cela donne 50 %.`,
        },
        {
          q: $localize`:@@ed_math_percentages_decimal_to_percent_q3:Quelle différence avec “% ↔ fraction” ?`,
          a: $localize`:@@ed_math_percentages_decimal_to_percent_a3:Ici on convertit un décimal en %. L’outil “% ↔ fraction” convertit entre pourcentages et fractions simplifiées.`,
        },
        {
          q: $localize`:@@ed_math_percentages_decimal_to_percent_q4:Et si je veux faire l’inverse (pourcentage → décimal) ?`,
          a: $localize`:@@ed_math_percentages_decimal_to_percent_a4:Il faut diviser par 100. Si vous avez un outil dédié “pourcentage → décimal”, utilisez-le pour éviter les erreurs d’écriture.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_decimal_to_percent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_decimal_to_percent_tip:Repère rapide : 0,01 = 1 %, 0,1 = 10 %, 0,25 = 25 %, 0,5 = 50 %, 0,75 = 75 %.`,
    },
  ],
};
