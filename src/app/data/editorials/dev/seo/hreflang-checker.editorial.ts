import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_seo_hreflang_title:Créer et auditer des annotations hreflang cohérentes`,
  lead: $localize`:@@ed_dev_seo_hreflang_lead:Les annotations hreflang relient les versions linguistiques ou régionales équivalentes d’une page. Le générateur produit trois formats et l’audit local repère les codes invalides, auto-références absentes, canonicals suspects et liens retour manquants dans les données fournies.`,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_hreflang_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_seo_hreflang_uc1_title:Préparer une nouvelle traduction`,
          text: $localize`:@@ed_dev_seo_hreflang_uc1_text:Associez chaque code de langue ou de région à son URL absolue, incluez la page courante et choisissez une destination x-default pour les visiteurs non couverts.`,
        },
        {
          title: $localize`:@@ed_dev_seo_hreflang_uc2_title:Comparer plusieurs modèles de page`,
          text: $localize`:@@ed_dev_seo_hreflang_uc2_text:Collez les annotations observées sur chaque page afin de trouver un retour absent, un ensemble différent ou une canonical qui ne pointe pas vers la page attendue.`,
        },
        {
          title: $localize`:@@ed_dev_seo_hreflang_uc3_title:Déployer hors du HTML`,
          text: $localize`:@@ed_dev_seo_hreflang_uc3_text:Générez un en-tête Link pour un document non HTML ou un fragment xhtml:link à intégrer dans un sitemap XML existant.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_seo_hreflang_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_seo_hreflang_method_1:Construisez un ensemble à partir de pages réellement équivalentes. Chaque version doit déclarer sa propre URL et les autres variantes au moyen d’adresses HTTP ou HTTPS complètes.`,
        $localize`:@@ed_dev_seo_hreflang_method_2:Installez le même ensemble sur les pages concernées et contrôlez les liens dans les deux sens. Une cible qui ne renvoie pas vers la source peut rendre la paire inutilisable pour Google.`,
        $localize`:@@ed_dev_seo_hreflang_method_3:Vérifiez séparément que chaque URL répond correctement, reste indexable, affiche la bonne langue et utilise une canonical compatible. L’outil n’effectue aucune requête réseau.`,
      ],
    },
    {
      id: 'codes',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_hreflang_codes:Codes et variantes`,
      icon: 'tc-icon tc-icon-language',
      items: [
        {
          text: $localize`:@@ed_dev_seo_hreflang_code_1:La langue utilise un code ISO 639-1 à deux lettres, par exemple fr ou en. Un code pays seul n’est pas un ciblage valide.`,
        },
        {
          text: $localize`:@@ed_dev_seo_hreflang_code_2:Une région ISO 3166-1 alpha-2 peut suivre la langue, par exemple en-GB. Le générateur normalise sa casse sans modifier l’intention.`,
        },
        {
          text: $localize`:@@ed_dev_seo_hreflang_code_3:Un script ISO 15924 peut être explicite, comme zh-Hant. x-default désigne la page de repli lorsque les autres codes ne correspondent pas.`,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_seo_hreflang_limits:Limites à connaître`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_seo_hreflang_limit_1:L’audit ne visite pas le Web. Une cible absente des blocs PAGE est signalée comme non vérifiable, sans conclure que son lien retour manque réellement.`,
        },
        {
          text: $localize`:@@ed_dev_seo_hreflang_limit_2:Une différence d’ensemble est un avertissement, pas toujours une erreur. Google autorise certains sous-ensembles tant que les relations importantes restent bidirectionnelles.`,
        },
        {
          text: $localize`:@@ed_dev_seo_hreflang_limit_3:hreflang aide au choix de la version dans les résultats ; il ne traduit pas la page et ne garantit ni exploration, ni indexation, ni classement.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_seo_hreflang_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_seo_hreflang_q1:Faut-il publier HTML, en-tête HTTP et sitemap en même temps ?`,
          a: $localize`:@@ed_dev_seo_hreflang_a1:Non. Google considère les trois méthodes comme équivalentes. Une seule méthode bien maintenue réduit le risque de divergence entre plusieurs sources.`,
        },
        {
          q: $localize`:@@ed_dev_seo_hreflang_q2:Deux codes peuvent-ils pointer vers la même URL ?`,
          a: $localize`:@@ed_dev_seo_hreflang_a2:Oui, notamment lorsqu’une version linguistique sert aussi de x-default. L’outil l’indique comme information afin que vous confirmiez ce choix.`,
        },
        {
          q: $localize`:@@ed_dev_seo_hreflang_q3:Les URL saisies sont-elles envoyées à Tools Central ?`,
          a: $localize`:@@ed_dev_seo_hreflang_a3:Non. La validation, la génération, la comparaison et l’export s’exécutent localement dans le navigateur. Aucun crawl ni stockage distant n’est déclenché.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_seo_hreflang_tip_title:La langue visible reste décisive`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_seo_hreflang_tip:Google détermine la langue à partir du contenu visible, pas uniquement du code hreflang ou de l’attribut lang. Évitez les pages dont seul le menu est traduit.`,
    },
  ],
};
