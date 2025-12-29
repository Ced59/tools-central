import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
} from 'pdf-lib';

export type PdfAnnotSubtype =
  | 'Text'
  | 'Highlight'
  | 'Underline'
  | 'Squiggly'
  | 'StrikeOut'
  | 'FreeText'
  | 'Ink'
  | 'Stamp'
  | 'Square'
  | 'Circle'
  | 'Line'
  | 'Polygon'
  | 'PolyLine'
  | 'Caret'
  | 'FileAttachment'
  | 'Sound'
  | 'Movie'
  | 'Widget'
  | 'Link'
  | 'Popup'
  | 'Unknown';

export interface PdfAnnotationItem {
  id: string;                 // stable-ish key
  objectId?: string | null;   // "123 0 R" when available
  pageNumber: number;

  subtype: PdfAnnotSubtype;
  contents?: string | null;
  author?: string | null;     // /T
  modified?: string | null;   // /M
  name?: string | null;       // /NM

  rect?: { x: number; y: number; w: number; h: number } | null;
  quadPoints?: number[] | null; // flat array, 8 per quad

  color?: { r: number; g: number; b: number } | null; // /C array 0..1
  flags?: number | null;       // /F

  // optional raw dict dump
  raw?: Record<string, unknown> | null;
}

export interface PdfAnnotationsExtractOptions {
  includeRect: boolean;
  includeQuadPoints: boolean;
  includeRaw: boolean;
}

export interface PdfAnnotationsExtractResult {
  pageCount: number;
  annotations: PdfAnnotationItem[];
}

export async function extractPdfAnnotations(
  doc: PDFDocument,
  opts: PdfAnnotationsExtractOptions
): Promise<PdfAnnotationsExtractResult> {
  const pages = doc.getPages();
  const out: PdfAnnotationItem[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const page: any = pages[i];
    const pageDict = page.node as PDFDict;

    const annotsVal = pageDict.get(PDFName.of('Annots'));
    const annotsArr = resolveArray(doc, annotsVal);
    if (!annotsArr) continue;

    for (let j = 0; j < annotsArr.size(); j++) {
      const annotVal = annotsArr.get(j);
      const annotDict = resolveDict(doc, annotVal);
      if (!annotDict) continue;

      const objectId =
        annotVal instanceof PDFRef ? annotVal.toString() : null;

      const subtypeName = annotDict.get(PDFName.of('Subtype'));
      const subtype = normalizeSubtype(subtypeName);

      // ✅ On ignore les Widgets : ce sont des champs de formulaire (AcroForm)
      // => gérés par l’outil "Champs PDF → JSON"
      if (subtype === 'Widget') continue;

      const contents = decodePdfString(annotDict.get(PDFName.of('Contents')));
      const author = decodePdfString(annotDict.get(PDFName.of('T')));
      const modified = decodePdfString(annotDict.get(PDFName.of('M')));
      const nm = decodePdfString(annotDict.get(PDFName.of('NM')));

      const flags = readNumber(annotDict.get(PDFName.of('F')));

      const rect = opts.includeRect
        ? readRect(doc, annotDict.get(PDFName.of('Rect')))
        : null;

      const quadPoints = opts.includeQuadPoints
        ? readQuadPoints(doc, annotDict.get(PDFName.of('QuadPoints')))
        : null;

      const color = readColor(doc, annotDict.get(PDFName.of('C')));

      const raw = opts.includeRaw ? dictToPlainObject(doc, annotDict) : null;

      const id = objectId ?? `p${pageNumber}-a${j}-${subtype}`;

      out.push({
        id,
        objectId,
        pageNumber,
        subtype,
        contents: contents ?? null,
        author: author ?? null,
        modified: modified ?? null,
        name: nm ?? null,
        rect,
        quadPoints,
        color,
        flags: flags ?? null,
        raw,
      });
    }
  }

  return { pageCount: pages.length, annotations: out };
}

/* ---------------- helpers ---------------- */

function normalizeSubtype(v: unknown): PdfAnnotSubtype {
  if (v instanceof PDFName) {
    const s = v.asString().replace(/^\//, '');
    // keep common ones, otherwise Unknown
    const known: Record<string, PdfAnnotSubtype> = {
      Text: 'Text',
      Highlight: 'Highlight',
      Underline: 'Underline',
      Squiggly: 'Squiggly',
      StrikeOut: 'StrikeOut',
      FreeText: 'FreeText',
      Ink: 'Ink',
      Stamp: 'Stamp',
      Square: 'Square',
      Circle: 'Circle',
      Line: 'Line',
      Polygon: 'Polygon',
      PolyLine: 'PolyLine',
      Caret: 'Caret',
      FileAttachment: 'FileAttachment',
      Sound: 'Sound',
      Movie: 'Movie',
      Widget: 'Widget',
      Link: 'Link',
      Popup: 'Popup',
    };
    return known[s] ?? 'Unknown';
  }
  return 'Unknown';
}

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

function decodePdfString(v: unknown): string | null {
  if (v instanceof PDFString) return v.decodeText().trim() || null;
  if (v instanceof PDFHexString) return v.decodeText().trim() || null;
  return null;
}

function readNumber(v: unknown): number | null {
  if (v instanceof PDFNumber) return v.asNumber();
  return null;
}

function readRect(doc: PDFDocument, rectVal: unknown): { x: number; y: number; w: number; h: number } | null {
  const arr = resolveArray(doc, rectVal);
  if (!arr || arr.size() < 4) return null;

  const n = (idx: number): number | null => {
    const v = arr.get(idx);
    return v instanceof PDFNumber ? v.asNumber() : null;
  };

  const x1 = n(0), y1 = n(1), x2 = n(2), y2 = n(3);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function readQuadPoints(doc: PDFDocument, qpVal: unknown): number[] | null {
  const arr = resolveArray(doc, qpVal);
  if (!arr || arr.size() < 8) return null;

  const out: number[] = [];
  for (let i = 0; i < arr.size(); i++) {
    const v = arr.get(i);
    if (v instanceof PDFNumber) out.push(v.asNumber());
  }
  return out.length ? out : null;
}

function readColor(doc: PDFDocument, cVal: unknown): { r: number; g: number; b: number } | null {
  const arr = resolveArray(doc, cVal);
  if (!arr || arr.size() < 3) return null;

  const n = (idx: number): number | null => {
    const v = arr.get(idx);
    return v instanceof PDFNumber ? v.asNumber() : null;
  };

  const r = n(0), g = n(1), b = n(2);
  if (r == null || g == null || b == null) return null;

  // values are usually 0..1
  return { r, g, b };
}

function dictToPlainObject(doc: PDFDocument, d: PDFDict): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of d.entries()) {
    const key = k instanceof PDFName ? k.asString().replace(/^\//, '') : String(k);
    out[key] = toPlain(doc, v);
  }
  return out;
}

function toPlain(doc: PDFDocument, v: unknown): unknown {
  const ctx = doc.context;

  if (v instanceof PDFRef) return { ref: v.toString() };
  if (v instanceof PDFName) return v.asString();
  if (v instanceof PDFNumber) return v.asNumber();
  if (v instanceof PDFBool) return v.asBoolean();
  if (v instanceof PDFString) return v.decodeText();
  if (v instanceof PDFHexString) return v.decodeText();

  if (v instanceof PDFArray) {
    const arr: unknown[] = [];
    for (let i = 0; i < v.size(); i++) arr.push(toPlain(doc, v.get(i)));
    return arr;
  }

  if (v instanceof PDFDict) return dictToPlainObject(doc, v);

  if (v instanceof PDFRawStream) {
    const dict = (v as any).dict as PDFDict | undefined;
    return dict ? { stream: dictToPlainObject(doc, dict) } : { stream: true };
  }

  // try lookup if it's a ref-like
  try {
    const looked = (v instanceof PDFRef) ? ctx.lookup(v) : null;
    if (looked) return toPlain(doc, looked);
  } catch {}

  return null;
}
