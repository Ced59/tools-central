// src/app/data/atomic-tools/dev/legacy.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/**
 * Formats Office binaires legacy (DOC/XLS/PPT) : Compound File Binary Format (CFBF/OLE).
 * ⚠️ Parsing complet côté client = très difficile ; ici on vise surtout l’identification et les infos basiques.
 */
export const DEV_LEGACY_TOOLS = {
  // ==========================================================================
  // ✅ IDENTIFY — Identification
  // ==========================================================================

  'ole-cfbf-file-info': {
    category: 'dev',
    group: 'legacy',
    subGroup: 'identify',
    title: $localize`:@@tool_ole_cfbf_file_info_title:CFBF/OLE : infos fichier`,
    description: $localize`:@@tool_ole_cfbf_file_info_desc:Détecter un conteneur OLE (DOC/XLS/PPT) et afficher header, FAT, streams et statistiques basiques.`,
    icon: 'pi pi-info-circle',
    route: routes.tool('dev', 'legacy', 'ole-cfbf-file-info'),
    available: false,
  },

  'doc-xls-ppt-signature-detector': {
    category: 'dev',
    group: 'legacy',
    subGroup: 'identify',
    title: $localize`:@@tool_doc_xls_ppt_signature_detector_title:DOC/XLS/PPT : détecter le format`,
    description: $localize`:@@tool_doc_xls_ppt_signature_detector_desc:Identifier DOC vs XLS vs PPT (best-effort) via streams/clsid et produire un rapport.`,
    icon: 'pi pi-search',
    route: routes.tool('dev', 'legacy', 'doc-xls-ppt-signature-detector'),
    available: false,
  },

  // ==========================================================================
  // ✅ CONVERT — Conversion (souvent backend)
  // ==========================================================================

  'doc-to-docx-converter': {
    category: 'dev',
    group: 'legacy',
    subGroup: 'convert',
    title: $localize`:@@tool_doc_to_docx_converter_title:DOC → DOCX (conversion)`,
    description: $localize`:@@tool_doc_to_docx_converter_desc:Convertir un DOC binaire vers DOCX (généralement via backend/outils externes).`,
    icon: 'pi pi-refresh',
    route: routes.tool('dev', 'legacy', 'doc-to-docx-converter'),
    available: false,
  },

  'xls-to-xlsx-converter': {
    category: 'dev',
    group: 'legacy',
    subGroup: 'convert',
    title: $localize`:@@tool_xls_to_xlsx_converter_title:XLS → XLSX (conversion)`,
    description: $localize`:@@tool_xls_to_xlsx_converter_desc:Convertir un XLS binaire vers XLSX (généralement via backend/outils externes).`,
    icon: 'pi pi-refresh',
    route: routes.tool('dev', 'legacy', 'xls-to-xlsx-converter'),
    available: false,
  },

  'ppt-to-pptx-converter': {
    category: 'dev',
    group: 'legacy',
    subGroup: 'convert',
    title: $localize`:@@tool_ppt_to_pptx_converter_title:PPT → PPTX (conversion)`,
    description: $localize`:@@tool_ppt_to_pptx_converter_desc:Convertir un PPT binaire vers PPTX (généralement via backend/outils externes).`,
    icon: 'pi pi-refresh',
    route: routes.tool('dev', 'legacy', 'ppt-to-pptx-converter'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
