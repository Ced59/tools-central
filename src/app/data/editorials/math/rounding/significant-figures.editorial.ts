import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_significant_figures_title:À propos : Chiffres significatifs`,
  lead: $localize`:@@ed_math_significant_figures_lead:Les chiffres significatifs indiquent la précision réelle d’une mesure ou d’un calcul. Cet outil permet de déterminer et gérer correctement les chiffres significatifs.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_significant_figures_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_significant_figures_uc1_title:Sciences expérimentales`,
          text: $localize`:@@ed_math_significant_figures_uc1_text:Exprimer correctement la précision d’une mesure.`
        },
        {
          title: $localize`:@@ed_math_significant_figures_uc2_title:Calculs numériques`,
          text: $localize`:@@ed_math_significant_figures_uc2_text:Éviter de donner une précision illusoire aux résultats.`
        },
        {
          title: $localize`:@@ed_math_significant_figures_uc3_title:Lecture de données`,
          text: $localize`:@@ed_math_significant_figures_uc3_text:Interpréter correctement des valeurs issues de mesures.`
        }
      ]
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_significant_figures_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_significant_figures_out1:L’outil identifie le nombre de chiffres significatifs d’une valeur.`,
        $localize`:@@ed_math_significant_figures_out2:Il aide à présenter les résultats avec une précision cohérente.`
      ]
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_significant_figures_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_significant_figures_lim1:Les règles dépendent du contexte scientifique ou scolaire.` },
        { text: $localize`:@@ed_math_significant_figures_lim2:Un mauvais arrondi peut donner une fausse impression de précision.` }
      ]
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_significant_figures_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_significant_figures_q1:Tous les zéros sont-ils significatifs ?`,
          a: $localize`:@@ed_math_significant_figures_a1:Non, seuls les zéros situés entre ou après des chiffres non nuls peuvent être significatifs selon l’écriture.`
        },
        {
          q: $localize`:@@ed_math_significant_figures_q2:Pourquoi utiliser les chiffres significatifs ?`,
          a: $localize`:@@ed_math_significant_figures_a2:Ils permettent de refléter fidèlement la précision réelle d’une mesure ou d’un calcul.`
        }
      ]
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_significant_figures_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_significant_figures_tip:Utiliser la notation scientifique permet souvent de clarifier le nombre de chiffres significatifs.`
    }
  ]
};
