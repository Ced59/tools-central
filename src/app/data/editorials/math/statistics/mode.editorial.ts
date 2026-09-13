import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_mode_title:À propos : Mode`,
  lead: $localize`:@@ed_math_statistics_mode_lead:Identifiez la ou les valeurs les plus fréquentes d’une série et leur nombre d’occurrences.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mode_usecases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        { title: $localize`:@@ed_math_statistics_mode_uc1_title:Tailles et références`, text: $localize`:@@ed_math_statistics_mode_uc1_text:Repérer la taille, la quantité ou la référence commandée le plus souvent.` },
        { title: $localize`:@@ed_math_statistics_mode_uc2_title:Résultats d’enquête`, text: $localize`:@@ed_math_statistics_mode_uc2_text:Trouver la réponse numérique la plus représentée dans un relevé.` },
        { title: $localize`:@@ed_math_statistics_mode_uc3_title:Détection de répétitions`, text: $localize`:@@ed_math_statistics_mode_uc3_text:Voir immédiatement si plusieurs valeurs partagent la fréquence maximale.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_mode_output:Ce que vous obtenez`,
      icon: 'tc-icon tc-icon-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_mode_out1:La fréquence de chaque valeur et la liste de celles qui atteignent le maximum.`,
        $localize`:@@ed_math_statistics_mode_out2:Une série peut être unimodale, multimodale ou ne pas avoir de mode utile si toutes les valeurs apparaissent autant de fois.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mode_limits:Limites et points d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_mode_lim1:Le mode ne décrit ni le centre numérique ni la dispersion ; il indique seulement ce qui se répète le plus.` },
        { text: $localize`:@@ed_math_statistics_mode_lim2:Avec des nombres décimaux issus de mesures, des écarts minuscules peuvent empêcher des valeurs proches d’être regroupées.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_mode_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        { q: $localize`:@@ed_math_statistics_mode_q1:Une série peut-elle avoir plusieurs modes ?`, a: $localize`:@@ed_math_statistics_mode_a1:Oui. Toutes les valeurs ayant la fréquence maximale sont des modes.` },
        { q: $localize`:@@ed_math_statistics_mode_q2:Le mode est-il forcément proche de la moyenne ?`, a: $localize`:@@ed_math_statistics_mode_a2:Non. Fréquence et moyenne mesurent deux aspects différents, surtout dans une série irrégulière ou asymétrique.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_mode_tip_title:Astuce`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_mode_tip:Pour des mesures continues, arrondissez d’abord selon une précision justifiée ou regroupez les valeurs en classes avant de chercher un mode.`,
    },
  ],
};
