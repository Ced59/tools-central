import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_data_json_diff_title:Comparer deux JSON sans confondre formatage et changements réels`,
  lead: $localize`:@@ed_dev_data_json_diff_lead:Ce comparateur analyse localement la structure de deux documents JSON. Il distingue ajouts, suppressions, valeurs, types et déplacements, peut associer des objets de tableau par identifiant, exclut des chemins volatils et génère un patch JSON standard sans envoyer les données vers un serveur.`,
  updatedAtIso: '2026-09-18',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_diff_use_cases:Quand utiliser un diff JSON structurel ?`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_diff_uc1_title:Vérifier une réponse d’API`,
          text: $localize`:@@ed_dev_data_json_diff_uc1_text:Comparez une réponse de référence et une nouvelle version sans être perturbé par l’ordre des propriétés ni l’indentation. Les changements sont rattachés à des chemins explicites plutôt qu’à des numéros de ligne fragiles.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_diff_uc2_title:Relire une configuration avant déploiement`,
          text: $localize`:@@ed_dev_data_json_diff_uc2_text:Isolez les options ajoutées, retirées ou dont le type a changé, puis téléchargez le rapport pour la revue. Les secrets restent locaux, mais ils figurent dans le rapport si vous ne les excluez pas.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_diff_uc3_title:Comparer des collections dont l’ordre varie`,
          text: $localize`:@@ed_dev_data_json_diff_uc3_text:Associez les objets d’un tableau avec une clé comme /id ou /meta/identifiant. Un objet déplacé reste le même élément et ses modifications internes sont comparées sous un chemin logique stable.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_json_diff_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_data_json_diff_method_1:Commencez par une comparaison par index. Cette stratégie est prévisible pour les tableaux ordonnés et produit directement un patch JSON applicable au document gauche. L’ordre des propriétés d’un objet n’est jamais considéré comme une différence.`,
        $localize`:@@ed_dev_data_json_diff_method_2:Si un tableau représente une collection d’entités, activez l’association par clé et indiquez un JSON Pointer relatif à chaque objet. La clé doit être présente, scalaire et unique dans chaque tableau concerné. Les tableaux de chaînes, nombres ou booléens restent comparés par index.`,
        $localize`:@@ed_dev_data_json_diff_method_3:Ajoutez enfin les chemins volatils, un par ligne, par exemple /metadata/updatedAt. Le chemin et tout son sous-arbre sont retirés du diff comme du patch ; vérifiez donc cette liste avant de conclure que deux documents sont équivalents.`,
      ],
    },
    {
      id: 'outputs',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_diff_outputs:Comprendre les deux sorties`,
      icon: 'tc-icon tc-icon-code',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_diff_patch_title:Patch JSON RFC 6902`,
          text: $localize`:@@ed_dev_data_json_diff_patch_text:Le patch contient des opérations add, remove et replace avec des chemins JSON Pointer échappés. Il transforme le document gauche vers le document droit pour les chemins inclus, même lorsque l’aperçu s’appuie sur une association de tableaux par clé.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_diff_report_title:Rapport de revue`,
          text: $localize`:@@ed_dev_data_json_diff_report_text:Le rapport conserve le résumé, les options et les valeurs avant/après de chaque différence. Traitez-le comme les documents d’origine : il peut contenir des informations sensibles et n’est jamais téléversé automatiquement.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_diff_share_title:Lien sans données`,
          text: $localize`:@@ed_dev_data_json_diff_share_text:Le bouton de partage copie uniquement l’adresse publique de l’outil. Les JSON, chemins ignorés, noms de fichiers et résultats ne sont placés ni dans l’URL ni dans le presse-papiers du lien.`,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_diff_limits:Précision, sécurité et limites`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          text: $localize`:@@ed_dev_data_json_diff_limit_1:Chaque source est limitée à 2 millions de caractères ou 2 Mo par fichier. Le parseur accepte au plus 100 000 valeurs, 64 niveaux d’imbrication et 20 000 différences ; le rapport et le patch partagent un plafond de sortie de 16 millions de caractères.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_diff_limit_2:Les noms de propriétés dupliqués sont refusés au lieu de conserver silencieusement la dernière valeur. Les chaînes UTF-16 mal formées et les nombres qui seraient arrondis par JavaScript sont également rejetés pour éviter un diff trompeur.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_diff_limit_3:Le traitement s’effectue dans un Worker éphémère. L’outil compare les données, mais ne valide pas un schéma métier, une signature, des droits d’accès ou la sécurité du système qui consommera le patch.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_data_json_diff_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_data_json_diff_q1:Pourquoi l’ordre des propriétés n’apparaît-il pas ?`,
          a: $localize`:@@ed_dev_data_json_diff_a1:Un objet JSON est comparé par noms de propriétés et non par ordre d’écriture. Deux objets possédant les mêmes clés et valeurs sont donc équivalents même si leurs propriétés sont réordonnées ou leur indentation différente.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_diff_q2:Le patch utilise-t-il les clés d’association des tableaux ?`,
          a: $localize`:@@ed_dev_data_json_diff_a2:Le rapport utilise les clés pour rendre les changements lisibles et signaler les déplacements. Le patch reste un document RFC 6902 standard fondé sur les index réels afin de pouvoir être appliqué par les bibliothèques compatibles.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_diff_q3:Pourquoi certains grands nombres sont-ils refusés ?`,
          a: $localize`:@@ed_dev_data_json_diff_a3:JavaScript ne représente pas exactement tous les entiers et décimaux JSON. Plutôt que de comparer deux valeurs déjà arrondies, l’outil demande de les encoder comme chaînes lorsque leur représentation exacte ne peut pas être conservée.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_data_json_diff_tip_title:Appliquer un patch sur une copie`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_data_json_diff_tip:Testez toujours le patch sur une copie, puis validez le résultat avec les règles métier du système cible. Un patch syntaxiquement correct peut rester inadapté à une API, une configuration ou une base de données particulière.`,
    },
  ],
};
