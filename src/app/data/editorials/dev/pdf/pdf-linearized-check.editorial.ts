import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_linearized_check_title:À propos : PDF Linearized Check`,
  lead: $localize`:@@ed_dev_pdf_pdf_linearized_check_lead:Détecter si un PDF est linéarisé (Fast Web View) et exporter un diagnostic JSON pour améliorer le chargement progressif sur le web et déboguer les problèmes de streaming.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_linearized_check_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc1_title:Optimiser l’affichage web`, text: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc1_text:Savoir si la première page peut s’afficher avant le téléchargement complet (progressive rendering).` },
        { title: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc2_title:Diagnostiquer un PDF lent`, text: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc2_text:Comprendre pourquoi un PDF met longtemps à s’ouvrir dans un navigateur ou un viewer en ligne.` },
        { title: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc3_title:Contrôle de livraison`, text: $localize`:@@ed_dev_pdf_pdf_linearized_check_uc3_text:Valider qu’un export serveur/CI produit bien des PDF linéarisés quand c’est une exigence.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_linearized_check_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_linearized_check_out1:Un indicateur clair : PDF linéarisé ou non, avec les principaux marqueurs (Linearization dictionary / hint tables).`,
        $localize`:@@ed_dev_pdf_pdf_linearized_check_out2:Des détails techniques (si disponibles) pour aider au debug : offsets, structure xref, présence des streams de hints.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_linearized_check_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_linearized_check_lim1:La linéarisation n’améliore le chargement que si le serveur supporte les requêtes HTTP Range (partial content).` },
        { text: $localize`:@@ed_dev_pdf_pdf_linearized_check_lim2:Certains PDF “quasi linéarisés” ou mal formés peuvent tromper des lecteurs : le diagnostic reste indicatif.` },
        { text: $localize`:@@ed_dev_pdf_pdf_linearized_check_lim3:Un PDF chiffré ou endommagé peut empêcher une analyse fiable de la structure.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_linearized_check_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_linearized_check_q1:Fast Web View, c’est la même chose que “compressé” ?`, a: $localize`:@@ed_dev_pdf_pdf_linearized_check_a1:Non. La linéarisation concerne l’ordre et l’indexation des données pour permettre un chargement progressif.` },
        { q: $localize`:@@ed_dev_pdf_pdf_linearized_check_q2:Comment linéariser un PDF ?`, a: $localize`:@@ed_dev_pdf_pdf_linearized_check_a2:En général via un outil comme qpdf (--linearize) ou via l’option de votre générateur PDF.` },
        { q: $localize`:@@ed_dev_pdf_pdf_linearized_check_q3:Pourquoi ça ne change rien sur mon site ?`, a: $localize`:@@ed_dev_pdf_pdf_linearized_check_a3:Si votre serveur/CDN ne gère pas Range, le navigateur doit télécharger plus de données avant d’afficher.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_linearized_check_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_linearized_check_tip:Si votre objectif est la performance web, testez aussi la présence d’images très lourdes (outil “Images PDF → JSON”) : la linéarisation ne compense pas un contenu surdimensionné.`,
    },
  ],
};
