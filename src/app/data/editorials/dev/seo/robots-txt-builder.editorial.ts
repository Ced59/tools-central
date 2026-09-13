import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_robots_builder_title:Créer et contrôler un fichier robots.txt fiable`,
  lead: $localize`:@@ed_dev_seo_robots_builder_lead:Le fichier robots.txt indique aux robots d’exploration les chemins qu’ils peuvent demander. Le générateur prépare une base propre, le validateur détecte les erreurs fréquentes et le simulateur explique la règle appliquée à une URL.`,
  updatedAtIso: '2026-09-13',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_robots_builder_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_robots_builder_uc1_title:Préparer un nouveau site`,
          text: $localize`:@@ed_dev_seo_robots_builder_uc1_text:Créez un groupe User-agent, bloquez les espaces sans intérêt pour l’exploration et déclarez un sitemap absolu.`,
        },
        {
          title: $localize`:@@ed_dev_seo_robots_builder_uc2_title:Auditer un fichier existant`,
          text: $localize`:@@ed_dev_seo_robots_builder_uc2_text:Collez son contenu pour repérer les directives invalides, les doublons, les chemins mal formés, le HTML accidentel ou une taille supérieure à 500 Kio.`,
        },
        {
          title: $localize`:@@ed_dev_seo_robots_builder_uc3_title:Diagnostiquer une URL bloquée`,
          text: $localize`:@@ed_dev_seo_robots_builder_uc3_text:Testez une URL avec un product token précis afin d’identifier le groupe sélectionné et la règle Allow ou Disallow la plus spécifique.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_robots_builder_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_robots_builder_method_1:Définissez d’abord l’origine exacte du site. Un fichier servi en HTTPS ne gouverne pas HTTP, un sous-domaine différent ni un autre port. Il doit être accessible à l’emplacement /robots.txt.`,
        $localize`:@@ed_dev_seo_robots_builder_method_2:Commencez avec peu de règles et des chemins explicites. Quand plusieurs règles correspondent, la plus spécifique gagne ; à spécificité égale, Allow prévaut sur Disallow.`,
        $localize`:@@ed_dev_seo_robots_builder_method_3:Testez les robots importants et quelques URL représentatives, publiez le fichier en UTF-8 avec le type text/plain, puis vérifiez la réponse HTTP depuis l’extérieur.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_robots_builder_limits:Limites à connaître`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_robots_builder_limit_1:Bloquer l’exploration n’empêche pas toujours une URL d’apparaître dans un résultat de recherche. Une URL connue par des liens peut rester indexée sans extrait.`,
        },
        {
          text: $localize`:@@ed_dev_seo_robots_builder_limit_2:robots.txt est public et ne protège aucune donnée. Utilisez une authentification et des autorisations serveur pour les contenus sensibles.`,
        },
        {
          text: $localize`:@@ed_dev_seo_robots_builder_limit_3:Le standard définit le socle commun, mais chaque robot peut prendre en charge des directives supplémentaires. Google ignore notamment Crawl-delay.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_robots_builder_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_robots_builder_q1:Quelle différence entre Allow et Disallow ?`,
          a: $localize`:@@ed_dev_seo_robots_builder_a1:Disallow interdit la demande des chemins correspondants. Allow crée une exception plus spécifique dans un espace autrement bloqué. Une valeur vide ne bloque rien.`,
        },
        {
          q: $localize`:@@ed_dev_seo_robots_builder_q2:Les majuscules et les paramètres d’URL comptent-ils ?`,
          a: $localize`:@@ed_dev_seo_robots_builder_a2:Oui. La comparaison du chemin est sensible à la casse et peut inclure la chaîne de requête. Les caractères * et $ servent respectivement de joker et de marqueur de fin.`,
        },
        {
          q: $localize`:@@ed_dev_seo_robots_builder_q3:Mes données sont-elles envoyées ou enregistrées ?`,
          a: $localize`:@@ed_dev_seo_robots_builder_a3:Non. La génération, l’analyse, la simulation et l’export du fichier sont réalisés localement dans le navigateur.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_robots_builder_tip_title:Avant de bloquer un chemin`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_robots_builder_tip:Vérifiez que le chemin ne contient pas les ressources nécessaires au rendu des pages, comme les feuilles de style ou les scripts. Une règle courte peut avoir un effet beaucoup plus large que prévu.`,
    },
  ],
};
