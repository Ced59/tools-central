import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_mean_course_title:À propos : Cours Moyennes`,
  lead: $localize`:@@ed_math_statistics_mean_course_lead:Ce cours complet sur les moyennes (statistiques) vous aide à comprendre quand utiliser une moyenne arithmétique, pondérée, géométrique, harmonique, quadratique (RMS), mobile ou robuste. L’objectif n’est pas seulement de “calculer”, mais de choisir la bonne moyenne, éviter les pièges classiques et savoir interpréter un résultat.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_course_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc1_title:Réviser pour un contrôle ou un examen`,
          text: $localize`:@@ed_math_statistics_mean_course_uc1_text:Revoir définitions, formules, exemples et questions types (arithmétique, pondérée, géométrique…).`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc2_title:Choisir la bonne moyenne en situation réelle`,
          text: $localize`:@@ed_math_statistics_mean_course_uc2_text:Notes avec coefficients, prix moyen payé, vitesse moyenne, croissance composée : chaque contexte appelle une moyenne différente.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc3_title:Comprendre les pièges fréquents`,
          text: $localize`:@@ed_math_statistics_mean_course_uc3_text:Éviter la “moyenne des moyennes”, les erreurs sur les vitesses, ou la moyenne des pourcentages quand il y a composition.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc4_title:Interpréter une moyenne sans se faire piéger`,
          text: $localize`:@@ed_math_statistics_mean_course_uc4_text:Savoir quand une moyenne est trompeuse (valeurs extrêmes, distribution asymétrique) et quand préférer une approche plus robuste.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc5_title:Apprendre avec des exemples pas à pas`,
          text: $localize`:@@ed_math_statistics_mean_course_uc5_text:Chaque notion est expliquée avec des séries de valeurs, calculs détaillés, et formules (LaTeX) pour bien visualiser.`,
        },
        {
          title: $localize`:@@ed_math_statistics_mean_course_uc6_title:S’auto-évaluer avec des quiz`,
          text: $localize`:@@ed_math_statistics_mean_course_uc6_text:Des questions QCM et numériques pour vérifier que vous savez appliquer les bonnes méthodes au bon moment.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_mean_course_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_mean_course_out1:Un cours structuré par types de moyennes : arithmétique, pondérée, géométrique, harmonique, RMS (quadratique), robustes (tronquée / winsorisée), mobile, et moyenne avec effectifs ou données groupées.`,
        $localize`:@@ed_math_statistics_mean_course_out2:Des formules claires et des exemples guidés pour passer de la définition à l’application (notes, prix, vitesses, rendements, séries temporelles…).`,
        $localize`:@@ed_math_statistics_mean_course_out3:Une méthode de choix rapide : reconnaître le contexte (coefficients, ratios, composition, outliers, temps) pour sélectionner la moyenne pertinente.`,
        $localize`:@@ed_math_statistics_mean_course_out4:Des quiz et des explications corrigées pour ancrer les automatismes et repérer vos erreurs typiques.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_course_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_statistics_mean_course_lim1:Une moyenne ne résume pas toute une distribution : sans information sur la dispersion (écart-type, quartiles…), elle peut masquer des écarts importants.`,
        },
        {
          text: $localize`:@@ed_math_statistics_mean_course_lim2:Le bon type de moyenne dépend du contexte : addition de valeurs (arithmétique), coefficients/quantités (pondérée), composition (géométrique), ratios sur base identique (harmonique), amplitude/erreur (RMS).`,
        },
        {
          text: $localize`:@@ed_math_statistics_mean_course_lim3:Attention aux valeurs extrêmes : la moyenne arithmétique est sensible aux outliers, d’où l’intérêt des moyennes robustes (tronquée / winsorisée) ou de la médiane selon le besoin.`,
        },
        {
          text: $localize`:@@ed_math_statistics_mean_course_lim4:Les données groupées par classes donnent souvent une moyenne approximative (centres de classes) : plus les classes sont larges, plus l’approximation peut être grossière.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_mean_course_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_statistics_mean_course_q1:Ce cours remplace-t-il une calculatrice de moyennes ?`,
          a: $localize`:@@ed_math_statistics_mean_course_a1:Non : l’objectif principal est d’expliquer et de faire choisir la bonne moyenne. Pour “calculer vite”, utilisez ensuite les outils dédiés (moyenne arithmétique, pondérée, mobile…).`,
        },
        {
          q: $localize`:@@ed_math_statistics_mean_course_q2:Pourquoi ne pas prendre la moyenne arithmétique dans tous les cas ?`,
          a: $localize`:@@ed_math_statistics_mean_course_a2:Parce que certains phénomènes se composent (rendements), d’autres sont des ratios (vitesse), et d’autres ont des poids (coefficients). Dans ces cas, l’arithmétique peut être fausse ou trompeuse.`,
        },
        {
          q: $localize`:@@ed_math_statistics_mean_course_q3:Quelle moyenne pour des rendements successifs (+10% puis −10%) ?`,
          a: $localize`:@@ed_math_statistics_mean_course_a3:On raisonne en facteurs et on utilise la moyenne géométrique (effet composé). C’est précisément un piège expliqué dans le cours.`,
        },
        {
          q: $localize`:@@ed_math_statistics_mean_course_q4:Quelle moyenne pour une vitesse moyenne ?`,
          a: $localize`:@@ed_math_statistics_mean_course_a4:Sur distances égales, c’est la moyenne harmonique ; sur durées égales, c’est l’arithmétique. Le cours montre comment reconnaître le bon cas.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_mean_course_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_mean_course_tip:Avant de calculer, posez-vous une seule question : “Est-ce que j’additionne des valeurs, ou est-ce que je combine des poids / des ratios / des multiplicateurs ?” Cette étape évite la majorité des erreurs de moyenne.`,
    },
  ],
};
