import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_median_title:À propos : Médiane`,
  lead: $localize`:@@ed_math_statistics_median_lead:Trouvez la valeur qui partage une série ordonnée en deux groupes de même effectif, sans laisser les valeurs extrêmes dominer le résultat.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_median_usecases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        { title: $localize`:@@ed_math_statistics_median_uc1_title:Revenus et prix`, text: $localize`:@@ed_math_statistics_median_uc1_text:Décrire une distribution asymétrique où quelques montants très élevés fausseraient la moyenne.` },
        { title: $localize`:@@ed_math_statistics_median_uc2_title:Temps de réponse`, text: $localize`:@@ed_math_statistics_median_uc2_text:Repérer la performance centrale d’un service malgré quelques mesures exceptionnellement lentes.` },
        { title: $localize`:@@ed_math_statistics_median_uc3_title:Contrôle de données`, text: $localize`:@@ed_math_statistics_median_uc3_text:Vérifier rapidement le centre d’une série après l’avoir triée.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_median_output:Ce que vous obtenez`,
      icon: 'tc-icon tc-icon-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_median_out1:La série triée, sa taille et sa médiane. Pour un effectif impair, il s’agit de la valeur centrale.`,
        $localize`:@@ed_math_statistics_median_out2:Pour un effectif pair, le résultat est la moyenne des deux valeurs centrales ; par exemple, 2, 5, 8 et 20 donnent 6,5.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_median_limits:Limites et points d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_median_lim1:La médiane décrit la position centrale, mais pas l’écart entre les valeurs ni la forme complète de la distribution.` },
        { text: $localize`:@@ed_math_statistics_median_lim2:Les valeurs doivent être comparables et exprimées dans la même unité ; les catégories sans ordre naturel n’ont pas de médiane.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_median_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        { q: $localize`:@@ed_math_statistics_median_q1:Faut-il trier la série avant de chercher la médiane ?`, a: $localize`:@@ed_math_statistics_median_a1:Oui. La médiane dépend de la position des valeurs dans l’ordre croissant, pas de leur ordre de saisie.` },
        { q: $localize`:@@ed_math_statistics_median_q2:Pourquoi moyenne et médiane peuvent-elles être différentes ?`, a: $localize`:@@ed_math_statistics_median_a2:La moyenne utilise la valeur de chaque observation, tandis que la médiane utilise surtout leur rang. Les extrêmes influencent donc davantage la moyenne.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_median_tip_title:Astuce`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_median_tip:Pour une série avec des valeurs atypiques, comparez médiane et moyenne : un écart important signale souvent une distribution asymétrique.`,
    },
  ],
};
