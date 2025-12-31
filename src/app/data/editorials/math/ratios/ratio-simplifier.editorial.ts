import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratio_simplifier_title:À propos : Simplifier un ratio`,
  lead: $localize`:@@ed_math_ratio_simplifier_lead:Réduire un ratio à sa forme la plus simple pour faciliter les comparaisons, les calculs et l’interprétation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_simplifier_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratio_simplifier_uc1_title:Comparaison de proportions`,
          text: $localize`:@@ed_math_ratio_simplifier_uc1_text:Comparer des mélanges, recettes ou répartitions.`,
        },
        {
          title: $localize`:@@ed_math_ratio_simplifier_uc2_title:Lecture de données`,
          text: $localize`:@@ed_math_ratio_simplifier_uc2_text:Rendre un ratio plus lisible dans un tableau ou un graphique.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratio_simplifier_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratio_simplifier_out1:La méthode pour diviser chaque terme par le plus grand diviseur commun.`,
        $localize`:@@ed_math_ratio_simplifier_out2:Un ratio équivalent mais plus simple à interpréter.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_simplifier_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_ratio_simplifier_lim1:Simplifier ne change pas la proportion, seulement son écriture.` },
        { text: $localize`:@@ed_math_ratio_simplifier_lim2:Attention aux ratios contenant des unités différentes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratio_simplifier_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratio_simplifier_tip:Commence toujours par chercher un facteur commun simple (2, 5 ou 10).`,
    },
  ],
};
