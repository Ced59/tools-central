import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_proportional_share_title:À propos : Part proportionnelle`,
  lead: $localize`:@@ed_math_proportional_share_lead:Calculer une part proportionnelle dans une répartition totale selon des poids ou des ratios donnés.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_proportional_share_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_proportional_share_uc1_title:Répartition d’un total`,
          text: $localize`:@@ed_math_proportional_share_uc1_text:Partager une somme d’argent, un temps ou une quantité selon des proportions.`,
        },
        {
          title: $localize`:@@ed_math_proportional_share_uc2_title:Pourcentages`,
          text: $localize`:@@ed_math_proportional_share_uc2_text:Calculer une part à partir d’un pourcentage du total.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_proportional_share_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_proportional_share_out1:La méthode générale pour calculer une part proportionnelle.`,
        $localize`:@@ed_math_proportional_share_out2:Le lien entre ratios, fractions et pourcentages.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_proportional_share_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_proportional_share_lim1:La somme des parts doit correspondre exactement au total.` },
        { text: $localize`:@@ed_math_proportional_share_lim2:Attention aux arrondis dans les répartitions réelles.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_proportional_share_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_proportional_share_tip:Vérifie toujours que la somme des parts reconstitue bien le total initial.`,
    },
  ],
};
