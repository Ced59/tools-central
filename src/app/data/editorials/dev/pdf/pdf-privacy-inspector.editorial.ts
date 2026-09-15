import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_privacy_title:Contrôler les traces cachées d’un PDF avant de le partager`,
  lead: $localize`:@@ed_dev_pdf_privacy_lead:Un PDF peut conserver le nom de son auteur, une pièce jointe, un formulaire rempli, une URL de suivi ou du code déclenché par certains lecteurs. Cet inspecteur rassemble ces signaux dans un rapport local, lisible et exportable, sans ouvrir les fichiers embarqués ni contacter les liens détectés.`,
  updatedAtIso: '2026-09-15',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_privacy_use_cases:Quand inspecter la confidentialité d’un PDF ?`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_privacy_uc1_title:Avant un envoi externe`,
          text: $localize`:@@ed_dev_pdf_privacy_uc1_text:Contrôlez un contrat, un rapport ou une présentation convertie en PDF avant de l’envoyer à un client, un candidat, une administration ou un partenaire.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_privacy_uc2_title:À la réception d’un document complexe`,
          text: $localize`:@@ed_dev_pdf_privacy_uc2_text:Repérez les pièces jointes, scripts et actions automatiques avant d’ouvrir le fichier dans un lecteur riche. L’inspecteur n’exécute jamais ces éléments.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_privacy_uc3_title:Pour documenter une revue`,
          text: $localize`:@@ed_dev_pdf_privacy_uc3_text:Téléchargez le JSON afin de conserver la version PDF, le nombre de pages, les catégories trouvées, leur sévérité et les limites explicites de l’analyse.`,
        },
      ],
    },
    {
      id: 'coverage',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_privacy_coverage:Ce que le rapport examine réellement`,
      icon: 'tc-icon tc-icon-search',
      paragraphs: [
        $localize`:@@ed_dev_pdf_privacy_coverage_1:Les dictionnaires d’information et les propriétés XMP peuvent révéler auteur, logiciel, dates, mots-clés ou identifiants documentaires. Le rapport affiche uniquement les valeurs pertinentes et les borne pour préserver la réactivité.`,
        $localize`:@@ed_dev_pdf_privacy_coverage_2:Les fichiers embarqués, URL externes, champs AcroForm ou XFA et signatures sont inventoriés sans extraire leurs données sensibles. Une valeur de formulaire est comptée comme présente, mais n’est jamais recopiée dans le rapport.`,
        $localize`:@@ed_dev_pdf_privacy_coverage_3:PDF.js détecte les actions JavaScript au niveau du document, des pages et des formulaires. Leur code n’est ni affiché, ni évalué, ni transmis. Les actions d’ouverture ou de lancement connues sont signalées séparément.`,
      ],
    },
    {
      id: 'interpretation',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_privacy_interpretation:Interpréter les niveaux d’attention`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_privacy_level_high_title:Attention forte`,
          text: $localize`:@@ed_dev_pdf_privacy_level_high_text:JavaScript, action automatique sensible ou fichier embarqué demande une revue avant diffusion. Leur présence n’établit pas à elle seule une intention malveillante.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_privacy_level_medium_title:À vérifier`,
          text: $localize`:@@ed_dev_pdf_privacy_level_medium_text:Les liens externes, formulaires remplis et structures XFA peuvent transmettre ou conserver des informations selon le lecteur et l’usage du document.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_privacy_level_low_title:Trace trouvée`,
          text: $localize`:@@ed_dev_pdf_privacy_level_low_text:Une métadonnée ou l’identité associée à une signature peut être légitime, mais mérite une décision consciente avant publication.`,
        },
      ],
    },
    {
      id: 'security',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_privacy_security:Traitement local et limites de sécurité`,
      icon: 'tc-icon tc-icon-lock',
      items: [
        { text: $localize`:@@ed_dev_pdf_privacy_security_1:Le fichier et son éventuel mot de passe restent dans la mémoire du navigateur. L’analyse s’exécute dans un Worker et les ressources PDF.js sont servies par Tools Central.`, },
        { text: $localize`:@@ed_dev_pdf_privacy_security_2:La taille est limitée à 50 Mio, le document à 1 000 pages et le nombre d’éléments distincts à 10 000. L’affichage est borné à 200 lignes tandis que les totaux complets restent dans le rapport.`, },
        { text: $localize`:@@ed_dev_pdf_privacy_security_3:Ce contrôle structurel n’est ni un antivirus, ni une analyse du texte ou des images visibles, ni une preuve cryptographique de validité des signatures. Un résultat vide n’est donc pas un certificat d’innocuité.`, },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_privacy_faq:Questions fréquentes sur la confidentialité des PDF`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_pdf_privacy_q1:Le mot de passe de mon PDF est-il enregistré ?`,
          a: $localize`:@@ed_dev_pdf_privacy_a1:Non. Il est transmis uniquement au Worker local pour déchiffrer la structure, puis disparaît avec l’état de la page, une réinitialisation ou la fermeture de l’onglet. Il n’est jamais inclus dans le JSON.`,
        },
        {
          q: $localize`:@@ed_dev_pdf_privacy_q2:Un JavaScript détecté signifie-t-il que le PDF est dangereux ?`,
          a: $localize`:@@ed_dev_pdf_privacy_a2:Pas nécessairement. Des formulaires légitimes utilisent JavaScript pour calculer ou valider des champs. Sa présence justifie toutefois une revue et l’ouverture dans un environnement adapté à la provenance du fichier.`,
        },
        {
          q: $localize`:@@ed_dev_pdf_privacy_q3:Pourquoi une signature n’est-elle pas marquée comme valide ou invalide ?`,
          a: $localize`:@@ed_dev_pdf_privacy_a3:Une validation fiable doit vérifier la chaîne de certificats, la révocation, l’horodatage et les octets signés. L’outil décrit seulement la présence, l’identité déclarée et la couverture exposées par le PDF.`,
        },
      ],
    },
  ],
};
