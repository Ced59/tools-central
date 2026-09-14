import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_structured_data_title:Extraire et comprendre les données structurées d’une page`,
  lead: $localize`:@@ed_dev_seo_structured_data_lead:Le balisage structuré décrit les entités d’une page et leurs relations. Cet extracteur lit localement un document HTML ou JSON-LD, rassemble JSON-LD, Microdata et RDFa dans un graphe commun, puis produit un rapport vérifiable sans charger la page ni exécuter ses scripts.`,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_structured_data_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_structured_data_uc1_title:Inventorier un modèle de page`,
          text: $localize`:@@ed_dev_seo_structured_data_uc1_text:Collez le HTML rendu pour repérer les types déclarés, les blocs dupliqués et la coexistence éventuelle de plusieurs formats de balisage.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_structured_data_uc2_title:Comprendre un graphe JSON-LD`,
          text: $localize`:@@ed_dev_seo_structured_data_uc2_text:Développez @graph, les objets imbriqués et les références @id afin de voir comment une page, une organisation, un auteur ou une offre sont reliés.` ,
        },
        {
          title: $localize`:@@ed_dev_seo_structured_data_uc3_title:Conserver une preuve de diagnostic`,
          text: $localize`:@@ed_dev_seo_structured_data_uc3_text:Exportez un JSON normalisé contenant les entités, propriétés, relations, formats et diagnostics pour comparer deux versions hors de l’outil.` ,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_structured_data_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_structured_data_method_1:Préférez le HTML réellement rendu plutôt qu’un extrait de template lorsque le balisage est injecté côté client. Vous pouvez aussi coller directement un objet ou un tableau JSON-LD pour isoler une erreur de syntaxe.`,
        $localize`:@@ed_dev_seo_structured_data_method_2:Fournissez l’URL publique comme base seulement si Microdata contient des liens relatifs. Cette valeur sert à leur résolution locale et ne déclenche aucune requête.`,
        $localize`:@@ed_dev_seo_structured_data_method_3:Corrigez d’abord le JSON invalide, les entités sans type et les limites atteintes. Vérifiez ensuite les propriétés obligatoires dans la documentation propre au type, puis testez la page publiée avec un outil officiel.`,
      ],
    },
    {
      id: 'formats',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_structured_data_formats:Formats analysés`,
      icon: 'tc-icon tc-icon-code',
      items: [
        {
          title: 'JSON-LD',
          text: $localize`:@@ed_dev_seo_structured_data_format_jsonld:Les scripts application/ld+json, les documents JSON directs, @graph, @id, @type, @value, @list et les objets imbriqués sont normalisés sans exécuter de JavaScript.` ,
        },
        {
          title: 'Microdata',
          text: $localize`:@@ed_dev_seo_structured_data_format_microdata:Les attributs itemscope, itemtype, itemid et itemprop sont lus avec les règles de valeur usuelles des éléments HTML. itemref est signalé mais n’est pas développé.` ,
        },
        {
          title: 'RDFa',
          text: $localize`:@@ed_dev_seo_structured_data_format_rdfa:Les ressources typeof et leurs propriétés property, rel ou rev sont inventoriées. Il s’agit d’une vue de diagnostic pratique, pas d’un processeur RDFa 1.1 canonique.` ,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_structured_data_limits:Limites et sécurité`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_structured_data_limit_1:L’analyse est bornée à 1 000 000 de caractères, 500 entités, 5 000 propriétés, 32 niveaux JSON et 200 diagnostics afin d’éviter qu’une source hostile ne bloque durablement l’interface.` ,
        },
        {
          text: $localize`:@@ed_dev_seo_structured_data_limit_2:Le parseur travaille sur un document inerte : il ne télécharge pas les images, scripts ou pixels présents dans le HTML et n’envoie pas le contenu vers un serveur.` ,
        },
        {
          text: $localize`:@@ed_dev_seo_structured_data_limit_3:L’outil n’applique pas les exigences détaillées de chaque résultat enrichi et ne garantit ni éligibilité, ni affichage dans les résultats, ni classement.` ,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_structured_data_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_structured_data_q1:Quel format faut-il privilégier ?`,
          a: $localize`:@@ed_dev_seo_structured_data_a1:Google prend en charge JSON-LD, Microdata et RDFa et recommande généralement JSON-LD, plus simple à maintenir sans mêler le balisage aux éléments visibles. Le format doit néanmoins rester cohérent avec votre chaîne de publication.` ,
        },
        {
          q: $localize`:@@ed_dev_seo_structured_data_q2:Un rapport sans erreur garantit-il un résultat enrichi ?`,
          a: $localize`:@@ed_dev_seo_structured_data_a2:Non. Une extraction correcte prouve seulement que la structure a pu être lue. Le contenu doit représenter la page visible, respecter les règles générales et contenir les propriétés exigées pour la fonctionnalité Google visée.` ,
        },
        {
          q: $localize`:@@ed_dev_seo_structured_data_q3:Peut-on analyser une URL directement ?`,
          a: $localize`:@@ed_dev_seo_structured_data_a3:Non. L’outil ne crawle aucun site afin de préserver confidentialité et prévisibilité. Copiez le HTML rendu ou le bloc JSON-LD depuis vos outils de développement.` ,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_structured_data_tip_title:Le contenu visible reste la référence`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_structured_data_tip:Ne décrivez pas dans les données structurées une information absente ou différente de la page. Un graphe techniquement valide peut rester trompeur et perdre son éligibilité aux fonctionnalités de recherche.` ,
    },
  ],
};
