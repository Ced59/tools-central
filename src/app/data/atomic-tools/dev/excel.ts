// src/app/data/atomic-tools/dev/excel.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/** SpreadsheetML (XLSX/XLSM/XLTM) — client-side inspection/extraction */
export const DEV_EXCEL_TOOLS = {
  // ===========================================================================
  // ✅ INSPECT — Inspection & extraction
  // ===========================================================================

  'xlsx-sheets-to-json': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_sheets_to_json_title:Feuilles XLSX → JSON`,
    description: $localize`:@@tool_xlsx_sheets_to_json_desc:Lister les feuilles (noms, états visibles/hidden, ids) et exporter la structure workbook.xml en JSON.`,
    icon: 'pi pi-table',
    route: routes.tool('dev', 'excel', 'xlsx-sheets-to-json'),
    available: false,
  },

  'xlsx-range-to-csv': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_range_to_csv_title:Plage XLSX → CSV`,
    description: $localize`:@@tool_xlsx_range_to_csv_desc:Extraire une plage (A1:D42) d’une feuille et l’exporter en CSV (en gérant sharedStrings et types de cellules).`,
    icon: 'pi pi-download',
    route: routes.tool('dev', 'excel', 'xlsx-range-to-csv'),
    available: false,
  },

  'xlsx-formulas-extractor': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_formulas_extractor_title:Formules XLSX → JSON`,
    description: $localize`:@@tool_xlsx_formulas_extractor_desc:Extraire les formules (f) et leurs adresses, détecter les formules partagées et produire un inventaire.`,
    icon: 'pi pi-percentage',
    route: routes.tool('dev', 'excel', 'xlsx-formulas-extractor'),
    available: false,
  },

  'xlsx-named-ranges-to-json': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_named_ranges_to_json_title:Noms définis → JSON`,
    description: $localize`:@@tool_xlsx_named_ranges_to_json_desc:Exporter les definedNames : plages nommées, constantes, formules et portée (workbook/sheet).`,
    icon: 'pi pi-tag',
    route: routes.tool('dev', 'excel', 'xlsx-named-ranges-to-json'),
    available: false,
  },

  'xlsx-styles-to-json': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_styles_to_json_title:Styles XLSX → JSON`,
    description: $localize`:@@tool_xlsx_styles_to_json_desc:Inspecter styles.xml (formats, fonts, fills, borders, numFmts) et produire un rapport lisible.`,
    icon: 'pi pi-sliders-h',
    route: routes.tool('dev', 'excel', 'xlsx-styles-to-json'),
    available: false,
  },

  'xlsx-shared-strings-to-json': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_shared_strings_to_json_title:SharedStrings → JSON`,
    description: $localize`:@@tool_xlsx_shared_strings_to_json_desc:Exporter sharedStrings.xml, stats (taille, doublons) et mapping vers les cellules.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'excel', 'xlsx-shared-strings-to-json'),
    available: false,
  },

  'xlsx-charts-media-extractor': {
    category: 'dev',
    group: 'excel',
    subGroup: 'inspect',
    title: $localize`:@@tool_xlsx_charts_media_extractor_title:Charts & médias (XLSX)`,
    description: $localize`:@@tool_xlsx_charts_media_extractor_desc:Inventorier charts, drawings et médias, et exporter les relations vers /xl/media/* et /xl/charts/* .`,
    icon: 'pi pi-chart-bar',
    route: routes.tool('dev', 'excel', 'xlsx-charts-media-extractor'),
    available: false,
  },

  // ===========================================================================
  // ✅ VALIDATE — Validation & audit
  // ===========================================================================

  'xlsx-hidden-sheets-detector': {
    category: 'dev',
    group: 'excel',
    subGroup: 'validate',
    title: $localize`:@@tool_xlsx_hidden_sheets_detector_title:Détecter les feuilles cachées`,
    description: $localize`:@@tool_xlsx_hidden_sheets_detector_desc:Détecter sheets hidden/veryHidden, états de workbook et exporter un rapport de visibilité.`,
    icon: 'pi pi-eye-slash',
    route: routes.tool('dev', 'excel', 'xlsx-hidden-sheets-detector'),
    available: false,
  },

  'xlsx-protection-check': {
    category: 'dev',
    group: 'excel',
    subGroup: 'validate',
    title: $localize`:@@tool_xlsx_protection_check_title:Protection XLSX (audit)`,
    description: $localize`:@@tool_xlsx_protection_check_desc:Détecter workbookProtection/sheetProtection (présence, options) et exporter un diagnostic (sans contournement).`,
    icon: 'pi pi-lock',
    route: routes.tool('dev', 'excel', 'xlsx-protection-check'),
    available: false,
  },

  'xlsm-macro-check': {
    category: 'dev',
    group: 'excel',
    subGroup: 'validate',
    title: $localize`:@@tool_xlsm_macro_check_title:XLSM : détecter les macros`,
    description: $localize`:@@tool_xlsm_macro_check_desc:Détecter vbaProject.bin (XLSM/XLTM) et exporter un diagnostic (sans exécution).`,
    icon: 'pi pi-shield',
    route: routes.tool('dev', 'excel', 'xlsm-macro-check'),
    available: false,
  },

  // ===========================================================================
  // ✅ TRANSFORM — Transformation
  // ===========================================================================

  'xlsx-remove-hidden-sheets': {
    category: 'dev',
    group: 'excel',
    subGroup: 'transform',
    title: $localize`:@@tool_xlsx_remove_hidden_sheets_title:Supprimer les feuilles cachées (XLSX)`,
    description: $localize`:@@tool_xlsx_remove_hidden_sheets_desc:Créer une copie en supprimant les feuilles hidden/veryHidden (best-effort, package-level).`,
    icon: 'pi pi-trash',
    route: routes.tool('dev', 'excel', 'xlsx-remove-hidden-sheets'),
    available: false,
  },

  'xlsx-sanitize-metadata': {
    category: 'dev',
    group: 'excel',
    subGroup: 'transform',
    title: $localize`:@@tool_xlsx_sanitize_metadata_title:Nettoyer les métadonnées (XLSX)`,
    description: $localize`:@@tool_xlsx_sanitize_metadata_desc:Nettoyer docProps et traces applicatives avant partage (privacy-first).`,
    icon: 'pi pi-user-minus',
    route: routes.tool('dev', 'excel', 'xlsx-sanitize-metadata'),
    available: false,
  },

  // ===========================================================================
  // ✅ DEBUG — Internals & debug
  // ===========================================================================

  'xlsx-xml-viewer': {
    category: 'dev',
    group: 'excel',
    subGroup: 'debug',
    title: $localize`:@@tool_xlsx_xml_viewer_title:Viewer XML SpreadsheetML`,
    description: $localize`:@@tool_xlsx_xml_viewer_desc:Explorer workbook.xml, worksheets, styles.xml et relationships, avec recherche et export d’extraits.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'excel', 'xlsx-xml-viewer'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
