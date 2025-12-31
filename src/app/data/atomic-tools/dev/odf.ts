// src/app/data/atomic-tools/dev/odf.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/** ODF (OpenDocument) — ODT/ODS/ODP : ZIP + XML (content/styles/meta/manifest) */
export const DEV_ODF_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction
  // ===========================================================================

  'odf-package-explorer': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odf_package_explorer_title:Explorer un package ODF (ZIP)`,
    description: $localize`:@@tool_odf_package_explorer_desc:Lister les fichiers internes d’un ODT/ODS/ODP, prévisualiser content.xml/styles.xml/meta.xml et télécharger une sélection.`,
    icon: 'pi pi-folder-open',
    route: routes.tool('dev', 'odf', 'odf-package-explorer'),
    available: false,
  },

  'odt-text-extractor': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odt_text_extractor_title:ODT → texte`,
    description: $localize`:@@tool_odt_text_extractor_desc:Extraire le texte d’un ODT (paragraphes, listes, tableaux simples) et l’exporter (TXT/JSON).`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'odf', 'odt-text-extractor'),
    available: false,
  },

  'odt-styles-to-json': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odt_styles_to_json_title:Styles ODT → JSON`,
    description: $localize`:@@tool_odt_styles_to_json_desc:Exporter les styles ODF (styles.xml) : paragraphes, caractères, pages, et propriétés héritées.`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('dev', 'odf', 'odt-styles-to-json'),
    available: false,
  },

  'odt-images-extractor': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odt_images_extractor_title:Extraire les images d’un ODT`,
    description: $localize`:@@tool_odt_images_extractor_desc:Extraire /Pictures/*, produire un inventaire (type, taille) et associer les images à leurs ancres dans content.xml.`,
    icon: 'pi pi-images',
    route: routes.tool('dev', 'odf', 'odt-images-extractor'),
    available: false,
  },

  'ods-sheets-to-json': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_ods_sheets_to_json_title:Feuilles ODS → JSON`,
    description: $localize`:@@tool_ods_sheets_to_json_desc:Lister les tables/feuilles (content.xml) et exporter la structure (noms, répétitions de colonnes/lignes).`,
    icon: 'pi pi-table',
    route: routes.tool('dev', 'odf', 'ods-sheets-to-json'),
    available: false,
  },

  'odp-slides-to-json': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odp_slides_to_json_title:Slides ODP → JSON`,
    description: $localize`:@@tool_odp_slides_to_json_desc:Lister les pages/diapos (content.xml) et exporter une structure exploitable (slides, shapes texte).`,
    icon: 'pi pi-clone',
    route: routes.tool('dev', 'odf', 'odp-slides-to-json'),
    available: false,
  },

  'odf-metadata-to-json': {
    category: 'dev',
    group: 'odf',
    subGroup: 'inspect',
    title: $localize`:@@tool_odf_metadata_to_json_title:Métadonnées ODF → JSON`,
    description: $localize`:@@tool_odf_metadata_to_json_desc:Extraire meta.xml : titre, auteur, dates, générateur, mots-clés, et statistiques document.`,
    icon: 'pi pi-info-circle',
    route: routes.tool('dev', 'odf', 'odf-metadata-to-json'),
    available: false,
  },

  // ===========================================================================
  // ✅ VALIDATE — Validation & audit
  // ===========================================================================

  'odf-manifest-check': {
    category: 'dev',
    group: 'odf',
    subGroup: 'validate',
    title: $localize`:@@tool_odf_manifest_check_title:Vérifier le manifest ODF`,
    description: $localize`:@@tool_odf_manifest_check_desc:Contrôler META-INF/manifest.xml : fichiers référencés, media-types, et références manquantes.`,
    icon: 'pi pi-verified',
    route: routes.tool('dev', 'odf', 'odf-manifest-check'),
    available: false,
  },

  // ===========================================================================
  // ✅ TRANSFORM — Transformation
  // ===========================================================================

  'odf-sanitize-metadata': {
    category: 'dev',
    group: 'odf',
    subGroup: 'transform',
    title: $localize`:@@tool_odf_sanitize_metadata_title:Nettoyer les métadonnées (ODF)`,
    description: $localize`:@@tool_odf_sanitize_metadata_desc:Nettoyer meta.xml (auteur, générateur, historiques) et produire un ODF “privacy-first”.`,
    icon: 'pi pi-user-minus',
    route: routes.tool('dev', 'odf', 'odf-sanitize-metadata'),
    available: false,
  },

  'odt-to-markdown': {
    category: 'dev',
    group: 'odf',
    subGroup: 'transform',
    title: $localize`:@@tool_odt_to_markdown_title:ODT → Markdown (approx)`,
    description: $localize`:@@tool_odt_to_markdown_desc:Conversion “best-effort” : titres, listes, tableaux simples, liens et images référencées.`,
    icon: 'pi pi-file',
    route: routes.tool('dev', 'odf', 'odt-to-markdown'),
    available: false,
  },

  // ===========================================================================
  // ✅ DEBUG — Internals & debug
  // ===========================================================================

  'odf-xml-viewer': {
    category: 'dev',
    group: 'odf',
    subGroup: 'debug',
    title: $localize`:@@tool_odf_xml_viewer_title:Viewer XML OpenDocument`,
    description: $localize`:@@tool_odf_xml_viewer_desc:Explorer content.xml/styles.xml/meta.xml/manifest.xml, rechercher dans le XML et exporter des extraits.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'odf', 'odf-xml-viewer'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
