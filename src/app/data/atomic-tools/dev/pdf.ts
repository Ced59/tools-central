// src/app/data/atomic-tools/dev/pdf.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

export const DEV_PDF_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction technique
  // ===========================================================================

  'pdf-form-fields-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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
    subGroup: 'inspect',
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

  // --- Prévu (inspect) ---

  'pdf-object-info-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'inspect',
    title: $localize`:@@tool_pdf_object_info_to_json_title:Objets PDF → JSON`,
    description: $localize`:@@tool_pdf_object_info_to_json_desc:Lister les objets (ids/références), types (dict/stream/array) et statistiques bas niveau.`,
    icon: 'pi pi-database',
    route: routes.tool('dev', 'pdf', 'pdf-object-info-to-json'),
    available: false,
  },

  'pdf-xref-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'inspect',
    title: $localize`:@@tool_pdf_xref_to_json_title:XRef PDF → JSON`,
    description: $localize`:@@tool_pdf_xref_to_json_desc:Inspecter la table/stream XRef (objets, offsets, générations) et exporter en JSON.`,
    icon: 'pi pi-sitemap',
    route: routes.tool('dev', 'pdf', 'pdf-xref-to-json'),
    available: false,
  },

  'pdf-page-content-ops-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'inspect',
    title: $localize`:@@tool_pdf_page_content_ops_to_json_title:Opérateurs de page → JSON`,
    description: $localize`:@@tool_pdf_page_content_ops_to_json_desc:Analyser les content streams (opérateurs PDF) par page et exporter une version structurée.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'pdf', 'pdf-page-content-ops-to-json'),
    available: false,
  },

  // ===========================================================================
  // ✅ VALIDATE — Validation & diagnostic
  // ===========================================================================

  'pdf-scan-detector': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'validate',
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

  // --- Prévu (validate) ---

  'pdf-encryption-check': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'validate',
    title: $localize`:@@tool_pdf_encryption_check_title:Chiffrement & permissions PDF`,
    description: $localize`:@@tool_pdf_encryption_check_desc:Détecter si le PDF est chiffré, quelles permissions sont activées, et exporter le diagnostic.`,
    icon: 'pi pi-lock',
    route: routes.tool('dev', 'pdf', 'pdf-encryption-check'),
    available: false,
  },

  'pdf-linearized-check': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'validate',
    title: $localize`:@@tool_pdf_linearized_check_title:PDF linéarisé (Fast Web View)`,
    description: $localize`:@@tool_pdf_linearized_check_desc:Détecter si le PDF est linéarisé et exporter l’état + indices.`,
    icon: 'pi pi-bolt',
    route: routes.tool('dev', 'pdf', 'pdf-linearized-check'),
    available: false,
  },

  'pdf-font-embedding-check': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'validate',
    title: $localize`:@@tool_pdf_font_embedding_check_title:Vérifier l’intégration des polices`,
    description: $localize`:@@tool_pdf_font_embedding_check_desc:Lister les polices non intégrées (ou partiellement) et exporter le rapport.`,
    icon: 'pi pi-check-circle',
    route: routes.tool('dev', 'pdf', 'pdf-font-embedding-check'),
    available: false,
  },

  // ===========================================================================
  // ✅ TRANSFORM — Transformation (prévu)
  // ===========================================================================

  'pdf-merge': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'transform',
    title: $localize`:@@tool_pdf_merge_title:Fusionner des PDF`,
    description: $localize`:@@tool_pdf_merge_desc:Fusionner plusieurs PDF en un seul, localement dans le navigateur.`,
    icon: 'pi pi-clone',
    route: routes.tool('dev', 'pdf', 'pdf-merge'),
    available: false,
  },

  'pdf-split': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'transform',
    title: $localize`:@@tool_pdf_split_title:Découper un PDF`,
    description: $localize`:@@tool_pdf_split_desc:Extraire certaines pages ou découper un PDF en plusieurs fichiers.`,
    icon: 'pi pi-copy',
    route: routes.tool('dev', 'pdf', 'pdf-split'),
    available: false,
  },

  'pdf-flatten-forms': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'transform',
    title: $localize`:@@tool_pdf_flatten_forms_title:Aplatir un formulaire PDF`,
    description: $localize`:@@tool_pdf_flatten_forms_desc:Convertir les champs de formulaire en contenu statique (flatten), pour partage/archivage.`,
    icon: 'pi pi-file-export',
    route: routes.tool('dev', 'pdf', 'pdf-flatten-forms'),
    available: false,
  },

  'pdf-sanitize': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'transform',
    title: $localize`:@@tool_pdf_sanitize_title:Nettoyer un PDF`,
    description: $localize`:@@tool_pdf_sanitize_desc:Supprimer métadonnées sensibles, XMP, pièces jointes, et exporter un PDF “sanitisé”.`,
    icon: 'pi pi-shield',
    route: routes.tool('dev', 'pdf', 'pdf-sanitize'),
    available: false,
  },

  // ===========================================================================
  // ✅ DEBUG — Internals & debug (prévu)
  // ===========================================================================

  'pdf-stream-decoder': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'debug',
    title: $localize`:@@tool_pdf_stream_decoder_title:Décoder un stream PDF`,
    description: $localize`:@@tool_pdf_stream_decoder_desc:Décoder un stream (Flate/LZW/ASCII85…) et exporter le résultat (texte/hex).`,
    icon: 'pi pi-wrench',
    route: routes.tool('dev', 'pdf', 'pdf-stream-decoder'),
    available: false,
  },

  'pdf-to-unicode-inspector': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'debug',
    title: $localize`:@@tool_pdf_to_unicode_inspector_title:Inspecter ToUnicode`,
    description: $localize`:@@tool_pdf_to_unicode_inspector_desc:Analyser les CMaps ToUnicode et diagnostiquer les problèmes de copie/texte illisible.`,
    icon: 'pi pi-language',
    route: routes.tool('dev', 'pdf', 'pdf-to-unicode-inspector'),
    available: false,
  },

  'pdf-text-structure-to-json': {
    category: 'dev',
    group: 'pdf',
    subGroup: 'debug',
    title: $localize`:@@tool_pdf_text_structure_to_json_title:Structure texte PDF → JSON`,
    description: $localize`:@@tool_pdf_text_structure_to_json_desc:Inspecter la structure texte (fonts/runs/positions) pour debug d’extraction.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'pdf', 'pdf-text-structure-to-json'),
    available: false,
  },

} as const satisfies Record<string, AtomicToolAny>;
