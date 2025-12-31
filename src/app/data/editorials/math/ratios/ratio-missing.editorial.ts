import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratio_missing_title:À propos : Valeur manquante dans un ratio`,
  lead: $localize`:@@ed_math_ratio_missing_lead:Calculer une valeur inconnue dans un ratio en conservant la proportion.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_missing_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratio_missing_uc1_title:Exercices scolaires`,
          text: $localize`:@@ed_math_ratio_missing_uc1_text:Résoudre des problèmes avec une donnée absente.`,
        },
        {
          title: $localize`:@@ed_math_ratio_missing_uc2_title:Situations concrètes`,
          text: $localize`:@@ed_math_ratio_missing_uc2_text:Adapter des recettes, des mélanges ou des dosages.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratio_missing_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratio_missing_out1:La méthode générale pour isoler une valeur inconnue.`,
        $localize`:@@ed_math_ratio_missing_out2:Un calcul fiable basé sur la proportionnalité.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_missing_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_ratio_missing_lim1:La relation doit être proportionnelle.` },
        { text: $localize`:@@ed_math_ratio_missing_lim2:Les unités doivent être cohérentes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratio_missing_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratio_missing_tip:Utilise le produit en croix pour isoler rapidement l’inconnue.`,
    },
  ],
};
