import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_error_title:À propos : Pourcentage d’erreur`,
  lead: $localize`:@@ed_math_percentages_percentage_error_lead:Ce calculateur permet de mesurer l’écart entre une valeur mesurée et une valeur de référence, exprimé en pourcentage de la valeur de référence.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_error_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_error_uc1_title:Évaluer une mesure`,
          text: $localize`:@@ed_math_percentages_percentage_error_uc1_text:Comparer une mesure expérimentale à une valeur théorique ou attendue.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_error_uc2_title:Contrôle qualité`,
          text: $localize`:@@ed_math_percentages_percentage_error_uc2_text:Vérifier la précision d’un résultat par rapport à une spécification ou une norme.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_error_uc3_title:Sciences et statistiques`,
          text: $localize`:@@ed_math_percentages_percentage_error_uc3_text:Exprimer l’erreur relative d’une estimation, d’un modèle ou d’un calcul.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_error_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_error_out1:Le pourcentage d’erreur entre la valeur mesurée et la valeur de référence.`,
        $localize`:@@ed_math_percentages_percentage_error_out2:Un indicateur normalisé pour juger de la précision ou de la fiabilité d’une mesure.`,
        $localize`:@@ed_math_percentages_percentage_error_out3:Un résultat exprimé en pourcentage, facilement comparable entre plusieurs situations.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_error_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_error_lim1:La valeur de référence doit être strictement différente de zéro.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_error_lim2:Le pourcentage d’erreur ne renseigne pas sur le sens de l’erreur (surestimation ou sous-estimation), seulement sur son ampleur.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_error_lim3:Ce calcul n’indique pas une variation dans le temps, mais une comparaison à une valeur “vraie”.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_error_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_error_q1:Quelle est la différence avec un écart relatif ?`,
          a: $localize`:@@ed_math_percentages_percentage_error_a1:Le pourcentage d’erreur compare une mesure à une valeur de référence considérée comme correcte. L’écart relatif compare deux valeurs sans notion de “vraie” valeur.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_error_q2:Le pourcentage d’erreur peut-il dépasser 100 % ?`,
          a: $localize`:@@ed_math_percentages_percentage_error_a2:Oui, si l’erreur est supérieure à la valeur de référence, ce qui indique une mesure très imprécise.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_error_q3:Est-ce la même chose qu’une variation en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_error_a3:Non. Une variation décrit un changement dans le temps, alors qu’un pourcentage d’erreur mesure une différence par rapport à une valeur de référence.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_error_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_error_tip:Pour une analyse complète, accompagnez le pourcentage d’erreur de la valeur absolue de l’erreur afin d’en comprendre l’impact réel.`,
    },
  ],
};
