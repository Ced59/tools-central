import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratio_calculator_title:À propos : Calculer un ratio`,
  lead: $localize`:@@ed_math_ratio_calculator_lead:Calculer et interpréter un ratio pour comparer deux grandeurs de manière simple et efficace.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_calculator_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratio_calculator_uc1_title:Comparaisons`,
          text: $localize`:@@ed_math_ratio_calculator_uc1_text:Comparer deux quantités (population, effectifs, concentrations).`,
        },
        {
          title: $localize`:@@ed_math_ratio_calculator_uc2_title:Données statistiques`,
          text: $localize`:@@ed_math_ratio_calculator_uc2_text:Exprimer une relation entre deux grandeurs sans dépendre de leur unité.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratio_calculator_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratio_calculator_out1:Le calcul exact du ratio entre deux valeurs.`,
        $localize`:@@ed_math_ratio_calculator_out2:Une interprétation claire du résultat obtenu.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_calculator_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_ratio_calculator_lim1:Un ratio n’indique pas une quantité absolue.` },
        { text: $localize`:@@ed_math_ratio_calculator_lim2:Attention aux divisions par zéro.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratio_calculator_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratio_calculator_tip:Pense à simplifier le ratio pour le rendre plus lisible.`,
    },
  ],
};
