import type { CatalogCategoryDefinition } from './types';

// =============================================================================
// DEV - Single Source of Truth
// =============================================================================

export const DEV_CATEGORY: CatalogCategoryDefinition = {
  title: $localize`:@@cat_dev_title:Développeur`,
  description: $localize`:@@cat_dev_desc:Outils pour développeurs : PDF, JSON, encodage, formats…`,
  icon: 'pi pi-code',
  available: true,
  groups: {
    // -------------------------------------------------------------------------
    // PDF
    // -------------------------------------------------------------------------
    pdf: {
      title: $localize`:@@group_dev_pdf_title:PDF`,
      description: $localize`:@@group_dev_pdf_desc:Extraction et inspection : champs de formulaires, métadonnées, JSON…`,
      icon: 'pi pi-file-pdf',
      available: true,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_pdf_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_pdf_sg_inspect_desc:Analyser et exporter la structure interne d'un PDF (métadonnées, pages, liens, polices, images, annotations, pièces jointes…).`,
          order: 1,
          tools: {
            'pdf-form-fields-to-json': {
              title: $localize`:@@tool_pdf_form_fields_to_json_title:Champs PDF → JSON`,
              description: $localize`:@@tool_pdf_form_fields_to_json_desc:Exporter la liste des champs d'un formulaire PDF (AcroForm) au format JSON.`,
              icon: 'pi pi-file-pdf',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-form-fields-to-json-tool/pdf-form-fields-to-json-tool.component').then(m => m.PdfFormFieldsToJsonToolComponent),
            },
            'pdf-metadata-to-json': {
              title: $localize`:@@tool_pdf_metadata_to_json_title:Métadonnées PDF → JSON`,
              description: $localize`:@@tool_pdf_metadata_to_json_desc:Titre, auteur, dates, nombre de pages et infos document exportées en JSON.`,
              icon: 'pi pi-info-circle',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-metadata-to-json-tool/pdf-metadata-to-json-tool.component').then(m => m.PdfMetadataToJsonToolComponent),
            },
            'pdf-outline-to-json': {
              title: $localize`:@@tool_pdf_outline_to_json_title:Sommaire PDF → JSON`,
              description: $localize`:@@tool_pdf_outline_to_json_desc:Extraire le plan (bookmarks) du PDF et l'exporter au format JSON.`,
              icon: 'pi pi-list',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-outline-to-json-tool/pdf-outline-to-json-tool.component').then(m => m.PdfOutlineToJsonToolComponent),
            },
            'pdf-links-extractor': {
              title: $localize`:@@tool_pdf_links_extractor_title:Extraire les liens d'un PDF`,
              description: $localize`:@@tool_pdf_links_extractor_desc:Récupérer toutes les URL cliquables d'un PDF et les exporter (JSON/texte).`,
              icon: 'pi pi-link',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-links-to-json-tool/pdf-links-to-json-tool.component').then(m => m.PdfLinksToJsonToolComponent),
            },
            'pdf-fonts-to-json': {
              title: $localize`:@@tool_pdf_fonts_to_json_title:Polices PDF → JSON`,
              description: $localize`:@@tool_pdf_fonts_to_json_desc:Identifier les polices utilisées dans un PDF et exporter la liste en JSON.`,
              icon: 'pi pi-align-left',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-fonts-to-json-tool/pdf-fonts-to-json-tool.component').then(m => m.PdfFontsToJsonToolComponent),
            },
            'pdf-pages-to-json': {
              title: $localize`:@@tool_pdf_pages_to_json_title:Pages PDF → JSON`,
              description: $localize`:@@tool_pdf_pages_to_json_desc:Exporter les informations de pages (dimensions, rotation, orientation, format) d'un PDF au format JSON.`,
              icon: 'pi pi-clone',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-pages-to-json-tool/pdf-pages-to-json-tool.component').then(m => m.PdfPagesToJsonToolComponent),
            },
            'pdf-images-to-json': {
              title: $localize`:@@tool_pdf_images_to_json_title:Images PDF → JSON`,
              description: $localize`:@@tool_pdf_images_to_json_desc:Extraire les images intégrées (XObjects) d'un PDF, détecter leur type et exporter la liste en JSON.`,
              icon: 'pi pi-images',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-images-to-json-tool/pdf-images-to-json-tool.component').then(m => m.PdfImagesToJsonToolComponent),
            },
            'pdf-annotations-to-json': {
              title: $localize`:@@tool_pdf_annotations_to_json_title:Annotations PDF → JSON`,
              description: $localize`:@@tool_pdf_annotations_to_json_desc:Exporter les annotations d'un PDF (commentaires, surlignages, notes…) au format JSON.`,
              icon: 'pi pi-comments',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-annotations-extractor-tool/pdf-annotations-extractor-tool.component').then(m => m.PdfAnnotationsToJsonToolComponent),
            },
            'pdf-signatures-to-json': {
              title: $localize`:@@tool_pdf_signatures_to_json_title:Signatures PDF → JSON`,
              description: $localize`:@@tool_pdf_signatures_to_json_desc:Détecter les signatures d'un PDF et exporter les informations techniques (ByteRange, SubFilter…) au format JSON.`,
              icon: 'pi pi-verified',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-signatures-to-json-tool/pdf-signatures-to-json-tool.component').then(m => m.PdfSignaturesToJsonToolComponent),
            },
            'pdf-attachments-extractor': {
              title: $localize`:@@tool_pdf_attachments_extractor_title:Pièces jointes PDF → JSON`,
              description: $localize`:@@tool_pdf_attachments_extractor_desc:Détecter et extraire les fichiers embarqués dans un PDF (EmbeddedFiles). Téléchargement individuel ou ZIP.`,
              icon: 'pi pi-paperclip',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-attachments-extractor-tool/pdf-attachments-extractor-tool.component').then(m => m.PdfAttachmentsExtractorToolComponent),
            },
            'pdf-object-info-to-json': {
              title: $localize`:@@tool_pdf_object_info_to_json_title:Objets PDF → JSON`,
              description: $localize`:@@tool_pdf_object_info_to_json_desc:Lister les objets (ids/références), types (dict/stream/array) et statistiques bas niveau.`,
              icon: 'pi pi-database',
              available: true,
              loadComponent: () =>
                import(
                  '../../components/pages/tools/dev/pdf/pdf-object-info-to-json/pdf-object-info-to-json.component'
                  ).then(m => m.PdfObjectInfoToJsonToolComponent),
            },
            'pdf-xref-to-json': {
              title: $localize`:@@tool_pdf_xref_to_json_title:XRef PDF → JSON`,
              description: $localize`:@@tool_pdf_xref_to_json_desc:Inspecter la table/stream XRef (objets, offsets, générations) et exporter en JSON.`,
              icon: 'pi pi-sitemap',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-xref-to-json-tool/pdf-xref-to-json-tool.component')
                  .then(m => m.PdfXrefToJsonToolComponent),
            },
            'pdf-page-content-ops-to-json': {
              title: $localize`:@@tool_pdf_page_content_ops_to_json_title:Opérateurs de page → JSON`,
              description: $localize`:@@tool_pdf_page_content_ops_to_json_desc:Analyser les content streams (opérateurs PDF) par page et exporter une version structurée.`,
              icon: 'pi pi-code',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-page-content-ops-to-json-tool/pdf-page-content-ops-to-json-tool.component')
                  .then(m => m.PdfPageContentOpsToJsonToolComponent),
            },
          },
        },
        validate: {
          title: $localize`:@@dev_pdf_sg_validate_title:Validation & diagnostic`,
          description: $localize`:@@dev_pdf_sg_validate_desc:Vérifier l'état d'un PDF (scan, chiffrement, permissions, conformité…) et exporter le diagnostic.`,
          order: 2,
          tools: {
            'pdf-scan-detector': {
              title: $localize`:@@tool_pdf_scan_detector_title:Détecter si un PDF est scanné`,
              description: $localize`:@@tool_pdf_scan_detector_desc:Estimer si un PDF provient d'un scan (images, absence de polices, indices CCITT/JBIG2) et exporter le diagnostic en JSON.`,
              icon: 'pi pi-search',
              available: true,
              loadComponent: () => import('../../components/pages/tools/dev/pdf/pdf-scan-detector-tool/pdf-scan-detector-tool.component').then(m => m.PdfScanDetectorToolComponent),
            },
            'pdf-encryption-check': {
              title: $localize`:@@tool_pdf_encryption_check_title:Chiffrement & permissions PDF`,
              description: $localize`:@@tool_pdf_encryption_check_desc:Détecter si le PDF est chiffré, quelles permissions sont activées, et exporter le diagnostic.`,
              icon: 'pi pi-lock',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-encryption-check-tool/pdf-encryption-check-tool.component')
                  .then(m => m.PdfEncryptionCheckToolComponent),
            },
            'pdf-linearized-check': {
              title: $localize`:@@tool_pdf_linearized_check_title:PDF linéarisé (Fast Web View)`,
              description: $localize`:@@tool_pdf_linearized_check_desc:Détecter si le PDF est linéarisé et exporter l'état + indices.`,
              icon: 'pi pi-bolt',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-linearized-check-tool/pdf-linearized-check-tool.component')
                  .then(m => m.PdfLinearizedCheckToolComponent),
            },
            'pdf-font-embedding-check': {
              title: $localize`:@@tool_pdf_font_embedding_check_title:Vérifier l'intégration des polices`,
              description: $localize`:@@tool_pdf_font_embedding_check_desc:Lister les polices non intégrées (ou partiellement) et exporter le rapport.`,
              icon: 'pi pi-check-circle',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-font-embedding-check-tool/pdf-font-embedding-check-tool.component')
                  .then(m => m.PdfFontEmbeddingCheckToolComponent),
            },
          },
        },
        transform: {
          title: $localize`:@@dev_pdf_sg_transform_title:Transformation`,
          description: $localize`:@@dev_pdf_sg_transform_desc:Convertir / modifier un PDF (fusion, split, flatten, nettoyage…).`,
          order: 3,
          tools: {
            'pdf-merge': {
              title: $localize`:@@tool_pdf_merge_title:Fusionner des PDF`,
              description: $localize`:@@tool_pdf_merge_desc:Fusionner plusieurs PDF en un seul, localement dans le navigateur.`,
              icon: 'pi pi-clone',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-merge-tool/pdf-merge-tool.component')
                  .then(m => m.PdfMergeToolComponent),
            },
            'pdf-split': {
              title: $localize`:@@tool_pdf_split_title:Découper un PDF`,
              description: $localize`:@@tool_pdf_split_desc:Extraire certaines pages ou découper un PDF en plusieurs fichiers.`,
              icon: 'pi pi-copy',
              available: true,
              loadComponent: () =>
                import('../../components/pages/tools/dev/pdf/pdf-split-tool/pdf-split-tool.component')
                  .then(m => m.PdfSplitToolComponent),
            },
            'pdf-flatten-forms': { title: $localize`:@@tool_pdf_flatten_forms_title:Aplatir un formulaire PDF`, description: $localize`:@@tool_pdf_flatten_forms_desc:Convertir les champs de formulaire en contenu statique (flatten), pour partage/archivage.`, icon: 'pi pi-file-export', available: false },
            'pdf-sanitize': { title: $localize`:@@tool_pdf_sanitize_title:Nettoyer un PDF`, description: $localize`:@@tool_pdf_sanitize_desc:Supprimer métadonnées sensibles, XMP, pièces jointes, et exporter un PDF "sanitisé".`, icon: 'pi pi-shield', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_pdf_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_pdf_sg_debug_desc:Explorer les objets bas niveau (xref, streams, opérateurs, ToUnicode…).`,
          order: 4,
          tools: {
            'pdf-stream-decoder': { title: $localize`:@@tool_pdf_stream_decoder_title:Décoder un stream PDF`, description: $localize`:@@tool_pdf_stream_decoder_desc:Décoder un stream (Flate/LZW/ASCII85…) et exporter le résultat (texte/hex).`, icon: 'pi pi-wrench', available: false },
            'pdf-to-unicode-inspector': { title: $localize`:@@tool_pdf_to_unicode_inspector_title:Inspecter ToUnicode`, description: $localize`:@@tool_pdf_to_unicode_inspector_desc:Analyser les CMaps ToUnicode et diagnostiquer les problèmes de copie/texte illisible.`, icon: 'pi pi-language', available: false },
            'pdf-text-structure-to-json': { title: $localize`:@@tool_pdf_text_structure_to_json_title:Structure texte PDF → JSON`, description: $localize`:@@tool_pdf_text_structure_to_json_desc:Inspecter la structure texte (fonts/runs/positions) pour debug d'extraction.`, icon: 'pi pi-align-left', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // OOXML
    // -------------------------------------------------------------------------
    ooxml: {
      title: $localize`:@@group_dev_ooxml_title:Open XML (OOXML)`,
      description: $localize`:@@group_dev_ooxml_desc:Inspecter les conteneurs OOXML (ZIP/XML) : relations, content types, métadonnées…`,
      icon: 'pi pi-box',
      available: false,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_ooxml_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_ooxml_sg_inspect_desc:Explorer le ZIP OOXML (fichiers, relations, content types, métadonnées) et exporter en JSON.`,
          order: 1,
          tools: {
            'ooxml-package-explorer': { title: $localize`:@@tool_ooxml_package_explorer_title:Explorer un package OOXML (ZIP)`, description: $localize`:@@tool_ooxml_package_explorer_desc:Lister les fichiers internes d'un DOCX/XLSX/PPTX, prévisualiser les XML, et télécharger une sélection.`, icon: 'pi pi-folder-open', available: false },
            'ooxml-rels-to-json': { title: $localize`:@@tool_ooxml_rels_to_json_title:Relationships OOXML → JSON`, description: $localize`:@@tool_ooxml_rels_to_json_desc:Exporter toutes les relations (_rels/*.rels) : targets, types, ids et graphe des dépendances.`, icon: 'pi pi-sitemap', available: false },
            'ooxml-content-types-to-json': { title: $localize`:@@tool_ooxml_content_types_to_json_title:[Content_Types].xml → JSON`, description: $localize`:@@tool_ooxml_content_types_to_json_desc:Inspecter les types de contenu déclarés (defaults/overrides) et détecter les incohérences.`, icon: 'pi pi-list', available: false },
            'ooxml-metadata-to-json': { title: $localize`:@@tool_ooxml_metadata_to_json_title:Métadonnées OOXML → JSON`, description: $localize`:@@tool_ooxml_metadata_to_json_desc:Extraire docProps (core/app/custom) : auteur, dates, application, titres, tags, etc.`, icon: 'pi pi-info-circle', available: false },
            'ooxml-media-inventory-to-json': { title: $localize`:@@tool_ooxml_media_inventory_to_json_title:Médias OOXML → JSON`, description: $localize`:@@tool_ooxml_media_inventory_to_json_desc:Inventorier les médias (images/audio/vidéo) et leurs références (rels).`, icon: 'pi pi-images', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_ooxml_sg_validate_title:Validation & cohérence`,
          description: $localize`:@@dev_ooxml_sg_validate_desc:Vérifier la cohérence des relationships, références manquantes, content types, et produire un diagnostic.`,
          order: 2,
          tools: {
            'ooxml-integrity-check': { title: $localize`:@@tool_ooxml_integrity_check_title:Vérifier l'intégrité OOXML`, description: $localize`:@@tool_ooxml_integrity_check_desc:Détecter targets manquants, rels orphelins, content types incohérents et générer un rapport.`, icon: 'pi pi-verified', available: false },
          },
        },
        transform: {
          title: $localize`:@@dev_ooxml_sg_transform_title:Transformation`,
          description: $localize`:@@dev_ooxml_sg_transform_desc:Nettoyer les métadonnées, supprimer des parties, regénérer un package OOXML minimal.`,
          order: 3,
          tools: {
            'ooxml-sanitize-metadata': { title: $localize`:@@tool_ooxml_sanitize_metadata_title:Nettoyer les métadonnées OOXML`, description: $localize`:@@tool_ooxml_sanitize_metadata_desc:Supprimer/normaliser docProps (auteur, société, chemins, historiques) pour partager un fichier plus "privacy-friendly".`, icon: 'pi pi-shield', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_ooxml_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_ooxml_sg_debug_desc:Graph des relations, arbre des parts, inspection des namespaces et fragments XML.`,
          order: 4,
          tools: {
            'ooxml-diff': { title: $localize`:@@tool_ooxml_diff_title:Comparer 2 packages OOXML`, description: $localize`:@@tool_ooxml_diff_desc:Comparer deux fichiers (DOCX/XLSX/PPTX) : diff par part (XML) + changements de médias et de relations.`, icon: 'pi pi-code', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // WORD
    // -------------------------------------------------------------------------
    word: {
      title: $localize`:@@group_dev_word_title:Word (DOCX)`,
      description: $localize`:@@group_dev_word_desc:Analyse et extraction de documents Word : texte, styles, champs, images, révisions…`,
      icon: 'pi pi-file',
      available: false,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_word_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_word_sg_inspect_desc:Texte, styles, polices, champs, images, liens, tables, en-têtes/pieds, notes et révisions.`,
          order: 1,
          tools: {
            'docx-text-extractor': { title: $localize`:@@tool_docx_text_extractor_title:DOCX → texte`, description: $localize`:@@tool_docx_text_extractor_desc:Extraire le texte d'un DOCX (paragraphes, listes, tableaux) et l'exporter (TXT/JSON).`, icon: 'pi pi-align-left', available: false },
            'docx-styles-to-json': { title: $localize`:@@tool_docx_styles_to_json_title:Styles DOCX → JSON`, description: $localize`:@@tool_docx_styles_to_json_desc:Exporter les styles (paragraph/character/table) et leurs propriétés (héritage, basés sur, liens).`, icon: 'pi pi-sliders-h', available: false },
            'docx-fonts-to-json': { title: $localize`:@@tool_docx_fonts_to_json_title:Polices DOCX → JSON`, description: $localize`:@@tool_docx_fonts_to_json_desc:Lister les polices utilisées (runs/styles) et détecter celles qui ne sont jamais appliquées.`, icon: 'pi pi-align-left', available: false },
            'docx-numbering-to-json': { title: $localize`:@@tool_docx_numbering_to_json_title:Listes & numérotation → JSON`, description: $localize`:@@tool_docx_numbering_to_json_desc:Exporter numbering.xml : niveaux, formats, indentations, numId/abstractNumId, et mapping par paragraphes.`, icon: 'pi pi-list', available: false },
            'docx-comments-to-json': { title: $localize`:@@tool_docx_comments_to_json_title:Commentaires DOCX → JSON`, description: $localize`:@@tool_docx_comments_to_json_desc:Extraire comments.xml : auteurs, dates, ancres, contenu et statistiques.`, icon: 'pi pi-comments', available: false },
            'docx-track-changes-to-json': { title: $localize`:@@tool_docx_track_changes_to_json_title:Révisions (track changes) → JSON`, description: $localize`:@@tool_docx_track_changes_to_json_desc:Détecter insertions/suppressions, auteurs, dates et exporter un rapport de révisions.`, icon: 'pi pi-history', available: false },
            'docx-hyperlinks-extractor': { title: $localize`:@@tool_docx_hyperlinks_extractor_title:Extraire les liens d'un DOCX`, description: $localize`:@@tool_docx_hyperlinks_extractor_desc:Extraire les hyperlinks (rels + champs) et exporter en JSON/texte.`, icon: 'pi pi-link', available: false },
            'docx-images-extractor': { title: $localize`:@@tool_docx_images_extractor_title:Extraire les images d'un DOCX`, description: $localize`:@@tool_docx_images_extractor_desc:Extraire /word/media/* et produire un inventaire (dimensions, type, références).`, icon: 'pi pi-images', available: false },
            'docx-headers-footers-to-json': { title: $localize`:@@tool_docx_headers_footers_to_json_title:En-têtes & pieds de page → JSON`, description: $localize`:@@tool_docx_headers_footers_to_json_desc:Exporter header*.xml/footer*.xml, avec leurs rels, et distinguer first/even/default.`, icon: 'pi pi-clone', available: false },
            'docx-footnotes-endnotes-to-json': { title: $localize`:@@tool_docx_footnotes_endnotes_to_json_title:Notes de bas de page → JSON`, description: $localize`:@@tool_docx_footnotes_endnotes_to_json_desc:Extraire footnotes.xml et endnotes.xml : contenu, ancres et statistiques.`, icon: 'pi pi-book', available: false },
            'docx-fields-extractor': { title: $localize`:@@tool_docx_fields_extractor_title:Champs Word → JSON`, description: $localize`:@@tool_docx_fields_extractor_desc:Détecter les champs (TOC, PAGE, REF, DATE, IF, etc.) et exporter leurs codes/instructions.`, icon: 'pi pi-tag', available: false },
            'docx-mergefields-extractor': { title: $localize`:@@tool_docx_mergefields_extractor_title:MERGEFIELD (mail merge) → JSON`, description: $localize`:@@tool_docx_mergefields_extractor_desc:Extraire la liste des champs de fusion (MERGEFIELD) et vérifier doublons/variantes/formatage.`, icon: 'pi pi-envelope', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_word_sg_validate_title:Validation & audit`,
          description: $localize`:@@dev_word_sg_validate_desc:Audit de compatibilité (styles, polices manquantes, liens cassés), et vérifs de conformité basiques.`,
          order: 2,
          tools: {
            'docx-macro-check': { title: $localize`:@@tool_docx_macro_check_title:DOCM : détecter les macros`, description: $localize`:@@tool_docx_macro_check_desc:Détecter la présence de vbaProject.bin (DOCM/DOTM) et exporter un diagnostic (sans exécution).`, icon: 'pi pi-shield', available: false },
            'docx-style-audit': { title: $localize`:@@tool_docx_style_audit_title:Audit de styles (DOCX)`, description: $localize`:@@tool_docx_style_audit_desc:Détecter styles dupliqués, non utilisés, overrides excessifs et incohérences typographiques.`, icon: 'pi pi-check', available: false },
          },
        },
        transform: {
          title: $localize`:@@dev_word_sg_transform_title:Transformation`,
          description: $localize`:@@dev_word_sg_transform_desc:Remplacement de placeholders, nettoyage (métadonnées), normalisation de styles, extraction en Markdown/HTML (approx).`,
          order: 3,
          tools: {
            'docx-replace-placeholders': { title: $localize`:@@tool_docx_replace_placeholders_title:Remplacer des placeholders (DOCX)`, description: $localize`:@@tool_docx_replace_placeholders_desc:Remplacer des balises (ex: {{name}}) en respectant les runs et produire un DOCX de sortie.`, icon: 'pi pi-refresh', available: false },
            'docx-sanitize-metadata': { title: $localize`:@@tool_docx_sanitize_metadata_title:Nettoyer les métadonnées (DOCX)`, description: $localize`:@@tool_docx_sanitize_metadata_desc:Supprimer/normaliser les infos personnelles : docProps, commentaires, auteurs de révisions (optionnel).`, icon: 'pi pi-user-minus', available: false },
            'docx-to-markdown': { title: $localize`:@@tool_docx_to_markdown_title:DOCX → Markdown (approx)`, description: $localize`:@@tool_docx_to_markdown_desc:Conversion "best-effort" : titres, listes, tableaux simples, liens, images référencées.`, icon: 'pi pi-file', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_word_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_word_sg_debug_desc:Inspection des parts WordprocessingML (document.xml, numbering, styles, rels) et export JSON/graph.`,
          order: 4,
          tools: {
            'docx-xml-viewer': { title: $localize`:@@tool_docx_xml_viewer_title:Viewer XML WordprocessingML`, description: $localize`:@@tool_docx_xml_viewer_desc:Explorer document.xml/styles.xml/numbering.xml, rechercher dans le XML et exporter des extraits.`, icon: 'pi pi-code', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // EXCEL
    // -------------------------------------------------------------------------
    excel: {
      title: $localize`:@@group_dev_excel_title:Excel (XLSX)`,
      description: $localize`:@@group_dev_excel_desc:Inspecter des fichiers Excel : feuilles, formules, styles, chaînes partagées, médias…`,
      icon: 'pi pi-table',
      available: false,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_excel_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_excel_sg_inspect_desc:Feuilles, cellules, styles, sharedStrings, noms définis, formules, charts et médias.`,
          order: 1,
          tools: {
            'xlsx-sheets-to-json': { title: $localize`:@@tool_xlsx_sheets_to_json_title:Feuilles XLSX → JSON`, description: $localize`:@@tool_xlsx_sheets_to_json_desc:Lister les feuilles (noms, états visibles/hidden, ids) et exporter la structure workbook.xml en JSON.`, icon: 'pi pi-table', available: false },
            'xlsx-range-to-csv': { title: $localize`:@@tool_xlsx_range_to_csv_title:Plage XLSX → CSV`, description: $localize`:@@tool_xlsx_range_to_csv_desc:Extraire une plage (A1:D42) d'une feuille et l'exporter en CSV (en gérant sharedStrings et types de cellules).`, icon: 'pi pi-download', available: false },
            'xlsx-formulas-extractor': { title: $localize`:@@tool_xlsx_formulas_extractor_title:Formules XLSX → JSON`, description: $localize`:@@tool_xlsx_formulas_extractor_desc:Extraire les formules (f) et leurs adresses, détecter les formules partagées et produire un inventaire.`, icon: 'pi pi-percentage', available: false },
            'xlsx-named-ranges-to-json': { title: $localize`:@@tool_xlsx_named_ranges_to_json_title:Noms définis → JSON`, description: $localize`:@@tool_xlsx_named_ranges_to_json_desc:Exporter les definedNames : plages nommées, constantes, formules et portée (workbook/sheet).`, icon: 'pi pi-tag', available: false },
            'xlsx-styles-to-json': { title: $localize`:@@tool_xlsx_styles_to_json_title:Styles XLSX → JSON`, description: $localize`:@@tool_xlsx_styles_to_json_desc:Inspecter styles.xml (formats, fonts, fills, borders, numFmts) et produire un rapport lisible.`, icon: 'pi pi-sliders-h', available: false },
            'xlsx-shared-strings-to-json': { title: $localize`:@@tool_xlsx_shared_strings_to_json_title:SharedStrings → JSON`, description: $localize`:@@tool_xlsx_shared_strings_to_json_desc:Exporter sharedStrings.xml, stats (taille, doublons) et mapping vers les cellules.`, icon: 'pi pi-align-left', available: false },
            'xlsx-charts-media-extractor': { title: $localize`:@@tool_xlsx_charts_media_extractor_title:Charts & médias (XLSX)`, description: $localize`:@@tool_xlsx_charts_media_extractor_desc:Inventorier charts, drawings et médias, et exporter les relations vers /xl/media/* et /xl/charts/* .`, icon: 'pi pi-chart-bar', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_excel_sg_validate_title:Validation & audit`,
          description: $localize`:@@dev_excel_sg_validate_desc:Détecter feuilles cachées, références cassées, formules invalides (surface), protections et compatibilité.`,
          order: 2,
          tools: {
            'xlsx-hidden-sheets-detector': { title: $localize`:@@tool_xlsx_hidden_sheets_detector_title:Détecter les feuilles cachées`, description: $localize`:@@tool_xlsx_hidden_sheets_detector_desc:Détecter sheets hidden/veryHidden, états de workbook et exporter un rapport de visibilité.`, icon: 'pi pi-eye-slash', available: false },
            'xlsx-protection-check': { title: $localize`:@@tool_xlsx_protection_check_title:Protection XLSX (audit)`, description: $localize`:@@tool_xlsx_protection_check_desc:Détecter workbookProtection/sheetProtection (présence, options) et exporter un diagnostic (sans contournement).`, icon: 'pi pi-lock', available: false },
            'xlsm-macro-check': { title: $localize`:@@tool_xlsm_macro_check_title:XLSM : détecter les macros`, description: $localize`:@@tool_xlsm_macro_check_desc:Détecter vbaProject.bin (XLSM/XLTM) et exporter un diagnostic (sans exécution).`, icon: 'pi pi-shield', available: false },
          },
        },
        transform: {
          title: $localize`:@@dev_excel_sg_transform_title:Transformation`,
          description: $localize`:@@dev_excel_sg_transform_desc:Exporter vers CSV/JSON, supprimer des feuilles, nettoyer des métadonnées, normaliser des styles.`,
          order: 3,
          tools: {
            'xlsx-remove-hidden-sheets': { title: $localize`:@@tool_xlsx_remove_hidden_sheets_title:Supprimer les feuilles cachées (XLSX)`, description: $localize`:@@tool_xlsx_remove_hidden_sheets_desc:Créer une copie en supprimant les feuilles hidden/veryHidden (best-effort, package-level).`, icon: 'pi pi-trash', available: false },
            'xlsx-sanitize-metadata': { title: $localize`:@@tool_xlsx_sanitize_metadata_title:Nettoyer les métadonnées (XLSX)`, description: $localize`:@@tool_xlsx_sanitize_metadata_desc:Nettoyer docProps et traces applicatives avant partage (privacy-first).`, icon: 'pi pi-user-minus', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_excel_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_excel_sg_debug_desc:Explorer SpreadsheetML (workbook, worksheets, styles) et le graphe de relations OOXML.`,
          order: 4,
          tools: {
            'xlsx-xml-viewer': { title: $localize`:@@tool_xlsx_xml_viewer_title:Viewer XML SpreadsheetML`, description: $localize`:@@tool_xlsx_xml_viewer_desc:Explorer workbook.xml, worksheets, styles.xml et relationships, avec recherche et export d'extraits.`, icon: 'pi pi-code', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // POWERPOINT
    // -------------------------------------------------------------------------
    powerpoint: {
      title: $localize`:@@group_dev_powerpoint_title:PowerPoint (PPTX)`,
      description: $localize`:@@group_dev_powerpoint_desc:Extraction et audit de slides : texte, notes, thèmes, médias, animations…`,
      icon: 'pi pi-clone',
      available: false,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_powerpoint_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_powerpoint_sg_inspect_desc:Texte des slides, notes, médias, thèmes, polices, liens et infos de deck.`,
          order: 1,
          tools: {
            'pptx-slides-to-json': { title: $localize`:@@tool_pptx_slides_to_json_title:Slides PPTX → JSON`, description: $localize`:@@tool_pptx_slides_to_json_desc:Lister les slides, layouts, masters et exporter la structure PresentationML en JSON.`, icon: 'pi pi-clone', available: false },
            'pptx-text-extractor': { title: $localize`:@@tool_pptx_text_extractor_title:PPTX → texte`, description: $localize`:@@tool_pptx_text_extractor_desc:Extraire le texte des slides (shapes) et l'exporter (TXT/JSON) avec repères slide/shape.`, icon: 'pi pi-align-left', available: false },
            'pptx-notes-extractor': { title: $localize`:@@tool_pptx_notes_extractor_title:Notes de présentation → JSON`, description: $localize`:@@tool_pptx_notes_extractor_desc:Extraire les notes (notesSlides) et les associer aux slides.`, icon: 'pi pi-book', available: false },
            'pptx-fonts-to-json': { title: $localize`:@@tool_pptx_fonts_to_json_title:Polices PPTX → JSON`, description: $localize`:@@tool_pptx_fonts_to_json_desc:Inventorier les polices utilisées (thèmes + runs) et produire un rapport exploitable.`, icon: 'pi pi-align-left', available: false },
            'pptx-media-extractor': { title: $localize`:@@tool_pptx_media_extractor_title:Extraire les médias (PPTX)`, description: $localize`:@@tool_pptx_media_extractor_desc:Extraire images/audio/vidéo de /ppt/media/* et exporter un inventaire avec références (rels).`, icon: 'pi pi-images', available: false },
            'pptx-hyperlinks-extractor': { title: $localize`:@@tool_pptx_hyperlinks_extractor_title:Extraire les liens d'un PPTX`, description: $localize`:@@tool_pptx_hyperlinks_extractor_desc:Extraire les hyperlinks (rels + actions) et exporter en JSON/texte.`, icon: 'pi pi-link', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_powerpoint_sg_validate_title:Validation & audit`,
          description: $localize`:@@dev_powerpoint_sg_validate_desc:Audit de cohérence (liens, médias manquants), compatibilité et état des animations/transitions (surface).`,
          order: 2,
          tools: {
            'pptx-animation-audit': { title: $localize`:@@tool_pptx_animation_audit_title:Audit animations/transitions`, description: $localize`:@@tool_pptx_animation_audit_desc:Détecter animations/transitions (timing) et exporter un rapport (surface) par slide.`, icon: 'pi pi-bolt', available: false },
            'pptm-macro-check': { title: $localize`:@@tool_pptm_macro_check_title:PPTM : détecter les macros`, description: $localize`:@@tool_pptm_macro_check_desc:Détecter vbaProject.bin (PPTM/POTM) et exporter un diagnostic (sans exécution).`, icon: 'pi pi-shield', available: false },
          },
        },
        transform: {
          title: $localize`:@@dev_powerpoint_sg_transform_title:Transformation`,
          description: $localize`:@@dev_powerpoint_sg_transform_desc:Exporter texte, nettoyer métadonnées, extraire médias, regrouper/filtrer slides (approche package).`,
          order: 3,
          tools: {
            'pptx-sanitize-metadata': { title: $localize`:@@tool_pptx_sanitize_metadata_title:Nettoyer les métadonnées (PPTX)`, description: $localize`:@@tool_pptx_sanitize_metadata_desc:Nettoyer docProps et traces applicatives avant partage (privacy-first).`, icon: 'pi pi-user-minus', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_powerpoint_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_powerpoint_sg_debug_desc:Explorer PresentationML (slides, layouts, masters) et relationships.`,
          order: 4,
          tools: {
            'pptx-xml-viewer': { title: $localize`:@@tool_pptx_xml_viewer_title:Viewer XML PresentationML`, description: $localize`:@@tool_pptx_xml_viewer_desc:Explorer presentation.xml, slides, masters/layouts et relationships, avec recherche et export d'extraits.`, icon: 'pi pi-code', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // ODF
    // -------------------------------------------------------------------------
    odf: {
      title: $localize`:@@group_dev_odf_title:OpenDocument (ODF)`,
      description: $localize`:@@group_dev_odf_desc:ODT/ODS/ODP : inspection ZIP/XML, texte, styles, métadonnées, médias…`,
      icon: 'pi pi-folder-open',
      available: false,
      subGroups: {
        inspect: {
          title: $localize`:@@dev_odf_sg_inspect_title:Inspection & extraction`,
          description: $localize`:@@dev_odf_sg_inspect_desc:ODT/ODS/ODP : explorer le ZIP ODF, extraire texte, styles, métadonnées et médias.`,
          order: 1,
          tools: {
            'odf-package-explorer': { title: $localize`:@@tool_odf_package_explorer_title:Explorer un package ODF (ZIP)`, description: $localize`:@@tool_odf_package_explorer_desc:Lister les fichiers internes d'un ODT/ODS/ODP, prévisualiser content.xml/styles.xml/meta.xml et télécharger une sélection.`, icon: 'pi pi-folder-open', available: false },
            'odt-text-extractor': { title: $localize`:@@tool_odt_text_extractor_title:ODT → texte`, description: $localize`:@@tool_odt_text_extractor_desc:Extraire le texte d'un ODT (paragraphes, listes, tableaux simples) et l'exporter (TXT/JSON).`, icon: 'pi pi-align-left', available: false },
            'odt-styles-to-json': { title: $localize`:@@tool_odt_styles_to_json_title:Styles ODT → JSON`, description: $localize`:@@tool_odt_styles_to_json_desc:Exporter les styles ODF (styles.xml) : paragraphes, caractères, pages, et propriétés héritées.`, icon: 'pi pi-sliders-h', available: false },
            'odt-images-extractor': { title: $localize`:@@tool_odt_images_extractor_title:Extraire les images d'un ODT`, description: $localize`:@@tool_odt_images_extractor_desc:Extraire /Pictures/*, produire un inventaire (type, taille) et associer les images à leurs ancres dans content.xml.`, icon: 'pi pi-images', available: false },
            'ods-sheets-to-json': { title: $localize`:@@tool_ods_sheets_to_json_title:Feuilles ODS → JSON`, description: $localize`:@@tool_ods_sheets_to_json_desc:Lister les tables/feuilles (content.xml) et exporter la structure (noms, répétitions de colonnes/lignes).`, icon: 'pi pi-table', available: false },
            'odp-slides-to-json': { title: $localize`:@@tool_odp_slides_to_json_title:Slides ODP → JSON`, description: $localize`:@@tool_odp_slides_to_json_desc:Lister les pages/diapos (content.xml) et exporter une structure exploitable (slides, shapes texte).`, icon: 'pi pi-clone', available: false },
            'odf-metadata-to-json': { title: $localize`:@@tool_odf_metadata_to_json_title:Métadonnées ODF → JSON`, description: $localize`:@@tool_odf_metadata_to_json_desc:Extraire meta.xml : titre, auteur, dates, générateur, mots-clés, et statistiques document.`, icon: 'pi pi-info-circle', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_odf_sg_validate_title:Validation & audit`,
          description: $localize`:@@dev_odf_sg_validate_desc:Vérifier le manifest, les références de médias, et l'intégrité des fichiers XML clés (content/styles/meta).`,
          order: 2,
          tools: {
            'odf-manifest-check': { title: $localize`:@@tool_odf_manifest_check_title:Vérifier le manifest ODF`, description: $localize`:@@tool_odf_manifest_check_desc:Contrôler META-INF/manifest.xml : fichiers référencés, media-types, et références manquantes.`, icon: 'pi pi-verified', available: false },
          },
        },
        transform: {
          title: $localize`:@@dev_odf_sg_transform_title:Transformation`,
          description: $localize`:@@dev_odf_sg_transform_desc:Exporter vers texte/JSON, nettoyer des métadonnées, extraire médias, conversion simple (approximative).`,
          order: 3,
          tools: {
            'odf-sanitize-metadata': { title: $localize`:@@tool_odf_sanitize_metadata_title:Nettoyer les métadonnées (ODF)`, description: $localize`:@@tool_odf_sanitize_metadata_desc:Nettoyer meta.xml (auteur, générateur, historiques) et produire un ODF "privacy-first".`, icon: 'pi pi-user-minus', available: false },
            'odt-to-markdown': { title: $localize`:@@tool_odt_to_markdown_title:ODT → Markdown (approx)`, description: $localize`:@@tool_odt_to_markdown_desc:Conversion "best-effort" : titres, listes, tableaux simples, liens et images référencées.`, icon: 'pi pi-file', available: false },
          },
        },
        debug: {
          title: $localize`:@@dev_odf_sg_debug_title:Internals & debug`,
          description: $localize`:@@dev_odf_sg_debug_desc:Inspecter content.xml/styles.xml et le manifest ODF, avec export JSON.`,
          order: 4,
          tools: {
            'odf-xml-viewer': { title: $localize`:@@tool_odf_xml_viewer_title:Viewer XML OpenDocument`, description: $localize`:@@tool_odf_xml_viewer_desc:Explorer content.xml/styles.xml/meta.xml/manifest.xml, rechercher dans le XML et exporter des extraits.`, icon: 'pi pi-code', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // RTF
    // -------------------------------------------------------------------------
    rtf: {
      title: $localize`:@@group_dev_rtf_title:RTF`,
      description: $localize`:@@group_dev_rtf_desc:Outils legacy sur fichiers RTF : extraction texte, audit, conversion simple.`,
      icon: 'pi pi-align-left',
      available: false,
      subGroups: {
        extract: {
          title: $localize`:@@dev_rtf_sg_extract_title:Extraction`,
          description: $localize`:@@dev_rtf_sg_extract_desc:Extraire le texte, détecter encodage, et récupérer des informations de base (polices, couleurs).`,
          order: 1,
          tools: {
            'rtf-to-text': { title: $localize`:@@tool_rtf_to_text_title:RTF → texte`, description: $localize`:@@tool_rtf_to_text_desc:Extraire le texte d'un fichier RTF (best-effort) et exporter en TXT/JSON.`, icon: 'pi pi-align-left', available: false },
            'rtf-font-table-to-json': { title: $localize`:@@tool_rtf_font_table_to_json_title:Table des polices RTF → JSON`, description: $localize`:@@tool_rtf_font_table_to_json_desc:Extraire la fonttbl (polices déclarées) et produire un inventaire.`, icon: 'pi pi-align-left', available: false },
          },
        },
        convert: {
          title: $localize`:@@dev_rtf_sg_convert_title:Conversion`,
          description: $localize`:@@dev_rtf_sg_convert_desc:Convertir RTF → texte/HTML/JSON simplifié (fidélité limitée).`,
          order: 2,
          tools: {
            'rtf-to-html': { title: $localize`:@@tool_rtf_to_html_title:RTF → HTML (approx)`, description: $localize`:@@tool_rtf_to_html_desc:Conversion "best-effort" vers HTML simple (paragraphes, gras/italique, listes limitées).`, icon: 'pi pi-file', available: false },
            'rtf-to-json': { title: $localize`:@@tool_rtf_to_json_title:RTF → JSON (structure)`, description: $localize`:@@tool_rtf_to_json_desc:Parser RTF et exporter une structure (groupes, contrôles, texte) pour debug/traitement.`, icon: 'pi pi-code', available: false },
          },
        },
        validate: {
          title: $localize`:@@dev_rtf_sg_validate_title:Validation`,
          description: $localize`:@@dev_rtf_sg_validate_desc:Détecter RTF corrompu, groupes non fermés, et anomalies de syntaxe courantes.`,
          order: 3,
          tools: {
            'rtf-syntax-check': { title: $localize`:@@tool_rtf_syntax_check_title:Vérifier la syntaxe RTF`, description: $localize`:@@tool_rtf_syntax_check_desc:Détecter anomalies courantes : groupes non fermés, contrôles invalides, encodage incohérent.`, icon: 'pi pi-verified', available: false },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // LEGACY
    // -------------------------------------------------------------------------
    legacy: {
      title: $localize`:@@group_dev_legacy_title:Formats Office legacy`,
      description: $localize`:@@group_dev_legacy_desc:DOC/XLS/PPT (binaires) : infos, détection et conversions.`,
      icon: 'pi pi-history',
      available: false,
      subGroups: {
        identify: {
          title: $localize`:@@dev_legacy_sg_identify_title:Identification`,
          description: $localize`:@@dev_legacy_sg_identify_desc:Reconnaître DOC/XLS/PPT (CFBF/OLE), afficher infos de base et signatures.`,
          order: 1,
          tools: {
            'ole-cfbf-file-info': { title: $localize`:@@tool_ole_cfbf_file_info_title:CFBF/OLE : infos fichier`, description: $localize`:@@tool_ole_cfbf_file_info_desc:Détecter un conteneur OLE (DOC/XLS/PPT) et afficher header, FAT, streams et statistiques basiques.`, icon: 'pi pi-info-circle', available: false },
            'doc-xls-ppt-signature-detector': { title: $localize`:@@tool_doc_xls_ppt_signature_detector_title:DOC/XLS/PPT : détecter le format`, description: $localize`:@@tool_doc_xls_ppt_signature_detector_desc:Identifier DOC vs XLS vs PPT (best-effort) via streams/clsid et produire un rapport.`, icon: 'pi pi-search', available: false },
          },
        },
        convert: {
          title: $localize`:@@dev_legacy_sg_convert_title:Conversion`,
          description: $localize`:@@dev_legacy_sg_convert_desc:Conversions vers formats modernes (souvent via backend) : DOC→DOCX, XLS→XLSX, PPT→PPTX.`,
          order: 2,
          tools: {
            'doc-to-docx-converter': { title: $localize`:@@tool_doc_to_docx_converter_title:DOC → DOCX (conversion)`, description: $localize`:@@tool_doc_to_docx_converter_desc:Convertir un DOC binaire vers DOCX (généralement via backend/outils externes).`, icon: 'pi pi-refresh', available: false },
            'xls-to-xlsx-converter': { title: $localize`:@@tool_xls_to_xlsx_converter_title:XLS → XLSX (conversion)`, description: $localize`:@@tool_xls_to_xlsx_converter_desc:Convertir un XLS binaire vers XLSX (généralement via backend/outils externes).`, icon: 'pi pi-refresh', available: false },
            'ppt-to-pptx-converter': { title: $localize`:@@tool_ppt_to_pptx_converter_title:PPT → PPTX (conversion)`, description: $localize`:@@tool_ppt_to_pptx_converter_desc:Convertir un PPT binaire vers PPTX (généralement via backend/outils externes).`, icon: 'pi pi-refresh', available: false },
          },
        },
      },
    },
  },
};
