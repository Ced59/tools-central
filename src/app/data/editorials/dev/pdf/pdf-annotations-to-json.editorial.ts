import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_title:À propos : PDF Annotations → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_lead:Exporter toutes les annotations d’un PDF (commentaires, surlignages, tampons, liens cliquables…) au format JSON pour audit, migration ou contrôle qualité.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc1_title:Audit de commentaires`, text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc1_text:Lister les notes, surlignages et tampons avant d’archiver ou de transmettre un PDF annoté.` },
        { title: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc2_title:Migration d’annotations`, text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc2_text:Extraire une structure JSON pour reconstituer les annotations dans un autre outil (GED, viewer, workflow QA).` },
        { title: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc3_title:Contrôle qualité`, text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc3_text:Vérifier qu’un document contient bien les annotations attendues (pages, positions, auteurs) dans une pipeline CI/CD.` },
        { title: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc4_title:Sécurité & conformité`, text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_uc4_text:Détecter des annotations cachant des données sensibles (commentaires internes, pièces jointes, contenus).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_annotations_to_json_out1:Un export JSON des annotations par page (type, rectangle, contenu, auteur, dates, flags, action associée).`,
        $localize`:@@ed_dev_pdf_pdf_annotations_to_json_out2:Des informations exploitables pour filtrer, comparer deux versions d’un PDF et automatiser un rapport d’audit.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_lim1:Certaines annotations peuvent avoir un rendu (appearance) complexe : le JSON décrit la structure, pas toujours l’apparence exacte.` },
        { text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_lim2:Sur des PDF chiffrés ou très endommagés, l’extraction peut être partielle ou impossible.` },
        { text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_lim3:Les données d’annotation peuvent contenir des informations personnelles (auteur, contenu) : pensez à anonymiser avant partage.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_q1:Est-ce que l’outil modifie mon PDF ?`, a: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_a1:Non. Il lit le fichier et génère un JSON ; votre PDF d’origine reste inchangé.` },
        { q: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_q2:Les liens cliquables sont-ils inclus ?`, a: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_a2:Oui, la plupart des liens sont des annotations (URI / GoTo) et apparaissent dans l’export.` },
        { q: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_q3:Pourquoi je ne vois pas certains surlignages ?`, a: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_a3:Selon le PDF, certains éléments peuvent être “aplatis” (flatten) ou dessinés dans le contenu de page plutôt qu’en annotation.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_annotations_to_json_tip:Pour un audit complet, combinez cet export avec “Liens PDF → JSON” et “Métadonnées PDF → JSON” afin de repérer à la fois les annotations, les URL et les infos de document.`,
    },
  ],
};
