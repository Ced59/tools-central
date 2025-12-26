import { CourseData } from "../../course.types";

export const meanCourseData: CourseData = {
  heroTitle: $localize`:@@mean_course_title:Cours complet sur les moyennes (statistiques)`,
  heroSubtitle: $localize`:@@mean_course_subtitle:Moyenne arithmétique, pondérée, géométrique, harmonique, quadratique (RMS), moyenne mobile, moyenne tronquée, données groupées… définitions, méthodes, exemples, pièges et quiz.`,
  backLink: '/categories/math/statistics',

  lessons: [
    // =========================================================
    // 1) INTRO : À quoi sert une moyenne ?
    // =========================================================
    {
      id: 'intro',
      title: $localize`:@@mean_l1_title:1) Comprendre ce qu’est une “moyenne”`,
      subtitle: $localize`:@@mean_l1_sub:Une valeur centrale pour résumer une série… mais pas toujours “la moyenne arithmétique”.`,
      tags: [
        $localize`:@@mean_tag_definition:définition`,
        $localize`:@@mean_tag_center:tendance centrale`,
        $localize`:@@mean_tag_method:métode`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l1_s1_title:Pourquoi utiliser une moyenne ?`,
          bullets: [
            $localize`:@@mean_l1_s1_b1:Une moyenne résume une liste de valeurs par un seul nombre (notes, prix, mesures, durées…).`,
            $localize`:@@mean_l1_s1_b2:Elle sert à comparer des groupes (deux classes, deux périodes), suivre une évolution (moyenne mensuelle) ou mesurer une performance globale.`,
            $localize`:@@mean_l1_s1_b3:Elle facilite la décision : un indicateur simple est souvent plus lisible qu’une longue liste de valeurs.`,
            $localize`:@@mean_l1_s1_b4:Mais une moyenne peut être trompeuse si la distribution est très asymétrique ou s’il existe des valeurs extrêmes.`,
          ],
        },
        {
          title: $localize`:@@mean_l1_s2_title:Trois mots à connaître : moyenne, médiane, mode`,
          bullets: [
            $localize`:@@mean_l1_s2_b1:Moyenne (au sens large) : une famille d’indicateurs “centrés” (arithmétique, pondérée, géométrique, harmonique…).`,
            $localize`:@@mean_l1_s2_b2:Médiane : la valeur qui coupe la série en deux (50% en dessous, 50% au-dessus).`,
            $localize`:@@mean_l1_s2_b3:Mode : la valeur la plus fréquente (peut être multiple).`,
            $localize`:@@mean_l1_s2_b4:En pratique, on regarde souvent moyenne + médiane + dispersion pour comprendre une série.`,
          ],
        },
        {
          title: $localize`:@@mean_l1_s3_title:Le bon réflexe : choisir le bon type de moyenne`,
          bullets: [
            $localize`:@@mean_l1_s3_b1:Arithmétique : quand on additionne des valeurs comparables (notes, tailles, quantités).`,
            $localize`:@@mean_l1_s3_b2:Pondérée : quand certaines valeurs comptent plus (coefficients, quantités, durées).`,
            $localize`:@@mean_l1_s3_b3:Géométrique : quand les effets se multiplient (croissance, rendements successifs).`,
            $localize`:@@mean_l1_s3_b4:Harmonique : pour des rapports “par unité” (vitesse, débit) quand l’unité de base est la même (même distance, même quantité).`,
            $localize`:@@mean_l1_s3_b5:RMS / quadratique : quand on travaille avec des carrés (signaux, amplitude effective, erreur).`,
            $localize`:@@mean_l1_s3_b6:Tronquée / winsorisée : quand on veut limiter l’impact des valeurs extrêmes.`,
            $localize`:@@mean_l1_s3_b7:Mobile : quand on veut lisser une série dans le temps.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_1',
          kind: 'mcq',
          prompt: $localize`:@@mean_l1_q1:Une moyenne sert principalement à :`,
          choices: [
            { label: $localize`:@@mean_l1_q1_a:résumer une série par une valeur centrale`, value: 'a' },
            { label: $localize`:@@mean_l1_q1_b:trouver uniquement le maximum`, value: 'b' },
            { label: $localize`:@@mean_l1_q1_c:réordonner toutes les valeurs`, value: 'c' },
          ],
          correctChoice: 'a',
          explanation: $localize`:@@mean_l1_q1_exp:Une moyenne est un indicateur de tendance centrale : elle résume la série par une valeur “typique”.`,
        },
      ],
    },

    // =========================================================
    // 2) MOYENNE ARITHMÉTIQUE
    // =========================================================
    {
      id: 'arithmetic',
      title: $localize`:@@mean_l2_title:2) Moyenne arithmétique`,
      subtitle: $localize`:@@mean_l2_sub:Somme des valeurs ÷ nombre de valeurs : la plus utilisée, mais sensible aux extrêmes.`,
      tags: [
        $localize`:@@mean_tag_arithmetic:arithmétique`,
        $localize`:@@mean_tag_formula:formule`,
        $localize`:@@mean_tag_properties:propriétés`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l2_s1_title:Définition et formule`,
          bullets: [
            $localize`:@@mean_l2_s1_b1:La moyenne arithmétique d’une série de n valeurs est la somme des valeurs divisée par n.`,
            $localize`:@@mean_l2_s1_b2:Elle est adaptée quand chaque valeur représente une observation équivalente (même “importance”).`,
            $localize`:@@mean_l2_s1_b3:On la note souvent x̄ (x barre).`,
          ],
          formulaLatex: String.raw`\bar{x}=\frac{x_1+x_2+\cdots+x_n}{n}`,
        },
        {
          title: $localize`:@@mean_l2_s2_title:Exemple pas à pas`,
          bullets: [
            $localize`:@@mean_l2_s2_b1:Série : 8, 12, 10.`,
            $localize`:@@mean_l2_s2_b2:Somme = 8 + 12 + 10 = 30.`,
            $localize`:@@mean_l2_s2_b3:Nombre de valeurs n = 3.`,
            $localize`:@@mean_l2_s2_b4:Moyenne = 30 ÷ 3 = 10.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l2_s2_ex1:Calcul`,
              latex: String.raw`\bar{x}=\frac{8+12+10}{3}=\frac{30}{3}=10`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l2_s3_title:Retrouver un total à partir d’une moyenne`,
          bullets: [
            $localize`:@@mean_l2_s3_b1:Si tu connais la moyenne et le nombre de valeurs, tu peux retrouver la somme totale.`,
            $localize`:@@mean_l2_s3_b2:Très utile pour les exercices “moyenne de classe”, “ajout d’une note”, etc.`,
          ],
          formulaLatex: String.raw`x_1+x_2+\cdots+x_n=n\bar{x}`,
        },
        {
          title: $localize`:@@mean_l2_s4_title:Propriétés (à connaître pour raisonner vite)`,
          bullets: [
            $localize`:@@mean_l2_s4_b1:Si on ajoute la même constante c à toutes les valeurs, la moyenne augmente de c.`,
            $localize`:@@mean_l2_s4_b2:Si on multiplie toutes les valeurs par k, la moyenne est multipliée par k.`,
            $localize`:@@mean_l2_s4_b3:La moyenne minimise la somme des carrés des écarts (propriété “moindres carrés”) : c’est une raison théorique de son importance.`,
            $localize`:@@mean_l2_s4_b4:Elle est sensible aux valeurs extrêmes : un seul outlier peut la déformer fortement.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l2_s4_ex1:Décalage`,
              // math-only (pas de texte)
              latex: String.raw`y_i=x_i+c\ \Rightarrow\ \bar{y}=\bar{x}+c`,
            },
            {
              label: $localize`:@@mean_l2_s4_ex2:Multiplication`,
              latex: String.raw`y_i=kx_i\ \Rightarrow\ \bar{y}=k\bar{x}`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l2_s5_title:Interprétation : “centre de gravité”`,
          bullets: [
            $localize`:@@mean_l2_s5_b1:On peut voir la moyenne comme un point d’équilibre : la somme des écarts positifs et négatifs se compense.`,
            $localize`:@@mean_l2_s5_b2:En effet, la somme des écarts à la moyenne vaut 0 : (x1−x̄)+…+(xn−x̄)=0.`,
          ],
          formulaLatex: String.raw`\sum_{i=1}^{n}(x_i-\bar{x})=0`,
        },
      ],
      quizzes: [
        {
          id: 'q_mean_2',
          kind: 'number',
          prompt: $localize`:@@mean_l2_q1:Calcule la moyenne de 4 ; 7 ; 9 ; 0.`,
          correctNumber: 5,
          precision: 0,
          explanation: $localize`:@@mean_l2_q1_exp:(4+7+9+0)/4 = 20/4 = 5.`,
        },
        {
          id: 'q_mean_3',
          kind: 'mcq',
          prompt: $localize`:@@mean_l2_q2:La moyenne arithmétique est :`,
          choices: [
            { label: $localize`:@@mean_l2_q2_a:insensible aux valeurs extrêmes`, value: 'a' },
            { label: $localize`:@@mean_l2_q2_b:sensible aux valeurs extrêmes`, value: 'b' },
            { label: $localize`:@@mean_l2_q2_c:toujours égale à la médiane`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l2_q2_exp:Une valeur extrême (très grande ou très petite) peut déplacer la moyenne de manière importante.`,
        },
      ],
    },

    // =========================================================
    // 3) MOYENNE PONDÉRÉE
    // =========================================================
    {
      id: 'weighted',
      title: $localize`:@@mean_l3_title:3) Moyenne pondérée (coefficients / poids)`,
      subtitle: $localize`:@@mean_l3_sub:Quand les valeurs n’ont pas la même importance : notes avec coefficients, prix moyen payé, temps passé, etc.`,
      tags: [
        $localize`:@@mean_tag_weighted:pondérée`,
        $localize`:@@mean_tag_coefficients:coefficients`,
        $localize`:@@mean_tag_real_life:vie réelle`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l3_s1_title:Définition`,
          bullets: [
            $localize`:@@mean_l3_s1_b1:Chaque valeur x_i a un poids w_i (coefficient, quantité, durée, importance…).`,
            $localize`:@@mean_l3_s1_b2:On additionne les produits “valeur × poids”.`,
            $localize`:@@mean_l3_s1_b3:On divise par la somme des poids.`,
            $localize`:@@mean_l3_s1_b4:Si tous les poids sont égaux, on retrouve la moyenne arithmétique.`,
          ],
          formulaLatex: String.raw`\bar{x}_w=\frac{\sum_{i=1}^{n}w_i x_i}{\sum_{i=1}^{n}w_i}`,
        },
        {
          title: $localize`:@@mean_l3_s2_title:Exemple : notes avec coefficients`,
          bullets: [
            $localize`:@@mean_l3_s2_b1:Math : 12 (coef 3), Français : 9 (coef 2), Anglais : 15 (coef 1).`,
            $localize`:@@mean_l3_s2_b2:Somme pondérée = 12×3 + 9×2 + 15×1 = 36 + 18 + 15 = 69.`,
            $localize`:@@mean_l3_s2_b3:Somme des coefs = 3+2+1 = 6.`,
            $localize`:@@mean_l3_s2_b4:Moyenne pondérée = 69/6 = 11,5.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l3_s2_ex1:Calcul`,
              latex: String.raw`\bar{x}_w=\frac{12\cdot3+9\cdot2+15\cdot1}{3+2+1}=\frac{69}{6}=11{,}5`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l3_s3_title:Exemple : prix moyen payé (quantités)`,
          bullets: [
            $localize`:@@mean_l3_s3_b1:Tu achètes 2 kg à 3 €/kg et 5 kg à 4 €/kg.`,
            $localize`:@@mean_l3_s3_b2:Le “poids” est la quantité : 2 et 5.`,
            $localize`:@@mean_l3_s3_b3:Prix moyen = (2×3 + 5×4)/(2+5) = (6+20)/7 = 26/7 ≈ 3,714 €/kg.`,
            $localize`:@@mean_l3_s3_b4:C’est le vrai prix moyen par kg sur l’ensemble des achats.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l3_s3_ex1:Calcul`,
              latex: String.raw`\bar{p}=\frac{2\cdot3+5\cdot4}{2+5}=\frac{26}{7}\approx 3{,}714`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l3_s4_title:Exemple : moyenne sur des durées différentes`,
          bullets: [
            $localize`:@@mean_l3_s4_b1:Une machine tourne 2 h à 100 unités/h puis 1 h à 40 unités/h.`,
            $localize`:@@mean_l3_s4_b2:Le poids est le temps (2 h et 1 h).`,
            $localize`:@@mean_l3_s4_b3:Production totale = 2×100 + 1×40 = 240 unités en 3 h.`,
            $localize`:@@mean_l3_s4_b4:Taux moyen = 240/3 = 80 unités/h.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l3_s4_ex1:Calcul`,
              latex: String.raw`\bar{r}=\frac{2\cdot100+1\cdot40}{2+1}=\frac{240}{3}=80`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l3_s5_title:Pièges à éviter`,
          bullets: [
            $localize`:@@mean_l3_s5_b1:Ne pas diviser par n : on divise par la somme des poids.`,
            $localize`:@@mean_l3_s5_b2:Si les poids sont des pourcentages, vérifier s’ils totalisent 100% (ou 1). Sinon, utiliser la somme réelle.`,
            $localize`:@@mean_l3_s5_b3:Attention à l’unité : une moyenne pondérée “par kg” ou “par heure” dépend du poids choisi.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_4',
          kind: 'number',
          prompt: $localize`:@@mean_l3_q1:Notes : 10 (coef 2), 14 (coef 3). Moyenne pondérée ?`,
          correctNumber: 12.4,
          precision: 1,
          explanation: $localize`:@@mean_l3_q1_exp:(10×2 + 14×3)/(2+3) = (20+42)/5 = 62/5 = 12,4.`,
        },
        {
          id: 'q_mean_5',
          kind: 'mcq',
          prompt: $localize`:@@mean_l3_q2:Dans une moyenne pondérée, on divise par :`,
          choices: [
            { label: $localize`:@@mean_l3_q2_a:le nombre de valeurs`, value: 'a' },
            { label: $localize`:@@mean_l3_q2_b:la somme des poids`, value: 'b' },
            { label: $localize`:@@mean_l3_q2_c:le maximum`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l3_q2_exp:La formule correcte divise par la somme des poids (coefficients, quantités, durées, etc.).`,
        },
      ],
    },

    // =========================================================
    // 4) MOYENNE GÉOMÉTRIQUE
    // =========================================================
    {
      id: 'geometric',
      title: $localize`:@@mean_l4_title:4) Moyenne géométrique (croissance, rendements, multiplicateurs)`,
      subtitle: $localize`:@@mean_l4_sub:Quand les effets se multiplient : facteurs successifs, croissance composée, rendements.`,
      tags: [
        $localize`:@@mean_tag_geometric:géométrique`,
        $localize`:@@mean_tag_growth:croissance`,
        $localize`:@@mean_tag_returns:rendements`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l4_s1_title:Définition`,
          bullets: [
            $localize`:@@mean_l4_s1_b1:La moyenne géométrique est la racine n-ième du produit des valeurs.`,
            $localize`:@@mean_l4_s1_b2:Elle est adaptée quand les valeurs représentent des multiplicateurs ou des facteurs (par exemple : ×1,10 puis ×0,90).`,
            $localize`:@@mean_l4_s1_b3:Elle nécessite généralement des valeurs positives (sinon, la racine n-ième peut ne pas être définie dans les réels).`,
          ],
          formulaLatex: String.raw`G=\sqrt[n]{x_1x_2\cdots x_n}`,
        },
        {
          title: $localize`:@@mean_l4_s2_title:Exemple : facteurs de variation successifs`,
          bullets: [
            $localize`:@@mean_l4_s2_b1:Une quantité augmente de 10% puis baisse de 10%.`,
            $localize`:@@mean_l4_s2_b2:Les facteurs sont 1,10 et 0,90.`,
            $localize`:@@mean_l4_s2_b3:Produit des facteurs = 1,10 × 0,90 = 0,99.`,
            $localize`:@@mean_l4_s2_b4:Facteur moyen (sur 2 périodes) = √0,99 ≈ 0,995.`,
            $localize`:@@mean_l4_s2_b5:Taux moyen par période ≈ 0,995 − 1 = −0,5%.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l4_s2_ex1:Calcul`,
              latex: String.raw`G=\sqrt{1{,}10\cdot0{,}90}=\sqrt{0{,}99}\approx 0{,}995`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l4_s3_title:Interprétation : “taux moyen”`,
          bullets: [
            $localize`:@@mean_l4_s3_b1:Si une grandeur évolue sur n périodes avec des facteurs f1…fn, le facteur moyen est G = (f1×…×fn)^(1/n).`,
            $localize`:@@mean_l4_s3_b2:Le taux moyen par période est alors G − 1.`,
            $localize`:@@mean_l4_s3_b3:C’est la notion utilisée pour des croissances composées (sur plusieurs années par exemple).`,
          ],
          // suppression du \text{taux moyen}
          formulaLatex: String.raw`G=\left(\prod_{i=1}^{n}f_i\right)^{1/n}\quad;\quad r=G-1`,
        },
        {
          title: $localize`:@@mean_l4_s4_title:Pourquoi pas la moyenne arithmétique des taux ?`,
          bullets: [
            $localize`:@@mean_l4_s4_b1:Parce que les taux successifs se composent (multiplication des facteurs), pas addition simple.`,
            $localize`:@@mean_l4_s4_b2:La moyenne arithmétique des pourcentages peut donner une estimation grossière, mais pas le facteur réellement équivalent.`,
            $localize`:@@mean_l4_s4_b3:La moyenne géométrique respecte la composition multiplicative.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_6',
          kind: 'mcq',
          prompt: $localize`:@@mean_l4_q1:Pour résumer des rendements successifs (effet composé), on utilise plutôt :`,
          choices: [
            { label: $localize`:@@mean_l4_q1_a:la moyenne arithmétique`, value: 'a' },
            { label: $localize`:@@mean_l4_q1_b:la moyenne géométrique`, value: 'b' },
            { label: $localize`:@@mean_l4_q1_c:le mode`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l4_q1_exp:Les rendements successifs se multiplient : la moyenne géométrique correspond à un facteur moyen équivalent.`,
        },
        {
          id: 'q_mean_7',
          kind: 'number',
          prompt: $localize`:@@mean_l4_q2:Produit de facteurs = 1,21 sur 2 périodes. Quel est le facteur moyen par période ?`,
          correctNumber: 1.1,
          precision: 1,
          explanation: $localize`:@@mean_l4_q2_exp:Le facteur moyen est √1,21 = 1,1 (soit +10% par période).`,
        },
      ],
    },

    // =========================================================
    // 5) MOYENNE HARMONIQUE
    // =========================================================
    {
      id: 'harmonic',
      title: $localize`:@@mean_l5_title:5) Moyenne harmonique (vitesses, débits, prix “par unité”)`,
      subtitle: $localize`:@@mean_l5_sub:La bonne moyenne pour des rapports quand l’unité de base est la même (même distance, même quantité).`,
      tags: [
        $localize`:@@mean_tag_harmonic:harmonique`,
        $localize`:@@mean_tag_speed:vitesse`,
        $localize`:@@mean_tag_ratio:ratio`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l5_s1_title:Définition`,
          bullets: [
            $localize`:@@mean_l5_s1_b1:La moyenne harmonique d’une série de valeurs positives x1…xn est : n divisé par la somme des inverses.`,
            $localize`:@@mean_l5_s1_b2:Elle est adaptée quand les valeurs sont des “par unité” (km/h, L/100km inversé, unités/heure, €/kg…) et que l’unité de base est identique entre mesures.`,
            $localize`:@@mean_l5_s1_b3:Elle donne plus de poids aux petites valeurs : une lenteur pénalise fortement une vitesse moyenne.`,
          ],
          formulaLatex: String.raw`H=\frac{n}{\frac{1}{x_1}+\frac{1}{x_2}+\cdots+\frac{1}{x_n}}`,
        },
        {
          title: $localize`:@@mean_l5_s2_title:Exemple classique : vitesse moyenne sur distances égales`,
          bullets: [
            $localize`:@@mean_l5_s2_b1:Tu fais 50 km à 60 km/h puis 50 km à 30 km/h.`,
            $localize`:@@mean_l5_s2_b2:On ne fait pas (60+30)/2 = 45 : c’est faux pour des distances égales.`,
            $localize`:@@mean_l5_s2_b3:On utilise la moyenne harmonique : H = 2 / (1/60 + 1/30) = 40 km/h.`,
            $localize`:@@mean_l5_s2_b4:Interprétation : le temps total est plus influencé par la portion lente.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l5_s2_ex1:Calcul`,
              latex: String.raw`H=\frac{2}{\frac{1}{60}+\frac{1}{30}}=\frac{2}{\frac{1}{60}+\frac{2}{60}}=\frac{2}{\frac{3}{60}}=40`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l5_s3_title:Cas où la moyenne arithmétique est correcte`,
          bullets: [
            $localize`:@@mean_l5_s3_b1:Si les durées sont égales (1 heure à 60 km/h puis 1 heure à 30 km/h), la distance totale est (60+30) et la vitesse moyenne est (60+30)/2 = 45 km/h.`,
            $localize`:@@mean_l5_s3_b2:Donc : distances égales → harmonique ; durées égales → arithmétique.`,
          ],
        },
        {
          title: $localize`:@@mean_l5_s4_title:Pièges fréquents`,
          bullets: [
            $localize`:@@mean_l5_s4_b1:Ne pas utiliser l’harmonique sur des valeurs négatives ou nulles (la formule demande des valeurs positives).`,
            $localize`:@@mean_l5_s4_b2:Toujours vérifier la condition “même unité de base” (même distance, même quantité).`,
            $localize`:@@mean_l5_s4_b3:Ne pas confondre “moyenne des vitesses” et “vitesse moyenne”.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_8',
          kind: 'number',
          prompt: $localize`:@@mean_l5_q1:Deux vitesses sur distances égales : 100 km/h puis 50 km/h. Vitesse moyenne ?`,
          correctNumber: 66.7,
          precision: 1,
          explanation: $localize`:@@mean_l5_q1_exp:Distances égales → harmonique : 2/(1/100+1/50)=2/(0,01+0,02)=2/0,03≈66,7.`,
        },
        {
          id: 'q_mean_9',
          kind: 'mcq',
          prompt: $localize`:@@mean_l5_q2:Pour une vitesse moyenne sur des distances égales, on utilise :`,
          choices: [
            { label: $localize`:@@mean_l5_q2_a:la moyenne arithmétique`, value: 'a' },
            { label: $localize`:@@mean_l5_q2_b:la moyenne harmonique`, value: 'b' },
            { label: $localize`:@@mean_l5_q2_c:la moyenne quadratique`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l5_q2_exp:Sur distances égales, le temps total dépend des inverses des vitesses → moyenne harmonique.`,
        },
      ],
    },

    // =========================================================
    // 6) MOYENNE QUADRATIQUE (RMS)
    // =========================================================
    {
      id: 'rms',
      title: $localize`:@@mean_l6_title:6) Moyenne quadratique (RMS)`,
      subtitle: $localize`:@@mean_l6_sub:La racine de la moyenne des carrés : très utilisée en physique, signaux, et erreurs.`,
      tags: [
        $localize`:@@mean_tag_rms:RMS`,
        $localize`:@@mean_tag_signal:signaux`,
        $localize`:@@mean_tag_error:erreur`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l6_s1_title:Définition`,
          bullets: [
            $localize`:@@mean_l6_s1_b1:La moyenne quadratique (RMS) se calcule en trois étapes : carré → moyenne → racine.`,
            $localize`:@@mean_l6_s1_b2:Elle est pertinente quand les valeurs peuvent être négatives mais qu’on veut une “amplitude” globale (le carré rend tout positif).`,
            $localize`:@@mean_l6_s1_b3:Le carré donne plus d’importance aux grandes valeurs : la RMS pénalise les écarts importants.`,
          ],
          formulaLatex: String.raw`\mathrm{RMS}=\sqrt{\frac{x_1^2+x_2^2+\cdots+x_n^2}{n}}`,
        },
        {
          title: $localize`:@@mean_l6_s2_title:Exemple`,
          bullets: [
            $localize`:@@mean_l6_s2_b1:Valeurs : 3 et 4.`,
            $localize`:@@mean_l6_s2_b2:Carrés : 9 et 16 ; moyenne des carrés : (9+16)/2=12,5.`,
            $localize`:@@mean_l6_s2_b3:Racine : √12,5 ≈ 3,536.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l6_s2_ex1:Calcul`,
              latex: String.raw`\mathrm{RMS}=\sqrt{\frac{3^2+4^2}{2}}=\sqrt{\frac{9+16}{2}}=\sqrt{12{,}5}\approx 3{,}536`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l6_s3_title:RMS vs moyenne arithmétique`,
          bullets: [
            $localize`:@@mean_l6_s3_b1:Si toutes les valeurs sont positives, la RMS est toujours ≥ moyenne arithmétique (en général).`,
            $localize`:@@mean_l6_s3_b2:La RMS met davantage l’accent sur les valeurs élevées.`,
            $localize`:@@mean_l6_s3_b3:Elle est souvent utilisée pour mesurer une “valeur efficace” (par exemple, en électricité).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_10',
          kind: 'number',
          prompt: $localize`:@@mean_l6_q1:Calcule la RMS de 0 et 10.`,
          correctNumber: 7.1,
          precision: 1,
          explanation: $localize`:@@mean_l6_q1_exp:RMS = sqrt((0²+10²)/2)=sqrt(100/2)=sqrt(50)≈7,1.`,
        },
      ],
    },

    // =========================================================
    // 7) MOYENNES ROBUSTES
    // =========================================================
    {
      id: 'robust',
      title: $localize`:@@mean_l7_title:7) Moyennes robustes : tronquée et winsorisée`,
      subtitle: $localize`:@@mean_l7_sub:Limiter l’impact des valeurs extrêmes quand la moyenne arithmétique est trop sensible.`,
      tags: [
        $localize`:@@mean_tag_robust:robuste`,
        $localize`:@@mean_tag_outliers:valeurs extrêmes`,
        $localize`:@@mean_tag_trimmed:tronquée`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l7_s1_title:Pourquoi des moyennes “robustes” ?`,
          bullets: [
            $localize`:@@mean_l7_s1_b1:Dans certaines séries, quelques valeurs aberrantes (erreurs de mesure, cas exceptionnels) faussent fortement la moyenne arithmétique.`,
            $localize`:@@mean_l7_s1_b2:On cherche alors un indicateur plus stable (moins influencé par les extrêmes).`,
            $localize`:@@mean_l7_s1_b3:La médiane est une option ; les moyennes tronquées ou winsorisées aussi.`,
          ],
        },
        {
          title: $localize`:@@mean_l7_s2_title:Moyenne tronquée (trimmed mean)`,
          bullets: [
            $localize`:@@mean_l7_s2_b1:On trie la série, puis on supprime une proportion des plus petites et des plus grandes valeurs (ex : 10% en bas et 10% en haut).`,
            $localize`:@@mean_l7_s2_b2:On calcule ensuite la moyenne arithmétique sur les valeurs restantes.`,
            $localize`:@@mean_l7_s2_b3:Plus la proportion tronquée est grande, plus l’indicateur est robuste, mais plus on perd d’information.`,
          ],
        },
        {
          title: $localize`:@@mean_l7_s3_title:Moyenne winsorisée (winsorized mean)`,
          bullets: [
            $localize`:@@mean_l7_s3_b1:Au lieu de supprimer les extrêmes, on les remplace par les valeurs “limites” (par exemple : tout ce qui est dans les 10% plus bas devient la valeur du 10e percentile, idem pour le haut).`,
            $localize`:@@mean_l7_s3_b2:On garde le même nombre de valeurs (pratique quand on veut conserver la taille d’échantillon).`,
            $localize`:@@mean_l7_s3_b3:Comme la tronquée, elle réduit l’influence des outliers.`,
          ],
        },
        {
          title: $localize`:@@mean_l7_s4_title:Quand utiliser ?`,
          bullets: [
            $localize`:@@mean_l7_s4_b1:Si tu suspectes des valeurs aberrantes (saisie erronée, capteurs, données bruitées).`,
            $localize`:@@mean_l7_s4_b2:Si la distribution est très asymétrique et que la moyenne arithmétique “ne représente personne”.`,
            $localize`:@@mean_l7_s4_b3:Si tu veux un compromis entre moyenne (efficace sur données “propres”) et médiane (très robuste).`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_11',
          kind: 'mcq',
          prompt: $localize`:@@mean_l7_q1:Une moyenne tronquée est utile surtout pour :`,
          choices: [
            { label: $localize`:@@mean_l7_q1_a:amplifier l’effet des valeurs extrêmes`, value: 'a' },
            { label: $localize`:@@mean_l7_q1_b:réduire l’impact des valeurs extrêmes`, value: 'b' },
            { label: $localize`:@@mean_l7_q1_c:calculer une croissance composée`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l7_q1_exp:La moyenne tronquée supprime une partie des valeurs extrêmes pour limiter leur influence.`,
        },
      ],
    },

    // =========================================================
    // 8) MOYENNE MOBILE
    // =========================================================
    {
      id: 'moving',
      title: $localize`:@@mean_l8_title:8) Moyenne mobile (moving average)`,
      subtitle: $localize`:@@mean_l8_sub:Lisser les variations à court terme pour révéler une tendance (données dans le temps).`,
      tags: [
        $localize`:@@mean_tag_moving:mobile`,
        $localize`:@@mean_tag_time:série temporelle`,
        $localize`:@@mean_tag_smoothing:lissage`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l8_s1_title:Principe`,
          bullets: [
            $localize`:@@mean_l8_s1_b1:Une moyenne mobile calcule une moyenne sur une fenêtre glissante de taille k (ex : 7 jours, 30 jours).`,
            $localize`:@@mean_l8_s1_b2:Elle réduit le “bruit” et met en évidence la tendance.`,
            $localize`:@@mean_l8_s1_b3:Plus la fenêtre est grande, plus la courbe est lissée… mais plus elle réagit lentement aux changements.`,
          ],
        },
        {
          title: $localize`:@@mean_l8_s2_title:Formule (moyenne mobile simple)`,
          bullets: [
            $localize`:@@mean_l8_s2_b1:À l’instant t, on moyenne les k dernières valeurs.`,
            $localize`:@@mean_l8_s2_b2:On peut aussi utiliser une moyenne mobile pondérée (donner plus de poids aux valeurs récentes).`,
          ],
          formulaLatex: String.raw`\mathrm{MA}_k(t)=\frac{x_t+x_{t-1}+\cdots+x_{t-k+1}}{k}`,
        },
        {
          title: $localize`:@@mean_l8_s3_title:Exemple (fenêtre k=3)`,
          bullets: [
            $localize`:@@mean_l8_s3_b1:Série : 10, 13, 9, 12, 11.`,
            $localize`:@@mean_l8_s3_b2:MA3 au 3e point = (10+13+9)/3 = 10,67.`,
            $localize`:@@mean_l8_s3_b3:MA3 au 4e point = (13+9+12)/3 = 11,33.`,
            $localize`:@@mean_l8_s3_b4:MA3 au 5e point = (9+12+11)/3 = 10,67.`,
          ],
        },
        {
          title: $localize`:@@mean_l8_s4_title:À quoi faire attention ?`,
          bullets: [
            $localize`:@@mean_l8_s4_b1:Une moyenne mobile “retarde” l’information : elle lisse mais introduit un décalage.`,
            $localize`:@@mean_l8_s4_b2:Elle ne remplace pas une analyse complète (saisonnalité, ruptures, outliers).`,
            $localize`:@@mean_l8_s4_b3:Si la fenêtre est trop grande, on perd des détails importants.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_12',
          kind: 'number',
          prompt: $localize`:@@mean_l8_q1:MA3 de (10, 13, 9) ?`,
          correctNumber: 10.7,
          precision: 1,
          explanation: $localize`:@@mean_l8_q1_exp:(10+13+9)/3 = 32/3 ≈ 10,7.`,
        },
      ],
    },

    // =========================================================
    // 9) EFFECTIFS / DONNÉES GROUPÉES
    // =========================================================
    {
      id: 'frequencies',
      title: $localize`:@@mean_l9_title:9) Moyenne avec effectifs (fréquences) et données groupées`,
      subtitle: $localize`:@@mean_l9_sub:Tableaux d’effectifs, fréquences, classes (intervalles) : calcul direct ou approximation par centres de classes.`,
      tags: [
        $localize`:@@mean_tag_frequency:fréquences`,
        $localize`:@@mean_tag_grouped:classes`,
        $localize`:@@mean_tag_table:tableaux`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l9_s1_title:Moyenne avec effectifs (fréquences)`,
          bullets: [
            $localize`:@@mean_l9_s1_b1:Quand une valeur x_i apparaît f_i fois, on peut utiliser une moyenne pondérée avec poids = f_i.`,
            $localize`:@@mean_l9_s1_b2:La somme des effectifs joue le rôle de n.`,
            $localize`:@@mean_l9_s1_b3:Très courant dans les tableaux statistiques (notes, âges, tailles…).`,
          ],
          formulaLatex: String.raw`\bar{x}=\frac{\sum_i f_i x_i}{\sum_i f_i}`,
        },
        {
          title: $localize`:@@mean_l9_s2_title:Exemple (tableau d’effectifs)`,
          bullets: [
            $localize`:@@mean_l9_s2_b1:10 (effectif 2), 12 (effectif 5), 14 (effectif 3).`,
            $localize`:@@mean_l9_s2_b2:Somme pondérée = 10×2 + 12×5 + 14×3 = 122.`,
            $localize`:@@mean_l9_s2_b3:Effectif total = 2+5+3 = 10.`,
            $localize`:@@mean_l9_s2_b4:Moyenne = 122/10 = 12,2.`,
          ],
          examples: [
            {
              label: $localize`:@@mean_l9_s2_ex1:Calcul`,
              latex: String.raw`\bar{x}=\frac{10\cdot2+12\cdot5+14\cdot3}{2+5+3}=\frac{122}{10}=12{,}2`,
            },
          ],
        },
        {
          title: $localize`:@@mean_l9_s3_title:Données groupées en classes (intervalles)`,
          bullets: [
            $localize`:@@mean_l9_s3_b1:Si les données sont regroupées par intervalles (classes), on ne connaît pas les valeurs exactes de chaque observation.`,
            $localize`:@@mean_l9_s3_b2:On approxime chaque classe par son centre (milieu de l’intervalle).`,
            $localize`:@@mean_l9_s3_b3:On calcule ensuite une moyenne pondérée avec les effectifs de classes.`,
            $localize`:@@mean_l9_s3_b4:C’est une estimation : des classes larges peuvent donner une approximation moins précise.`,
          ],
          // on retire la phrase en \text{...}
          formulaLatex: String.raw`\bar{x}\approx\frac{\sum_k f_k m_k}{\sum_k f_k}`,
        },
        {
          title: $localize`:@@mean_l9_s4_title:Conseils pratiques`,
          bullets: [
            $localize`:@@mean_l9_s4_b1:Si tu peux, préfère des classes plus fines (moins larges) pour une meilleure estimation.`,
            $localize`:@@mean_l9_s4_b2:Vérifie les unités : une moyenne n’a de sens que si toutes les valeurs sont dans la même unité.`,
            $localize`:@@mean_l9_s4_b3:Pour mieux comprendre la série, ajoute une mesure de dispersion (étendue, écart-type) en complément.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_13',
          kind: 'number',
          prompt: $localize`:@@mean_l9_q1:Valeurs 5 (effectif 4) et 9 (effectif 6). Moyenne ?`,
          correctNumber: 7.4,
          precision: 1,
          explanation: $localize`:@@mean_l9_q1_exp:(5×4 + 9×6)/(4+6) = (20+54)/10 = 7,4.`,
        },
      ],
    },

    // =========================================================
    // 10) CHOIX + PIÈGES
    // =========================================================
    {
      id: 'choose-traps',
      title: $localize`:@@mean_l10_title:10) Choisir la bonne moyenne et éviter les pièges`,
      subtitle: $localize`:@@mean_l10_sub:Moyenne trompeuse, moyenne des moyennes, erreurs d’interprétation, check-list de choix rapide.`,
      tags: [
        $localize`:@@mean_tag_traps:pièges`,
        $localize`:@@mean_tag_choice:choix`,
        $localize`:@@mean_tag_misleading:trompeuse`,
      ],
      sections: [
        {
          title: $localize`:@@mean_l10_s1_title:La moyenne peut être trompeuse`,
          bullets: [
            $localize`:@@mean_l10_s1_b1:Si une distribution est asymétrique (beaucoup de petites valeurs et quelques très grandes), la moyenne arithmétique peut ne représenter “personne”.`,
            $localize`:@@mean_l10_s1_b2:Exemple classique : salaires. Un petit nombre de salaires très élevés peut augmenter la moyenne.`,
            $localize`:@@mean_l10_s1_b3:Dans ce cas, la médiane est souvent plus représentative de la situation “typique”.`,
            $localize`:@@mean_l10_s1_b4:Réflexe : comparer moyenne et médiane + regarder la dispersion (étendue, écart-type, quartiles).`,
          ],
        },
        {
          title: $localize`:@@mean_l10_s2_title:Piège n°1 : la “moyenne des moyennes”`,
          bullets: [
            $localize`:@@mean_l10_s2_b1:Faire (moyenne A + moyenne B)/2 n’est correct que si A et B ont le même effectif.`,
            $localize`:@@mean_l10_s2_b2:Si les effectifs diffèrent, il faut pondérer par les effectifs.`,
            $localize`:@@mean_l10_s2_b3:C’est une erreur très fréquente dans les calculs de moyennes de classes, d’équipes, de groupes.`,
          ],
          formulaLatex: String.raw`\bar{x}=\frac{n_1\bar{x}_1+n_2\bar{x}_2+\cdots}{n_1+n_2+\cdots}`,
        },
        {
          title: $localize`:@@mean_l10_s3_title:Piège n°2 : vitesse moyenne (rappel)`,
          bullets: [
            $localize`:@@mean_l10_s3_b1:Distances égales → moyenne harmonique.`,
            $localize`:@@mean_l10_s3_b2:Durées égales → moyenne arithmétique.`,
            $localize`:@@mean_l10_s3_b3:Le piège vient du fait que la vitesse moyenne dépend du temps total, et le temps dépend de 1/v.`,
          ],
        },
        {
          title: $localize`:@@mean_l10_s4_title:Piège n°3 : additionner des pourcentages et “faire une moyenne”`,
          bullets: [
            $localize`:@@mean_l10_s4_b1:Si tu veux un taux moyen équivalent sur plusieurs périodes, ce n’est pas la moyenne arithmétique des pourcentages : c’est la moyenne géométrique des facteurs.`,
            $localize`:@@mean_l10_s4_b2:Exemple : +50% puis −50% → moyenne arithmétique des taux = 0% mais le résultat final est ×0,75.`,
            $localize`:@@mean_l10_s4_b3:La moyenne géométrique respecte la composition multiplicative.`,
          ],
          // bonus: formule math-only cohérente avec le bullet
          formulaLatex: String.raw`1{,}5\cdot0{,}5=0{,}75`,
        },
        {
          title: $localize`:@@mean_l10_s5_title:Check-list (choix rapide en 20 secondes)`,
          bullets: [
            $localize`:@@mean_l10_s5_b1:Est-ce que chaque valeur compte pareil ? → moyenne arithmétique.`,
            $localize`:@@mean_l10_s5_b2:Est-ce qu’il y a des coefficients, des quantités ou des durées ? → moyenne pondérée.`,
            $localize`:@@mean_l10_s5_b3:Est-ce que les effets se multiplient (croissance, rendements) ? → moyenne géométrique.`,
            $localize`:@@mean_l10_s5_b4:Est-ce que je moyenne un ratio “par unité” sur une base identique (distance/quantité) ? → moyenne harmonique.`,
            $localize`:@@mean_l10_s5_b5:Est-ce que je veux une amplitude/erreur globale qui pénalise les grandes valeurs ? → RMS.`,
            $localize`:@@mean_l10_s5_b6:Est-ce que les outliers faussent tout ? → moyenne tronquée / winsorisée (ou médiane).`,
            $localize`:@@mean_l10_s5_b7:Est-ce une série temporelle avec bruit ? → moyenne mobile.`,
          ],
        },
      ],
      quizzes: [
        {
          id: 'q_mean_14',
          kind: 'mcq',
          prompt: $localize`:@@mean_l10_q1:Deux classes : A (10 élèves, moyenne 12) et B (30 élèves, moyenne 8). La moyenne globale est :`,
          choices: [
            { label: $localize`:@@mean_l10_q1_a:(12+8)/2`, value: 'a' },
            { label: $localize`:@@mean_l10_q1_b:(10×12 + 30×8)/(10+30)`, value: 'b' },
            { label: $localize`:@@mean_l10_q1_c:12`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l10_q1_exp:Il faut pondérer par les effectifs : la classe B a 3 fois plus d’élèves.`,
        },
        {
          id: 'q_mean_15',
          kind: 'mcq',
          prompt: $localize`:@@mean_l10_q2:Pour des rendements successifs (effet composé), la bonne moyenne est :`,
          choices: [
            { label: $localize`:@@mean_l10_q2_a:arithmétique`, value: 'a' },
            { label: $localize`:@@mean_l10_q2_b:géométrique`, value: 'b' },
            { label: $localize`:@@mean_l10_q2_c:harmonique`, value: 'c' },
          ],
          correctChoice: 'b',
          explanation: $localize`:@@mean_l10_q2_exp:Les rendements se multiplient : la moyenne géométrique donne le facteur moyen équivalent.`,
        },
      ],
    },
  ],
};
