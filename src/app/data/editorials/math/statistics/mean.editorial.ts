import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_statistics_mean_title:À propos : Moyenne`,
  lead: $localize`:@@ed_math_statistics_mean_lead:Calculez la moyenne arithmétique d’une série en additionnant toutes les valeurs, puis en divisant cette somme par leur nombre.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_usecases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        { title: $localize`:@@ed_math_statistics_mean_uc1_title:Notes scolaires`, text: $localize`:@@ed_math_statistics_mean_uc1_text:Obtenir la note moyenne d’une série d’évaluations lorsque chaque note a le même poids.` },
        { title: $localize`:@@ed_math_statistics_mean_uc2_title:Mesures répétées`, text: $localize`:@@ed_math_statistics_mean_uc2_text:Résumer des températures, durées ou distances relevées dans les mêmes conditions.` },
        { title: $localize`:@@ed_math_statistics_mean_uc3_title:Contrôle rapide`, text: $localize`:@@ed_math_statistics_mean_uc3_text:Comparer le niveau moyen de deux séries exprimées dans la même unité.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_statistics_mean_output:Ce que vous obtenez`,
      icon: 'tc-icon tc-icon-database',
      paragraphs: [
        $localize`:@@ed_math_statistics_mean_out1:La somme des valeurs, leur nombre et la moyenne arithmétique correspondante.`,
        $localize`:@@ed_math_statistics_mean_out2:Par exemple, pour 8, 10 et 15, la somme vaut 33 et la moyenne vaut 11.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_statistics_mean_limits:Limites et points d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_statistics_mean_lim1:Une valeur très élevée ou très faible peut déplacer fortement la moyenne ; consultez aussi la médiane pour une série asymétrique.` },
        { text: $localize`:@@ed_math_statistics_mean_lim2:Une moyenne simple ne convient pas si les valeurs ont des coefficients différents : utilisez alors une moyenne pondérée.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_statistics_mean_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        { q: $localize`:@@ed_math_statistics_mean_q1:La moyenne doit-elle être l’une des valeurs de la série ?`, a: $localize`:@@ed_math_statistics_mean_a1:Non. La moyenne de 1 et 2 est 1,5, même si 1,5 n’apparaît pas dans la série.` },
        { q: $localize`:@@ed_math_statistics_mean_q2:Peut-on calculer la moyenne d’une série vide ?`, a: $localize`:@@ed_math_statistics_mean_a2:Non. Sans valeur, le nombre d’éléments est nul et la division nécessaire n’est pas définie.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_statistics_mean_tip_title:Astuce`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_statistics_mean_tip:Vérifiez que toutes les valeurs utilisent la même unité avant le calcul ; additionner des euros et des pourcentages n’a pas de sens.`,
    },
  ],
};
