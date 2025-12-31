// src/app/data/atomic-tools/dev/powerpoint.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/** PresentationML (PPTX/PPTM/POTX/POTM) — client-side inspection/extraction */
export const DEV_POWERPOINT_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction
  // ===========================================================================

  'pptx-slides-to-json': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_slides_to_json_title:Slides PPTX → JSON`,
    description: $localize`:@@tool_pptx_slides_to_json_desc:Lister les slides, layouts, masters et exporter la structure PresentationML en JSON.`,
    icon: 'pi pi-clone',
    route: routes.tool('dev', 'powerpoint', 'pptx-slides-to-json'),
    available: false,
  },

  'pptx-text-extractor': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_text_extractor_title:PPTX → texte`,
    description: $localize`:@@tool_pptx_text_extractor_desc:Extraire le texte des slides (shapes) et l’exporter (TXT/JSON) avec repères slide/shape.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'powerpoint', 'pptx-text-extractor'),
    available: false,
  },

  'pptx-notes-extractor': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_notes_extractor_title:Notes de présentation → JSON`,
    description: $localize`:@@tool_pptx_notes_extractor_desc:Extraire les notes (notesSlides) et les associer aux slides.`,
    icon: 'pi pi-book',
    route: routes.tool('dev', 'powerpoint', 'pptx-notes-extractor'),
    available: false,
  },

  'pptx-fonts-to-json': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_fonts_to_json_title:Polices PPTX → JSON`,
    description: $localize`:@@tool_pptx_fonts_to_json_desc:Inventorier les polices utilisées (thèmes + runs) et produire un rapport exploitable.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'powerpoint', 'pptx-fonts-to-json'),
    available: false,
  },

  'pptx-media-extractor': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_media_extractor_title:Extraire les médias (PPTX)`,
    description: $localize`:@@tool_pptx_media_extractor_desc:Extraire images/audio/vidéo de /ppt/media/* et exporter un inventaire avec références (rels).`,
    icon: 'pi pi-images',
    route: routes.tool('dev', 'powerpoint', 'pptx-media-extractor'),
    available: false,
  },

  'pptx-hyperlinks-extractor': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'inspect',
    title: $localize`:@@tool_pptx_hyperlinks_extractor_title:Extraire les liens d’un PPTX`,
    description: $localize`:@@tool_pptx_hyperlinks_extractor_desc:Extraire les hyperlinks (rels + actions) et exporter en JSON/texte.`,
    icon: 'pi pi-link',
    route: routes.tool('dev', 'powerpoint', 'pptx-hyperlinks-extractor'),
    available: false,
  },

  // ==========================================================================
  // ✅ VALIDATE — Validation & audit
  // ==========================================================================

  'pptx-animation-audit': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'validate',
    title: $localize`:@@tool_pptx_animation_audit_title:Audit animations/transitions`,
    description: $localize`:@@tool_pptx_animation_audit_desc:Détecter animations/transitions (timing) et exporter un rapport (surface) par slide.`,
    icon: 'pi pi-bolt',
    route: routes.tool('dev', 'powerpoint', 'pptx-animation-audit'),
    available: false,
  },

  'pptm-macro-check': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'validate',
    title: $localize`:@@tool_pptm_macro_check_title:PPTM : détecter les macros`,
    description: $localize`:@@tool_pptm_macro_check_desc:Détecter vbaProject.bin (PPTM/POTM) et exporter un diagnostic (sans exécution).`,
    icon: 'pi pi-shield',
    route: routes.tool('dev', 'powerpoint', 'pptm-macro-check'),
    available: false,
  },

  // ==========================================================================
  // ✅ TRANSFORM — Transformation
  // ==========================================================================

  'pptx-sanitize-metadata': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'transform',
    title: $localize`:@@tool_pptx_sanitize_metadata_title:Nettoyer les métadonnées (PPTX)`,
    description: $localize`:@@tool_pptx_sanitize_metadata_desc:Nettoyer docProps et traces applicatives avant partage (privacy-first).`,
    icon: 'pi pi-user-minus',
    route: routes.tool('dev', 'powerpoint', 'pptx-sanitize-metadata'),
    available: false,
  },

  // ==========================================================================
  // ✅ DEBUG — Internals & debug
  // ==========================================================================

  'pptx-xml-viewer': {
    category: 'dev',
    group: 'powerpoint',
    subGroup: 'debug',
    title: $localize`:@@tool_pptx_xml_viewer_title:Viewer XML PresentationML`,
    description: $localize`:@@tool_pptx_xml_viewer_desc:Explorer presentation.xml, slides, masters/layouts et relationships, avec recherche et export d’extraits.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'powerpoint', 'pptx-xml-viewer'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
