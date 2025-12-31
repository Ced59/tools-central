import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_rule_of_three_proportion_table_check_title:À propos : Vérifier un tableau de proportionnalité`,
  lead: $localize`:@@ed_math_rule_of_three_proportion_table_check_lead:Cet outil permet de vérifier rapidement si un tableau correspond à une situation de proportionnalité, en contrôlant l’existence d’un coefficient constant entre les lignes.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_rule_of_three_proportion_table_check_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_ptc_uc1_title:Exercices scolaires`, text: $localize`:@@ed_ptc_uc1_text:Vérifier si un tableau donné dans un exercice correspond bien à une situation de proportionnalité.` },
        { title: $localize`:@@ed_ptc_uc2_title:Contrôle rapide`, text: $localize`:@@ed_ptc_uc2_text:Valider un tableau rempli manuellement avant de poursuivre un calcul.` },
        { title: $localize`:@@ed_ptc_uc3_title:Données réelles`, text: $localize`:@@ed_ptc_uc3_text:Tester si deux grandeurs évoluent proportionnellement (prix, quantités, distances…).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_ptc_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_ptc_out1:L’indication claire si le tableau est proportionnel ou non.`,
        $localize`:@@ed_ptc_out2:Le coefficient de proportionnalité lorsqu’il existe.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_ptc_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_ptc_lim1:Les valeurs doivent être numériques et comparables.` },
        { text: $localize`:@@ed_ptc_lim2:Une erreur dans une seule colonne suffit à casser la proportionnalité.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_ptc_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_ptc_q1:Comment savoir si un tableau est proportionnel ?`, a: $localize`:@@ed_ptc_a1:Si le rapport entre les deux lignes est constant pour toutes les colonnes.` },
        { q: $localize`:@@ed_ptc_q2:Et si une valeur ne respecte pas le coefficient ?`, a: $localize`:@@ed_ptc_a2:Alors le tableau n’est pas proportionnel.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_ptc_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_ptc_tip:Commence par diviser chaque valeur de la deuxième ligne par la première : le résultat doit être constant.`,
    },
  ],
};
