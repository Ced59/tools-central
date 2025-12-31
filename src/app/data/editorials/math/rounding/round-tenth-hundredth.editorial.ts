import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_order_of_magnitude_title:À propos : Ordre de grandeur`,
  lead: $localize`:@@ed_math_order_of_magnitude_lead:L’ordre de grandeur permet d’estimer rapidement la taille d’un nombre sans calcul précis. Cet outil aide à comparer, simplifier et raisonner efficacement sur des valeurs très grandes ou très petites.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_order_of_magnitude_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_math_order_of_magnitude_uc1_title:Estimation rapide`,
          text: $localize`:@@ed_math_order_of_magnitude_uc1_text:Évaluer un résultat sans effectuer de calcul détaillé.`
        },
        {
          title: $localize`:@@ed_math_order_of_magnitude_uc2_title:Comparer des grandeurs`,
          text: $localize`:@@ed_math_order_of_magnitude_uc2_text:Savoir si une valeur est 10, 100 ou 1 000 fois plus grande qu’une autre.`
        },
        {
          title: $localize`:@@ed_math_order_of_magnitude_uc3_title:Raisonnement scientifique`,
          text: $localize`:@@ed_math_order_of_magnitude_uc3_text:Utiliser des puissances de 10 pour raisonner en physique, économie ou informatique.`
        }
      ]
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_order_of_magnitude_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_math_order_of_magnitude_out1:L’outil détermine la puissance de 10 la plus proche associée à un nombre.`,
        $localize`:@@ed_math_order_of_magnitude_out2:Il fournit une approximation utile pour comparer rapidement des valeurs.`
      ]
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_order_of_magnitude_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_order_of_magnitude_lim1:Un ordre de grandeur est une estimation, pas une valeur exacte.` },
        { text: $localize`:@@ed_math_order_of_magnitude_lim2:Deux nombres de même ordre de grandeur peuvent rester sensiblement différents.` }
      ]
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_order_of_magnitude_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_math_order_of_magnitude_q1:À quoi sert un ordre de grandeur ?`,
          a: $localize`:@@ed_math_order_of_magnitude_a1:Il permet de raisonner rapidement sur des tailles de nombres sans précision excessive.`
        },
        {
          q: $localize`:@@ed_math_order_of_magnitude_q2:Est-ce une approximation fiable ?`,
          a: $localize`:@@ed_math_order_of_magnitude_a2:Oui pour comparer et estimer, mais pas pour des calculs précis.`
        }
      ]
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_order_of_magnitude_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_order_of_magnitude_tip:En estimation mentale, arrondissez toujours au chiffre significatif le plus proche avant de chercher l’ordre de grandeur.`
    }
  ]
};
