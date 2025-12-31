import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_proportion_fraction_title:À propos : a / b = c / d`,
  lead: $localize`:@@ed_math_proportion_fraction_lead:Comprendre l’égalité de deux rapports et savoir l’utiliser pour résoudre des problèmes de proportionnalité.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_proportion_fraction_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_proportion_fraction_uc1_title:Produits en croix`,
          text: $localize`:@@ed_math_proportion_fraction_uc1_text:Résoudre une équation de proportion avec une valeur manquante.`,
        },
        {
          title: $localize`:@@ed_math_proportion_fraction_uc2_title:Ratios équivalents`,
          text: $localize`:@@ed_math_proportion_fraction_uc2_text:Vérifier si deux rapports représentent la même proportion.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_proportion_fraction_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_proportion_fraction_out1:Le lien entre fractions égales et proportionnalité.`,
        $localize`:@@ed_math_proportion_fraction_out2:Pourquoi le produit en croix fonctionne.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_proportion_fraction_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_proportion_fraction_lim1:Les fractions doivent représenter des grandeurs comparables.` },
        { text: $localize`:@@ed_math_proportion_fraction_lim2:Attention aux divisions par zéro.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_proportion_fraction_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_proportion_fraction_tip:Si a×d = b×c, alors les deux rapports sont équivalents.`,
    },
  ],
};
