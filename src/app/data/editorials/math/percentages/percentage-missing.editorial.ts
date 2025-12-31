import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_missing_title:À propos : Pourcentage manquant`,
  lead: $localize`:@@ed_math_percentages_percentage_missing_lead:Ce calculateur permet de retrouver le pourcentage correspondant à une valeur donnée par rapport à une base, lorsque le taux est inconnu.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_missing_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_missing_uc1_title:Identifier un taux implicite`,
          text: $localize`:@@ed_math_percentages_percentage_missing_uc1_text:Vous connaissez un montant et sa base, mais pas le pourcentage appliqué (ex. commission, frais, remise).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_missing_uc2_title:Résoudre un exercice à inconnue`,
          text: $localize`:@@ed_math_percentages_percentage_missing_uc2_text:Classique en mathématiques : une valeur représente une fraction d’un total, et il faut retrouver le taux correspondant.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_missing_uc3_title:Vérifier une information annoncée`,
          text: $localize`:@@ed_math_percentages_percentage_missing_uc3_text:Permet de contrôler rapidement un pourcentage communiqué à partir des chiffres réels.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_missing_uc4_title:Comparer des situations similaires`,
          text: $localize`:@@ed_math_percentages_percentage_missing_uc4_text:Utile pour comparer des taux implicites entre plusieurs cas (ex. deux remises différentes sur des bases distinctes).`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_missing_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_missing_out1:Le pourcentage manquant, calculé à partir de la valeur observée et de la base de référence.`,
        $localize`:@@ed_math_percentages_percentage_missing_out2:Un résultat exprimé en pourcentage, directement interprétable et comparable.`,
        $localize`:@@ed_math_percentages_percentage_missing_out3:Une aide claire pour comprendre “combien en %” représente une valeur.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_missing_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_missing_lim1:La base de référence doit être strictement différente de zéro.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_missing_lim2:Ce calcul ne permet pas de retrouver une valeur initiale avant variation (voir plutôt “pourcentage inverse”).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_missing_lim3:Le pourcentage obtenu peut dépasser 100 % si la valeur est supérieure à la base.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_missing_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_missing_q1:Quelle différence avec “Part sur total” ?`,
          a: $localize`:@@ed_math_percentages_percentage_missing_a1:Les deux calculent un pourcentage, mais ici le but est de retrouver un taux inconnu à partir d’une valeur et d’une base, souvent dans un contexte de calcul isolé.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_missing_q2:Est-ce la même chose qu’une règle de trois ?`,
          a: $localize`:@@ed_math_percentages_percentage_missing_a2:Oui, il s’agit d’une forme spécifique de règle de trois où l’inconnue est le pourcentage.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_missing_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_missing_tip:Si votre question est “cela représente combien en % ?”, alors vous cherchez exactement un pourcentage manquant.`,
    },
  ],
};
