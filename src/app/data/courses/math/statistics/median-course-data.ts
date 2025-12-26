import { CourseData } from "../../course.types";

export const medianCourseData: CourseData = {
  heroTitle: $localize`:@@median_course_title:Cours complet sur la médiane (statistiques)`,
  heroSubtitle: $localize`:@@median_course_subtitle:Définition, méthode de calcul (n pair / impair), médiane pondérée, données groupées (classes), robustesse aux valeurs extrêmes, interprétation, pièges et quiz.`,
  backLink: '/categories/math/statistics',

  lessons: [
    // =========================================================
    // 1) INTRO : pourquoi la médiane ?
    // =========================================================
    {
      id: 'intro',
      title: $localize`:@@median_l1_title:1) Comprendre la médiane`,
      subtitle: $localize`:@@median_l1_sub:La valeur “au milieu” : 50% des données en dessous, 50% au-dessus.`,
      tags: [
        $localize`:@@median_tag_definition:définition`,
        $localize`:@@median_tag_robust:robuste`,
        $localize`:@@median_tag_center:tendance centrale`,
      ],
      sections: [
        {
          title: $localize`:@@median_l1_s1_title:À quoi sert la médiane ?`,
          bullets: [
            $localize`:@@median_l1_s1_b1:La médiane résume une série par une valeur centrale : elle partage les données en deux moitiés.`,
            $localize`:@@median_l1_s1_b2:Elle est particulièrement utile quand la moyenne est trompeuse (distribution asymétrique, valeurs extrêmes).`,
            $localize`:@@median_l1_s1_b3:Dans la vie réelle, on l’utilise souvent pour des salaires, prix immobiliers, revenus, temps d’attente…`,
            $localize`:@@median_l1_s1_b4:Elle est dite “robuste” : quelques valeurs aberrantes modifient peu la médiane.`,
          ],
        },
        {
          title: $localize`:@@median_l1_s2_title:Intuition simple`,
          bullets: [
            $localize`:@@median_l1_s2_b1:On trie les valeurs : la médiane est celle du milieu (ou la moyenne des deux du milieu).`,
            $localize`:@@median_l1_s2_b2:Le but n’est pas de “faire une moyenne”, mais de trouver une position centrale (le 50e percentile).`,
            $localize`:@@median_l1_s2_b3:La médiane dépend de l’ordre, pas des distances entre valeurs.`,
          ],
        },
        {
          title: $localize`:@@median_l1_s3_title:Médiane vs moyenne : idée clé`,
          bullets: [
            $localize`:@@median_l1_s3_b1:La moyenne utilise toutes les valeurs et leurs écarts : elle peut être tirée vers le haut/bas par des extrêmes.`,
            $localize`:@@median_l1_s3_b2:La médiane regarde uniquement “qui est au milieu” après tri : elle résiste mieux aux extrêmes.`,
            $localize`:@@median_l1_s3_b3:Sur une distribution symétrique, moyenne et médiane sont souvent proches.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_1',
          kind: 'mcq',
          prompt: $localize`:@@median_l1_q1:La médiane d’une série est :`,
          choices: [
            { label: $localize`:@@median_l1_q1_a:la valeur la plus fréquente`, value: 'a' },
            { label: $localize`:@@median_l1_q1_b:une valeur centrale qui coupe la série en deux`, value: 'b' },
            { label: $localize`:@@median_l1_q1_c:la somme des valeurs divisée par n`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l1_q1_exp:La médiane sépare la série triée en deux moitiés : 50% en dessous, 50% au-dessus.`,
        },
      ],
    },

    // =========================================================
    // 2) CALCUL : n impair / n pair
    // =========================================================
    {
      id: 'compute',
      title: $localize`:@@median_l2_title:2) Calculer la médiane (n impair / n pair)`,
      subtitle: $localize`:@@median_l2_sub:Tri obligatoire, puis règle du milieu : simple, mais attention aux pièges.`,
      tags: [
        $localize`:@@median_tag_method:métode`,
        $localize`:@@median_tag_sort:tri`,
        $localize`:@@median_tag_even_odd:pair/impair`,
      ],
      sections: [
        {
          title: $localize`:@@median_l2_s1_title:Étape 1 : trier la série`,
          bullets: [
            $localize`:@@median_l2_s1_b1:On trie les valeurs dans l’ordre croissant (ou décroissant, c’est pareil).`,
            $localize`:@@median_l2_s1_b2:Sans tri, on ne peut pas définir correctement la médiane.`,
            $localize`:@@median_l2_s1_b3:En cas d’égalité (valeurs répétées), on les garde : ça fait partie des données.`,
          ],
        },
        {
          title: $localize`:@@median_l2_s2_title:Cas 1 : n impair (une vraie valeur “au milieu”)`,
          bullets: [
            $localize`:@@median_l2_s2_b1:Si n est impair, la médiane est la valeur de rang (n+1)/2 dans la liste triée.`,
            $localize`:@@median_l2_s2_b2:Exemple : n=5 → rang (5+1)/2=3 : c’est la 3e valeur.`,
          ],
          examples: [
            {
              label: $localize`:@@median_l2_s2_ex1:Exemple`,
              // juste des ensembles / flèches / égalités (aucun \text)
              latex: String.raw`\{2,7,4,9,3\}\to\{2,3,4,7,9\}\Rightarrow m=4`,
            },
          ],
        },
        {
          title: $localize`:@@median_l2_s3_title:Cas 2 : n pair (moyenne des deux valeurs centrales)`,
          bullets: [
            $localize`:@@median_l2_s3_b1:Si n est pair, il n’y a pas une seule valeur centrale : il y en a deux.`,
            $localize`:@@median_l2_s3_b2:On prend la moyenne arithmétique des deux valeurs centrales (rang n/2 et n/2+1).`,
            $localize`:@@median_l2_s3_b3:La médiane peut alors être un nombre qui n’apparaît pas dans la série (ce n’est pas un problème).`,
          ],
          examples: [
            {
              label: $localize`:@@median_l2_s3_ex1:Exemple`,
              latex: String.raw`\{1,2,10,12\}\Rightarrow m=\frac{2+10}{2}=6`,
            },
          ],
        },
        {
          title: $localize`:@@median_l2_s4_title:Formules de rang (mémo rapide)`,
          bullets: [
            $localize`:@@median_l2_s4_b1:n impair : médiane = valeur de rang (n+1)/2 (dans la série triée).`,
            $localize`:@@median_l2_s4_b2:n pair : médiane = moyenne des rangs n/2 et n/2+1.`,
          ],
          // math-only, sans mots: on encode pair/impair via n=2k ou n=2k+1
          formulaLatex: String.raw`m=
\begin{cases}
x_{(\frac{n+1}{2})} & n=2k+1\\[4pt]
\frac{x_{(k)}+x_{(k+1)}}{2} & n=2k
\end{cases}`,
        },
        {
          title: $localize`:@@median_l2_s5_title:Pièges fréquents`,
          bullets: [
            $localize`:@@median_l2_s5_b1:Oublier de trier : c’est l’erreur n°1.`,
            $localize`:@@median_l2_s5_b2:Confondre rang et valeur : la médiane est une valeur, pas une position.`,
            $localize`:@@median_l2_s5_b3:En n pair, ne pas prendre “une des deux valeurs du milieu” : on prend leur moyenne.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_2',
          kind: 'number',
          prompt: $localize`:@@median_l2_q1:Médiane de 9 ; 1 ; 4 ; 6 ; 7 ?`,
          correctNumber: 6,
          precision: 0,
          explanation: $localize`:@@median_l2_q1_exp:Tri : 1,4,6,7,9 → n=5 (impair) → 3e valeur = 6.`,
        },
        {
          id: 'q_median_3',
          kind: 'number',
          prompt: $localize`:@@median_l2_q2:Médiane de 2 ; 10 ; 4 ; 8 ?`,
          correctNumber: 6,
          precision: 0,
          explanation: $localize`:@@median_l2_q2_exp:Tri : 2,4,8,10 → n=4 (pair) → (4+8)/2 = 6.`,
        },
      ],
    },

    // =========================================================
    // 3) ROBUSTESSE : valeurs extrêmes / asymétrie
    // =========================================================
    {
      id: 'robustness',
      title: $localize`:@@median_l3_title:3) Médiane et valeurs extrêmes : pourquoi elle est robuste`,
      subtitle: $localize`:@@median_l3_sub:Une valeur aberrante peut exploser la moyenne, mais change peu la médiane.`,
      tags: [
        $localize`:@@median_tag_outliers:valeurs extrêmes`,
        $localize`:@@median_tag_skew:asymétrie`,
        $localize`:@@median_tag_robust:robustesse`,
      ],
      sections: [
        {
          title: $localize`:@@median_l3_s1_title:Exemple “moyenne trompeuse”`,
          bullets: [
            $localize`:@@median_l3_s1_b1:Série A : 10, 10, 10, 10, 10 → moyenne=10, médiane=10.`,
            $localize`:@@median_l3_s1_b2:Série B : 10, 10, 10, 10, 1000 → moyenne monte fortement, médiane reste 10.`,
            $localize`:@@median_l3_s1_b3:Conclusion : un seul outlier peut déplacer la moyenne, mais la médiane résiste.`,
          ],
          examples: [
            {
              label: $localize`:@@median_l3_s1_ex1:Illustration`,
              // math-only
              latex: String.raw`\{10,10,10,10,1000\}\Rightarrow m=10`,
            },
          ],
        },
        {
          title: $localize`:@@median_l3_s2_title:Interprétation en percentiles`,
          bullets: [
            $localize`:@@median_l3_s2_b1:La médiane correspond au 50e percentile (aussi appelé “2e quartile” ou Q2).`,
            $localize`:@@median_l3_s2_b2:Dire “la médiane vaut m” signifie qu’au moins 50% des valeurs sont ≤ m et au moins 50% sont ≥ m.`,
            $localize`:@@median_l3_s2_b3:C’est une information de position, pas de dispersion.`,
          ],
        },
        {
          title: $localize`:@@median_l3_s3_title:Quand la médiane est préférable`,
          bullets: [
            $localize`:@@median_l3_s3_b1:Quand la distribution est asymétrique (revenus, prix), car la moyenne est tirée vers la “queue”.`,
            $localize`:@@median_l3_s3_b2:Quand il y a des outliers (erreurs de mesure, cas exceptionnels).`,
            $localize`:@@median_l3_s3_b3:Quand on cherche une valeur “typique” pour une population (médiane des salaires).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_4',
          kind: 'mcq',
          prompt: $localize`:@@median_l3_q1:La médiane est dite “robuste” car :`,
          choices: [
            { label: $localize`:@@median_l3_q1_a:elle utilise la somme de toutes les valeurs`, value: 'a' },
            { label: $localize`:@@median_l3_q1_b:elle est peu influencée par quelques valeurs extrêmes`, value: 'b' },
            { label: $localize`:@@median_l3_q1_c:elle est toujours égale à la moyenne`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l3_q1_exp:Une poignée d’extrêmes change peu la position centrale (50e percentile), contrairement à la moyenne.`,
        },
      ],
    },

    // =========================================================
    // 4) MÉDIANE PONDÉRÉE
    // =========================================================
    {
      id: 'weighted-median',
      title: $localize`:@@median_l4_title:4) Médiane pondérée (weighted median)`,
      subtitle: $localize`:@@median_l4_sub:Quand les observations ont des poids : effectifs, importance, fréquence…`,
      tags: [
        $localize`:@@median_tag_weighted:pondérée`,
        $localize`:@@median_tag_frequency:fréquences`,
        $localize`:@@median_tag_practical:pratique`,
      ],
      sections: [
        {
          title: $localize`:@@median_l4_s1_title:Définition intuitive`,
          bullets: [
            $localize`:@@median_l4_s1_b1:On a des valeurs x_i et des poids w_i (effectifs, importance).`,
            $localize`:@@median_l4_s1_b2:La médiane pondérée est une valeur m telle que le poids cumulé en dessous de m est ≤ 50% et le poids cumulé au-dessus de m est ≤ 50%.`,
            $localize`:@@median_l4_s1_b3:Autrement dit, m coupe “la masse totale des poids” en deux.`,
          ],
        },
        {
          title: $localize`:@@median_l4_s2_title:Méthode de calcul (pas à pas)`,
          bullets: [
            $localize`:@@median_l4_s2_b1:1) Trier les valeurs x par ordre croissant.`,
            $localize`:@@median_l4_s2_b2:2) Calculer le total des poids W = somme(w_i).`,
            $localize`:@@median_l4_s2_b3:3) Faire la somme cumulée des poids en suivant l’ordre trié.`,
            $localize`:@@median_l4_s2_b4:4) La médiane pondérée est la première valeur pour laquelle le cumul atteint au moins W/2.`,
          ],
          // math-only (on évite \text{...})
          formulaLatex: String.raw`W=\sum_i w_i\quad;\quad
m=\min\left\{x_k:\sum_{i\le k} w_i\ge \frac{W}{2}\right\}`,
        },
        {
          title: $localize`:@@median_l4_s3_title:Exemple simple avec effectifs`,
          bullets: [
            $localize`:@@median_l4_s3_b1:Valeurs : 10 (poids 2), 12 (poids 5), 14 (poids 3).`,
            $localize`:@@median_l4_s3_b2:Poids total W = 2+5+3 = 10, donc W/2 = 5.`,
            $localize`:@@median_l4_s3_b3:Cumul : à 10 → 2 ; à 12 → 2+5=7 (on dépasse 5) : médiane pondérée = 12.`,
          ],
          examples: [
            {
              label: $localize`:@@median_l4_s3_ex1:Résultat`,
              // math-only
              latex: String.raw`W=10,\ \frac{W}{2}=5,\ \sum_{i\le k}w_i\ge 5\Rightarrow m=12`,
            },
          ],
        },
        {
          title: $localize`:@@median_l4_s4_title:Remarques importantes`,
          bullets: [
            $localize`:@@median_l4_s4_b1:La médiane pondérée est une valeur de la série (souvent), contrairement au cas n pair où la médiane peut être intermédiaire.`,
            $localize`:@@median_l4_s4_b2:Si les poids sont des pourcentages, W=100% (ou 1) : on cherche le point où le cumul atteint 50%.`,
            $localize`:@@median_l4_s4_b3:On peut l’utiliser pour des distributions discrètes (tableaux d’effectifs).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_5',
          kind: 'mcq',
          prompt: $localize`:@@median_l4_q1:Pour calculer une médiane pondérée, on utilise principalement :`,
          choices: [
            { label: $localize`:@@median_l4_q1_a:la somme des valeurs`, value: 'a' },
            { label: $localize`:@@median_l4_q1_b:les poids cumulés après tri`, value: 'b' },
            { label: $localize`:@@median_l4_q1_c:le maximum et le minimum`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l4_q1_exp:La médiane pondérée coupe la masse des poids en deux : tri + cumul des poids.`,
        },
      ],
    },

    // =========================================================
    // 5) DONNÉES GROUPÉES (classes)
    // =========================================================
    {
      id: 'grouped',
      title: $localize`:@@median_l5_title:5) Médiane avec données groupées (classes / intervalles)`,
      subtitle: $localize`:@@median_l5_sub:Quand on n’a pas les valeurs exactes mais des classes (histogramme) : on estime la médiane.`,
      tags: [
        $localize`:@@median_tag_grouped:classes`,
        $localize`:@@median_tag_histogram:histogramme`,
        $localize`:@@median_tag_estimation:estimation`,
      ],
      sections: [
        {
          title: $localize`:@@median_l5_s1_title:Pourquoi c’est différent ?`,
          bullets: [
            $localize`:@@median_l5_s1_b1:Avec des classes (ex : [0;10[, [10;20[…), on ne connaît pas chaque valeur exacte.`,
            $localize`:@@median_l5_s1_b2:On connaît seulement un effectif par intervalle.`,
            $localize`:@@median_l5_s1_b3:On peut alors estimer la médiane en trouvant la “classe médiane” (celle qui contient la 50e percentile).`,
          ],
        },
        {
          title: $localize`:@@median_l5_s2_title:Étapes (méthode standard)`,
          bullets: [
            $localize`:@@median_l5_s2_b1:1) Calculer l’effectif total N.`,
            $localize`:@@median_l5_s2_b2:2) Trouver N/2 (la position médiane).`,
            $localize`:@@median_l5_s2_b3:3) Calculer les effectifs cumulés par classe jusqu’à dépasser N/2 : la classe qui dépasse est la classe médiane.`,
            $localize`:@@median_l5_s2_b4:4) Estimer la médiane par interpolation linéaire dans cette classe (hypothèse de répartition uniforme dans la classe).`,
          ],
        },
        {
          title: $localize`:@@median_l5_s3_title:Formule d’estimation (interpolation)`,
          bullets: [
            $localize`:@@median_l5_s3_b1:Soit L la borne inférieure de la classe médiane, h la largeur de classe, f l’effectif de la classe médiane.`,
            $localize`:@@median_l5_s3_b2:Soit C l’effectif cumulé avant la classe médiane, et N l’effectif total.`,
            $localize`:@@median_l5_s3_b3:Alors la médiane estimée est :`,
          ],
          // déjà math-only
          formulaLatex: String.raw`m\approx L+\left(\frac{\frac{N}{2}-C}{f}\right)\,h`,
        },
        {
          title: $localize`:@@median_l5_s4_title:Interprétation de la formule`,
          bullets: [
            $localize`:@@median_l5_s4_b1:On se place à l’intérieur de la classe médiane selon “combien il manque” pour atteindre N/2.`,
            $localize`:@@median_l5_s4_b2:Si N/2 est juste au début de la classe, m est proche de L.`,
            $localize`:@@median_l5_s4_b3:Si N/2 est proche de la fin de la classe, m est proche de la borne supérieure.`,
          ],
        },
        {
          title: $localize`:@@median_l5_s5_title:Limites`,
          bullets: [
            $localize`:@@median_l5_s5_b1:C’est une estimation : elle dépend de l’hypothèse “uniforme dans la classe”.`,
            $localize`:@@median_l5_s5_b2:Plus les classes sont larges, plus l’estimation peut être imprécise.`,
            $localize`:@@median_l5_s5_b3:Si possible, préférer des classes plus fines (intervalles plus petits).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_6',
          kind: 'mcq',
          prompt: $localize`:@@median_l5_q1:Pour estimer la médiane sur des données en classes, on commence par :`,
          choices: [
            { label: $localize`:@@median_l5_q1_a:prendre le milieu de la plus grande classe`, value: 'a' },
            { label: $localize`:@@median_l5_q1_b:trouver la classe qui contient N/2 via les cumulés`, value: 'b' },
            { label: $localize`:@@median_l5_q1_c:faire la moyenne arithmétique des bornes`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l5_q1_exp:On repère la classe médiane en dépassant N/2 avec les effectifs cumulés, puis on interpole.`,
        },
      ],
    },

    // =========================================================
    // 6) QUARTILES / PERCENTILES
    // =========================================================
    {
      id: 'percentiles',
      title: $localize`:@@median_l6_title:6) Médiane, quartiles et percentiles`,
      subtitle: $localize`:@@median_l6_sub:Comprendre la médiane comme un percentile : une porte d’entrée vers les quartiles et l’IQR.`,
      tags: [
        $localize`:@@median_tag_percentile:percentiles`,
        $localize`:@@median_tag_quartiles:quartiles`,
        $localize`:@@median_tag_iqr:IQR`,
      ],
      sections: [
        {
          title: $localize`:@@median_l6_s1_title:Percentiles (idée)`,
          bullets: [
            $localize`:@@median_l6_s1_b1:Le p-ième percentile est une valeur en dessous de laquelle se trouvent p% des données.`,
            $localize`:@@median_l6_s1_b2:La médiane est le 50e percentile (p=50).`,
            $localize`:@@median_l6_s1_b3:Les quartiles : Q1 = 25e percentile, Q2 = 50e (médiane), Q3 = 75e.`,
          ],
        },
        {
          title: $localize`:@@median_l6_s2_title:IQR (écart interquartile)`,
          bullets: [
            $localize`:@@median_l6_s2_b1:IQR = Q3 − Q1 : mesure la dispersion de la moitié centrale des données.`,
            $localize`:@@median_l6_s2_b2:Très utile avec la médiane pour résumer une série sans être trop sensible aux extrêmes.`,
            $localize`:@@median_l6_s2_b3:Les boîtes à moustaches (boxplots) utilisent médiane + quartiles + moustaches (souvent liées à 1,5×IQR).`,
          ],
          // déjà math-only
          formulaLatex: String.raw`\mathrm{IQR}=Q_3-Q_1`,
        },
        {
          title: $localize`:@@median_l6_s3_title:Pourquoi c’est précieux en pratique`,
          bullets: [
            $localize`:@@median_l6_s3_b1:Médiane + IQR donne un résumé robuste (centre + dispersion) même en présence d’outliers.`,
            $localize`:@@median_l6_s3_b2:Dans les comparaisons (deux groupes), c’est souvent plus fiable que moyenne + écart-type si les distributions sont “bizarres”.`,
            $localize`:@@median_l6_s3_b3:En data, c’est une base pour des méthodes robustes (MAD, trimmed mean, etc.).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_7',
          kind: 'mcq',
          prompt: $localize`:@@median_l6_q1:La médiane correspond à :`,
          choices: [
            { label: $localize`:@@median_l6_q1_a:Q1 (25e percentile)`, value: 'a' },
            { label: $localize`:@@median_l6_q1_b:Q2 (50e percentile)`, value: 'b' },
            { label: $localize`:@@median_l6_q1_c:Q3 (75e percentile)`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l6_q1_exp:La médiane est le 50e percentile : Q2.`,
        },
      ],
    },

    // =========================================================
    // 7) PIÈGES
    // =========================================================
    {
      id: 'traps',
      title: $localize`:@@median_l7_title:7) Pièges fréquents et bonnes pratiques`,
      subtitle: $localize`:@@median_l7_sub:Tri, effectifs, données groupées, confusion avec moyenne/mode : ce qui fait perdre des points.`,
      tags: [
        $localize`:@@median_tag_traps:pièges`,
        $localize`:@@median_tag_practice:bonnes pratiques`,
        $localize`:@@median_tag_checklist:check-list`,
      ],
      sections: [
        {
          title: $localize`:@@median_l7_s1_title:Les erreurs classiques`,
          bullets: [
            $localize`:@@median_l7_s1_b1:Oublier de trier la série avant de chercher le milieu.`,
            $localize`:@@median_l7_s1_b2:Confondre médiane et mode (valeur la plus fréquente).`,
            $localize`:@@median_l7_s1_b3:En n pair, choisir “une valeur centrale” au hasard au lieu de faire la moyenne des deux centrales.`,
            $localize`:@@median_l7_s1_b4:Avec effectifs, oublier que la médiane se trouve via les effectifs cumulés.`,
            $localize`:@@median_l7_s1_b5:Avec classes, ne pas identifier la classe médiane (via N/2) avant d’interpoler.`,
          ],
        },
        {
          title: $localize`:@@median_l7_s2_title:Comment vérifier rapidement si ton résultat est plausible`,
          bullets: [
            $localize`:@@median_l7_s2_b1:Après tri, la médiane doit être comprise entre la valeur centrale basse et la valeur centrale haute (cas n pair).`,
            $localize`:@@median_l7_s2_b2:Au moins 50% des valeurs doivent être ≤ médiane (et ≥ médiane).`,
            $localize`:@@median_l7_s2_b3:Si tu ajoutes une valeur extrême très grande (ou très petite), la médiane change peu ou pas du tout (si n est grand).`,
          ],
        },
        {
          title: $localize`:@@median_l7_s3_title:Check-list en 15 secondes`,
          bullets: [
            $localize`:@@median_l7_s3_b1:1) Trier.`,
            $localize`:@@median_l7_s3_b2:2) Compter n (ou N si effectifs).`,
            $localize`:@@median_l7_s3_b3:3) Impair : rang (n+1)/2 ; Pair : moyenne des rangs n/2 et n/2+1.`,
            $localize`:@@median_l7_s3_b4:4) Avec effectifs : cumuler jusqu’à atteindre 50% du total.`,
            $localize`:@@median_l7_s3_b5:5) Avec classes : trouver la classe médiane via N/2, puis (optionnel) interpoler.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_median_8',
          kind: 'mcq',
          prompt: $localize`:@@median_l7_q1:Pour trouver la médiane, l’étape indispensable est :`,
          choices: [
            { label: $localize`:@@median_l7_q1_a:calculer la somme`, value: 'a' },
            { label: $localize`:@@median_l7_q1_b:trier la série`, value: 'b' },
            { label: $localize`:@@median_l7_q1_c:trouver le maximum`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@median_l7_q1_exp:La médiane dépend de l’ordre : sans tri, on ne sait pas quelle valeur est “au milieu”.`,
        },
        {
          id: 'q_median_9',
          kind: 'number',
          prompt: $localize`:@@median_l7_q2:Médiane de 1 ; 2 ; 2 ; 2 ; 100 ?`,
          correctNumber: 2,
          precision: 0,
          explanation: $localize`:@@median_l7_q2_exp:Tri : 1,2,2,2,100 → n=5 → 3e valeur = 2.`,
        },
      ],
    },
  ],
};
