import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_rounding_error_title:À propos : Erreur d’arrondi`,
  lead: $localize`:@@ed_math_rounding_error_lead:L’erreur d’arrondi correspond à la différence entre une valeur exacte et sa valeur arrondie. Cet outil permet de mesurer et comprendre l’impact des arrondis.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_rounding_error_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_rounding_error_uc1_title:Calculs répétés`,
          text: $localize`:@@ed_math_rounding_error_uc1_text:Comprendre pourquoi des arrondis successifs faussent un résultat final.`
        },
        {
          title: $localize`:@@ed_math_rounding_error_uc2_title:Sciences et ingénierie`,
          text: $localize`:@@ed_math_rounding_error_uc2_text:Évaluer la précision d’un calcul numérique.`
        },
        {
          title: $localize`:@@ed_math_rounding_error_uc3_title:Finance`,
          text: $localize`:@@ed_math_rounding_error_uc3_text:Mesurer l’impact des arrondis sur des montants cumulés.`
        }
      ]
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_rounding_error_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_rounding_error_out1:L’outil calcule l’erreur absolue et relative liée à un arrondi.`,
        $localize`:@@ed_math_rounding_error_out2:Il aide à évaluer si l’arrondi est acceptable dans un contexte donné.`
      ]
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_rounding_error_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_rounding_error_lim1:Une erreur d’arrondi est inévitable dès que l’on simplifie un nombre.` },
        { text: $localize`:@@ed_math_rounding_error_lim2:Les erreurs peuvent s’accumuler dans des calculs longs.` }
      ]
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_rounding_error_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_rounding_error_q1:Une erreur d’arrondi est-elle toujours négligeable ?`,
          a: $localize`:@@ed_math_rounding_error_a1:Non, elle peut devenir significative si les arrondis sont répétés ou mal choisis.`
        },
        {
          q: $localize`:@@ed_math_rounding_error_q2:Comment limiter l’erreur d’arrondi ?`,
          a: $localize`:@@ed_math_rounding_error_a2:En conservant plus de chiffres intermédiaires et en arrondissant uniquement à la fin.`
        }
      ]
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_rounding_error_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_rounding_error_tip:Arrondissez le plus tard possible dans un calcul pour réduire l’erreur globale.`
    }
  ]
};
