import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_rule_of_three_proportion_table_complete_title:À propos : Compléter un tableau de proportionnalité`,
  lead: $localize`:@@ed_math_rule_of_three_proportion_table_complete_lead:Cet outil permet de compléter automatiquement un tableau de proportionnalité à partir du coefficient ou des valeurs connues.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_ptcomp_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_ptcomp_uc1_title:Devoirs`, text: $localize`:@@ed_ptcomp_uc1_text:Compléter un tableau partiellement rempli.` },
        { title: $localize`:@@ed_ptcomp_uc2_title:Contrôle`, text: $localize`:@@ed_ptcomp_uc2_text:Vérifier rapidement des résultats.` },
        { title: $localize`:@@ed_ptcomp_uc3_title:Vie quotidienne`, text: $localize`:@@ed_ptcomp_uc3_text:Calculer des prix, quantités ou durées proportionnelles.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_ptcomp_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_ptcomp_out1:Les valeurs manquantes du tableau.`,
        $localize`:@@ed_ptcomp_out2:Le coefficient de proportionnalité utilisé.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_ptcomp_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_ptcomp_lim1:Le tableau doit être proportionnel.` },
        { text: $localize`:@@ed_ptcomp_lim2:Les unités doivent être cohérentes.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_ptcomp_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_ptcomp_q1:Que faire si le tableau n’est pas proportionnel ?`, a: $localize`:@@ed_ptcomp_a1:On ne peut pas le compléter avec une règle de trois.` },
        { q: $localize`:@@ed_ptcomp_q2:Comment trouver le coefficient ?`, a: $localize`:@@ed_ptcomp_a2:En divisant une valeur de la deuxième ligne par celle de la première.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_ptcomp_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_ptcomp_tip:Si une colonne est complète, elle suffit pour déterminer tout le tableau.`,
    },
  ],
};
