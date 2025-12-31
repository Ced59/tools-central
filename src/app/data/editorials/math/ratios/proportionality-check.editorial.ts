import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_proportionality_check_title:À propos : Vérifier une proportionnalité`,
  lead: $localize`:@@ed_math_proportionality_check_lead:Apprendre à déterminer rapidement si deux séries de valeurs sont proportionnelles ou non, à l’aide de tests simples et fiables.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_proportionality_check_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_proportionality_check_uc1_title:Exercices scolaires`,
          text: $localize`:@@ed_math_proportionality_check_uc1_text:Vérifier si un tableau correspond bien à une situation de proportionnalité.`,
        },
        {
          title: $localize`:@@ed_math_proportionality_check_uc2_title:Données réelles`,
          text: $localize`:@@ed_math_proportionality_check_uc2_text:Analyser des données (prix, distances, durées) avant d’appliquer une règle de trois.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_proportionality_check_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_proportionality_check_out1:Les critères indispensables pour reconnaître une proportionnalité.`,
        $localize`:@@ed_math_proportionality_check_out2:Les méthodes de vérification par rapport constant ou produit constant.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_proportionality_check_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_proportionality_check_lim1:Une relation linéaire n’est pas forcément proportionnelle.` },
        { text: $localize`:@@ed_math_proportionality_check_lim2:Les erreurs viennent souvent d’unités non homogènes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_proportionality_check_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_proportionality_check_tip:Teste toujours avec deux paires de valeurs différentes pour confirmer la proportionnalité.`,
    },
  ],
};
