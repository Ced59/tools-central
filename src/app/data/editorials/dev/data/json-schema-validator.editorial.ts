import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_data_json_schema_title:Valider un JSON avec un contrat explicite et des erreurs exploitables`,
  lead: $localize`:@@ed_dev_data_json_schema_lead:Ce validateur exécute JSON Schema dans un Worker local, sans convertir les types ni supprimer les propriétés qui échouent. Il prend en charge Draft 7, 2019-09 et 2020-12, localise chaque règle en échec avec un JSON Pointer et peut proposer un exemple corrigé lorsque la modification reste prudente.`,
  updatedAtIso: '2026-09-18',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_schema_use_cases:Quand valider des données avec JSON Schema ?`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_schema_uc1_title:Tester un payload d’API`,
          text: $localize`:@@ed_dev_data_json_schema_uc1_text:Vérifiez avant intégration que les champs obligatoires, types, formats et valeurs autorisées correspondent au contrat. Un chemin comme /utilisateur/email désigne directement la donnée à corriger, sans dépendre de son numéro de ligne.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_schema_uc2_title:Contrôler un fichier de configuration`,
          text: $localize`:@@ed_dev_data_json_schema_uc2_text:Repérez les options inconnues avec additionalProperties, les tableaux incomplets et les contraintes numériques avant un déploiement. Le moteur ne remplace aucune valeur dans l’entrée pendant le diagnostic.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_schema_uc3_title:Comparer un producteur à son contrat`,
          text: $localize`:@@ed_dev_data_json_schema_uc3_text:Collez un exemple produit par un formulaire, un export ou un service puis exportez le rapport technique. Le rapport contient les chemins et règles, pas une copie automatique du JSON d’origine.`,
        },
      ],
    },
    {
      id: 'drafts',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_json_schema_drafts:Choisir le bon brouillon`,
      icon: 'tc-icon tc-icon-code',
      paragraphs: [
        $localize`:@@ed_dev_data_json_schema_drafts_1:En détection automatique, la propriété $schema sélectionne Draft 7, 2019-09 ou 2020-12. Lorsqu’elle est absente, Draft 7 est utilisé pour rester compatible avec les nombreux schémas historiques qui reposent sur definitions et les anciens comportements de tuples.`,
        $localize`:@@ed_dev_data_json_schema_drafts_2:Un choix explicite remplace seulement la déclaration pendant la compilation locale ; le texte collé n’est pas réécrit. Cette option aide à tester un schéma sans URI $schema, mais ne convertit pas automatiquement les mots-clés d’un brouillon vers un autre.`,
        $localize`:@@ed_dev_data_json_schema_drafts_3:Les références internes comme #/$defs/adresse ou #/definitions/adresse sont résolues. Les références HTTP, HTTPS ou relatives vers d’autres fichiers sont refusées afin que la validation reste prévisible, hors ligne et sans fuite de l’URL référencée.`,
      ],
    },
    {
      id: 'diagnostics',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_schema_diagnostics:Lire le diagnostic`,
      icon: 'tc-icon tc-icon-list',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_schema_diag_path_title:Chemin des données`,
          text: $localize`:@@ed_dev_data_json_schema_diag_path_text:Le JSON Pointer d’instance indique la valeur concernée. Une erreur required reste attachée à l’objet parent et nomme séparément la propriété manquante ; une erreur à la racine affiche explicitement « Racine ».`,
        },
        {
          title: $localize`:@@ed_dev_data_json_schema_diag_rule_title:Chemin de la règle`,
          text: $localize`:@@ed_dev_data_json_schema_diag_rule_text:Le chemin de schéma montre la contrainte appliquée, par exemple #/properties/age/minimum. Le mot-clé technique est conservé dans le rapport pour faciliter une recherche dans la spécification.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_schema_diag_format_title:Formats standards`,
          text: $localize`:@@ed_dev_data_json_schema_diag_format_text:La vérification optionnelle couvre notamment email, date, date-time, URI, hostname, UUID, IPv4 et IPv6. Un format vérifie une syntaxe ; il ne prouve pas qu’une adresse existe, qu’un domaine répond ou qu’une ressource est sûre.`,
        },
      ],
    },
    {
      id: 'correction',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_json_schema_correction:Ce que corrige la proposition automatique`,
      icon: 'tc-icon tc-icon-wrench',
      paragraphs: [
        $localize`:@@ed_dev_data_json_schema_correction_1:La proposition peut ajouter une propriété required lorsqu’un default, un example, une constante, une valeur enum ou un type simple fournit une valeur déterministe. Elle peut aussi retirer une propriété explicitement interdite, appliquer une borne numérique, compléter ou tronquer une chaîne ou un tableau et remplacer quelques formats par un exemple syntaxique.`,
        $localize`:@@ed_dev_data_json_schema_correction_2:Chaque proposition est revalidée avec le même schéma et le même brouillon. Le badge distingue une proposition devenue valide d’une aide encore incomplète. Les règles conditionnelles, les expressions régulières et les variantes anyOf ou oneOf ne sont pas devinées.`,
        $localize`:@@ed_dev_data_json_schema_correction_3:Une valeur techniquement valide peut rester fausse pour votre métier. Relisez le JSON proposé, remplacez les exemples génériques et ne l’utilisez jamais comme migration automatique de données sans tests propres à votre application.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_schema_limits:Sécurité, précision et limites`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          text: $localize`:@@ed_dev_data_json_schema_limit_1:Le schéma est limité à 500 000 caractères, les données à 2 millions de caractères et chaque fichier à 2 Mo. Le parseur accepte au plus 100 000 valeurs et 64 niveaux d’imbrication ; l’interface affiche au maximum 500 erreurs.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_schema_limit_2:Les clés dupliquées, chaînes UTF-16 mal formées et nombres qui perdraient leur représentation JavaScript sont refusés avant validation. Les expressions régulières sont plafonnées en nombre et en longueur, puis exécutées dans un Worker annulable.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_schema_limit_3:JSON Schema décrit la forme et certaines relations entre valeurs. Il ne vérifie ni une signature, ni des droits d’accès, ni l’existence d’un compte, ni la sécurité du code qui consommera les données.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_data_json_schema_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_data_json_schema_q1:Pourquoi « 42 » n’est-il pas accepté comme nombre ?`,
          a: $localize`:@@ed_dev_data_json_schema_a1:Le validateur désactive la coercition. Une chaîne reste une chaîne, même si son contenu ressemble à un nombre. Cette rigueur évite qu’un test réussi dans l’outil masque une incompatibilité réelle dans un consommateur qui ne convertit pas les types.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_schema_q2:Pourquoi une référence distante est-elle refusée ?`,
          a: $localize`:@@ed_dev_data_json_schema_a2:Charger une référence distante rendrait le résultat dépendant du réseau et révélerait l’URL demandée au serveur distant. Regroupez les définitions nécessaires dans $defs ou definitions et utilisez des références locales.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_schema_q3:Une validation réussie garantit-elle que le JSON est sûr ?`,
          a: $localize`:@@ed_dev_data_json_schema_a3:Non. Elle garantit seulement le respect des règles exprimées par le schéma. Le contenu doit encore être traité comme non fiable : contrôles d’autorisation, échappement, limites métier et protections propres au système restent nécessaires.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_data_json_schema_tip_title:Versionner le schéma avec les données`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_data_json_schema_tip:Conservez le brouillon, le schéma et des exemples valides/invalides dans le même dépôt que le producteur. Une validation locale ponctuelle aide au diagnostic ; des tests automatisés empêchent le contrat de dériver au fil des versions.`,
    },
  ],
};
