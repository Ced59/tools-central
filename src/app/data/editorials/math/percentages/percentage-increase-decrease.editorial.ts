import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = false;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_increase_decrease_title:À propos : Augmenter / diminuer de X%`,
  lead: $localize`:@@ed_math_percentages_percentage_increase_decrease_lead:TODO: Décrire l’objectif exact de cet outil (intention unique, pas une paraphrase d’un autre).`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc1_title:TODO`, text: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc1_text:TODO: Exemple concret 1` },
        { title: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc2_title:TODO`, text: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc2_text:TODO: Exemple concret 2` },
        { title: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc3_title:TODO`, text: $localize`:@@ed_math_percentages_percentage_increase_decrease_uc3_text:TODO: Exemple concret 3` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_increase_decrease_out1:TODO: Décrire précisément la sortie.`,
        $localize`:@@ed_math_percentages_percentage_increase_decrease_out2:TODO: À quoi sert cette sortie.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_percentages_percentage_increase_decrease_lim1:TODO.` },
        { text: $localize`:@@ed_math_percentages_percentage_increase_decrease_lim2:TODO.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_math_percentages_percentage_increase_decrease_q1:TODO`, a: $localize`:@@ed_math_percentages_percentage_increase_decrease_a1:TODO` },
        { q: $localize`:@@ed_math_percentages_percentage_increase_decrease_q2:TODO`, a: $localize`:@@ed_math_percentages_percentage_increase_decrease_a2:TODO` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_increase_decrease_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_increase_decrease_tip:TODO: Une astuce unique liée à l’intention de l’outil.`,
    },
  ],
};
