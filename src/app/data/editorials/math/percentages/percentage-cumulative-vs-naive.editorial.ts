import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_title:À propos : Effet cumulé vs somme naïve`,
  lead: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_lead:Ce calculateur compare la somme naïve des pourcentages (addition) et l’effet cumulé réel (applications successives), afin d’éviter l’erreur fréquente “+X% +Y% = +(X+Y)%”.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc1_title:Hausses successives sur un prix`,
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc1_text:Comparer “+10 % puis +10 %” avec “+20 %” pour comprendre l’écart dû au cumul.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc2_title:Remises en chaîne`,
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc2_text:Deux promotions successives (ex. −15 % puis −10 %) ne correspondent pas à −25 % : cet outil montre l’effet réel.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc3_title:Intérêts, rendement, inflation`,
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc3_text:Comprendre pourquoi les pourcentages cumulés sur plusieurs périodes ne s’obtiennent pas par simple addition.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc4_title:Budget, objectifs et KPI`,
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc4_text:Comparer une “somme de progressions” et une progression réellement obtenue après plusieurs étapes.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc5_title:Explication pédagogique`,
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_uc5_text:Idéal pour illustrer une notion en cours : le cumul passe par des coefficients multiplicateurs.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_out1:La somme naïve des pourcentages (addition directe), utile uniquement comme comparaison.`,
        $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_out2:L’effet cumulé réel obtenu après applications successives, calculé via des coefficients.`,
        $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_out3:La différence entre les deux approches, pour visualiser l’erreur potentielle et mieux communiquer un résultat.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_lim1:Le cumul dépend de l’ordre et du fait que chaque pourcentage s’applique à une nouvelle base.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_lim2:Ce calcul compare des effets multiplicatifs ; si vous cherchez une simple part sur total, ce n’est pas l’outil adapté.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_q1:Pourquoi ne peut-on pas additionner des pourcentages successifs ?`,
          a: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_a1:Parce que chaque pourcentage s’applique à une base différente après la première modification. Le calcul correct passe par des coefficients multiplicateurs.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_q2:Exemple simple : +10 % puis +10 %, ça fait combien au final ?`,
          a: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_a2:Ce n’est pas +20 % mais +21 % : on applique ×1,10 puis ×1,10, soit ×1,21 au total.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_q3:Et une baisse de −50 % puis une hausse de +50 % ?`,
          a: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_a3:On ne revient pas au point de départ : la hausse s’applique sur la valeur diminuée. Exemple : 100 → 50 → 75.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_q4:Quelle différence avec “pourcentage équivalent” ?`,
          a: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_a4:Le pourcentage équivalent donne directement un seul taux global. Ici, l’objectif est de comparer le cumul réel à l’addition naïve pour comprendre l’écart.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_cumulative_vs_naive_tip:Pensez en “×(1 ± X/100)” : dès qu’il y a plusieurs étapes, multipliez les coefficients au lieu d’additionner les pourcentages.`,
    },
  ],
};
