import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_text_writing_readability_title:À propos : Lisibilité & clarté`,
  lead: $localize`:@@ed_text_writing_readability_lead:Analysez la lisibilité de votre texte (score, statistiques et conseils) pour écrire plus clair, plus fluide et plus facile à comprendre.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_text_writing_readability_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_text_writing_readability_uc1_title:Améliorer un texte avant publication`,
          text: $localize`:@@ed_text_writing_readability_uc1_text:Vérifiez rapidement si un article, une page web ou une description de produit est facile à lire, puis ajustez la longueur des phrases et le vocabulaire.`,
        },
        {
          title: $localize`:@@ed_text_writing_readability_uc2_title:Rendre une communication plus accessible`,
          text: $localize`:@@ed_text_writing_readability_uc2_text:Optimisez un email, une notice, un document interne ou un message client pour qu’il soit compris du premier coup (moins d’ambiguïtés, moins de relectures).`,
        },
        {
          title: $localize`:@@ed_text_writing_readability_uc3_title:Optimiser un contenu SEO sans sacrifier la clarté`,
          text: $localize`:@@ed_text_writing_readability_uc3_text:Repérez les passages trop denses : un texte plus clair augmente souvent le temps de lecture, réduit le taux de rebond et améliore l’expérience utilisateur.`,
        },
        {
          title: $localize`:@@ed_text_writing_readability_uc4_title:Adapter un texte à un niveau de lecture cible`,
          text: $localize`:@@ed_text_writing_readability_uc4_text:Évaluez si le texte convient à un public grand public, scolaire ou professionnel, et simplifiez là où c’est nécessaire.`,
        },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_text_writing_readability_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_text_writing_readability_out1:Un score de lisibilité et des statistiques clés (longueur moyenne des phrases, mots longs, structure générale) pour évaluer la clarté de votre texte en un coup d’œil.`,
        $localize`:@@ed_text_writing_readability_out2:Des conseils actionnables pour améliorer la lisibilité : raccourcir les phrases, privilégier la voix active, clarifier les enchaînements, et supprimer le jargon inutile.`,
        $localize`:@@ed_text_writing_readability_out3:Une lecture plus confortable pour vos lecteurs : un texte clair se comprend plus vite, se retient mieux, et donne une impression plus professionnelle.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_text_writing_readability_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_text_writing_readability_lim1:Un score de lisibilité est un indicateur, pas un verdict : un texte technique peut être volontairement plus dense (documentation, juridique, scientifique).`,
        },
        {
          text: $localize`:@@ed_text_writing_readability_lim2:Les métriques se basent sur des signaux “mécaniques” (phrases, mots) : elles ne remplacent pas la relecture humaine sur le fond (cohérence, exactitude, ton).`,
        },
        {
          text: $localize`:@@ed_text_writing_readability_lim3:La lisibilité dépend aussi du contexte : titres, mise en forme, listes et exemples améliorent souvent plus qu’un simple changement de vocabulaire.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_text_writing_readability_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_text_writing_readability_q1:Quel score de lisibilité viser ?`,
          a: $localize`:@@ed_text_writing_readability_a1:Pour un contenu grand public, visez un texte fluide avec des phrases plutôt courtes et un vocabulaire simple. Pour un public expert, un score plus “difficile” peut être normal : l’objectif est surtout d’éviter les passages inutilement compliqués.`,
        },
        {
          q: $localize`:@@ed_text_writing_readability_q2:Comment améliorer rapidement la lisibilité d’un texte ?`,
          a: $localize`:@@ed_text_writing_readability_a2:Commencez par couper les phrases longues, remplacer les enchaînements flous par des connecteurs simples, et supprimer les mots inutiles. Ajoutez des listes et des exemples quand le texte devient dense.`,
        },
        {
          q: $localize`:@@ed_text_writing_readability_q3:Est-ce utile pour le SEO ?`,
          a: $localize`:@@ed_text_writing_readability_a3:Oui : un contenu plus clair améliore souvent l’engagement (lecture plus longue, moins d’allers-retours), ce qui renforce l’expérience utilisateur. Le but n’est pas de “tricher”, mais d’écrire mieux pour les humains.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_text_writing_readability_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_text_writing_readability_tip:Si votre score est moyen, commencez par une action simple : transformez chaque phrase de plus de 25–30 mots en deux phrases plus courtes. C’est souvent le meilleur gain de clarté en un minimum de temps.`,
    },
  ],
};
