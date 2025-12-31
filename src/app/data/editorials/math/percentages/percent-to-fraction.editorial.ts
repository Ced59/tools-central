import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percent_to_fraction_title:À propos : Pourcentage ↔ fraction`,
  lead: $localize`:@@ed_math_percentages_percent_to_fraction_lead:Ce convertisseur permet de passer d’un pourcentage à une fraction (et inversement), en simplifiant la fraction lorsque c’est possible, pour mieux comprendre et manipuler les proportions.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percent_to_fraction_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percent_to_fraction_uc1_title:Exercices scolaires et révisions`,
          text: $localize`:@@ed_math_percentages_percent_to_fraction_uc1_text:Convertir 25 % en 1/4, 12,5 % en 1/8, ou 3/5 en 60 % pour vérifier une réponse.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_to_fraction_uc2_title:Comprendre une proportion`,
          text: $localize`:@@ed_math_percentages_percent_to_fraction_uc2_text:Une fraction simplifiée est parfois plus parlante qu’un pourcentage, notamment pour les proportions “classiques”.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_to_fraction_uc3_title:Passer entre écritures (fraction ↔ % ↔ décimal)`,
          text: $localize`:@@ed_math_percentages_percent_to_fraction_uc3_text:Utile pour naviguer entre différentes formes d’écriture d’une même valeur, selon le contexte.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_to_fraction_uc4_title:Résoudre une règle de trois`,
          text: $localize`:@@ed_math_percentages_percent_to_fraction_uc4_text:Transformer un taux en fraction peut faciliter certains calculs mentaux ou la mise en équation.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percent_to_fraction_uc5_title:Vérifier une simplification`,
          text: $localize`:@@ed_math_percentages_percent_to_fraction_uc5_text:Éviter les erreurs de réduction de fraction en obtenant automatiquement une forme irréductible.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percent_to_fraction_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percent_to_fraction_out1:La conversion d’un pourcentage en fraction, avec une fraction simplifiée lorsque c’est possible.`,
        $localize`:@@ed_math_percentages_percent_to_fraction_out2:La conversion d’une fraction en pourcentage, utile pour interpréter rapidement une proportion.`,
        $localize`:@@ed_math_percentages_percent_to_fraction_out3:Un résultat clair et exploitable pour les exercices, les contrôles et les calculs du quotidien.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percent_to_fraction_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percent_to_fraction_lim1:Certains pourcentages donnent des fractions avec de grands dénominateurs (ex. 33,33 %), selon l’arrondi choisi.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percent_to_fraction_lim2:Une fraction peut produire un pourcentage non “propre” (avec décimales), ce qui est normal.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percent_to_fraction_lim3:Si vous cherchez une part sur total ou une variation, utilisez plutôt les outils dédiés aux pourcentages (ceci est un convertisseur d’écriture).`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percent_to_fraction_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percent_to_fraction_q1:Comment convertir un pourcentage en fraction ?`,
          a: $localize`:@@ed_math_percentages_percent_to_fraction_a1:On écrit le pourcentage sur 100 (ex. 25 % = 25/100) puis on simplifie la fraction.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percent_to_fraction_q2:Comment convertir une fraction en pourcentage ?`,
          a: $localize`:@@ed_math_percentages_percent_to_fraction_a2:On transforme la fraction en nombre décimal (division) puis on multiplie par 100.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percent_to_fraction_q3:Pourquoi 12,5 % devient 1/8 ?`,
          a: $localize`:@@ed_math_percentages_percent_to_fraction_a3:Parce que 12,5 % = 12,5/100 = 0,125, et 0,125 = 1/8.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percent_to_fraction_q4:Est-ce que 33,33 % vaut exactement 1/3 ?`,
          a: $localize`:@@ed_math_percentages_percent_to_fraction_a4:Pas exactement : 1/3 = 33,333… %. 33,33 % est une approximation arrondie.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percent_to_fraction_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percent_to_fraction_tip:Certains pourcentages “classiques” se mémorisent facilement : 50 % = 1/2, 25 % = 1/4, 20 % = 1/5, 12,5 % = 1/8.`,
    },
  ],
};
