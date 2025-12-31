import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_scan_detector_title:À propos : PDF Scan Detector`,
  lead: $localize`:@@ed_dev_pdf_pdf_scan_detector_lead:Détecter si un PDF est un scan (image-only) ou contient du texte exploitable, et exporter un diagnostic JSON par page pour orienter OCR, accessibilité et extraction.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_scan_detector_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc1_title:Décider d’un OCR`, text: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc1_text:Savoir rapidement si l’OCR est nécessaire avant indexation/recherche plein texte.` },
        { title: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc2_title:Contrôle accessibilité`, text: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc2_text:Identifier des PDF “images” non sélectionnables (souvent non accessibles) à corriger.` },
        { title: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc3_title:Pipeline d’extraction`, text: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc3_text:Router automatiquement les documents : extraction directe si texte présent, OCR sinon.` },
        { title: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc4_title:QA de numérisation`, text: $localize`:@@ed_dev_pdf_pdf_scan_detector_uc4_text:Repérer des pages de mauvaise qualité (trop peu de texte, images dominantes) dans un lot de scans.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_scan_detector_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_scan_detector_out1:Un diagnostic JSON par page : présence de texte, proportion de contenu image, indices de “scan” (selon heuristiques).`,
        $localize`:@@ed_dev_pdf_pdf_scan_detector_out2:Des indicateurs pour prioriser l’OCR (pages à traiter, pages déjà exploitables).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_scan_detector_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_scan_detector_lim1:Détection heuristique : certains PDF graphiques (catalogues, slides) peuvent ressembler à des scans sans l’être.` },
        { text: $localize`:@@ed_dev_pdf_pdf_scan_detector_lim2:Des PDF peuvent contenir du “texte caché” (OCR déjà fait) : l’outil le détecte mais la qualité peut varier.` },
        { text: $localize`:@@ed_dev_pdf_pdf_scan_detector_lim3:La qualité réelle de l’OCR dépendra de la résolution, du contraste et de la langue — non évalués finement ici.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_scan_detector_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_scan_detector_q1:Un scan peut-il contenir du texte sélectionnable ?`, a: $localize`:@@ed_dev_pdf_pdf_scan_detector_a1:Oui, si un OCR a été appliqué : l’image reste, mais une couche texte est ajoutée.` },
        { q: $localize`:@@ed_dev_pdf_pdf_scan_detector_q2:Est-ce que l’outil fait l’OCR ?`, a: $localize`:@@ed_dev_pdf_pdf_scan_detector_a2:Non. Il détecte et diagnostique. L’OCR est une étape séparée.` },
        { q: $localize`:@@ed_dev_pdf_pdf_scan_detector_q3:Pourquoi une page est classée “scan” alors que je vois du texte ?`, a: $localize`:@@ed_dev_pdf_pdf_scan_detector_a3:Le texte visible peut être une image (rendu), pas du texte vectoriel. Le diagnostic se base sur le contenu interne.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_scan_detector_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_scan_detector_tip:Avant d’investir du temps d’extraction, détectez les scans : c’est la façon la plus simple d’éviter de “chasser” du texte qui n’existe pas sans OCR.`,
    },
  ],
};
