import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_title:À propos : Cours règle de trois`,
  lead: $localize`:@@ed_math_rule_of_three_rule_of_three_course_lead:Ce cours complet sur la règle de trois vous apprend à résoudre tous les problèmes de proportionnalité : règle de trois directe et inverse, méthode du passage à l’unité, produit en croix, tableaux de proportionnalité, et vérifications rapides pour éviter les erreurs. L’objectif est de savoir identifier le bon type de relation et calculer une valeur manquante de façon fiable.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_rule_of_three_rule_of_three_course_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc1_title:Résoudre un exercice “3 valeurs connues, 1 inconnue”`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc1_text:Mettre les valeurs dans un tableau et trouver rapidement la 4e valeur (directe ou inverse).`,
        },
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc2_title:Calculer un prix, une quantité ou un dosage`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc2_text:Prix au kilo, recette pour plus/moins de personnes, dilution, dosage, consommation… avec unités cohérentes.`,
        },
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc3_title:Comprendre et vérifier une proportionnalité`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc3_text:Savoir tester si c’est bien proportionnel (ratio constant) ou si c’est l’inverse (produit constant) avant de calculer.`,
        },
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc4_title:Utiliser un tableau de proportionnalité`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc4_text:Retrouver le coefficient k, compléter un tableau, et contrôler la cohérence des résultats.`,
        },
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc5_title:Réviser pour un contrôle / examen`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc5_text:Retenir les méthodes (passage à l’unité, produit en croix), les formules utiles et les pièges classiques.`,
        },
        {
          title: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc6_title:S’entraîner avec des quiz corrigés`,
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_uc6_text:Des QCM et exercices numériques pour automatiser le bon réflexe (directe vs inverse + unités).`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_rule_of_three_rule_of_three_course_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_rule_of_three_rule_of_three_course_out1:Un cours clair et progressif : définition de la proportionnalité, test rapide (directe/inverse), puis méthodes de calcul pas à pas.`,
        $localize`:@@ed_math_rule_of_three_rule_of_three_course_out2:Les deux grandes méthodes : passage à l’unité (intuitif) et produit en croix (rapide et standard), avec tableaux et exemples.`,
        $localize`:@@ed_math_rule_of_three_rule_of_three_course_out3:Un chapitre “tableau de proportionnalité” pour compléter facilement via le coefficient k.`,
        $localize`:@@ed_math_rule_of_three_rule_of_three_course_out4:Une partie “proportionnalité inverse” (produit constant) avec cas typiques et mini-tests de cohérence.`,
        $localize`:@@ed_math_rule_of_three_rule_of_three_course_out5:Des quiz corrigés pour vérifier que vous savez choisir la bonne relation, gérer les unités, et appliquer la bonne formule.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_rule_of_three_rule_of_three_course_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_lim1:La règle de trois ne s’applique que s’il y a proportionnalité (directe ou inverse). Si la relation n’est pas proportionnelle, le résultat sera faux même si le calcul est “bien fait”.`,
        },
        {
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_lim2:Les unités doivent être cohérentes (minutes/heures, grammes/kilos, €/kg…). Une conversion oubliée est une des causes n°1 d’erreur.`,
        },
        {
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_lim3:Attention au sens (directe vs inverse) : si vous vous trompez de relation, vous obtiendrez un résultat “possible” mais incohérent avec la logique du problème.`,
        },
        {
          text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_lim4:Sur des nombres avec beaucoup de décimales, gardez une précision suffisante pendant le calcul (arrondir trop tôt peut fausser le résultat final).`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_rule_of_three_rule_of_three_course_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_rule_of_three_rule_of_three_course_q1:Comment savoir si c’est une proportionnalité directe ou inverse ?`,
          a: $localize`:@@ed_math_rule_of_three_rule_of_three_course_a1:Directe : si A augmente, B augmente (ratio constant). Inverse : si A augmente, B diminue (produit A×B constant). Un mini-test mental avant de calculer évite la plupart des erreurs.`,
        },
        {
          q: $localize`:@@ed_math_rule_of_three_rule_of_three_course_q2:Le produit en croix marche-t-il toujours ?`,
          a: $localize`:@@ed_math_rule_of_three_rule_of_three_course_a2:Oui si (et seulement si) la relation est proportionnelle et que le tableau est correctement construit (mêmes grandeurs sur une même colonne) avec des unités cohérentes.`,
        },
        {
          q: $localize`:@@ed_math_rule_of_three_rule_of_three_course_q3:Quelle méthode choisir : passage à l’unité ou produit en croix ?`,
          a: $localize`:@@ed_math_rule_of_three_rule_of_three_course_a3:Le passage à l’unité est très intuitif quand les nombres sont simples. Le produit en croix est plus rapide et standard (surtout en contrôle), à condition de bien placer les valeurs.`,
        },
        {
          q: $localize`:@@ed_math_rule_of_three_rule_of_three_course_q4:Que faire si je n’ai pas exactement “3 valeurs et une inconnue” ?`,
          a: $localize`:@@ed_math_rule_of_three_rule_of_three_course_a4:On peut souvent simplifier : convertir les unités, ramener à une situation équivalente (par unité, par personne…), ou décomposer en plusieurs règles de trois successives.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_rule_of_three_rule_of_three_course_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_rule_of_three_rule_of_three_course_tip:Avant de calculer, faites le “test de sens” : si la quantité de départ augmente, est-ce que le résultat doit augmenter ou diminuer ? Si votre calcul donne l’inverse, c’est que vous avez inversé directe/inverse ou mal rempli le tableau.`,
    },
  ],
};
