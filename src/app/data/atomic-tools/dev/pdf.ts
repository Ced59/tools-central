import {routes} from "../../routes";
import type {AtomicToolAny} from "../index";

export const DEV_PDF_TOOLS = {
  // ✅ Extraction (subGroup: 'extract')
  'pdf-form-fields-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_form_fields_to_json_title:Champs PDF → JSON`,
    description: $localize`:@@tool_pdf_form_fields_to_json_desc:Exporter la liste des champs d’un formulaire PDF (AcroForm) au format JSON.`,
    icon: 'pi pi-file-pdf',
    route: routes.tool('dev', 'pdf', 'pdf-form-fields-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-form-fields-to-json-tool/pdf-form-fields-to-json-tool.component'
        ).then(m => m.PdfFormFieldsToJsonToolComponent),
  },

  'pdf-metadata-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_metadata_to_json_title:Métadonnées PDF → JSON`,
    description: $localize`:@@tool_pdf_metadata_to_json_desc:Titre, auteur, dates, nombre de pages et infos document exportées en JSON.`,
    icon: 'pi pi-info-circle',
    route: routes.tool('dev', 'pdf', 'pdf-metadata-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-metadata-to-json-tool/pdf-metadata-to-json-tool.component'
        ).then(m => m.PdfMetadataToJsonToolComponent),
  },

  'pdf-outline-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_outline_to_json_title:Sommaire PDF → JSON`,
    description: $localize`:@@tool_pdf_outline_to_json_desc:Extraire le plan (bookmarks) du PDF et l’exporter au format JSON.`,
    icon: 'pi pi-list',
    route: routes.tool('dev', 'pdf', 'pdf-outline-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-outline-to-json-tool/pdf-outline-to-json-tool.component'
        ).then(m => m.PdfOutlineToJsonToolComponent),
  },

  'pdf-links-extractor': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_links_extractor_title:Extraire les liens d’un PDF`,
    description: $localize`:@@tool_pdf_links_extractor_desc:Récupérer toutes les URL cliquables d’un PDF et les exporter (JSON/texte).`,
    icon: 'pi pi-link',
    route: routes.tool('dev', 'pdf', 'pdf-links-extractor'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-links-to-json-tool/pdf-links-to-json-tool.component'
        ).then(m => m.PdfLinksToJsonToolComponent),
  },

  'pdf-fonts-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_fonts_to_json_title:Polices PDF → JSON`,
    description: $localize`:@@tool_pdf_fonts_to_json_desc:Identifier les polices utilisées dans un PDF et exporter la liste en JSON.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'pdf', 'pdf-fonts-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-fonts-to-json-tool/pdf-fonts-to-json-tool.component'
        ).then(m => m.PdfFontsToJsonToolComponent),
  },

  'pdf-pages-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_pages_to_json_title:Pages PDF → JSON`,
    description: $localize`:@@tool_pdf_pages_to_json_desc:Exporter les informations de pages (dimensions, rotation, orientation, format) d’un PDF au format JSON.`,
    icon: 'pi pi-clone',
    route: routes.tool('dev', 'pdf', 'pdf-pages-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-pages-to-json-tool/pdf-pages-to-json-tool.component'
        ).then(m => m.PdfPagesToJsonToolComponent),
  },

  'pdf-images-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_images_to_json_title:Images PDF → JSON`,
    description: $localize`:@@tool_pdf_images_to_json_desc:Extraire les images intégrées (XObjects) d’un PDF, détecter leur type et exporter la liste en JSON.`,
    icon: 'pi pi-images',
    route: routes.tool('dev', 'pdf', 'pdf-images-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-images-to-json-tool/pdf-images-to-json-tool.component'
        ).then(m => m.PdfImagesToJsonToolComponent),
  },

  'pdf-annotations-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_annotations_to_json_title:Annotations PDF → JSON`,
    description: $localize`:@@tool_pdf_annotations_to_json_desc:Exporter les annotations d’un PDF (commentaires, surlignages, notes…) au format JSON.`,
    icon: 'pi pi-comments',
    route: routes.tool('dev', 'pdf', 'pdf-annotations-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-annotations-extractor-tool/pdf-annotations-extractor-tool.component'
        ).then(m => m.PdfAnnotationsToJsonToolComponent),
  },

  'pdf-signatures-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_signatures_to_json_title:Signatures PDF → JSON`,
    description: $localize`:@@tool_pdf_signatures_to_json_desc:Détecter les signatures d’un PDF et exporter les informations techniques (ByteRange, SubFilter…) au format JSON.`,
    icon: 'pi pi-verified',
    route: routes.tool('dev', 'pdf', 'pdf-signatures-to-json'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-signatures-to-json-tool/pdf-signatures-to-json-tool.component'
        ).then(m => m.PdfSignaturesToJsonToolComponent),
  },

  'pdf-attachments-extractor': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_attachments_extractor_title:Pièces jointes PDF → JSON`,
    description: $localize`:@@tool_pdf_attachments_extractor_desc:Détecter et extraire les fichiers embarqués dans un PDF (EmbeddedFiles). Téléchargement individuel ou ZIP.`,
    icon: 'pi pi-paperclip',
    route: routes.tool('dev', 'pdf', 'pdf-attachments-extractor'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-attachments-extractor-tool/pdf-attachments-extractor-tool.component'
        ).then(m => m.PdfAttachmentsExtractorToolComponent),
  },

  'pdf-scan-detector': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'extract',
    title: $localize`:@@tool_pdf_scan_detector_title:Détecter si un PDF est scanné`,
    description: $localize`:@@tool_pdf_scan_detector_desc:Estimer si un PDF provient d’un scan (images, absence de polices, indices CCITT/JBIG2) et exporter le diagnostic en JSON.`,
    icon: 'pi pi-search',
    route: routes.tool('dev', 'pdf', 'pdf-scan-detector'),
    available: true,
    loadComponent: () =>
      import(
        '../../../components/pages/tools/dev/pdf/pdf-scan-detector-tool/pdf-scan-detector-tool.component'
        ).then(m => m.PdfScanDetectorToolComponent),
  },
} as const satisfies Record<string, AtomicToolAny>;
