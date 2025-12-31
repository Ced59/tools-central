import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_applied_rate_title:À propos : Retrouver le pourcentage appliqué`,
  lead: $localize`:@@ed_math_percentages_percentage_applied_rate_lead:Ce calculateur permet de retrouver le pourcentage effectivement appliqué entre une valeur initiale et une valeur finale, afin d’identifier une hausse, une baisse ou un taux implicite.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_applied_rate_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_applied_rate_uc1_title:Retrouver une remise ou une majoration`,
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_uc1_text:Vous connaissez le prix avant et le prix après : ce calcul permet de retrouver le pourcentage de réduction ou d’augmentation réellement appliqué.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_applied_rate_uc2_title:Trouver un taux implicite`,
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_uc2_text:Déterminer un taux “caché” (commission, frais, marge) à partir d’un montant de départ et d’un montant obtenu.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_applied_rate_uc3_title:Comparer deux périodes ou deux scénarios`,
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_uc3_text:Comparer un avant/après (budget, performance, quantité) en retrouvant le taux de changement correspondant.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_applied_rate_uc4_title:Contrôler un calcul annoncé`,
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_uc4_text:Vérifier rapidement si un pourcentage communiqué correspond bien aux chiffres affichés.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_applied_rate_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_applied_rate_out1:Le pourcentage appliqué entre la valeur initiale et la valeur finale (taux de modification).`,
        $localize`:@@ed_math_percentages_percentage_applied_rate_out2:Une interprétation simple : hausse ou baisse, selon le sens du changement.`,
        $localize`:@@ed_math_percentages_percentage_applied_rate_out3:Un résultat utile pour identifier une remise, une majoration, un taux implicite ou un changement global.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_applied_rate_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_lim1:La valeur initiale doit être différente de zéro, sinon le pourcentage appliqué est indéfini.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_lim2:Ce calcul décrit un taux global entre deux valeurs ; si vous avez plusieurs étapes, utilisez plutôt un outil de composition de pourcentages.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_lim3:Pour comparer deux taux (ex. 12 % vs 15 %), il faut plutôt un outil de points de pourcentage.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_applied_rate_lim4:Un résultat supérieur à 100 % est possible si la valeur finale est plus de deux fois la valeur initiale.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_applied_rate_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_applied_rate_q1:Quelle différence avec “pourcentage manquant” ?`,
          a: $localize`:@@ed_math_percentages_percentage_applied_rate_a1:Ici, on retrouve le taux de modification entre un “avant” et un “après”. Le “pourcentage manquant” vise plutôt à déterminer quel % représente une valeur par rapport à une base, sans notion d’évolution.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_applied_rate_q2:Est-ce la même chose qu’une variation en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percentage_applied_rate_a2:C’est proche : dans la plupart des cas, retrouver le pourcentage appliqué revient à calculer la variation entre une valeur initiale et une valeur finale.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_applied_rate_q3:Peut-on retrouver un taux de remise à partir du prix barré et du prix payé ?`,
          a: $localize`:@@ed_math_percentages_percentage_applied_rate_a3:Oui : c’est l’un des usages principaux, car le taux est souvent plus parlant que la différence en euros.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_applied_rate_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_applied_rate_tip:Si vous connaissez la valeur initiale et la valeur finale, vous n’avez pas besoin de deviner le taux : calculez-le, puis utilisez “Augmenter / diminuer de X%” pour simuler d’autres scénarios.`,
    },
  ],
};
