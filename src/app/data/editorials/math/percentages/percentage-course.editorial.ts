import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_course_title:À propos : Cours complet sur les pourcentages`,
  lead: $localize`:@@ed_math_percentages_percentage_course_lead:Ce cours propose une compréhension complète des pourcentages : définition, méthodes de calcul, interprétation correcte et pièges courants, avec des liens vers les outils adaptés à chaque situation.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_course_usecases:À qui s’adresse ce cours ?`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_course_uc1_title:Apprendre ou réviser les bases`,
          text: $localize`:@@ed_math_percentages_percentage_course_uc1_text:Idéal pour comprendre ce qu’est réellement un pourcentage et comment l’utiliser correctement.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_course_uc2_title:Choisir le bon type de calcul`,
          text: $localize`:@@ed_math_percentages_percentage_course_uc2_text:Ce cours aide à identifier quel outil utiliser selon la question posée (variation, part, erreur, cumul, etc.).`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_course_uc3_title:Éviter les erreurs classiques`,
          text: $localize`:@@ed_math_percentages_percentage_course_uc3_text:Comprendre pourquoi certains raisonnements sur les pourcentages sont faux ou trompeurs.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_course_uc4_title:Accompagner un apprentissage`,
          text: $localize`:@@ed_math_percentages_percentage_course_uc4_text:Utile pour les élèves, parents, enseignants ou toute personne souhaitant expliquer les pourcentages.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_course_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_course_out1:Une vision claire et structurée des différents types de calculs de pourcentages.`,
        $localize`:@@ed_math_percentages_percentage_course_out2:Des explications conceptuelles pour comprendre le sens des résultats, pas seulement les formules.`,
        $localize`:@@ed_math_percentages_percentage_course_out3:Des passerelles directes vers les outils adaptés à chaque situation.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_course_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_course_lim1:Ce cours n’est pas un calculateur : pour obtenir un résultat chiffré, il faut utiliser les outils dédiés.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_course_lim2:La compréhension des pourcentages nécessite parfois de manipuler plusieurs notions proches mais différentes.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_course_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_course_q1:Pourquoi y a-t-il autant d’outils pour les pourcentages ?`,
          a: $localize`:@@ed_math_percentages_percentage_course_a1:Parce que des questions différentes nécessitent des raisonnements différents : part, variation, erreur, cumul ou équivalence ne se calculent pas de la même façon.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_course_q2:Ce cours remplace-t-il les outils ?`,
          a: $localize`:@@ed_math_percentages_percentage_course_a2:Non. Il sert à comprendre et orienter, tandis que les outils servent à calculer précisément.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_course_q3:Est-ce adapté aux débutants ?`,
          a: $localize`:@@ed_math_percentages_percentage_course_a3:Oui. Le contenu est conçu pour être progressif et accessible, même sans bases solides.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_course_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_course_tip:Si vous hésitez entre plusieurs outils, commencez par ce cours : il vous aidera à formuler correctement votre question avant de calculer.`,
    },
  ],
};
