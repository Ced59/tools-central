import { Injectable, WritableSignal } from '@angular/core';

export interface PdfExportMeta {
  toolId?: string;
  toolSlug?: string;
  toolVersion?: string;
  siteBaseUrl?: string;
  locale?: string;
}

/**
 * Service pour les actions communes des outils PDF (copie, téléchargement, export).
 * Évite la duplication des méthodes copyJson() et downloadJson() dans chaque component.
 */
@Injectable({
  providedIn: 'root',
})
export class PdfToolActionsService {
  /**
   * Copie le JSON dans le presse-papiers et affiche un message temporaire.
   * 
   * @param jsonText Le texte JSON à copier
   * @param tipMessage Signal pour afficher le message de feedback
   * @param successMessage Message en cas de succès
   * @param failMessage Message en cas d'échec
   */
  async copyJson(
    jsonText: string,
    tipMessage: WritableSignal<string>,
    successMessage: string = 'JSON copié dans le presse-papiers.',
    failMessage: string = 'Impossible de copier automatiquement.'
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(jsonText);
      tipMessage.set(successMessage);
      window.setTimeout(() => tipMessage.set(''), 2500);
    } catch {
      tipMessage.set(failMessage);
    }
  }

  /**
   * Télécharge le JSON en tant que fichier.
   * 
   * @param jsonText Le texte JSON à télécharger
   * @param baseName Nom de base du fichier (sans extension)
   */
  downloadJson(jsonText: string, baseName: string): void {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Télécharge un fichier binaire (ex: PDF modifié, ZIP).
   * 
   * @param data Les données binaires
   * @param fileName Nom du fichier avec extension
   * @param mimeType Type MIME du fichier
   */
  downloadBinary(data: Uint8Array | ArrayBuffer, fileName: string, mimeType: string): void {
    let blobData: ArrayBuffer;
    if (data instanceof Uint8Array) {
      blobData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    } else {
      blobData = data;
    }
    const blob = new Blob([blobData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Génère le nom de fichier de téléchargement basé sur le nom du PDF original.
   * 
   * @param originalFileName Nom du fichier PDF original
   * @param suffix Suffixe à ajouter (ex: 'fonts', 'metadata')
   * @param extension Extension du fichier de sortie (défaut: 'json')
   */
  getDownloadFileName(originalFileName: string, suffix: string, extension: string = 'json'): string {
    const baseName = originalFileName
      ? originalFileName.replace(/\.pdf$/i, '')
      : 'pdf';
    return `${baseName}-${suffix}.${extension}`;
  }

  /**
   * Construit un objet JSON avec les métadonnées d'export.
   * 
   * @param data Les données à exporter
   * @param meta Métadonnées optionnelles
   * @param includeMeta Si true, ajoute les métadonnées _meta à l'objet
   */
  buildExportObject<T extends Record<string, unknown>>(
    data: T,
    meta?: PdfExportMeta,
    includeMeta: boolean = true
  ): T & { _meta?: Record<string, unknown> } {
    if (!includeMeta || !meta) {
      return data as T & { _meta?: Record<string, unknown> };
    }

    return {
      ...data,
      _meta: {
        exportedAt: new Date().toISOString(),
        toolId: meta.toolId,
        toolSlug: meta.toolSlug,
        toolVersion: meta.toolVersion,
        siteBaseUrl: meta.siteBaseUrl,
        locale: meta.locale,
      },
    };
  }

  /**
   * Réinitialise les états communs d'un outil PDF.
   * 
   * @param signals Les signals à réinitialiser
   */
  resetToolState(signals: {
    status: WritableSignal<string>;
    errorMessage: WritableSignal<string>;
    tipMessage: WritableSignal<string>;
    fileName: WritableSignal<string>;
    fileSize: WritableSignal<number>;
  }): void {
    signals.status.set('idle');
    signals.errorMessage.set('');
    signals.tipMessage.set('');
    signals.fileName.set('');
    signals.fileSize.set(0);
  }
}
