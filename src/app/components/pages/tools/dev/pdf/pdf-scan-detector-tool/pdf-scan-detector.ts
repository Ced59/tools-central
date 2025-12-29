import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
} from 'pdf-lib';

export interface PdfScanPageInfo {
  pageNumber: number;
  hasFontResources: boolean;
  fontCount: number;

  imageCount: number;
  has1BitFaxLikeImage: boolean; // CCITT/JBIG2 or BitsPerComponent=1

  reasons: string[]; // technical signals
}

export interface PdfScanDetectResult {
  pageCount: number;

  fontsTotal: number;
  pagesWithFonts: number;

  imagesTotal: number;
  pagesWithImages: number;

  pagesFaxLike: number;

  scanScore: number; // 0..100
  isLikelyScanned: boolean;

  summaryReasons: string[];

  pages: PdfScanPageInfo[];
}

export function detectScannedPdf(doc: PDFDocument): PdfScanDetectResult {
  const pages = doc.getPages();
  const pageCount = pages.length;

  let fontsTotal = 0;
  let pagesWithFonts = 0;

  let imagesTotal = 0;
  let pagesWithImages = 0;

  let pagesFaxLike = 0;

  const pageInfos: PdfScanPageInfo[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const page: any = pages[i];
    const pageDict = page.node as PDFDict;

    const resources = resolveDict(doc, pageDict.get(PDFName.of('Resources')));

    // Fonts
    const fontDict = resolveDict(doc, resources?.get(PDFName.of('Font')));
    const fontCount = fontDict ? countDictEntries(fontDict) : 0;
    const hasFonts = fontCount > 0;

    fontsTotal += fontCount;
    if (hasFonts) pagesWithFonts++;

    // Images via XObject scan
    const { imageCount, faxLike } = countImagesInResources(doc, resources);

    imagesTotal += imageCount;
    if (imageCount > 0) pagesWithImages++;
    if (faxLike) pagesFaxLike++;

    const reasons: string[] = [];
    if (!hasFonts) reasons.push('no-font-resources');
    if (imageCount > 0) reasons.push('has-images');
    if (faxLike) reasons.push('fax-like-image');

    pageInfos.push({
      pageNumber,
      hasFontResources: hasFonts,
      fontCount,
      imageCount,
      has1BitFaxLikeImage: faxLike,
      reasons,
    });
  }

  // --- scoring heuristic (simple, SEO-friendly, stable)
  // Strong scan signals:
  // - 0 fonts & images present => very likely scanned
  // - fax-like images (CCITT/JBIG2 or BitsPerComponent=1) => strong scan
  // Mixed: few fonts but images on most pages => possible scanned+OCR or forms.

  let score = 0;
  const summaryReasons: string[] = [];

  if (pagesWithImages > 0) {
    score += 20;
    summaryReasons.push('pages-have-images');
  }

  if (pagesWithFonts === 0 && pagesWithImages > 0) {
    score += 55;
    summaryReasons.push('no-fonts-but-images');
  } else if (pagesWithFonts <= Math.max(1, Math.floor(pageCount * 0.1)) && pagesWithImages > 0) {
    score += 25;
    summaryReasons.push('very-few-font-pages');
  }

  if (pagesFaxLike > 0) {
    score += 30;
    summaryReasons.push('fax-like-images-detected');
  }

  // If fonts are on most pages, reduce likelihood
  if (pagesWithFonts >= Math.floor(pageCount * 0.8)) {
    score -= 20;
    summaryReasons.push('fonts-on-most-pages');
  }

  // clamp
  score = Math.max(0, Math.min(100, score));

  const isLikelyScanned = score >= 60;

  return {
    pageCount,
    fontsTotal,
    pagesWithFonts,
    imagesTotal,
    pagesWithImages,
    pagesFaxLike,
    scanScore: score,
    isLikelyScanned,
    summaryReasons,
    pages: pageInfos,
  };
}

/* ---------------- helpers ---------------- */

function resolveDict(doc: PDFDocument, v: unknown): PDFDict | null {
  const ctx = doc.context;
  if (v instanceof PDFDict) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFDict ? looked : null;
  }
  return null;
}

function resolveArray(doc: PDFDocument, v: unknown): PDFArray | null {
  const ctx = doc.context;
  if (v instanceof PDFArray) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFArray ? looked : null;
  }
  return null;
}

function countDictEntries(d: PDFDict): number {
  let n = 0;
  for (const _ of d.entries()) n++;
  return n;
}

function countImagesInResources(doc: PDFDocument, resources: PDFDict | null): { imageCount: number; faxLike: boolean } {
  if (!resources) return { imageCount: 0, faxLike: false };

  const xobj = resolveDict(doc, resources.get(PDFName.of('XObject')));
  if (!xobj) return { imageCount: 0, faxLike: false };

  let imageCount = 0;
  let faxLike = false;

  for (const [, v] of xobj.entries()) {
    const d = resolveDict(doc, v);
    const s = resolveStream(doc, v);

    // Some XObjects are streams; we want their dict
    const dict = (s ? s.dict : d) ?? null;
    if (!dict) continue;

    const subtype = dict.get(PDFName.of('Subtype'));
    if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;

    imageCount++;

    // fax-like signals:
    const bpc = dict.get(PDFName.of('BitsPerComponent'));
    if (bpc instanceof PDFNumber && bpc.asNumber() === 1) faxLike = true;

    const filter = dict.get(PDFName.of('Filter'));
    const filters = normalizeFilters(doc, filter);
    if (filters.some(f => f === '/CCITTFaxDecode' || f === '/JBIG2Decode')) faxLike = true;
  }

  return { imageCount, faxLike };
}

function resolveStream(doc: PDFDocument, v: unknown): PDFRawStream | null {
  const ctx = doc.context;
  if (v instanceof PDFRawStream) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFRawStream ? looked : null;
  }
  return null;
}

function normalizeFilters(doc: PDFDocument, v: unknown): string[] {
  if (!v) return [];
  if (v instanceof PDFName) return [v.asString()];

  const arr = resolveArray(doc, v);
  if (!arr) return [];

  const out: string[] = [];
  for (let i = 0; i < arr.size(); i++) {
    const it = arr.get(i);
    if (it instanceof PDFName) out.push(it.asString());
  }
  return out;
}
