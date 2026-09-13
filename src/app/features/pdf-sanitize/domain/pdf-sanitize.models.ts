export type PdfSanitizeOptions = Readonly<{
  clearMetadata: boolean;
  removeAnnotations: boolean;
  removeActions: boolean;
  removeNames: boolean;
  removeAcroForm: boolean;
  rebuildPdf: boolean;
}>;

export type PdfSanitizeCounts = Readonly<{
  pages: number;
  annotationsRemoved: number;
  openActionRemoved: boolean;
  catalogAaRemoved: boolean;
  namesRemoved: boolean;
  acroFormRemoved: boolean;
  metadataCleared: boolean;
  rebuilt: boolean;
}>;
