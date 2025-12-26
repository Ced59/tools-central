import {CourseData} from "../../../shared/course/course.types";

export const ruleOfThreeCourseData: CourseData = {
  id: 'rule-of-three',
  heroTitle: $localize`:@@rot_course_title:Cours complet sur la règle de trois`,
  heroSubtitle: $localize`:@@rot_course_subtitle:Directe, inverse, tableaux, méthode du produit en croix, pièges et quiz.`,
  backLink: '/categories/math/rule-of-three',

  lessons: [
    {
      id: 'intro',
      title: $localize`:@@rot_l1_title:1) Comprendre la règle de trois`,
      subtitle: $localize`:@@rot_l1_sub:Proportionnalité et recherche d’une valeur manquante.`,
      tags: [
        $localize`:@@rot_tag_direct:directe`,
        $localize`:@@rot_tag_inverse:inverse`,
        $localize`:@@rot_tag_units:unités`,
      ],
      sections: [
        {
          title: $localize`:@@rot_l1_s1_title:Quand l’utiliser ?`,
          bullets: [
            $localize`:@@rot_l1_s1_b1:On l’utilise quand deux grandeurs sont proportionnelles (directement ou inversement).`,
            $localize`:@@rot_l1_s1_b2:On connaît 3 valeurs et on cherche la 4e (valeur manquante).`,
            $localize`:@@rot_l1_s1_b3:Avant de calculer, mettre toutes les valeurs dans des unités cohérentes.`,
          ],
        },
        {
          title: $localize`:@@rot_l1_s2_title:Test rapide`,
          bullets: [
            $localize`:@@rot_l1_s2_b1:Directe : si A double, B double (ratio constant).`,
            $localize`:@@rot_l1_s2_b2:Inverse : si A double, B est divisé par 2 (produit constant).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_rot_1',
          kind: 'mcq',
          prompt: $localize`:@@rot_l1_q1:La règle de trois est adaptée si :`,
          choices: [
            { label: $localize`:@@rot_l1_q1_a:la relation est proportionnelle`, value: 'a' },
            { label: $localize`:@@rot_l1_q1_b:la relation est une addition fixe`, value: 'b' },
            { label: $localize`:@@rot_l1_q1_c:il n’y a aucun lien entre les valeurs`, value: 'c' },
          ],
          correctChoice: 'a',
          explanation: $localize`:@@rot_l1_q1_exp:La règle de trois suppose une relation de proportionnalité.`,
        },
      ],
    },

    {
      id: 'direct',
      title: $localize`:@@rot_l2_title:2) Proportionnalité directe`,
      subtitle: $localize`:@@rot_l2_sub:Passage à l’unité, coefficient, produit en croix.`,
      tags: [
        $localize`:@@rot_tag_direct:directe`,
        $localize`:@@rot_tag_cross:produit en croix`,
      ],
      sections: [
        {
          title: $localize`:@@rot_l2_s1_title:Passage à l’unité`,
          bullets: [
            $localize`:@@rot_l2_s1_b1:On calcule d’abord la valeur pour 1 unité, puis on multiplie.`,
            $localize`:@@rot_l2_s1_b2:Méthode intuitive quand les nombres sont simples.`,
          ],
          examples: [
            {
              label: $localize`:@@rot_l2_s1_ex1:Exemple`,
              latex: String.raw`3\ \text{unités}\rightarrow 12\quad\Rightarrow\quad 1\ \text{unité}\rightarrow 4\quad\Rightarrow\quad 5\ \text{unités}\rightarrow 20`,
            },
          ],
        },
        {
          title: $localize`:@@rot_l2_s2_title:Produit en croix`,
          bullets: [
            $localize`:@@rot_l2_s2_b1:On met les valeurs dans un tableau à 2 colonnes.`,
            $localize`:@@rot_l2_s2_b2:On multiplie en croix et on divise par la valeur “en face” de l’inconnue.`,
          ],
          formulaLatex: String.raw`\begin{array}{c|c}
a & b\\
c & x
\end{array}
\Rightarrow x=\frac{b\times c}{a}`,
        },
      ],
      quizzes: [
        {
          id: 'q_rot_2',
          kind: 'number',
          prompt: $localize`:@@rot_l2_q1:Si 3 unités correspondent à 12, combien pour 5 unités ?`,
          correctNumber: 20,
          precision: 0,
          explanation: $localize`:@@rot_l2_q1_exp:Valeur par unité = 12/3 = 4, donc 5 → 20.`,
        },
      ],
    },

    {
      id: 'tables',
      title: $localize`:@@rot_l3_title:3) Tableau de proportionnalité`,
      subtitle: $localize`:@@rot_l3_sub:Compléter et vérifier grâce au coefficient.`,
      tags: [
        $localize`:@@rot_tag_table:tableau`,
        $localize`:@@rot_tag_direct:directe`,
      ],
      sections: [
        {
          title: $localize`:@@rot_l3_s1_title:Coefficient`,
          bullets: [
            $localize`:@@rot_l3_s1_b1:En directe, on a souvent B = k × A (k constant).`,
            $localize`:@@rot_l3_s1_b2:Une fois k trouvé, on complète les autres valeurs facilement.`,
          ],
          formulaLatex: String.raw`k=\frac{B}{A}\Rightarrow B=k\times A`,
        },
      ],
      quizzes: [
        {
          id: 'q_rot_3',
          kind: 'number',
          prompt: $localize`:@@rot_l3_q1:Si 2 unités → 9, alors 10 unités → ?`,
          correctNumber: 45,
          precision: 0,
          explanation: $localize`:@@rot_l3_q1_exp:k = 9/2 = 4,5 donc 10 → 45.`,
        },
      ],
    },

    {
      id: 'inverse',
      title: $localize`:@@rot_l4_title:4) Proportionnalité inverse`,
      subtitle: $localize`:@@rot_l4_sub:Produit constant (A×B) et cas typiques.`,
      tags: [
        $localize`:@@rot_tag_inverse:inverse`,
      ],
      sections: [
        {
          title: $localize`:@@rot_l4_s1_title:Principe`,
          bullets: [
            $localize`:@@rot_l4_s1_b1:En inverse, A × B reste constant.`,
            $localize`:@@rot_l4_s1_b2:Si A double, B est divisé par 2.`,
          ],
          formulaLatex: String.raw`A\times B=\text{constante}\Rightarrow x=\frac{a\times b}{c}`,
          examples: [
            {
              label: $localize`:@@rot_l4_s1_ex1:Exemple`,
              latex: String.raw`6\times 10=60\Rightarrow \frac{60}{12}=5`,
            },
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_rot_4',
          kind: 'number',
          prompt: $localize`:@@rot_l4_q1:Si A=6 correspond à B=10, que vaut B quand A=12 (cas inverse) ?`,
          correctNumber: 5,
          precision: 0,
          explanation: $localize`:@@rot_l4_q1_exp:Produit constant : 6×10 = 60, donc B = 60/12 = 5.`,
        },
      ],
    },

    {
      id: 'traps',
      title: $localize`:@@rot_l5_title:5) Pièges fréquents`,
      subtitle: $localize`:@@rot_l5_sub:Erreurs de tableau, unités incohérentes, mauvais sens.`,
      tags: [
        $localize`:@@rot_tag_traps:pièges`,
        $localize`:@@rot_tag_units:unités`,
      ],
      sections: [
        {
          title: $localize`:@@rot_l5_s1_title:À vérifier avant de calculer`,
          bullets: [
            $localize`:@@rot_l5_s1_b1:Convertir toutes les valeurs dans les mêmes unités.`,
            $localize`:@@rot_l5_s1_b2:Garder les colonnes cohérentes (mêmes grandeurs sur une même colonne).`,
            $localize`:@@rot_l5_s1_b3:Tester rapidement : si A augmente, B augmente (directe) ou diminue (inverse).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_rot_5',
          kind: 'mcq',
          prompt: $localize`:@@rot_l5_q1:Si A augmente et B diminue (produit constant), on est en :`,
          choices: [
            { label: $localize`:@@rot_l5_q1_a:proportionnalité directe`, value: 'a' },
            { label: $localize`:@@rot_l5_q1_b:proportionnalité inverse`, value: 'b' },
            { label: $localize`:@@rot_l5_q1_c:variation en pourcentage`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@rot_l5_q1_exp:Quand le produit A×B est constant, la relation est inverse.`,
        },
      ],
    },
  ],
};
