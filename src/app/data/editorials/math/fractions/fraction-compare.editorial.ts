import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fraction_compare_title:À propos : Comparaison de fractions`,
  lead: $localize`:@@ed_math_fractions_fraction_compare_lead:Cet outil compare deux fractions pour déterminer laquelle est la plus grande, la plus petite ou si elles sont égales, en appliquant une méthode mathématique fiable et compréhensible.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_compare_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fraction_compare_uc1_title:Vérifier un exercice`,
          text: $localize`:@@ed_math_fractions_fraction_compare_uc1_text:Comparer rapidement des fractions comme 3/4 et 5/6 pour valider une réponse.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_compare_uc2_title:Classer des valeurs`,
          text: $localize`:@@ed_math_fractions_fraction_compare_uc2_text:Déterminer l’ordre croissant ou décroissant de plusieurs fractions.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_compare_uc3_title:Comparer des proportions`,
          text: $localize`:@@ed_math_fractions_fraction_compare_uc3_text:Savoir quelle part est la plus importante sans convertir mentalement en décimal.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_compare_uc4_title:Éviter les erreurs intuitives`,
          text: $localize`:@@ed_math_fractions_fraction_compare_uc4_text:Comparer correctement des fractions “piégeuses” comme 1/8 et 1/6.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fraction_compare_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fraction_compare_out1:Une indication claire : fraction A > fraction B, fraction A < fraction B ou égalité.`,
        $localize`:@@ed_math_fractions_fraction_compare_out2:Une comparaison fiable basée sur une méthode mathématique (dénominateur commun ou produit en croix).`,
        $localize`:@@ed_math_fractions_fraction_compare_out3:Un résultat immédiatement exploitable pour classer, décider ou poursuivre un calcul.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_compare_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fraction_compare_lim1:Les dénominateurs ne doivent jamais être égaux à zéro.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_compare_lim2:Comparer via une approximation décimale peut introduire des erreurs si les valeurs sont arrondies.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_compare_lim3:Deux fractions différentes peuvent représenter la même valeur (ex. 1/2 et 2/4).`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fraction_compare_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fraction_compare_q1:Comment comparer deux fractions avec des dénominateurs différents ?`,
          a: $localize`:@@ed_math_fractions_fraction_compare_a1:On peut utiliser un dénominateur commun ou comparer les produits en croix.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_compare_q2:Pourquoi 1/6 est plus grand que 1/8 ?`,
          a: $localize`:@@ed_math_fractions_fraction_compare_a2:Parce qu’avec le même numérateur, plus le dénominateur est petit, plus la fraction est grande.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_compare_q3:Deux fractions peuvent-elles être égales ?`,
          a: $localize`:@@ed_math_fractions_fraction_compare_a3:Oui, par exemple 1/2 et 2/4 représentent la même valeur.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_compare_q4:Pourquoi ne pas toujours convertir en décimal ?`,
          a: $localize`:@@ed_math_fractions_fraction_compare_a4:La conversion décimale peut être arrondie, alors que la comparaison par fractions est exacte.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fraction_compare_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fraction_compare_tip:Pour comparer rapidement à la main, utilisez le produit en croix : comparez a×d et b×c pour a/b et c/d.`,
    },
  ],
};
