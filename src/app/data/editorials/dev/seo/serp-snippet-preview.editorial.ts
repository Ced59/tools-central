import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_serp_preview_title:Bien préparer son snippet Google`,
  lead: $localize`:@@ed_dev_seo_serp_preview_lead:Un snippet lisible aide l’internaute à comprendre la promesse d’une page avant de cliquer. Cet outil simule son apparence et signale les contenus trop courts, manquants ou susceptibles d’être tronqués.`,
  updatedAtIso: '2026-09-13',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_serp_preview_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_serp_preview_uc1_title:Préparer une nouvelle page`,
          text: $localize`:@@ed_dev_seo_serp_preview_uc1_text:Vérifiez que le sujet principal, la valeur proposée et le nom de marque restent compréhensibles avant la publication.`,
        },
        {
          title: $localize`:@@ed_dev_seo_serp_preview_uc2_title:Améliorer un faible taux de clic`,
          text: $localize`:@@ed_dev_seo_serp_preview_uc2_text:Comparez plusieurs formulations sans modifier la page et privilégiez celle qui répond le plus clairement à l’intention de recherche.`,
        },
        {
          title: $localize`:@@ed_dev_seo_serp_preview_uc3_title:Contrôler les vues mobile et ordinateur`,
          text: $localize`:@@ed_dev_seo_serp_preview_uc3_text:Repérez les messages essentiels qui disparaissent lorsque l’espace d’affichage devient plus étroit.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_serp_preview_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_serp_preview_method_1:Commencez le titre par le sujet ou la réponse recherchée. Évitez les répétitions, les suites de mots-clés et les promesses que la page ne tient pas.`,
        $localize`:@@ed_dev_seo_serp_preview_method_2:Rédigez ensuite une description naturelle qui complète le titre avec un bénéfice, une précision ou un élément différenciant. Chaque page importante mérite une formulation propre.`,
        $localize`:@@ed_dev_seo_serp_preview_method_3:Testez enfin les deux appareils. Une longueur équilibrée est un indicateur éditorial, pas un objectif à remplir artificiellement.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_serp_preview_limits:Limites à connaître`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_serp_preview_limit_1:Google ne fixe pas de longueur maximale en caractères pour la balise title ou la meta description ; l’affichage dépend notamment de la largeur disponible.`,
        },
        {
          text: $localize`:@@ed_dev_seo_serp_preview_limit_2:Le moteur peut créer un titre ou un snippet différent à partir du contenu de la page, des liens ou de la requête saisie.`,
        },
        {
          text: $localize`:@@ed_dev_seo_serp_preview_limit_3:La largeur en pixels est une estimation stable. La police, le gras, la langue et les expériences d’interface peuvent modifier le rendu réel.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_serp_preview_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_serp_preview_q1:Existe-t-il une longueur parfaite pour un titre SEO ?`,
          a: $localize`:@@ed_dev_seo_serp_preview_a1:Non. Le titre doit d’abord être descriptif, distinct et utile. L’indicateur de largeur sert surtout à anticiper une coupure visuelle.`,
        },
        {
          q: $localize`:@@ed_dev_seo_serp_preview_q2:Une meta description améliore-t-elle directement le classement ?`,
          a: $localize`:@@ed_dev_seo_serp_preview_a2:Elle sert surtout à présenter la page dans le résultat lorsqu’elle est retenue. Une description pertinente peut aider un lecteur qualifié à choisir le bon résultat.`,
        },
        {
          q: $localize`:@@ed_dev_seo_serp_preview_q3:Mes données sont-elles enregistrées ?`,
          a: $localize`:@@ed_dev_seo_serp_preview_a3:Non. Les champs sont analysés localement dans le navigateur et ne sont pas transmis à un service distant.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_serp_preview_tip_title:Conseil`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_serp_preview_tip:Écrivez pour une personne, puis vérifiez la largeur. Un snippet précis et honnête vaut mieux qu’un texte artificiellement rempli jusqu’à la limite.`,
    },
  ],
};
