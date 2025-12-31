import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_direct_proportionality_title:À propos : Proportionnalité directe`,
  lead: $localize`:@@ed_math_direct_proportionality_lead:Comprendre et reconnaître une relation de proportionnalité directe, savoir l’utiliser pour calculer une valeur manquante et éviter les confusions avec d’autres relations.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_direct_proportionality_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_direct_proportionality_uc1_title:Prix et quantités`,
          text: $localize`:@@ed_math_direct_proportionality_uc1_text:Calculer le prix total en fonction d’une quantité achetée quand le prix unitaire est constant.`,
        },
        {
          title: $localize`:@@ed_math_direct_proportionality_uc2_title:Conversions simples`,
          text: $localize`:@@ed_math_direct_proportionality_uc2_text:Convertir des unités (distance, masse, durée) lorsque le rapport entre grandeurs est constant.`,
        },
        {
          title: $localize`:@@ed_math_direct_proportionality_uc3_title:Tableaux de proportionnalité`,
          text: $localize`:@@ed_math_direct_proportionality_uc3_text:Compléter, vérifier ou corriger un tableau de valeurs proportionnelles.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_direct_proportionality_output:Ce que vous apprenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_direct_proportionality_out1:La définition claire d’une proportionnalité directe et les critères pour la reconnaître.`,
        $localize`:@@ed_math_direct_proportionality_out2:Les méthodes de calcul (coefficient, passage à l’unité, produit en croix) applicables dans tous les exercices.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_direct_proportionality_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_direct_proportionality_lim1:Toutes les relations linéaires ne sont pas proportionnelles (attention aux constantes ajoutées).` },
        { text: $localize`:@@ed_math_direct_proportionality_lim2:Les unités doivent être cohérentes avant tout calcul.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_direct_proportionality_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_direct_proportionality_q1:Comment savoir si deux grandeurs sont proportionnelles ?`,
          a: $localize`:@@ed_math_direct_proportionality_a1:Si le rapport entre les valeurs reste constant, la relation est proportionnelle.`,
        },
        {
          q: $localize`:@@ed_math_direct_proportionality_q2:Peut-on utiliser la règle de trois dans tous les cas ?`,
          a: $localize`:@@ed_math_direct_proportionality_a2:Oui, uniquement si la relation est bien proportionnelle.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_direct_proportionality_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_direct_proportionality_tip:Avant de calculer, vérifie toujours si doubler une valeur double bien l’autre : c’est le test le plus rapide.`,
    },
  ],
};
