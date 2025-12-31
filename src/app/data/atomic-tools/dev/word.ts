// src/app/data/atomic-tools/dev/word.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/** WordprocessingML (DOCX/DOTX/DOCM/DOTM) — client-side inspection/extraction */
export const DEV_WORD_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction
  // ===========================================================================

  'docx-text-extractor': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_text_extractor_title:DOCX → texte`,
    description: $localize`:@@tool_docx_text_extractor_desc:Extraire le texte d’un DOCX (paragraphes, listes, tableaux) et l’exporter (TXT/JSON).`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'word', 'docx-text-extractor'),
    available: false,
  },

  'docx-styles-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_styles_to_json_title:Styles DOCX → JSON`,
    description: $localize`:@@tool_docx_styles_to_json_desc:Exporter les styles (paragraph/character/table) et leurs propriétés (héritage, basés sur, liens).`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('dev', 'word', 'docx-styles-to-json'),
    available: false,
  },

  'docx-fonts-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_fonts_to_json_title:Polices DOCX → JSON`,
    description: $localize`:@@tool_docx_fonts_to_json_desc:Lister les polices utilisées (runs/styles) et détecter celles qui ne sont jamais appliquées.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'word', 'docx-fonts-to-json'),
    available: false,
  },

  'docx-numbering-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_numbering_to_json_title:Listes & numérotation → JSON`,
    description: $localize`:@@tool_docx_numbering_to_json_desc:Exporter numbering.xml : niveaux, formats, indentations, numId/abstractNumId, et mapping par paragraphes.`,
    icon: 'pi pi-list',
    route: routes.tool('dev', 'word', 'docx-numbering-to-json'),
    available: false,
  },

  'docx-comments-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_comments_to_json_title:Commentaires DOCX → JSON`,
    description: $localize`:@@tool_docx_comments_to_json_desc:Extraire comments.xml : auteurs, dates, ancres, contenu et statistiques.`,
    icon: 'pi pi-comments',
    route: routes.tool('dev', 'word', 'docx-comments-to-json'),
    available: false,
  },

  'docx-track-changes-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_track_changes_to_json_title:Révisions (track changes) → JSON`,
    description: $localize`:@@tool_docx_track_changes_to_json_desc:Détecter insertions/suppressions, auteurs, dates et exporter un rapport de révisions.`,
    icon: 'pi pi-history',
    route: routes.tool('dev', 'word', 'docx-track-changes-to-json'),
    available: false,
  },

  'docx-hyperlinks-extractor': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_hyperlinks_extractor_title:Extraire les liens d’un DOCX`,
    description: $localize`:@@tool_docx_hyperlinks_extractor_desc:Extraire les hyperlinks (rels + champs) et exporter en JSON/texte.`,
    icon: 'pi pi-link',
    route: routes.tool('dev', 'word', 'docx-hyperlinks-extractor'),
    available: false,
  },

  'docx-images-extractor': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_images_extractor_title:Extraire les images d’un DOCX`,
    description: $localize`:@@tool_docx_images_extractor_desc:Extraire /word/media/* et produire un inventaire (dimensions, type, références).`,
    icon: 'pi pi-images',
    route: routes.tool('dev', 'word', 'docx-images-extractor'),
    available: false,
  },

  'docx-headers-footers-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_headers_footers_to_json_title:En-têtes & pieds de page → JSON`,
    description: $localize`:@@tool_docx_headers_footers_to_json_desc:Exporter header*.xml/footer*.xml, avec leurs rels, et distinguer first/even/default.`,
    icon: 'pi pi-clone',
    route: routes.tool('dev', 'word', 'docx-headers-footers-to-json'),
    available: false,
  },

  'docx-footnotes-endnotes-to-json': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_footnotes_endnotes_to_json_title:Notes de bas de page → JSON`,
    description: $localize`:@@tool_docx_footnotes_endnotes_to_json_desc:Extraire footnotes.xml et endnotes.xml : contenu, ancres et statistiques.`,
    icon: 'pi pi-book',
    route: routes.tool('dev', 'word', 'docx-footnotes-endnotes-to-json'),
    available: false,
  },

  'docx-fields-extractor': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_fields_extractor_title:Champs Word → JSON`,
    description: $localize`:@@tool_docx_fields_extractor_desc:Détecter les champs (TOC, PAGE, REF, DATE, IF, etc.) et exporter leurs codes/instructions.`,
    icon: 'pi pi-tag',
    route: routes.tool('dev', 'word', 'docx-fields-extractor'),
    available: false,
  },

  'docx-mergefields-extractor': {
    category: 'dev',
    group: 'word',
    subGroup: 'inspect',
    title: $localize`:@@tool_docx_mergefields_extractor_title:MERGEFIELD (mail merge) → JSON`,
    description: $localize`:@@tool_docx_mergefields_extractor_desc:Extraire la liste des champs de fusion (MERGEFIELD) et vérifier doublons/variantes/formatage.`,
    icon: 'pi pi-envelope',
    route: routes.tool('dev', 'word', 'docx-mergefields-extractor'),
    available: false,
  },

  // ===========================================================================
  // ✅ VALIDATE — Validation & audit
  // ===========================================================================

  'docx-macro-check': {
    category: 'dev',
    group: 'word',
    subGroup: 'validate',
    title: $localize`:@@tool_docx_macro_check_title:DOCM : détecter les macros`,
    description: $localize`:@@tool_docx_macro_check_desc:Détecter la présence de vbaProject.bin (DOCM/DOTM) et exporter un diagnostic (sans exécution).`,
    icon: 'pi pi-shield',
    route: routes.tool('dev', 'word', 'docx-macro-check'),
    available: false,
  },

  'docx-style-audit': {
    category: 'dev',
    group: 'word',
    subGroup: 'validate',
    title: $localize`:@@tool_docx_style_audit_title:Audit de styles (DOCX)`,
    description: $localize`:@@tool_docx_style_audit_desc:Détecter styles dupliqués, non utilisés, overrides excessifs et incohérences typographiques.`,
    icon: 'pi pi-check',
    route: routes.tool('dev', 'word', 'docx-style-audit'),
    available: false,
  },

  // ===========================================================================
  // ✅ TRANSFORM — Transformation
  // ===========================================================================

  'docx-replace-placeholders': {
    category: 'dev',
    group: 'word',
    subGroup: 'transform',
    title: $localize`:@@tool_docx_replace_placeholders_title:Remplacer des placeholders (DOCX)`,
    description: $localize`:@@tool_docx_replace_placeholders_desc:Remplacer des balises (ex: {{name}}) en respectant les runs et produire un DOCX de sortie.`,
    icon: 'pi pi-refresh',
    route: routes.tool('dev', 'word', 'docx-replace-placeholders'),
    available: false,
  },

  'docx-sanitize-metadata': {
    category: 'dev',
    group: 'word',
    subGroup: 'transform',
    title: $localize`:@@tool_docx_sanitize_metadata_title:Nettoyer les métadonnées (DOCX)`,
    description: $localize`:@@tool_docx_sanitize_metadata_desc:Supprimer/normaliser les infos personnelles : docProps, commentaires, auteurs de révisions (optionnel).`,
    icon: 'pi pi-user-minus',
    route: routes.tool('dev', 'word', 'docx-sanitize-metadata'),
    available: false,
  },

  'docx-to-markdown': {
    category: 'dev',
    group: 'word',
    subGroup: 'transform',
    title: $localize`:@@tool_docx_to_markdown_title:DOCX → Markdown (approx)`,
    description: $localize`:@@tool_docx_to_markdown_desc:Conversion “best-effort” : titres, listes, tableaux simples, liens, images référencées.`,
    icon: 'pi pi-file',
    route: routes.tool('dev', 'word', 'docx-to-markdown'),
    available: false,
  },

  // ===========================================================================
  // ✅ DEBUG — Internals & debug
  // ===========================================================================

  'docx-xml-viewer': {
    category: 'dev',
    group: 'word',
    subGroup: 'debug',
    title: $localize`:@@tool_docx_xml_viewer_title:Viewer XML WordprocessingML`,
    description: $localize`:@@tool_docx_xml_viewer_desc:Explorer document.xml/styles.xml/numbering.xml, rechercher dans le XML et exporter des extraits.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'word', 'docx-xml-viewer'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
