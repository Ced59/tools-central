import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_images_to_pdf_title:Assembler plusieurs images dans un PDF sans téléversement`,
  lead: $localize`:@@ed_dev_images_to_pdf_lead:Ce convertisseur crée une page PDF par image directement dans le navigateur. Vous contrôlez l’ordre, le format A4, Lettre US ou adapté à l’image, les marges et le niveau de compression avant de télécharger le document.` ,
  updatedAtIso: '2026-09-14',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_images_to_pdf_use_cases:Quand regrouper des images dans un PDF ?`,
      icon: 'tc-icon tc-icon-images',
      items: [
        {
          title: $localize`:@@ed_dev_images_to_pdf_uc1_title:Partager un scan multipage`,
          text: $localize`:@@ed_dev_images_to_pdf_uc1_text:Photographiez ou numérisez chaque feuille, placez les fichiers dans l’ordre de lecture et créez un document unique plus simple à envoyer ou archiver.` ,
        },
        {
          title: $localize`:@@ed_dev_images_to_pdf_uc2_title:Préparer un dossier illustré`,
          text: $localize`:@@ed_dev_images_to_pdf_uc2_text:Utilisez des pages A4 ou Lettre US et des marges constantes afin d’obtenir une présentation homogène à partir d’images de proportions différentes.` ,
        },
        {
          title: $localize`:@@ed_dev_images_to_pdf_uc3_title:Conserver la taille propre à chaque image`,
          text: $localize`:@@ed_dev_images_to_pdf_uc3_text:Le format adapté crée chaque page selon les dimensions de son image à 96 pixels par pouce, sans forcer toutes les pages dans le même ratio.` ,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_images_to_pdf_method:Choisir format, marges et compression`,
      icon: 'tc-icon tc-icon-sliders-h',
      paragraphs: [
        $localize`:@@ed_dev_images_to_pdf_method_1:Les formats A4 et Lettre US redimensionnent l’image pour la faire tenir entièrement dans la zone imprimable : aucune partie n’est rognée. Les espaces libres dépendent donc du ratio de la photo et de l’orientation choisie.` ,
        $localize`:@@ed_dev_images_to_pdf_method_2:Le mode qualité élevée préserve les PNG en PNG et encode les photos avec une qualité JPEG forte. Les modes équilibré et compact convertissent les pages en JPEG sur fond blanc pour réduire le poids, ce qui supprime la transparence.` ,
        $localize`:@@ed_dev_images_to_pdf_method_3:Commencez par le mode équilibré pour un scan ou des photos. Choisissez qualité élevée pour des schémas avec transparence ou du petit texte, puis contrôlez le PDF obtenu à 100 % avant diffusion.` ,
      ],
    },
    {
      id: 'privacy',
      kind: 'list',
      heading: $localize`:@@ed_dev_images_to_pdf_privacy:Traitement local et limites de sécurité`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        { text: $localize`:@@ed_dev_images_to_pdf_privacy_1:Les images sont décodées et le PDF est créé dans un Web Worker du navigateur. Aucun fichier, nom de fichier ou contenu n’est envoyé à Tools Central.` },
        { text: $localize`:@@ed_dev_images_to_pdf_privacy_2:La sélection est limitée à 50 images, 25 Mio par fichier et 100 Mio au total. Les dimensions, le nombre de pixels et la sortie PDF sont également bornés pour protéger la mémoire.` },
        { text: $localize`:@@ed_dev_images_to_pdf_privacy_3:Le type déclaré par le navigateur n’est pas considéré comme une preuve : l’outil vérifie les signatures et dimensions PNG, JPEG ou WebP avant le décodage complet.` },
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_images_to_pdf_limits:Ce que cette conversion ne fait pas`,
      icon: 'tc-icon tc-icon-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_images_to_pdf_limit_1:Le texte visible dans une image reste composé de pixels : il ne devient pas sélectionnable, recherchable ni accessible à un lecteur d’écran.` },
        { text: $localize`:@@ed_dev_images_to_pdf_limit_2:L’outil ne réalise ni reconnaissance OCR, ni correction automatique de perspective, ni amélioration d’un scan flou ou sous-exposé.` },
        { text: $localize`:@@ed_dev_images_to_pdf_limit_3:Les métadonnées EXIF ne sont pas recopiées comme métadonnées PDF, mais l’image est réencodée. Vérifiez toujours l’orientation et le rendu final avant partage.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_images_to_pdf_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_images_to_pdf_q1:Pourquoi le PDF compact a-t-il un fond blanc ?`,
          a: $localize`:@@ed_dev_images_to_pdf_a1:JPEG ne gère pas la transparence. Les modes équilibré et compact composent donc les pixels transparents sur du blanc avant encodage afin d’obtenir un document cohérent et plus léger.` ,
        },
        {
          q: $localize`:@@ed_dev_images_to_pdf_q2:Mes images sont-elles rognées sur une page A4 ?`,
          a: $localize`:@@ed_dev_images_to_pdf_a2:Non. L’image est réduite ou agrandie proportionnellement pour tenir dans la page et les marges. Des bandes blanches peuvent apparaître si son ratio diffère de celui de la page.` ,
        },
        {
          q: $localize`:@@ed_dev_images_to_pdf_q3:Pourquoi une très grande image est-elle refusée ?`,
          a: $localize`:@@ed_dev_images_to_pdf_a3:Une image compressée de quelques mégaoctets peut occuper beaucoup plus de mémoire une fois décodée. Les limites de dimensions et de pixels évitent qu’un fichier épuise la mémoire, notamment sur mobile.` ,
        },
      ],
    },
  ],
};
