import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Editorial content for ratio → fraction tool.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_ratios_ratio_to_fraction_title:À propos : Ratio → fraction`,
  lead: $localize`:@@ed_math_ratios_ratio_to_fraction_lead:
Convertir un ratio (a:b) en fraction permet de le manipuler plus facilement en calcul, de le simplifier ou de le comparer à d’autres valeurs numériques.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_ratios_ratio_to_fraction_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_ratios_ratio_to_fraction_uc1_title:Mathématiques scolaires`,
          text: $localize`:@@ed_math_ratios_ratio_to_fraction_uc1_text:
Passer d’un ratio à une fraction pour appliquer des règles de calcul, de simplification ou de comparaison.`,
        },
        {
          title: $localize`:@@ed_math_ratios_ratio_to_fraction_uc2_title:Statistiques et probabilités`,
          text: $localize`:@@ed_math_ratios_ratio_to_fraction_uc2_text:
Exprimer un rapport sous forme de fraction pour raisonner sur des parts ou des probabilités.`,
        },
        {
          title: $localize`:@@ed_math_ratios_ratio_to_fraction_uc3_title:Problèmes de proportion`,
          text: $localize`:@@ed_math_ratios_ratio_to_fraction_uc3_text:
Transformer un ratio en fraction pour l’intégrer dans un calcul de proportionnalité ou une règle de trois.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_ratios_ratio_to_fraction_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_ratios_ratio_to_fraction_out1:
La fraction équivalente au ratio saisi, sous la forme a/b.`,
        $localize`:@@ed_math_ratios_ratio_to_fraction_out2:
Une écriture mathématique directement exploitable pour des calculs, comparaisons ou conversions ultérieures.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_ratios_ratio_to_fraction_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_math_ratios_ratio_to_fraction_lim1:
Un ratio n’a de sens que si ses deux termes sont positifs ou nuls.`,
        },
        {
          text: $localize`:@@ed_math_ratios_ratio_to_fraction_lim2:
La fraction obtenue peut nécessiter une simplification pour être sous forme irréductible.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_ratios_ratio_to_fraction_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_ratios_ratio_to_fraction_q1:Un ratio et une fraction, est-ce la même chose ?`,
          a: $localize`:@@ed_math_ratios_ratio_to_fraction_a1:
Ils expriment une relation similaire, mais le ratio compare deux quantités alors que la fraction représente une division.`,
        },
        {
          q: $localize`:@@ed_math_ratios_ratio_to_fraction_q2:Peut-on simplifier la fraction obtenue ?`,
          a: $localize`:@@ed_math_ratios_ratio_to_fraction_a2:
Oui, la fraction peut souvent être simplifiée en divisant le numérateur et le dénominateur par un même facteur.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_ratios_ratio_to_fraction_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_ratios_ratio_to_fraction_tip:
Après conversion, simplifie toujours la fraction : cela facilite les comparaisons et les calculs suivants.`,
    },
  ],
};
