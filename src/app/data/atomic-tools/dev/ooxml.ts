// src/app/data/atomic-tools/dev/ooxml.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/**
 * Open XML (OOXML) = package ZIP + parts XML + relationships.
 * Groupe "dev/ooxml" : outils génériques applicables à DOCX/XLSX/PPTX.
 */
export const DEV_OOXML_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction
  // ===========================================================================

  'ooxml-package-explorer': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'inspect',
    title: $localize`:@@tool_ooxml_package_explorer_title:Explorer un package OOXML (ZIP)`,
    description: $localize`:@@tool_ooxml_package_explorer_desc:Lister les fichiers internes d’un DOCX/XLSX/PPTX, prévisualiser les XML, et télécharger une sélection.`,
    icon: 'pi pi-folder-open',
    route: routes.tool('dev', 'ooxml', 'ooxml-package-explorer'),
    available: false,
  },

  'ooxml-rels-to-json': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'inspect',
    title: $localize`:@@tool_ooxml_rels_to_json_title:Relationships OOXML → JSON`,
    description: $localize`:@@tool_ooxml_rels_to_json_desc:Exporter toutes les relations (_rels/*.rels) : targets, types, ids et graphe des dépendances.`,
    icon: 'pi pi-sitemap',
    route: routes.tool('dev', 'ooxml', 'ooxml-rels-to-json'),
    available: false,
  },

  'ooxml-content-types-to-json': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'inspect',
    title: $localize`:@@tool_ooxml_content_types_to_json_title:[Content_Types].xml → JSON`,
    description: $localize`:@@tool_ooxml_content_types_to_json_desc:Inspecter les types de contenu déclarés (defaults/overrides) et détecter les incohérences.`,
    icon: 'pi pi-list',
    route: routes.tool('dev', 'ooxml', 'ooxml-content-types-to-json'),
    available: false,
  },

  'ooxml-metadata-to-json': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'inspect',
    title: $localize`:@@tool_ooxml_metadata_to_json_title:Métadonnées OOXML → JSON`,
    description: $localize`:@@tool_ooxml_metadata_to_json_desc:Extraire docProps (core/app/custom) : auteur, dates, application, titres, tags, etc.`,
    icon: 'pi pi-info-circle',
    route: routes.tool('dev', 'ooxml', 'ooxml-metadata-to-json'),
    available: false,
  },

  'ooxml-media-inventory-to-json': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'inspect',
    title: $localize`:@@tool_ooxml_media_inventory_to_json_title:Médias OOXML → JSON`,
    description: $localize`:@@tool_ooxml_media_inventory_to_json_desc:Inventorier les médias (images/audio/vidéo) et leurs références (rels).`,
    icon: 'pi pi-images',
    route: routes.tool('dev', 'ooxml', 'ooxml-media-inventory-to-json'),
    available: false,
  },

  // ===========================================================================
  // ✅ VALIDATE — Validation & diagnostic
  // ===========================================================================

  'ooxml-integrity-check': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'validate',
    title: $localize`:@@tool_ooxml_integrity_check_title:Vérifier l’intégrité OOXML`,
    description: $localize`:@@tool_ooxml_integrity_check_desc:Détecter targets manquants, rels orphelins, content types incohérents et générer un rapport.`,
    icon: 'pi pi-verified',
    route: routes.tool('dev', 'ooxml', 'ooxml-integrity-check'),
    available: false,
  },

  // ===========================================================================
  // ✅ TRANSFORM — Transformation (package-level)
  // ===========================================================================

  'ooxml-sanitize-metadata': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'transform',
    title: $localize`:@@tool_ooxml_sanitize_metadata_title:Nettoyer les métadonnées OOXML`,
    description: $localize`:@@tool_ooxml_sanitize_metadata_desc:Supprimer/normaliser docProps (auteur, société, chemins, historiques) pour partager un fichier plus “privacy-friendly”.`,
    icon: 'pi pi-shield',
    route: routes.tool('dev', 'ooxml', 'ooxml-sanitize-metadata'),
    available: false,
  },

  'ooxml-diff': {
    category: 'dev',
    group: 'ooxml',
    subGroup: 'debug',
    title: $localize`:@@tool_ooxml_diff_title:Comparer 2 packages OOXML`,
    description: $localize`:@@tool_ooxml_diff_desc:Comparer deux fichiers (DOCX/XLSX/PPTX) : diff par part (XML) + changements de médias et de relations.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'ooxml', 'ooxml-diff'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
