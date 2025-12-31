import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_percentages_percentage_exercises_generator_title:À propos : Générateur d’exercices`,
  lead: $localize`:@@ed_math_percentages_percentage_exercises_generator_lead:Ce générateur permet de créer automatiquement des exercices sur les pourcentages, avec des questions variées et des corrections, pour s’entraîner efficacement et progresser.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_exercises_generator_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_percentages_percentage_exercises_generator_uc1_title:Réviser les pourcentages`,
          text: $localize`:@@ed_math_percentages_percentage_exercises_generator_uc1_text:Idéal pour s’entraîner avant un contrôle, un examen ou un concours, avec des exercices renouvelés à chaque utilisation.`,
        },
        {
          title: $localize`:@@ed_math_percentages_percentage_exercises_generator_uc2_title:Enseigner ou accompagner`,
          text: $localize`:@@ed_math_percentages_percentage_exercises_generator_uc2_text:Utile pour les enseignants, parents ou formateurs souhaitant proposer rapidement des exercices adaptés.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_percentages_percentage_exercises_generator_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_percentages_percentage_exercises_generator_out1:Une série d’exercices générés automatiquement, couvrant différents types de calculs de pourcentages.`,
        $localize`:@@ed_math_percentages_percentage_exercises_generator_out2:Des énoncés clairs avec des données variées pour éviter l’apprentissage par cœur.`,
        $localize`:@@ed_math_percentages_percentage_exercises_generator_out3:Des corrections ou résultats permettant de vérifier immédiatement sa compréhension.`,
        $localize`:@@ed_math_percentages_percentage_exercises_generator_out4:Un outil d’entraînement complémentaire aux calculateurs et aux pages de cours.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_percentages_percentage_exercises_generator_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_percentages_percentage_exercises_generator_lim1:Ce générateur vise l’entraînement, pas l’évaluation officielle ou notée.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_exercises_generator_lim2:Il est recommandé de comprendre les méthodes de calcul avant de multiplier les exercices.`,
        },
        {
          text: $localize`:@@ed_math_percentages_percentage_exercises_generator_lim3:Les exercices sont génériques et ne remplacent pas un cours structuré.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_percentages_percentage_exercises_generator_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_percentages_percentage_exercises_generator_q1:À quel niveau s’adresse ce générateur ?`,
          a: $localize`:@@ed_math_percentages_percentage_exercises_generator_a1:Il convient aussi bien aux élèves qu’aux adultes souhaitant réviser les bases ou consolider leurs acquis.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_exercises_generator_q2:Les exercices sont-ils toujours les mêmes ?`,
          a: $localize`:@@ed_math_percentages_percentage_exercises_generator_a2:Non, les valeurs et les situations changent afin de proposer un entraînement varié.`,
        },
        {
          q: $localize`:@@ed_math_percentages_percentage_exercises_generator_q3:Dois-je utiliser les calculateurs en parallèle ?`,
          a: $localize`:@@ed_math_percentages_percentage_exercises_generator_a3:Oui, les calculateurs sont complémentaires pour vérifier un résultat ou comprendre une méthode précise.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_percentages_percentage_exercises_generator_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_percentages_percentage_exercises_generator_tip:Alternez exercices et outils de calcul : comprendre la méthode puis s’entraîner est la meilleure façon de maîtriser les pourcentages.`,
    },
  ],
};
