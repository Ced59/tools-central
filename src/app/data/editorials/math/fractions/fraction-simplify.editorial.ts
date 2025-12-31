import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fraction_simplify_title:À propos : Simplification de fractions`,
  lead: $localize`:@@ed_math_fractions_fraction_simplify_lead:Cet outil réduit une fraction à sa forme la plus simple (irréductible) en divisant le numérateur et le dénominateur par leur plus grand diviseur commun, sans changer la valeur de la fraction.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_simplify_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fraction_simplify_uc1_title:Vérifier un résultat`,
          text: $localize`:@@ed_math_fractions_fraction_simplify_uc1_text:Contrôler qu’une fraction comme 18/24 peut bien être réduite à 3/4.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_simplify_uc2_title:Préparer un calcul`,
          text: $localize`:@@ed_math_fractions_fraction_simplify_uc2_text:Simplifier une fraction avant une addition, multiplication ou comparaison.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_simplify_uc3_title:Rendre une fraction lisible`,
          text: $localize`:@@ed_math_fractions_fraction_simplify_uc3_text:Présenter un résultat clair et standard dans un devoir, un document ou un rapport.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_simplify_uc4_title:Identifier des fractions équivalentes`,
          text: $localize`:@@ed_math_fractions_fraction_simplify_uc4_text:Montrer que 2/4, 3/6 et 1/2 représentent la même valeur.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_simplify_uc5_title:Éviter les erreurs de comparaison`,
          text: $localize`:@@ed_math_fractions_fraction_simplify_uc5_text:Comparer des fractions après les avoir mises sous forme irréductible.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fraction_simplify_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fraction_simplify_out1:La fraction simplifiée sous sa forme irréductible.`,
        $localize`:@@ed_math_fractions_fraction_simplify_out2:Une écriture mathématiquement équivalente mais plus courte et plus lisible.`,
        $localize`:@@ed_math_fractions_fraction_simplify_out3:Un résultat prêt à être utilisé dans d’autres opérations ou comparaisons.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_simplify_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fraction_simplify_lim1:Le dénominateur ne doit jamais être égal à zéro.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_simplify_lim2:Une fraction déjà irréductible ne peut pas être simplifiée davantage.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_simplify_lim3:La simplification ne change pas la valeur numérique de la fraction.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fraction_simplify_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fraction_simplify_q1:Comment savoir si une fraction est irréductible ?`,
          a: $localize`:@@ed_math_fractions_fraction_simplify_a1:Elle est irréductible lorsque le numérateur et le dénominateur n’ont pas de diviseur commun autre que 1.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_simplify_q2:Pourquoi simplifier une fraction ?`,
          a: $localize`:@@ed_math_fractions_fraction_simplify_a2:Pour obtenir une écriture plus claire et faciliter les calculs et comparaisons.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_simplify_q3:Est-ce obligatoire de simplifier ?`,
          a: $localize`:@@ed_math_fractions_fraction_simplify_a3:En mathématiques scolaires et scientifiques, on attend généralement une fraction sous forme simplifiée.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_simplify_q4:Quelle méthode utilise l’outil ?`,
          a: $localize`:@@ed_math_fractions_fraction_simplify_a4:Il s’appuie sur le plus grand diviseur commun (PGCD) du numérateur et du dénominateur.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fraction_simplify_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fraction_simplify_tip:Si les deux nombres sont pairs ou multiples d’un même nombre, commencez par diviser par ce facteur avant de chercher le PGCD.`,
    },
  ],
};
