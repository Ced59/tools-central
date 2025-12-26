import {CourseData} from "../../../shared/course/course.types";


export const percentageCourseData: CourseData = {
  id: 'percentages',
  heroTitle: $localize`:@@pct_course_title:Cours complet sur les pourcentages`,
  heroSubtitle: $localize`:@@pct_course_subtitle:Leçons structurées, formules, exemples et quiz (QCM + numérique) pour maîtriser les pourcentages.`,
  backLink: '/categories/math/percentages',

  lessons: [
    {
      id: 'intro',
      title: $localize`:@@pct_l1_title:1) Comprendre un pourcentage`,
      subtitle: $localize`:@@pct_l1_sub:Définition, lecture et conversions rapides.`,
      tags: [
        $localize`:@@pct_tag_basics:bases`,
        $localize`:@@pct_tag_conversion:conversion`,
      ],
      sections: [
        {
          title: $localize`:@@pct_l1_s1_title:Définition`,
          bullets: [
            $localize`:@@pct_l1_s1_b1:Un pourcentage est une fraction sur 100 : p% = p/100.`,
            $localize`:@@pct_l1_s1_b2:On peut l’écrire en décimal (0,25) ou en fraction (1/4).`,
            $localize`:@@pct_l1_s1_b3:Pour calculer, on utilise souvent un coefficient : p% correspond à p/100.`,
          ],
          formulaLatex: String.raw`\begin{aligned}
p\% &= \frac{p}{100}\\
\text{coefficient} &= \frac{p}{100}
\end{aligned}`,
          examples: [
            {
              label: $localize`:@@pct_l1_s1_ex1:Exemple`,
              latex: String.raw`25\%=\frac{25}{100}=0{,}25=\frac{1}{4}`,
            },
          ],
        },
        {
          title: $localize`:@@pct_l1_s2_title:Piège courant`,
          bullets: [
            $localize`:@@pct_l1_s2_b1:Ne pas confondre “20%” et “0,20” : 20% = 0,20.`,
            $localize`:@@pct_l1_s2_b2:Une hausse de +p% signifie multiplier par (1 + p/100).`,
          ],
          formulaLatex: String.raw`\text{Après }+p\%:\ \text{nouveau}=\text{ancien}\times\left(1+\frac{p}{100}\right)`,
        },
      ],
      quizzes: [
        {
          id: 'q_pct_1',
          kind: 'mcq',
          prompt: $localize`:@@pct_l1_q1:Quel est le coefficient multiplicateur correspondant à +15% ?`,
          choices: [
            { label: '0,15', value: 'a' },
            { label: '1,15', value: 'b' },
            { label: '15', value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@pct_l1_q1_exp:Une hausse de +15% => 1 + 15/100 = 1,15.`,
        },
        {
          id: 'q_pct_2',
          kind: 'number',
          prompt: $localize`:@@pct_l1_q2:Convertir 2,5% en nombre décimal.`,
          correctNumber: 0.025,
          precision: 3,
          explanation: $localize`:@@pct_l1_q2_exp:2,5% = 2,5/100 = 0,025.`,
        },
      ],
    },

    {
      id: 'percent-of',
      title: $localize`:@@pct_l2_title:2) Calculer p% d’une valeur`,
      subtitle: $localize`:@@pct_l2_sub:Le réflexe : p% de y.`,
      tags: [
        $localize`:@@pct_tag_percent_of:p% de`,
        $localize`:@@pct_tag_coeff:coefficient`,
      ],
      sections: [
        {
          title: $localize`:@@pct_l2_s1_title:Méthode`,
          bullets: [
            $localize`:@@pct_l2_s1_b1:Convertir p% en coefficient p/100 puis multiplier.`,
            $localize`:@@pct_l2_s1_b2:Certains pourcentages ont des équivalents simples (ex: 25% = 1/4).`,
          ],
          formulaLatex: String.raw`x=\frac{p}{100}\times y`,
          examples: [
            {
              label: $localize`:@@pct_l2_s1_ex1:Exemple`,
              latex: String.raw`12\%\ \text{de}\ 250=0{,}12\times 250=30`,
            },
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_3',
          kind: 'number',
          prompt: $localize`:@@pct_l2_q1:Calculer 18% de 250.`,
          correctNumber: 45,
          precision: 0,
          explanation: $localize`:@@pct_l2_q1_exp:0,18 × 250 = 45.`,
        },
        {
          id: 'q_pct_4',
          kind: 'mcq',
          prompt: $localize`:@@pct_l2_q2:25% d’un nombre, c’est équivalent à…`,
          choices: [
            { label: $localize`:@@pct_l2_q2_a:le diviser par 2`, value: 'a' },
            { label: $localize`:@@pct_l2_q2_b:le diviser par 4`, value: 'b' },
            { label: $localize`:@@pct_l2_q2_c:le multiplier par 4`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@pct_l2_q2_exp:25% = 1/4.`,
        },
      ],
    },

    {
      id: 'what-percent',
      title: $localize`:@@pct_l3_title:3) “X est quel % de Y”`,
      subtitle: $localize`:@@pct_l3_sub:Transformer un ratio en pourcentage.`,
      tags: [
        $localize`:@@pct_tag_ratio:ratio`,
        '×100',
      ],
      sections: [
        {
          title: $localize`:@@pct_l3_s1_title:Formule`,
          bullets: [
            $localize`:@@pct_l3_s1_b1:On divise X par Y pour obtenir une proportion, puis on multiplie par 100.`,
            $localize`:@@pct_l3_s1_b2:Attention : Y ne doit pas être 0.`,
          ],
          formulaLatex: String.raw`p=\frac{x}{y}\times 100`,
          examples: [
            {
              label: $localize`:@@pct_l3_s1_ex1:Exemple`,
              latex: String.raw`\frac{30}{200}\times 100=15\%`,
            },
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_5',
          kind: 'number',
          prompt: $localize`:@@pct_l3_q1:48 représente quel % de 120 ?`,
          correctNumber: 40,
          precision: 0,
          unit: '%',
          explanation: $localize`:@@pct_l3_q1_exp:48/120 = 0,4, donc 40%.`,
        },
      ],
    },

    {
      id: 'variation',
      title: $localize`:@@pct_l4_title:4) Variation en %`,
      subtitle: $localize`:@@pct_l4_sub:Mesurer l’évolution entre une valeur initiale et une valeur finale.`,
      tags: [
        $localize`:@@pct_tag_variation:variation`,
        $localize`:@@pct_tag_evolution:évolution`,
      ],
      sections: [
        {
          title: $localize`:@@pct_l4_s1_title:Formule standard`,
          bullets: [
            $localize`:@@pct_l4_s1_b1:On compare l’écart (final - initial) à la valeur initiale.`,
            $localize`:@@pct_l4_s1_b2:Le signe indique hausse (+) ou baisse (-).`,
          ],
          formulaLatex: String.raw`p=\frac{\text{final}-\text{initial}}{\text{initial}}\times 100`,
          examples: [
            {
              label: $localize`:@@pct_l4_s1_ex1:Exemple`,
              latex: String.raw`80\to 100:\ \frac{100-80}{80}\times 100=25\%`,
            },
          ],
        },
        {
          title: $localize`:@@pct_l4_s2_title:Pièges`,
          bullets: [
            $localize`:@@pct_l4_s2_b1:Le dénominateur est l’initial (dans la variation “classique”).`,
            $localize`:@@pct_l4_s2_b2:La variation A→B n’est pas exactement l’opposé de B→A.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_6',
          kind: 'number',
          prompt: $localize`:@@pct_l4_q1:Une valeur passe de 50 à 62,5. Variation en % ?`,
          correctNumber: 25,
          precision: 0,
          unit: '%',
          explanation: $localize`:@@pct_l4_q1_exp:(62,5-50)/50×100 = 25%.`,
        },
        {
          id: 'q_pct_7',
          kind: 'mcq',
          prompt: $localize`:@@pct_l4_q2:Si on passe de 100 à 80, la variation est :`,
          choices: [
            { label: '+20%', value: 'a' },
            { label: '-20%', value: 'b' },
            { label: '-25%', value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@pct_l4_q2_exp:(80-100)/100×100 = -20%.`,
        },
      ],
    },

    {
      id: 'reverse',
      title: $localize`:@@pct_l5_title:5) Retrouver la valeur initiale`,
      subtitle: $localize`:@@pct_l5_sub:Revenir avant une variation (pourcentage inverse).`,
      tags: [
        $localize`:@@pct_tag_inverse:inverse`,
        $localize`:@@pct_tag_return:retour`,
      ],
      sections: [
        {
          title: $localize`:@@pct_l5_s1_title:Principe`,
          bullets: [
            $localize`:@@pct_l5_s1_b1:Après +p%, final = initial × (1 + p/100).`,
            $localize`:@@pct_l5_s1_b2:Donc initial = final ÷ (1 + p/100).`,
            $localize`:@@pct_l5_s1_b3:Si le coefficient vaut 0, l’inversion est impossible.`,
          ],
          formulaLatex: String.raw`\text{initial}=\frac{\text{final}}{1+\frac{p}{100}}`,
        },
      ],
      quizzes: [
        {
          id: 'q_pct_8',
          kind: 'number',
          prompt: $localize`:@@pct_l5_q1:Après une hausse de +25%, la valeur finale est 250. Valeur initiale ?`,
          correctNumber: 200,
          precision: 0,
          explanation: $localize`:@@pct_l5_q1_exp:Initial = 250 / 1,25 = 200.`,
        },
      ],
    },

    {
      id: 'successive',
      title: $localize`:@@pct_l6_title:6) Pourcentages successifs`,
      subtitle: $localize`:@@pct_l6_sub:Composer plusieurs variations via les coefficients.`,
      tags: [
        $localize`:@@pct_tag_successive:successifs`,
        $localize`:@@pct_tag_comp:composition`,
      ],
      sections: [
        {
          title: $localize`:@@pct_l6_s1_title:Règle`,
          bullets: [
            $localize`:@@pct_l6_s1_b1:On n’additionne pas des % successifs : on multiplie les coefficients.`,
            $localize`:@@pct_l6_s1_b2:Coefficient total = (1+p1/100)×(1+p2/100)×…`,
            $localize`:@@pct_l6_s1_b3:% équivalent = (coef_total - 1)×100.`,
          ],
          formulaLatex: String.raw`\begin{aligned}
\text{coef} &= \prod_i\left(1+\frac{p_i}{100}\right)\\
p_{eq} &= (\text{coef}-1)\times 100
\end{aligned}`,
          examples: [
            {
              label: $localize`:@@pct_l6_s1_ex1:Exemple`,
              latex: String.raw`+20\%\ \text{puis}\ -20\%:\ 1,2\times 0,8=0,96\Rightarrow -4\%`,
            },
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_9',
          kind: 'number',
          prompt: $localize`:@@pct_l6_q1:Une valeur subit +10% puis +10%. % équivalent ?`,
          correctNumber: 21,
          precision: 0,
          unit: '%',
          explanation: $localize`:@@pct_l6_q1_exp:1,1×1,1=1,21 donc +21%.`,
        },
      ],
    },

    {
      id: 'points',
      title: $localize`:@@pct_l7_title:7) Points de % (pp) vs variation en %`,
      subtitle: $localize`:@@pct_l7_sub:Différence entre écart de taux et variation relative.`,
      tags: ['pp', $localize`:@@pct_tag_rates:taux`],
      sections: [
        {
          title: $localize`:@@pct_l7_s1_title:Différence`,
          bullets: [
            $localize`:@@pct_l7_s1_b1:Points de % : différence brute entre deux taux.`,
            $localize`:@@pct_l7_s1_b2:Variation relative : (nouveau - ancien) / ancien × 100.`,
          ],
          formulaLatex: String.raw`\Delta(\text{pp})=b-a\qquad\Delta(\%)=\frac{b-a}{a}\times 100`,
          examples: [
            {
              label: $localize`:@@pct_l7_s1_ex1:Exemple`,
              latex: String.raw`10\%\to 12\%:\ +2\ \text{pp}\ \text{et}\ +20\%\ \text{relatif}`,
            },
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_10',
          kind: 'mcq',
          prompt: $localize`:@@pct_l7_q1:Un taux passe de 5% à 6%. Variation :`,
          choices: [
            { label: $localize`:@@pct_l7_q1_a:+1 pp et +20% relatif`, value: 'a' },
            { label: $localize`:@@pct_l7_q1_b:+1% et +1 pp`, value: 'b' },
            { label: $localize`:@@pct_l7_q1_c:+20 pp`, value: 'c' },
          ],
          correctChoice: 'a',
          explanation: $localize`:@@pct_l7_q1_exp:pp = 1 ; relatif = 1/5 = 20%.`,
        },
      ],
    },

    {
      id: 'shares-weighted',
      title: $localize`:@@pct_l8_title:8) Parts, totaux et pondérations`,
      subtitle: $localize`:@@pct_l8_sub:Répartitions et moyenne pondérée de taux.`,
      tags: [$localize`:@@pct_tag_share:part`, $localize`:@@pct_tag_weighted:pondéré`],
      sections: [
        {
          title: $localize`:@@pct_l8_s1_title:Part sur total`,
          bullets: [
            $localize`:@@pct_l8_s1_b1:Part(%) = part/total × 100.`,
            $localize`:@@pct_l8_s1_b2:Le total est la somme des parts.`,
          ],
          formulaLatex: String.raw`p_A=\frac{A}{A+B+C}\times 100`,
        },
        {
          title: $localize`:@@pct_l8_s2_title:Moyenne pondérée`,
          bullets: [
            $localize`:@@pct_l8_s2_b1:Si les groupes n’ont pas le même poids, on pondère.`,
            $localize`:@@pct_l8_s2_b2:Formule : (Σ p_i×w_i)/(Σ w_i).`,
          ],
          formulaLatex: String.raw`\bar{p}=\frac{\sum(p_i w_i)}{\sum w_i}`,
        },
      ],
      quizzes: [
        {
          id: 'q_pct_11',
          kind: 'number',
          prompt: $localize`:@@pct_l8_q1:A=30, B=50, C=20. Part de A en % ?`,
          correctNumber: 30,
          precision: 0,
          unit: '%',
          explanation: $localize`:@@pct_l8_q1_exp:Total=100, donc A=30%.`,
        },
        {
          id: 'q_pct_12',
          kind: 'number',
          prompt: $localize`:@@pct_l8_q2:Taux 80% (poids 10) et 50% (poids 30). Moyenne pondérée ?`,
          correctNumber: 57.5,
          precision: 1,
          unit: '%',
          explanation: $localize`:@@pct_l8_q2_exp:(80×10 + 50×30)/(10+30) = 57,5%.`,
        },
      ],
    },

    {
      id: 'limits-traps',
      title: $localize`:@@pct_l9_title:9) Limites et pièges avancés`,
      subtitle: $localize`:@@pct_l9_sub:-100%, +∞, bases différentes, erreurs classiques.`,
      tags: [$localize`:@@pct_tag_limits:limites`, $localize`:@@pct_tag_traps:pièges`],
      sections: [
        {
          title: $localize`:@@pct_l9_s1_title:Idées clés`,
          bullets: [
            $localize`:@@pct_l9_s1_b1:Une baisse de 100% mène à une valeur finale 0.`,
            $localize`:@@pct_l9_s1_b2:Une hausse peut dépasser 100% (ex: +150%).`,
            $localize`:@@pct_l9_s1_b3:Si l’initial tend vers 0, la variation relative peut devenir très grande.`,
          ],
        },
        {
          title: $localize`:@@pct_l9_s2_title:Pièges`,
          bullets: [
            $localize`:@@pct_l9_s2_b1:“+x% puis -x%” ne revient pas au point de départ.`,
            $localize`:@@pct_l9_s2_b2:Ne pas confondre points de % et % relatif.`,
            $localize`:@@pct_l9_s2_b3:Bien choisir la base (initiale ou finale selon le contexte).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_pct_13',
          kind: 'mcq',
          prompt: $localize`:@@pct_l9_q1:Après +50% puis -50%, le résultat est :`,
          choices: [
            { label: $localize`:@@pct_l9_q1_a:identique à l’origine`, value: 'a' },
            { label: $localize`:@@pct_l9_q1_b:plus petit qu’à l’origine`, value: 'b' },
            { label: $localize`:@@pct_l9_q1_c:plus grand qu’à l’origine`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@pct_l9_q1_exp:1,5×0,5=0,75 donc -25% au total.`,
        },
      ],
    },
  ],
};
