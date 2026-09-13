import { PDFArray, PDFDict, PDFDocument, PDFName } from 'pdf-lib';

import type {
  SanitizePdfCommand,
  SanitizePdfResult,
} from '../application/sanitize-pdf.use-case';
import type { PdfSanitizeCounts } from '../domain/pdf-sanitize.models';

export async function sanitizePdfBuffer(
  command: SanitizePdfCommand,
): Promise<SanitizePdfResult> {
  const sourceDocument = await PDFDocument.load(command.pdfBytes, { ignoreEncryption: false });
  const annotationsBefore = countAnnotations(sourceDocument);
  const outputDocument = command.options.rebuildPdf
    ? await rebuildDocumentByCopyingPages(sourceDocument)
    : sourceDocument;

  const counts: PdfSanitizeCounts = {
    pages: outputDocument.getPageCount(),
    annotationsRemoved: command.options.removeAnnotations
      ? removeAnnotations(outputDocument)
      : 0,
    ...removeCatalogEntries(outputDocument, command),
    metadataCleared: command.options.clearMetadata
      ? clearMetadata(outputDocument)
      : false,
    rebuilt: command.options.rebuildPdf,
  };

  const output = await outputDocument.save();
  const pdfBytes = Uint8Array.from(output).buffer;

  return {
    pdfBytes,
    counts,
    annotationsMayRemain:
      command.options.removeAnnotations &&
      annotationsBefore > 0 &&
      counts.annotationsRemoved === 0,
  };
}

async function rebuildDocumentByCopyingPages(source: PDFDocument): Promise<PDFDocument> {
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, source.getPageIndices());
  for (const page of pages) {
    output.addPage(page);
  }
  return output;
}

function countAnnotations(document: PDFDocument): number {
  try {
    return document.getPages().reduce((total, page) => {
      const annotations = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      return total + (annotations?.size() ?? 0);
    }, 0);
  } catch {
    return 0;
  }
}

function removeAnnotations(document: PDFDocument): number {
  let removed = 0;

  try {
    for (const page of document.getPages()) {
      const annotations = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (annotations) {
        removed += annotations.size();
        page.node.delete(PDFName.of('Annots'));
      }
      page.node.delete(PDFName.of('AA'));
    }
  } catch {
    // Le moteur reste best-effort pour les structures PDF non standard.
  }

  return removed;
}

function removeCatalogEntries(
  document: PDFDocument,
  command: SanitizePdfCommand,
): Pick<
  PdfSanitizeCounts,
  'openActionRemoved' | 'catalogAaRemoved' | 'namesRemoved' | 'acroFormRemoved'
> {
  const catalog: PDFDict = document.catalog;

  return {
    openActionRemoved: command.options.removeActions
      ? deleteIfPresent(catalog, 'OpenAction')
      : false,
    catalogAaRemoved: command.options.removeActions
      ? deleteIfPresent(catalog, 'AA')
      : false,
    namesRemoved: command.options.removeNames
      ? deleteIfPresent(catalog, 'Names')
      : false,
    acroFormRemoved: command.options.removeAcroForm
      ? deleteIfPresent(catalog, 'AcroForm')
      : false,
  };
}

function deleteIfPresent(dictionary: PDFDict, key: string): boolean {
  const name = PDFName.of(key);
  if (!dictionary.has(name)) {
    return false;
  }
  dictionary.delete(name);
  return true;
}

function clearMetadata(document: PDFDocument): boolean {
  try {
    document.setTitle('');
    document.setAuthor('');
    document.setSubject('');
    document.setKeywords([]);
    document.setProducer('');
    document.setCreator('');
    document.catalog.delete(PDFName.of('Metadata'));
    return true;
  } catch {
    return false;
  }
}
