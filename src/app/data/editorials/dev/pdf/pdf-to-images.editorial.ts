import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_to_images_title:Convertir les pages d’un PDF en images sans envoyer le document`,
  lead: $localize`:@@ed_dev_pdf_to_images_lead:Ce convertisseur rend les pages d’un PDF directement dans le navigateur avec PDF.js. Vous choisissez les pages, la résolution et le format, contrôlez les dimensions estimées avant le traitement, puis récupérez une image ou une archive ZIP.` ,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_to_images_use_cases:Quand convertir un PDF en PNG, JPEG ou WebP ?`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_to_images_uc1_title:Créer un aperçu partageable`,
          text: $localize`:@@ed_dev_pdf_to_images_uc1_text:Convertissez quelques pages en images pour une messagerie, une documentation ou une vignette sans transmettre le PDF à un service distant.` ,
        },
        {
          title: $localize`:@@ed_dev_pdf_to_images_uc2_title:Préparer des pages pour le Web`,
          text: $localize`:@@ed_dev_pdf_to_images_uc2_text:Choisissez JPEG pour une page photographique, PNG pour les aplats et petits caractères, ou WebP lorsque votre chaîne de publication le prend en charge.` ,
        },
        {
          title: $localize`:@@ed_dev_pdf_to_images_uc3_title:Exporter une plage précise`,
          text: $localize`:@@ed_dev_pdf_to_images_uc3_text:La syntaxe 1-3, 7 permet de ne rendre que les pages utiles. Plusieurs résultats sont regroupés dans un ZIP avec des noms de fichiers ordonnés.` ,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_to_images_method:Choisir la résolution et le format`,
      icon: 'tc-icon tc-icon-sliders-h',
      paragraphs: [
        $localize`:@@ed_dev_pdf_to_images_method_1:Le PDF décrit ses pages en points, à raison de 72 points par pouce. À 144 DPI, chaque dimension contient donc environ deux fois plus de pixels qu’à 72 DPI, et le nombre total de pixels est multiplié par quatre.` ,
        $localize`:@@ed_dev_pdf_to_images_method_2:Pour un écran, commencez à 96 ou 144 DPI. Montez à 200 ou 300 DPI uniquement si de petits détails doivent rester lisibles, car la mémoire et le temps de rendu augmentent rapidement.` ,
        $localize`:@@ed_dev_pdf_to_images_method_3:PNG conserve précisément les aplats mais peut être lourd. JPEG et WebP sont avec perte : réduisez progressivement la qualité et contrôlez visuellement les caractères fins, graphiques et contrastes.` ,
      ],
    },
    {
      id: 'privacy',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_to_images_privacy:Confidentialité et limites de sécurité`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          text: $localize`:@@ed_dev_pdf_to_images_privacy_1:Le fichier, son éventuel mot de passe et les images générées restent dans la mémoire locale du navigateur. Ils ne sont ni téléversés ni enregistrés par l’outil.` ,
        },
        {
          text: $localize`:@@ed_dev_pdf_to_images_privacy_2:La taille d’entrée est limitée à 50 Mio, un document à 1 000 pages et une conversion à 50 pages. Un budget de pixels bloque aussi les demandes susceptibles d’épuiser la mémoire.` ,
        },
        {
          text: $localize`:@@ed_dev_pdf_to_images_privacy_3:Le moteur utilise uniquement des ressources embarquées par le site et applique des budgets de taille et de pixels. Un PDF reste toutefois un format complexe : n’ouvrez pas un document provenant d’une source non fiable sur un appareil sensible.` ,
        },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_to_images_limits:Ce que l’image ne conserve pas`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_to_images_limit_1:Le texte devient une grille de pixels : il n’est plus sélectionnable, recherchable ni correctement interprété par un lecteur d’écran.` },
        { text: $localize`:@@ed_dev_pdf_to_images_limit_2:Les liens, champs de formulaire, signatures numériques, pièces jointes, calques et métadonnées du PDF ne sont pas transférés dans l’image.` },
        { text: $localize`:@@ed_dev_pdf_to_images_limit_3:Le rendu suit les capacités de PDF.js et du navigateur. Des polices absentes, profils colorimétriques particuliers ou très grandes images peuvent produire un résultat différent du logiciel d’origine.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_to_images_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_pdf_to_images_q1:Quel format donne la meilleure qualité ?`,
          a: $localize`:@@ed_dev_pdf_to_images_a1:PNG est sans perte et convient aux schémas ou au texte net. JPEG et WebP offrent souvent des fichiers plus petits pour les photos, mais leur qualité doit être vérifiée visuellement.` ,
        },
        {
          q: $localize`:@@ed_dev_pdf_to_images_q2:Pourquoi 300 DPI est-il parfois bloqué ?`,
          a: $localize`:@@ed_dev_pdf_to_images_a2:Le nombre de pixels croît avec le carré de la résolution. L’outil calcule le coût avant rendu et bloque une combinaison trop lourde afin de protéger l’onglet et les appareils mobiles.` ,
        },
        {
          q: $localize`:@@ed_dev_pdf_to_images_q3:Le mot de passe quitte-t-il mon appareil ?`,
          a: $localize`:@@ed_dev_pdf_to_images_a3:Non. Il est fourni uniquement au moteur PDF exécuté dans votre navigateur et est effacé de l’interface lors de la réinitialisation ou du départ de la page.` ,
        },
      ],
    },
  ],
};
