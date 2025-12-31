import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_limits_title:À propos : Limites des pourcentages`,
  lead: $localize`:@@ed_math_percentages_percentage_limits_lead:Ce module met en évidence les situations où les pourcentages peuvent induire en erreur, perdre leur sens ou conduire à de mauvaises interprétations.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_limits_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_limits_uc1_title:Décrypter une information trompeuse`,
          text: $localize`:@@ed_math_percentages_percentage_limits_uc1_text:Analyser des phrases comme “augmentation de 100 %” ou “baisse de 50 %” pour comprendre ce qu’elles signifient réellement.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_limits_uc2_title:Éviter les erreurs de raisonnement`,
          text: $localize`:@@ed_math_percentages_percentage_limits_uc2_text:Identifier les pièges fréquents liés aux bases de calcul, aux comparaisons incorrectes ou aux pourcentages cumulés.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_limits_uc3_title:Mieux interpréter des statistiques`,
          text: $localize`:@@ed_math_percentages_percentage_limits_uc3_text:Comprendre pourquoi certains pourcentages paraissent impressionnants alors que les valeurs absolues restent faibles.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_limits_uc4_title:Apprendre ou enseigner les pourcentages`,
          text: $localize`:@@ed_math_percentages_percentage_limits_uc4_text:Outil pédagogique pour expliquer les limites conceptuelles des pourcentages en mathématiques, économie ou sciences sociales.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_limits_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_limits_out1:Des explications claires sur les situations où les pourcentages ne suffisent pas à décrire correctement une réalité.`,
        $localize`:@@ed_math_percentages_percentage_limits_out2:Des exemples concrets montrant les erreurs d’interprétation les plus courantes.`,
        $localize`:@@ed_math_percentages_percentage_limits_out3:Une aide à la prise de recul face aux chiffres exprimés uniquement en pourcentage.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_limits_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_limits_lim1:Un pourcentage n’a de sens que si la base de calcul est clairement définie.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_limits_lim2:Les variations successives en pourcentage ne sont pas additives (ex. −50 % puis +50 % ne ramènent pas à la valeur initiale).`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_limits_lim3:Un pourcentage élevé peut masquer une valeur absolue très faible.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_limits_lim4:Comparer des pourcentages calculés sur des bases différentes peut être trompeur.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_limits_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_limits_q1:Pourquoi dit-on que les pourcentages peuvent être trompeurs ?`,
          a: $localize`:@@ed_math_percentages_percentage_limits_a1:Parce qu’ils masquent souvent la valeur de départ, la taille réelle des quantités ou les différences de base utilisées.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_limits_q2:Un pourcentage suffit-il toujours pour comparer deux situations ?`,
          a: $localize`:@@ed_math_percentages_percentage_limits_a2:Non. Il est souvent nécessaire de regarder aussi les valeurs absolues ou le contexte du calcul.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_limits_q3:Est-ce un outil de calcul ?`,
          a: $localize`:@@ed_math_percentages_percentage_limits_a3:Non. Cet outil sert à comprendre les limites conceptuelles des pourcentages et à éviter les erreurs d’interprétation.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_limits_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_limits_tip:Face à un pourcentage, posez toujours la question “par rapport à quoi ?” : la base est souvent plus importante que le chiffre lui-même.`,
    },
  ],
};
