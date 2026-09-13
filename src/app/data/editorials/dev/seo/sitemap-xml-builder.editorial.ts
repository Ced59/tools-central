import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_sitemap_title:Créer et contrôler un sitemap XML utile`,
  lead: $localize`:@@ed_dev_seo_sitemap_lead:Un sitemap aide les moteurs à découvrir les URL canoniques d’un site. Cet outil génère un fichier minimal, analyse un XML existant et explique les erreurs qui empêchent son exploitation correcte.`,
  updatedAtIso: '2026-09-13',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_sitemap_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_sitemap_uc1_title:Publier un premier sitemap`,
          text: $localize`:@@ed_dev_seo_sitemap_uc1_text:Transformez une liste de chemins ou d’URL en document XML UTF-8 avec des adresses absolues, échappées et dédupliquées.`,
        },
        {
          title: $localize`:@@ed_dev_seo_sitemap_uc2_title:Auditer un fichier existant`,
          text: $localize`:@@ed_dev_seo_sitemap_uc2_text:Collez son contenu pour contrôler la syntaxe XML, l’espace de noms, les URL, les dates, les doublons et les limites du protocole.`,
        },
        {
          title: $localize`:@@ed_dev_seo_sitemap_uc3_title:Découper un grand site`,
          text: $localize`:@@ed_dev_seo_sitemap_uc3_text:Générez plusieurs sitemaps de 50 000 entrées au maximum, puis rassemblez leurs URL dans un index de sitemaps.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_sitemap_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_sitemap_method_1:Listez uniquement les URL absolues et canoniques que vous souhaitez proposer à l’indexation. Écartez les redirections, erreurs, doublons, pages noindex et variantes de paramètres inutiles.`,
        $localize`:@@ed_dev_seo_sitemap_method_2:Ajoutez lastmod seulement si sa valeur reflète une modification significative de la page. Une date artificiellement rafraîchie à chaque génération réduit la confiance accordée à ce signal.`,
        $localize`:@@ed_dev_seo_sitemap_method_3:Publiez le fichier à une adresse stable, référencez-le dans robots.txt ou soumettez-le dans la console du moteur, puis surveillez les URL découvertes et indexées.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_sitemap_limits:Limites à connaître`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_sitemap_limit_1:Un sitemap ou un index contient au maximum 50 000 entrées et pèse au maximum 50 Mio avant compression. Utilisez plusieurs fichiers au-delà.`,
        },
        {
          text: $localize`:@@ed_dev_seo_sitemap_limit_2:L’emplacement du fichier détermine normalement son périmètre. Un sitemap placé dans un sous-répertoire ne devrait pas lister des URL situées plus haut sans mécanisme de soumission intersites vérifié.`,
        },
        {
          text: $localize`:@@ed_dev_seo_sitemap_limit_3:Google ignore les valeurs priority et changefreq. Le fichier est un indice de découverte, pas une garantie d’exploration, d’indexation ou de classement.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_sitemap_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_sitemap_q1:Faut-il inclure toutes les pages du site ?`,
          a: $localize`:@@ed_dev_seo_sitemap_a1:Non. Incluez les versions canoniques, indexables et utiles. Un sitemap propre aide davantage au diagnostic qu’un inventaire contenant des URL techniques ou dupliquées.`,
        },
        {
          q: $localize`:@@ed_dev_seo_sitemap_q2:Quelle différence entre sitemap et index de sitemaps ?`,
          a: $localize`:@@ed_dev_seo_sitemap_a2:Un sitemap liste des pages dans des éléments url. Un index liste des fichiers sitemap dans des éléments sitemap et permet de répartir un grand ensemble.`,
        },
        {
          q: $localize`:@@ed_dev_seo_sitemap_q3:Mes URL sont-elles envoyées à Tools Central ?`,
          a: $localize`:@@ed_dev_seo_sitemap_a3:Non. La génération, l’analyse et le téléchargement sont réalisés localement dans le navigateur. L’outil ne visite pas les URL saisies.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_sitemap_tip_title:Un fichier minimal est souvent meilleur`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_sitemap_tip:Commencez par loc et un lastmod fiable. N’ajoutez pas des balises facultatives pour remplir le fichier : chaque valeur doit avoir une signification opérationnelle.`,
    },
  ],
};
