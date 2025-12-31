import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_of_number_title:À propos : Pourcentage d’un nombre`,
  lead: $localize`:@@ed_math_percentages_percentage_of_number_lead:Ce calculateur permet de déterminer rapidement la valeur correspondant à un pourcentage d’un nombre, sans supposer de total, de part ou d’évolution particulière.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_of_number_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_of_number_uc1_title:Calculs simples du quotidien`,
          text: $localize`:@@ed_math_percentages_percentage_of_number_uc1_text:Calculer rapidement 10 %, 25 % ou 50 % d’un nombre pour estimer une quantité, une réduction ou un effort.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_of_number_uc2_title:Exercices scolaires et révisions`,
          text: $localize`:@@ed_math_percentages_percentage_of_number_uc2_text:Utile pour comprendre et appliquer la notion de pourcentage sur un nombre donné, sans contexte supplémentaire.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_of_number_uc3_title:Vérification mentale ou rapide`,
          text: $localize`:@@ed_math_percentages_percentage_of_number_uc3_text:Permet de vérifier un calcul annoncé ou d’obtenir un ordre de grandeur sans passer par un outil plus complexe.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_of_number_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_of_number_out1:La valeur correspondant au pourcentage appliqué au nombre saisi.`,
        $localize`:@@ed_math_percentages_percentage_of_number_out2:Un résultat direct et immédiat, adapté aux calculs simples et aux besoins généraux.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_of_number_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_of_number_lim1:Ce calcul ne donne pas un pourcentage relatif à un ensemble ou à un total.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_of_number_lim2:Si vous cherchez à savoir quelle part un nombre représente dans un total, utilisez plutôt l’outil “Part sur total”.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_of_number_lim3:Pour analyser une évolution entre deux valeurs, un calcul de variation en pourcentage est plus approprié.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_of_number_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_of_number_q1:Quelle différence avec “Pourcentage d’un total” ?`,
          a: $localize`:@@ed_math_percentages_percentage_of_number_a1:Ici, on applique simplement un taux à un nombre isolé. “Pourcentage d’un total” suppose un contexte où le nombre fait partie d’un ensemble global.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_of_number_q2:Est-ce utile même pour des calculs très simples ?`,
          a: $localize`:@@ed_math_percentages_percentage_of_number_a2:Oui, notamment pour éviter les erreurs et gagner du temps, surtout lorsque les nombres ou les taux sont moins évidents.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_of_number_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_of_number_tip:Si votre question se résume à “combien fait X % de ce nombre ?” sans autre contexte, c’est exactement l’outil qu’il vous faut.`,
    },
  ],
};
