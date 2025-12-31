import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_reverse_title:À propos : Pourcentage inverse`,
  lead: $localize`:@@ed_math_percentages_percentage_reverse_lead:Ce calculateur permet de retrouver une valeur initiale avant l’application d’un pourcentage, par exemple pour connaître le prix d’origine avant une remise, une augmentation ou une taxe.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_reverse_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_reverse_uc1_title:Retrouver un prix avant remise`,
          text: $localize`:@@ed_math_percentages_percentage_reverse_uc1_text:Un produit coûte 80 € après une remise de 20 %. Ce calcul permet de retrouver son prix initial avant réduction.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_reverse_uc2_title:Annuler une augmentation ou une taxe`,
          text: $localize`:@@ed_math_percentages_percentage_reverse_uc2_text:Vous connaissez un montant TTC ou après augmentation et souhaitez connaître la valeur d’origine avant application du pourcentage.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_reverse_uc3_title:Comprendre un calcul “à l’envers”`,
          text: $localize`:@@ed_math_percentages_percentage_reverse_uc3_text:Utile en mathématiques, en gestion ou en comptabilité pour résoudre un problème où la valeur finale est connue mais pas la base.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_reverse_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_reverse_out1:La valeur de départ avant l’application du pourcentage, calculée de façon exacte à partir du montant final et du taux.`,
        $localize`:@@ed_math_percentages_percentage_reverse_out2:Un résultat immédiatement exploitable pour analyser un prix réel, vérifier une facture ou résoudre un exercice.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_reverse_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_reverse_lim1:Le pourcentage ne doit pas être égal à 100 %, sinon la valeur d’origine est mathématiquement impossible à déterminer.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_reverse_lim2:Ce calcul suppose un pourcentage appliqué une seule fois, sans cumul ni variations successives.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_reverse_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_reverse_q1:Quelle est la différence avec un calcul de pourcentage classique ?`,
          a: $localize`:@@ed_math_percentages_percentage_reverse_a1:Ici, on part du résultat final pour retrouver la valeur initiale. Un calcul classique applique un pourcentage à une valeur déjà connue.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_reverse_q2:Puis-je l’utiliser pour une TVA ou une remise commerciale ?`,
          a: $localize`:@@ed_math_percentages_percentage_reverse_a2:Oui, c’est précisément l’un des usages principaux pour retrouver un montant hors taxe ou avant réduction.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_reverse_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_reverse_tip:Pour vérifier un calcul de remise, refaites ensuite un calcul de pourcentage classique à partir du résultat obtenu : vous devez retrouver exactement le montant final.`,
    },
  ],
};
