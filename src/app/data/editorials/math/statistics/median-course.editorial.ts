import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_median_course_title:À propos : Cours Médiane`,
  lead: $localize`:@@ed_math_statistics_median_course_lead:Ce cours complet sur la médiane (statistiques) vous apprend à calculer et interpréter la médiane dans tous les cas : série simple (n pair / impair), séries avec effectifs, médiane pondérée, et estimation sur données groupées (classes). L’objectif est de savoir quand la médiane est plus pertinente que la moyenne, notamment en présence de valeurs extrêmes.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_median_course_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_statistics_median_course_uc1_title:Réviser un chapitre de statistiques`,
          text: $localize`:@@ed_math_statistics_median_course_uc1_text:Comprendre la médiane, la méthode de calcul, et les erreurs fréquentes (tri, rang, n pair/impair).`,
        },
        {
          title: $localize`:@@ed_math_statistics_median_course_uc2_title:Choisir entre moyenne et médiane`,
          text: $localize`:@@ed_math_statistics_median_course_uc2_text:Savoir pourquoi la médiane est souvent meilleure quand la distribution est asymétrique ou qu’il y a des valeurs extrêmes (salaires, prix…).`,
        },
        {
          title: $localize`:@@ed_math_statistics_median_course_uc3_title:Traiter des tableaux d’effectifs`,
          text: $localize`:@@ed_math_statistics_median_course_uc3_text:Calculer une médiane avec effectifs via les cumulés, sans reconstruire toute la liste des valeurs.`,
        },
        {
          title: $localize`:@@ed_math_statistics_median_course_uc4_title:Comprendre la médiane pondérée`,
          text: $localize`:@@ed_math_statistics_median_course_uc4_text:Quand chaque valeur n’a pas le même “poids” (fréquences, importance), apprendre la logique des poids cumulés jusqu’à 50%.`,
        },
        {
          title: $localize`:@@ed_math_statistics_median_course_uc5_title:Estimer une médiane sur des classes`,
          text: $localize`:@@ed_math_statistics_median_course_uc5_text:Identifier la classe médiane (N/2) et utiliser l’interpolation quand on n’a que des intervalles (histogrammes).`,
        },
        {
          title: $localize`:@@ed_math_statistics_median_course_uc6_title:S’auto-évaluer avec des quiz`,
          text: $localize`:@@ed_math_statistics_median_course_uc6_text:Des QCM et exercices numériques pour vérifier que vous savez appliquer la bonne méthode selon le format des données.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_median_course_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_median_course_out1:Un cours structuré et progressif : définition, intuition (50% en dessous / 50% au-dessus), puis méthode de calcul avec tri obligatoire.`,
        $localize`:@@ed_math_statistics_median_course_out2:Des cas complets : n impair (valeur centrale), n pair (moyenne des deux valeurs centrales), avec exemples pas à pas et quiz corrigés.`,
        $localize`:@@ed_math_statistics_median_course_out3:Des extensions utiles : médiane pondérée (poids/effectifs) et médiane sur données groupées (classe médiane + interpolation).`,
        $localize`:@@ed_math_statistics_median_course_out4:Une partie interprétation : médiane comme 50e percentile (Q2), lien avec quartiles/IQR, et pourquoi la médiane est robuste face aux valeurs extrêmes.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_median_course_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_statistics_median_course_lim1:La médiane dépend du tri : sans série triée (ou sans effectifs cumulés), on risque une erreur immédiate.`,
        },
        {
          text: $localize`:@@ed_math_statistics_median_course_lim2:La médiane décrit une position, pas la dispersion : deux séries très différentes peuvent avoir la même médiane. Pour compléter, on regarde souvent quartiles et IQR.`,
        },
        {
          text: $localize`:@@ed_math_statistics_median_course_lim3:Sur données groupées en classes, la médiane est souvent une estimation : elle dépend de l’hypothèse de répartition uniforme dans la classe médiane.`,
        },
        {
          text: $localize`:@@ed_math_statistics_median_course_lim4:La médiane seule ne suffit pas toujours à décider : selon l’objectif, on peut préférer moyenne, médiane, ou un couple médiane + IQR (ou encore une moyenne robuste).`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_median_course_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_statistics_median_course_q1:Pourquoi faut-il trier la série pour calculer la médiane ?`,
          a: $localize`:@@ed_math_statistics_median_course_a1:Parce que la médiane est définie par la position “au milieu” dans la série ordonnée. Sans tri, on ne sait pas quelles valeurs sont centrales.`,
        },
        {
          q: $localize`:@@ed_math_statistics_median_course_q2:Quelle est la médiane quand il y a un nombre pair de valeurs ?`,
          a: $localize`:@@ed_math_statistics_median_course_a2:On prend la moyenne des deux valeurs centrales (après tri). La médiane peut alors être un nombre qui n’apparaît pas dans la série, et c’est normal.`,
        },
        {
          q: $localize`:@@ed_math_statistics_median_course_q3:Médiane ou moyenne : laquelle choisir ?`,
          a: $localize`:@@ed_math_statistics_median_course_a3:Si la série contient des valeurs extrêmes ou une forte asymétrie (salaires, prix), la médiane est souvent plus représentative. Si les données sont “homogènes”, la moyenne peut être plus informative.`,
        },
        {
          q: $localize`:@@ed_math_statistics_median_course_q4:C’est quoi la médiane sur un tableau d’effectifs ou des classes ?`,
          a: $localize`:@@ed_math_statistics_median_course_a4:Avec effectifs, on utilise les cumulés pour trouver où se situe 50% du total. Avec des classes, on repère la classe médiane via N/2 puis on peut estimer la médiane par interpolation dans cette classe.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_median_course_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_median_course_tip:Réflexe anti-erreur : après avoir trié, repérez d’abord les deux valeurs “centrales” (même si n est impair). Si n est pair, la médiane est entre les deux ; si n est impair, elle est exactement l’une d’elles.`,
    },
  ],
};
