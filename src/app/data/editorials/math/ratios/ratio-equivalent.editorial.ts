import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratio_equivalent_title:À propos : Ratios équivalents`,
  lead: $localize`:@@ed_math_ratio_equivalent_lead:Identifier si deux ratios représentent la même proportion malgré des écritures différentes.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_equivalent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratio_equivalent_uc1_title:Simplification`,
          text: $localize`:@@ed_math_ratio_equivalent_uc1_text:Reconnaître des ratios identiques sous des formes différentes.`,
        },
        {
          title: $localize`:@@ed_math_ratio_equivalent_uc2_title:Vérification`,
          text: $localize`:@@ed_math_ratio_equivalent_uc2_text:Vérifier qu’une transformation conserve bien la proportion.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratio_equivalent_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratio_equivalent_out1:La définition précise de ratios équivalents.`,
        $localize`:@@ed_math_ratio_equivalent_out2:Les techniques pour les reconnaître rapidement.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratio_equivalent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_ratio_equivalent_lim1:Multiplier ou diviser par zéro invalide le ratio.` },
        { text: $localize`:@@ed_math_ratio_equivalent_lim2:Les deux termes doivent être transformés de la même manière.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratio_equivalent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratio_equivalent_tip:Si a×d = b×c, alors les ratios a/b et c/d sont équivalents.`,
    },
  ],
};
