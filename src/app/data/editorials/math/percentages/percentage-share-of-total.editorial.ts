import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_share_of_total_title:Proportion : calculer la part de chaque élément dans un total`,
  lead: $localize`:@@ed_math_percentages_percentage_share_of_total_lead:Une proportion (ou “part du total”) sert à convertir une répartition en pourcentages : chaque valeur est rapportée à la somme globale. C’est l’outil idéal pour analyser une composition (budget, catégories, sources, produits) et communiquer une répartition clairement.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_share_of_total_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_share_of_total_uc1_title:Répartition d’un budget`,
          text: $localize`:@@ed_math_percentages_percentage_share_of_total_uc1_text:Transformer des montants (loyer, alimentation, transport, loisirs) en parts (%) pour visualiser les postes dominants.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_share_of_total_uc2_title:Statistiques par catégories`,
          text: $localize`:@@ed_math_percentages_percentage_share_of_total_uc2_text:Exprimer des volumes par catégorie (ventes, visites, tickets, incidents) sous forme de parts comparables.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_share_of_total_uc3_title:Analyse de mix (produits / canaux)`,
          text: $localize`:@@ed_math_percentages_percentage_share_of_total_uc3_text:Mesurer le poids relatif de chaque composant dans un ensemble (mix de ventes, sources de trafic, gammes).`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_share_of_total_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_share_of_total_out1:L’outil calcule le total (somme des valeurs) puis la part de chaque élément : (valeur ÷ total) × 100.`,
        $localize`:@@ed_math_percentages_percentage_share_of_total_out2:Vous obtenez une répartition en pourcentages, utile pour classer les éléments, repérer les plus importants et vérifier la cohérence globale.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_share_of_total_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_share_of_total_lim1:Si le total vaut 0 (toutes les valeurs à 0), les parts ne sont pas définies : il n’y a pas de base pour calculer une proportion.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_share_of_total_lim2:Avec des arrondis, la somme des parts peut faire 99,99% ou 100,01% : ce n’est pas une erreur, c’est l’effet du formatage.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_share_of_total_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_share_of_total_q1:Pourquoi mes parts ne font pas exactement 100% ?`,
          a: $localize`:@@ed_math_percentages_percentage_share_of_total_a1:C’est généralement dû aux arrondis. En interne, les parts sont exactes, mais l’affichage arrondi peut créer un léger écart.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_share_of_total_q2:Quelle différence avec “X est quel % de Y” ?`,
          a: $localize`:@@ed_math_percentages_percentage_share_of_total_a2:“X est quel % de Y” traite un ratio simple entre deux valeurs. Ici, on calcule une répartition : plusieurs éléments sont comparés à un total commun (souvent la somme des éléments).`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_share_of_total_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_share_of_total_tip:Pour une répartition “propre” à afficher, garde 1 à 2 décimales maximum. Si tu veux absolument totaliser 100%, calcule une “part restante” (100 − somme des parts affichées) sur la dernière catégorie.`,
    },
  ],
};
