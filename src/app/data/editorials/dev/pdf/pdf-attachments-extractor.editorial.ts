import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_title:À propos : PDF Attachments Extractor`,
  lead: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_lead:Extraire les fichiers intégrés (pièces jointes / embedded files) d’un PDF et obtenir un inventaire JSON (noms, tailles, types) pour analyse, archivage ou sécurité.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc1_title:Récupérer une pièce jointe intégrée`, text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc1_text:Extraire un XML, une facture, un ZIP ou tout autre fichier embarqué dans un PDF.` },
        { title: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc2_title:Analyse sécurité`, text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc2_text:Identifier rapidement la présence de fichiers cachés/embarqués avant ouverture ou partage.` },
        { title: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc3_title:Automatisation GED`, text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_uc3_text:Alimenter un workflow qui sépare le PDF “conteneur” de ses fichiers annexes.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_attachments_extractor_out1:Une liste JSON des pièces jointes (nom, taille, mime/type si disponible, méthode de stockage).`,
        $localize`:@@ed_dev_pdf_pdf_attachments_extractor_out2:Un export des fichiers intégrés (quand l’outil le permet) pour les récupérer indépendamment du PDF.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_lim1:Un PDF chiffré peut empêcher l’accès aux fichiers intégrés sans mot de passe.` },
        { text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_lim2:Une pièce jointe peut contenir un contenu potentiellement dangereux : scannez les fichiers extraits avant usage.` },
        { text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_lim3:Les métadonnées de type (MIME) ne sont pas toujours présentes : l’extension du nom n’est pas une garantie.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_q1:Un PDF peut vraiment contenir des fichiers ?`, a: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_a1:Oui. Le format PDF supporte des “embedded files” (pièces jointes) via l’arbre des noms.` },
        { q: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_q2:Est-ce que l’outil supprime les pièces jointes ?`, a: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_a2:Non, il extrait et/ou liste. Pour nettoyer un PDF, utilisez plutôt un outil de “sanitization”.` },
        { q: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_q3:Je ne vois aucune pièce jointe, c’est normal ?`, a: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_a3:Oui : la plupart des PDF n’en contiennent pas. L’outil sert justement à vérifier.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_attachments_extractor_tip:Si vous devez partager le document, pensez à exécuter “Nettoyer / sanitiser un PDF” après extraction pour retirer les pièces jointes et réduire les risques.`,
    },
  ],
};
