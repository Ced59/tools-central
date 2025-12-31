// src/app/data/atomic-tools/dev/rtf.tools.ts
import { routes } from '../../routes';
import type { AtomicToolAny } from '../index';

/** RTF — format texte legacy (parsing best-effort côté client) */
export const DEV_RTF_TOOLS = {
  // ==========================================================================
  // ✅ EXTRACT — Extraction
  // ==========================================================================

  'rtf-to-text': {
    category: 'dev',
    group: 'rtf',
    subGroup: 'extract',
    title: $localize`:@@tool_rtf_to_text_title:RTF → texte`,
    description: $localize`:@@tool_rtf_to_text_desc:Extraire le texte d’un fichier RTF (best-effort) et exporter en TXT/JSON.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'rtf', 'rtf-to-text'),
    available: false,
  },

  'rtf-font-table-to-json': {
    category: 'dev',
    group: 'rtf',
    subGroup: 'extract',
    title: $localize`:@@tool_rtf_font_table_to_json_title:Table des polices RTF → JSON`,
    description: $localize`:@@tool_rtf_font_table_to_json_desc:Extraire la fonttbl (polices déclarées) et produire un inventaire.`,
    icon: 'pi pi-align-left',
    route: routes.tool('dev', 'rtf', 'rtf-font-table-to-json'),
    available: false,
  },

  // ==========================================================================
  // ✅ CONVERT — Conversion
  // ==========================================================================

  'rtf-to-html': {
    category: 'dev',
    group: 'rtf',
    subGroup: 'convert',
    title: $localize`:@@tool_rtf_to_html_title:RTF → HTML (approx)`,
    description: $localize`:@@tool_rtf_to_html_desc:Conversion “best-effort” vers HTML simple (paragraphes, gras/italique, listes limitées).`,
    icon: 'pi pi-file',
    route: routes.tool('dev', 'rtf', 'rtf-to-html'),
    available: false,
  },

  'rtf-to-json': {
    category: 'dev',
    group: 'rtf',
    subGroup: 'convert',
    title: $localize`:@@tool_rtf_to_json_title:RTF → JSON (structure)`,
    description: $localize`:@@tool_rtf_to_json_desc:Parser RTF et exporter une structure (groupes, contrôles, texte) pour debug/traitement.`,
    icon: 'pi pi-code',
    route: routes.tool('dev', 'rtf', 'rtf-to-json'),
    available: false,
  },

  // ==========================================================================
  // ✅ VALIDATE — Validation
  // ==========================================================================

  'rtf-syntax-check': {
    category: 'dev',
    group: 'rtf',
    subGroup: 'validate',
    title: $localize`:@@tool_rtf_syntax_check_title:Vérifier la syntaxe RTF`,
    description: $localize`:@@tool_rtf_syntax_check_desc:Détecter anomalies courantes : groupes non fermés, contrôles invalides, encodage incohérent.`,
    icon: 'pi pi-verified',
    route: routes.tool('dev', 'rtf', 'rtf-syntax-check'),
    available: false,
  },
} as const satisfies Record<string, AtomicToolAny>;
