import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_math_rounding_truncate_title:À propos : Troncature`,
  lead: $localize`:@@ed_math_rounding_truncate_lead:Supprimez les chiffres situés après une précision choisie sans arrondir le dernier chiffre conservé.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_math_rounding_truncate_usecases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        { title: $localize`:@@ed_math_rounding_truncate_uc1_title:Affichage contrôlé`, text: $localize`:@@ed_math_rounding_truncate_uc1_text:Limiter un résultat à un nombre précis de décimales sans modifier les chiffres conservés.` },
        { title: $localize`:@@ed_math_rounding_truncate_uc2_title:Exercices de calcul`, text: $localize`:@@ed_math_rounding_truncate_uc2_text:Comparer concrètement la troncature et l’arrondi sur des nombres positifs ou négatifs.` },
        { title: $localize`:@@ed_math_rounding_truncate_uc3_title:Traitement de données`, text: $localize`:@@ed_math_rounding_truncate_uc3_text:Appliquer une règle de coupure explicite avant un export ou une comparaison.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_math_rounding_truncate_output:Ce que vous obtenez`,
      icon: 'tc-icon tc-icon-database',
      paragraphs: [
        $localize`:@@ed_math_rounding_truncate_out1:La valeur tronquée à la précision demandée et la partie supprimée. Ainsi, 12,987 tronqué à deux décimales donne 12,98.`,
        $localize`:@@ed_math_rounding_truncate_out2:Pour un nombre négatif, la troncature se rapproche de zéro : −12,987 devient −12,98 à deux décimales.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_math_rounding_truncate_limits:Limites et points d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_math_rounding_truncate_lim1:La troncature crée un biais systématique vers zéro et ne doit pas être confondue avec un arrondi au plus proche.` },
        { text: $localize`:@@ed_math_rounding_truncate_lim2:Pour des montants financiers, appliquez la règle légale ou comptable attendue ; une simple troncature peut produire un total incorrect.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_math_rounding_truncate_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        { q: $localize`:@@ed_math_rounding_truncate_q1:Quelle différence entre tronquer et arrondir ?`, a: $localize`:@@ed_math_rounding_truncate_a1:Tronquer supprime les chiffres suivants. Arrondir peut augmenter le dernier chiffre conservé selon la valeur du premier chiffre supprimé.` },
        { q: $localize`:@@ed_math_rounding_truncate_q2:Tronquer un nombre négatif revient-il à prendre sa partie entière inférieure ?`, a: $localize`:@@ed_math_rounding_truncate_a2:Non. La troncature vers zéro de −2,8 donne −2, tandis que l’arrondi inférieur donne −3.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_math_rounding_truncate_tip_title:Astuce`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_math_rounding_truncate_tip:Conservez la valeur d’origine pour les calculs intermédiaires et tronquez seulement au moment où le format de sortie l’exige.`,
    },
  ],
};
