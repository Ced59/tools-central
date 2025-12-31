import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Editorial content for ratio → percent tool.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratios_ratio_to_percent_title:À propos : Ratio → pourcentage`,
  lead: $localize`:@@ed_math_ratios_ratio_to_percent_lead:
Convertir un ratio en pourcentage permet d’exprimer une part de manière intuitive et comparable, notamment dans des contextes du quotidien.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratios_ratio_to_percent_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratios_ratio_to_percent_uc1_title:Analyses et statistiques`,
          text: $localize`:@@ed_math_ratios_ratio_to_percent_uc1_text:
Transformer un ratio en pourcentage pour comparer des proportions ou interpréter des résultats.`,
        },
        {
          title: $localize`:@@ed_math_ratios_ratio_to_percent_uc2_title:Vie quotidienne`,
          text: $localize`:@@ed_math_ratios_ratio_to_percent_uc2_text:
Exprimer une part de réussite, de répartition ou d’avancement de manière plus parlante.`,
        },
        {
          title: $localize`:@@ed_math_ratios_ratio_to_percent_uc3_title:Économie et finance`,
          text: $localize`:@@ed_math_ratios_ratio_to_percent_uc3_text:
Présenter des ratios sous forme de pourcentages pour faciliter la lecture et la communication.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratios_ratio_to_percent_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratios_ratio_to_percent_out1:
Le pourcentage équivalent au ratio fourni.`,
        $localize`:@@ed_math_ratios_ratio_to_percent_out2:
Une valeur directement interprétable pour comparer des parts ou communiquer un résultat.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratios_ratio_to_percent_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_ratios_ratio_to_percent_lim1:
Le dénominateur du ratio ne doit pas être nul.`,
        },
        {
          text: $localize`:@@ed_math_ratios_ratio_to_percent_lim2:
Un pourcentage supérieur à 100% indique que la première quantité dépasse la seconde.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_ratios_ratio_to_percent_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_ratios_ratio_to_percent_q1:Pourquoi convertir un ratio en pourcentage ?`,
          a: $localize`:@@ed_math_ratios_ratio_to_percent_a1:
Le pourcentage est souvent plus intuitif et permet de comparer rapidement différentes situations.`,
        },
        {
          q: $localize`:@@ed_math_ratios_ratio_to_percent_q2:Un ratio peut-il donner plus de 100% ?`,
          a: $localize`:@@ed_math_ratios_ratio_to_percent_a2:
Oui, si la première valeur est supérieure à la seconde, le pourcentage dépasse 100%.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratios_ratio_to_percent_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratios_ratio_to_percent_tip:
Pour interpréter correctement un pourcentage, identifie toujours clairement ce qui représente le “tout” (100%).`,
    },
  ],
};
