import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_what_percent_title:X est quel pourcentage de Y ?`,
  lead: $localize`:@@ed_math_percentages_percentage_what_percent_lead:Cet outil calcule la part que représente une valeur X par rapport à un total Y. C’est le calcul de base pour exprimer une proportion (part sur total), comparer des contributions ou lire une statistique “en pourcentage”.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_what_percent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_what_percent_uc1_title:Part sur total (stats, rapports)`,
          text: $localize`:@@ed_math_percentages_percentage_what_percent_uc1_text:Exprimer une contribution : “20 sur 80, ça représente combien % ?” (ex : parts de marché, répartition).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_what_percent_uc2_title:Progression et objectifs`,
          text: $localize`:@@ed_math_percentages_percentage_what_percent_uc2_text:Mesurer l’avancement : “on a fait 35 sur 50, on en est à quel % ?”`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_what_percent_uc3_title:Finance et budget`,
          text: $localize`:@@ed_math_percentages_percentage_what_percent_uc3_text:Comprendre le poids d’une dépense ou d’un poste : “ce coût représente quel % du budget total ?”`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_what_percent_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_what_percent_out1:L’outil calcule le pourcentage correspondant à la formule : (X ÷ Y) × 100.`,
        $localize`:@@ed_math_percentages_percentage_what_percent_out2:Le résultat sert à interpréter une proportion de façon standardisée : on compare plus facilement des parts (même si les totaux diffèrent).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_what_percent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_what_percent_lim1:Si Y = 0, le pourcentage n’est pas calculable (division par zéro). Il faut alors raisonner autrement (écart, valeur brute, ou “non défini”).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_what_percent_lim2:Un résultat peut dépasser 100% si X > Y : ce n’est pas une erreur, cela signifie simplement que X est supérieur au total de référence choisi.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_what_percent_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_what_percent_q1:Quelle est la différence avec une “variation en %” ?`,
          a: $localize`:@@ed_math_percentages_percentage_what_percent_a1:Ici on calcule une proportion (part sur total). Une variation en % compare un “avant” et un “après” : (final − initial) ÷ initial.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_what_percent_q2:Pourquoi j’obtiens plus de 100% ?`,
          a: $localize`:@@ed_math_percentages_percentage_what_percent_a2:Parce que la référence Y n’est pas un “total” au sens strict, ou parce que X dépasse Y. Le pourcentage exprime un ratio, pas une contrainte.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_what_percent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_what_percent_tip:Pour éviter les confusions, écrivez toujours la phrase complète : “X représente P% de Y”. Le choix de Y (la référence) est ce qui donne du sens au pourcentage.`,
    },
  ],
};
