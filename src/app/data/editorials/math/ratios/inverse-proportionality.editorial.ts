import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_inverse_proportionality_title:À propos : Proportionnalité inverse`,
  lead: $localize`:@@ed_math_inverse_proportionality_lead:Identifier une proportionnalité inverse, comprendre la notion de produit constant et appliquer correctement la règle de trois inverse.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_inverse_proportionality_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_inverse_proportionality_uc1_title:Temps et vitesse`,
          text: $localize`:@@ed_math_inverse_proportionality_uc1_text:Calculer un temps de parcours quand la vitesse varie.`,
        },
        {
          title: $localize`:@@ed_math_inverse_proportionality_uc2_title:Partage de travail`,
          text: $localize`:@@ed_math_inverse_proportionality_uc2_text:Estimer la durée d’un travail selon le nombre de personnes.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_inverse_proportionality_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_inverse_proportionality_out1:La différence fondamentale entre proportionnalité directe et inverse.`,
        $localize`:@@ed_math_inverse_proportionality_out2:La méthode basée sur le produit constant pour résoudre les exercices.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_inverse_proportionality_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_inverse_proportionality_lim1:Ne pas confondre avec une simple diminution linéaire.` },
        { text: $localize`:@@ed_math_inverse_proportionality_lim2:Vérifier que le produit des deux grandeurs reste constant.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_inverse_proportionality_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_inverse_proportionality_tip:Si l’une des valeurs double et que l’autre est divisée par deux, tu es en proportionnalité inverse.`,
    },
  ],
};
