/**
 * Types partagés pour les outils PDF
 */

/**
 * États possibles d'un outil PDF
 */
export type PdfToolStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Carte de statistique affichée dans les résultats
 */
export interface PdfToolStatCard {
  /** Label traduit */
  label: string;
  /** Valeur à afficher */
  value: string | number;
}

/**
 * Configuration UI complète du PdfToolShellComponent
 */
export interface PdfToolShellUi {
  // Boutons
  btnPick: string;
  btnReset: string;
  btnCopy: string;
  btnDownload: string;

  // Filtre
  placeholderFilter: string;

  // Status tags
  statusLoading: string;
  statusReady: string;
  statusError: string;

  // Section import
  importTitle: string;
  importSub: string;

  // Section résultats
  resultsTitle: string;
  resultsSub: string;

  // Panel JSON
  jsonTitle: string;
  jsonSub: string;

  // Liste gauche
  leftTitle: string;
  emptyText: string;

  // Navigation
  backText: string;
}

/**
 * Configuration de base pour un outil PDF
 */
export interface PdfToolConfig {
  /** ID unique de l'outil */
  toolId: string;
  /** Slug pour l'URL */
  toolSlug: string;
  /** Version de l'outil */
  toolVersion?: string;
  /** Lien de retour */
  backLink: string;
  /** Icône PrimeNG */
  icon?: string;
  /** Types de fichiers acceptés */
  accept?: string;
  /** Autoriser plusieurs fichiers */
  multiple?: boolean;
}

/**
 * Métadonnées d'un fichier PDF chargé
 */
export interface PdfFileInfo {
  /** Nom du fichier */
  fileName: string;
  /** Taille en bytes */
  fileSize: number;
  /** Nombre de pages */
  pageCount?: number;
  /** Est chiffré */
  isEncrypted?: boolean;
  /** Version PDF */
  pdfVersion?: string;
}

/**
 * Résultat d'extraction générique
 */
export interface PdfExtractionResult<T> {
  /** Données extraites */
  data: T;
  /** Informations sur le fichier source */
  fileInfo: PdfFileInfo;
  /** Erreurs non bloquantes */
  warnings?: string[];
}

/**
 * Options d'export JSON
 */
export interface PdfJsonExportOptions {
  /** Indenter le JSON */
  pretty: boolean;
  /** Inclure les métadonnées d'export */
  includeMeta: boolean;
  /** Champs spécifiques à inclure/exclure */
  includeFields?: string[];
  excludeFields?: string[];
}
