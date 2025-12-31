import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_fractions_fraction_to_percent_title:À propos : Fraction → %`,
  lead: $localize`:@@ed_math_fractions_fraction_to_percent_lead:Ce convertisseur transforme une fraction en pourcentage afin d’exprimer une proportion de manière plus intuitive, que ce soit pour des exercices, des statistiques ou des données du quotidien.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_to_percent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_fractions_fraction_to_percent_uc1_title:Exprimer une part en %`,
          text: $localize`:@@ed_math_fractions_fraction_to_percent_uc1_text:Transformer 1/4 en 25 % ou 3/5 en 60 % pour communiquer clairement une proportion.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_percent_uc2_title:Comprendre des résultats`,
          text: $localize`:@@ed_math_fractions_fraction_to_percent_uc2_text:Passer d’une fraction à un pourcentage pour interpréter plus facilement un score, un taux ou une réussite.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_percent_uc3_title:Statistiques et probabilités`,
          text: $localize`:@@ed_math_fractions_fraction_to_percent_uc3_text:Convertir une probabilité écrite en fraction en pourcentage (ex. 3/20 → 15 %).`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_percent_uc4_title:Vérifier un exercice`,
          text: $localize`:@@ed_math_fractions_fraction_to_percent_uc4_text:Contrôler rapidement une conversion demandée dans un devoir ou un contrôle.`,
        },
        {
          title: $localize`:@@ed_math_fractions_fraction_to_percent_uc5_title:Préparer un tableau ou un rapport`,
          text: $localize`:@@ed_math_fractions_fraction_to_percent_uc5_text:Passer à une présentation en % pour des graphiques, des KPI ou des synthèses.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_fractions_fraction_to_percent_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_fractions_fraction_to_percent_out1:Le pourcentage correspondant à la fraction saisie (conversion exacte quand c’est possible).`,
        $localize`:@@ed_math_fractions_fraction_to_percent_out2:Un résultat lisible pour exprimer une proportion, un taux ou une réussite.`,
        $localize`:@@ed_math_fractions_fraction_to_percent_out3:Un pourcentage exploitable même lorsque la fraction produit une valeur périodique (avec un arrondi).`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_fractions_fraction_to_percent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_fractions_fraction_to_percent_lim1:Le dénominateur ne doit jamais être égal à zéro.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_to_percent_lim2:Certaines fractions donnent un pourcentage infini périodique (ex. 1/3 = 33,333… %), ce qui nécessite un arrondi.`,
        },
        {
          text: $localize`:@@ed_math_fractions_fraction_to_percent_lim3:Une fraction supérieure à 1 correspond à un pourcentage supérieur à 100 % (ex. 5/4 = 125 %).`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_fractions_fraction_to_percent_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_fractions_fraction_to_percent_q1:Comment convertir une fraction en pourcentage ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_percent_a1:On divise le numérateur par le dénominateur pour obtenir un décimal, puis on multiplie par 100.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_percent_q2:Pourquoi 1/2 vaut 50 % ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_percent_a2:Parce que 1/2 = 0,5 et 0,5 × 100 = 50 %.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_percent_q3:Pourquoi 1/3 ne donne pas un pourcentage “propre” ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_percent_a3:Parce que 1/3 = 0,333… à l’infini, donc le pourcentage est 33,333… % : on arrondit.`,
        },
        {
          q: $localize`:@@ed_math_fractions_fraction_to_percent_q4:Quelle différence avec “% ↔ fraction” ?`,
          a: $localize`:@@ed_math_fractions_fraction_to_percent_a4:Ici on part d’une fraction pour obtenir un pourcentage. L’outil “% ↔ fraction” convertit dans les deux sens et vise souvent une fraction simplifiée sur 100.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_fractions_fraction_to_percent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_fractions_fraction_to_percent_tip:Si la fraction se simplifie en un dénominateur de 2, 4, 5, 10, 20, 25, 50 ou 100, vous obtenez souvent un pourcentage “propre” sans calcul compliqué.`,
    },
  ],
};
