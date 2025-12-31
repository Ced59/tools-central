import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_split_title:À propos : PDF Split`,
  lead: $localize`:@@ed_dev_pdf_pdf_split_lead:Découper (split) un PDF en plusieurs fichiers : une page par fichier ou des plages de pages, pour extraction, partage, traitement batch et automatisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_split_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_split_uc1_title:Partager seulement une partie`, text: $localize`:@@ed_dev_pdf_pdf_split_uc1_text:Envoyer uniquement les pages pertinentes (ex : annexes, pages signées, factures) sans transmettre tout le document.` },
        { title: $localize`:@@ed_dev_pdf_pdf_split_uc2_title:Traitement batch`, text: $localize`:@@ed_dev_pdf_pdf_split_uc2_text:Découper un gros PDF en pages unitaires pour OCR, indexation ou traitement parallèle.` },
        { title: $localize`:@@ed_dev_pdf_pdf_split_uc3_title:Préparer un dossier`, text: $localize`:@@ed_dev_pdf_pdf_split_uc3_text:Isoler des sections par plages (1-3, 4-7, etc.) pour créer plusieurs livrables.` },
        { title: $localize`:@@ed_dev_pdf_pdf_split_uc4_title:Debug de page problématique`, text: $localize`:@@ed_dev_pdf_pdf_split_uc4_text:Extraire une page qui fait planter un outil, pour isoler et analyser l’erreur.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_split_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_split_out1:Des PDF de sortie selon les plages demandées (ou une page par fichier) avec une nomenclature cohérente.`,
        $localize`:@@ed_dev_pdf_pdf_split_out2:Un mapping JSON des plages/pages extraites pour tracer l’origine de chaque fichier généré.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_split_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_split_lim1:Découper un PDF signé invalide généralement la signature (le fichier change) : gardez l’original si besoin de preuve.` },
        { text: $localize`:@@ed_dev_pdf_pdf_split_lim2:Sur des PDF chiffrés, il faut souvent déverrouiller avant split.` },
        { text: $localize`:@@ed_dev_pdf_pdf_split_lim3:Des éléments de navigation (bookmarks) peuvent être perdus ou simplifiés selon le moteur de split.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_split_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_split_q1:Puis-je extraire les pages 3 à 5 ?`, a: $localize`:@@ed_dev_pdf_pdf_split_a1:Oui : utilisez des plages. Selon l’outil, vous pouvez fournir une liste de ranges (ex : 3-5, 8, 10-12).` },
        { q: $localize`:@@ed_dev_pdf_pdf_split_q2:La qualité change-t-elle ?`, a: $localize`:@@ed_dev_pdf_pdf_split_a2:Non : le split réutilise les pages. Il ne recomprime pas le contenu.` },
        { q: $localize`:@@ed_dev_pdf_pdf_split_q3:Que devient la numérotation ?`, a: $localize`:@@ed_dev_pdf_pdf_split_a3:Les pages dans les fichiers extraits repartent généralement à 1, mais le mapping conserve la correspondance avec l’original.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_split_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_split_tip:Pour un traitement robuste, commencez par “Pages PDF → JSON” : vous pourrez vérifier le nombre exact de pages et éviter les erreurs de plage (hors limites).`,
    },
  ],
};
