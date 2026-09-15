import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_ooxml_metadata_title:Retirer les informations personnelles cachées d’un document Office` ,
  lead: $localize`:@@ed_dev_ooxml_metadata_lead:Un fichier Word, Excel ou PowerPoint peut conserver le nom de ses auteurs, une société, des dates, le logiciel utilisé, des champs personnalisés ou une miniature. Cet outil inventorie ces traces, crée une copie nettoyée et affiche un rapport avant/après, sans téléversement.` ,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_ooxml_metadata_use_cases:Quand nettoyer les métadonnées d’un DOCX, XLSX ou PPTX ?` ,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          title: $localize`:@@ed_dev_ooxml_metadata_uc1_title:Partager un document avec un client` ,
          text: $localize`:@@ed_dev_ooxml_metadata_uc1_text:Retirez le nom du créateur, du dernier éditeur et de l’organisation avant d’envoyer un livrable produit depuis un poste ou un modèle interne.` ,
        },
        {
          title: $localize`:@@ed_dev_ooxml_metadata_uc2_title:Publier un fichier téléchargeable` ,
          text: $localize`:@@ed_dev_ooxml_metadata_uc2_text:Contrôlez les propriétés exposées par un document destiné à un site public, une candidature, un appel d’offres ou une base documentaire.` ,
        },
        {
          title: $localize`:@@ed_dev_ooxml_metadata_uc3_title:Vérifier un modèle réutilisé` ,
          text: $localize`:@@ed_dev_ooxml_metadata_uc3_text:Repérez les champs personnalisés, chemins ou noms d’entreprise qui peuvent survivre lorsqu’un ancien fichier sert de point de départ.` ,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_ooxml_metadata_method:Comment fonctionne le nettoyage OOXML ?` ,
      icon: 'tc-icon tc-icon-cogs',
      paragraphs: [
        $localize`:@@ed_dev_ooxml_metadata_method_1:DOCX, XLSX et PPTX sont des archives ZIP contenant des fichiers XML. L’outil vérifie d’abord la table centrale, les chemins, les méthodes de compression, le nombre d’entrées et le volume décompressé avant de lire les propriétés.` ,
        $localize`:@@ed_dev_ooxml_metadata_method_2:Les parties qualifiées par les relations OPC officielles sont vidées de leurs valeurs tout en conservant leur racine, leur espace de noms et leur encodage. La relation de miniature est supprimée ; ses octets restent présents lorsqu’un autre contenu du document les utilise.` ,
        $localize`:@@ed_dev_ooxml_metadata_method_3:Le package est ensuite recompressé dans un Web Worker. Téléchargez la copie, ouvrez-la dans Word, Excel ou PowerPoint et enregistrez-la seulement après avoir vérifié le contenu important.` ,
      ],
    },
    {
      id: 'report',
      kind: 'list',
      heading: $localize`:@@ed_dev_ooxml_metadata_report:Comprendre le rapport avant/après` ,
      icon: 'tc-icon tc-icon-list',
      items: [
        { text: $localize`:@@ed_dev_ooxml_metadata_report_1:« Détectés » compte les valeurs prises en charge trouvées avant modification : auteurs, dates, société, application, modèle, temps d’édition, propriétés personnalisées et aperçu.` },
        { text: $localize`:@@ed_dev_ooxml_metadata_report_2:« Retirés ou neutralisés » correspond aux catégories cochées. Une catégorie laissée décochée apparaît dans les éléments conservés après traitement.` },
        { text: $localize`:@@ed_dev_ooxml_metadata_report_3:Une absence de résultat ne prouve pas qu’un document ne contient aucune donnée sensible : du texte visible, des commentaires ou des objets intégrés peuvent encore en révéler.` },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_ooxml_metadata_limits:Formats, sécurité et limites` ,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_ooxml_metadata_limit_1:Seuls les formats sans macros DOCX, XLSX et PPTX sont acceptés, jusqu’à 50 Mio. Chaque partie XML inspectée est limitée à 2 Mio et une miniature officiellement déclarée à 25 Mio. Les archives ZIP64, multidisque, chiffrées, ambiguës ou présentant un ratio de compression dangereux sont refusées avant extraction.` },
        { text: $localize`:@@ed_dev_ooxml_metadata_limit_2:L’outil ne retire pas les commentaires, auteurs de révisions, notes de présentation, feuilles masquées, contenu visible, liens, objets incorporés, signatures numériques ni protections.` },
        { text: $localize`:@@ed_dev_ooxml_metadata_limit_3:La reconstruction modifie les octets et invalide une éventuelle signature du package. Conservez toujours l’original et vérifiez la copie dans l’application Office utilisée par vos destinataires.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_ooxml_metadata_faq:Questions fréquentes sur les métadonnées Office` ,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_ooxml_metadata_q1:Le contenu de mon document est-il envoyé au serveur ?` ,
          a: $localize`:@@ed_dev_ooxml_metadata_a1:Non. La lecture, l’inventaire, le nettoyage et la recompression s’exécutent dans le navigateur. Le fichier, son nom et les valeurs détectées ne sont pas transmis à Tools Central.` ,
        },
        {
          q: $localize`:@@ed_dev_ooxml_metadata_q2:Pourquoi les fichiers DOCM, XLSM et PPTM sont-ils refusés ?` ,
          a: $localize`:@@ed_dev_ooxml_metadata_a2:Ils peuvent contenir des macros et relations supplémentaires dont la conservation sûre demande un audit spécifique. L’outil limite volontairement sa promesse aux packages DOCX, XLSX et PPTX sans macros.` ,
        },
        {
          q: $localize`:@@ed_dev_ooxml_metadata_q3:Le document nettoyé est-il forcément anonyme ?` ,
          a: $localize`:@@ed_dev_ooxml_metadata_a3:Non. Un nom peut rester dans le texte, les commentaires, les révisions, les notes, les images ou des objets intégrés. Le rapport couvre les propriétés standard annoncées, pas une anonymisation exhaustive du contenu.` ,
        },
      ],
    },
  ],
};
