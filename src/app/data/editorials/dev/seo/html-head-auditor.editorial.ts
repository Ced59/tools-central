import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_html_head_title:Auditer les balises essentielles d’un head HTML`,
  lead: $localize`:@@ed_dev_seo_html_head_lead:Le head rassemble des signaux qui aident navigateurs, moteurs de recherche et plateformes sociales à comprendre une page. Cet auditeur examine localement title, description, canonical, robots, viewport, encodage, hreflang, Open Graph, Twitter et JSON-LD sans crawler le site ni exécuter le code collé.`,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_html_head_use_cases:Quand utiliser cet auditeur`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_html_head_uc1_title:Relire un template avant publication`,
          text: $localize`:@@ed_dev_seo_html_head_uc1_text:Repérez rapidement une balise manquante, vide ou dupliquée avant d’intégrer un nouveau modèle de page dans la chaîne de déploiement.`,
        },
        {
          title: $localize`:@@ed_dev_seo_html_head_uc2_title:Comparer le HTML réellement rendu`,
          text: $localize`:@@ed_dev_seo_html_head_uc2_text:Copiez le head depuis les outils de développement pour vérifier les métadonnées après rendu côté serveur ou hydratation côté client.`,
        },
        {
          title: $localize`:@@ed_dev_seo_html_head_uc3_title:Documenter une recette SEO`,
          text: $localize`:@@ed_dev_seo_html_head_uc3_text:Téléchargez le rapport JSON afin de conserver les valeurs, les alternatives linguistiques et les diagnostics associés à une version donnée.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_html_head_method:Méthode de vérification`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_html_head_method_1:Renseignez l’URL publique exacte, puis collez le document HTML rendu ou seulement son head. Cette URL sert aux comparaisons locales avec canonical, og:url et les variantes hreflang ; elle n’est jamais ouverte par l’outil.`,
        $localize`:@@ed_dev_seo_html_head_method_2:Traitez d’abord les erreurs structurelles comme plusieurs title, une canonical relative ou un hreflang invalide. Examinez ensuite noindex, les métadonnées absentes et les incohérences informatives selon l’intention de la page.`,
        $localize`:@@ed_dev_seo_html_head_method_3:Après correction, contrôlez la réponse HTTP et le HTML publié. Une directive X-Robots-Tag, une redirection, le rendu JavaScript ou une canonical envoyée par en-tête ne figurent pas nécessairement dans le code collé.`,
      ],
    },
    {
      id: 'checks',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_html_head_checks:Contrôles effectués`,
      icon: 'tc-icon tc-icon-search',
      items: [
        {
          title: $localize`:@@ed_dev_seo_html_head_check_search_title:Recherche et indexation`,
          text: $localize`:@@ed_dev_seo_html_head_check_search_text:Présence et unicité de title, description et canonical, validité de la canonical, directives robots contradictoires, noindex et meta refresh.`,
        },
        {
          title: $localize`:@@ed_dev_seo_html_head_check_technical_title:Document et mobile`,
          text: $localize`:@@ed_dev_seo_html_head_check_technical_text:Déclaration UTF-8, viewport contenant width=device-width, présence d’une balise base et nombre de blocs JSON-LD.`,
        },
        {
          title: $localize`:@@ed_dev_seo_html_head_check_social_title:International et partage social`,
          text: $localize`:@@ed_dev_seo_html_head_check_social_text:Codes et URL hreflang, auto-référence, propriétés Open Graph de base, cohérence entre og:url et canonical, puis type de carte Twitter.`,
        },
      ],
    },
    {
      id: 'interpretation',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_html_head_interpretation:Ce que le rapport ne promet pas`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_html_head_limit_1:Une URL canonical constitue un signal de regroupement, pas une obligation imposée au moteur. Sa cohérence avec les redirections, liens internes et sitemaps reste importante.`,
        },
        {
          text: $localize`:@@ed_dev_seo_html_head_limit_2:La longueur seule ne décide pas du titre ou de la description affichés. Les moteurs peuvent générer ou reformuler un résultat selon le contenu et la requête ; l’outil affiche donc les comptes sans seuil arbitraire.`,
        },
        {
          text: $localize`:@@ed_dev_seo_html_head_limit_3:Les aperçus sociaux et résultats enrichis dépendent aussi de l’accessibilité des ressources, du cache des plateformes, du contenu visible et de règles extérieures à ce parseur.`,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_html_head_limits:Limites et confidentialité`,
      icon: 'tc-icon tc-icon-lock',
      paragraphs: [
        $localize`:@@ed_dev_seo_html_head_limits_1:La source est limitée à 1 000 000 de caractères, 1 000 balises et 200 diagnostics. Ces bornes réduisent le risque de blocage avec un document volontairement excessif.`,
        $localize`:@@ed_dev_seo_html_head_limits_2:Le parseur traite une chaîne de texte sans DOM actif. Il n’insère pas le HTML, ne charge ni image ni script, n’exécute aucun gestionnaire et n’envoie aucune donnée à un service distant.`,
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_html_head_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_html_head_q1:Faut-il absolument une meta description ?`,
          a: $localize`:@@ed_dev_seo_html_head_a1:Elle n’est pas nécessaire à l’indexation, mais une description spécifique peut aider le moteur à composer un extrait utile. Son absence est donc un avertissement, pas une preuve de blocage.`,
        },
        {
          q: $localize`:@@ed_dev_seo_html_head_q2:Pourquoi une canonical différente n’est-elle qu’une information ?`,
          a: $localize`:@@ed_dev_seo_html_head_a2:Une page peut volontairement désigner une autre URL représentative. Le rapport met la différence en évidence sans supposer qu’il s’agit d’une erreur métier.`,
        },
        {
          q: $localize`:@@ed_dev_seo_html_head_q3:L’outil peut-il analyser directement une URL ?`,
          a: $localize`:@@ed_dev_seo_html_head_a3:Non. Il ne crawle aucun site. Cette contrainte rend le traitement prévisible et confidentiel ; copiez le HTML rendu pour auditer précisément la version voulue.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_html_head_tip_title:Auditez aussi la réponse HTTP`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_html_head_tip:Le meilleur head ne compense pas une page inaccessible, une chaîne de redirections, une erreur serveur ou un X-Robots-Tag noindex. Utilisez ce rapport comme une étape de contrôle, puis vérifiez la réponse réellement servie.`,
    },
  ],
};
