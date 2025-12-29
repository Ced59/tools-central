import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
} from 'pdf-lib';

export type PdfSigKind = 'field' | 'dict';

export interface PdfSignatureItem {
  id: string;                 // stable-ish id
  kind: PdfSigKind;

  // from widget / field if available
  fieldName?: string | null;  // /T (field name)
  partialName?: string | null;// /TU (alternate)
  pageNumber?: number | null; // if visible widget found
  rect?: { x: number; y: number; w: number; h: number } | null;

  // signature dict
  sigObjectId?: string | null; // "123 0 R"
  filter?: string | null;      // /Filter
  subFilter?: string | null;   // /SubFilter
  name?: string | null;        // /Name
  reason?: string | null;      // /Reason
  location?: string | null;    // /Location
  contactInfo?: string | null; // /ContactInfo
  m?: string | null;           // /M date

  byteRange?: number[] | null; // /ByteRange
  contentsLength?: number | null; // length in bytes of /Contents (decoded text length not reliable)
  hasContents?: boolean;
}

export interface PdfSignaturesExtractOptions {
  includeRect: boolean;
  includeRawSigDict: boolean;
}

export interface PdfSignaturesExtractResult {
  pageCount: number;
  isEncrypted: boolean;
  hasAcroForm: boolean;
  signatures: PdfSignatureItem[];
  rawSigDicts?: Record<string, unknown>[]; // optional
}

export async function extractPdfSignatures(
  doc: PDFDocument,
  opts: PdfSignaturesExtractOptions
): Promise<PdfSignaturesExtractResult> {
  const pages = doc.getPages();
  const pageCount = pages.length;

  // encryption info (pdf-lib throws on load if encrypted w/ password; here doc loaded => not locked)
  const isEncrypted = false;

  const ctx = doc.context;
  const catalog = (doc as any).catalog as PDFDict | undefined;

  const acroFormVal = catalog?.get(PDFName.of('AcroForm'));
  const acroForm = resolveDict(doc, acroFormVal);
  const hasAcroForm = !!acroForm;

  const signatures: PdfSignatureItem[] = [];
  const rawSigDicts: Record<string, unknown>[] = [];

  // map widget annot ref -> page number (for visible signature)
  const annotRefToPage = buildAnnotRefToPageMap(doc);

  // --- 1) from AcroForm fields (preferred)
  if (acroForm) {
    const fieldsVal = acroForm.get(PDFName.of('Fields'));
    const fields = resolveArray(doc, fieldsVal);

    if (fields) {
      for (let i = 0; i < fields.size(); i++) {
        const fieldVal = fields.get(i);
        const fieldDict = resolveDict(doc, fieldVal);
        if (!fieldDict) continue;

        walkFieldTree(doc, fieldDict, (leaf) => {
          const ft = leaf.get(PDFName.of('FT'));
          if (!(ft instanceof PDFName) || ft.asString() !== '/Sig') return;

          const fieldName = decodePdfString(leaf.get(PDFName.of('T')));
          const tu = decodePdfString(leaf.get(PDFName.of('TU')));

          // widgets
          const kidsVal = leaf.get(PDFName.of('Kids'));
          const kids = resolveArray(doc, kidsVal);

          // signature value
          const vVal = leaf.get(PDFName.of('V'));
          const sigDict = resolveDict(doc, vVal);

          const base: PdfSignatureItem = {
            id: (fieldVal instanceof PDFRef ? fieldVal.toString() : `sig-field-${fieldName ?? i}`),
            kind: 'field',
            fieldName: fieldName ?? null,
            partialName: tu ?? null,
          };

          // If a widget exists, attach page/rect
          if (kids && kids.size() > 0) {
            const first = kids.get(0);
            const widgetDict = resolveDict(doc, first);
            const widgetRef = first instanceof PDFRef ? first : null;

            const pageNumber = widgetRef ? (annotRefToPage.get(widgetRef.toString()) ?? null) : null;
            base.pageNumber = pageNumber;

            if (opts.includeRect && widgetDict) {
              base.rect = readRect(doc, widgetDict.get(PDFName.of('Rect')));
            }
          }

          if (sigDict) {
            const sigObjId = vVal instanceof PDFRef ? vVal.toString() : null;

            const info = readSigDict(doc, sigDict);
            base.sigObjectId = sigObjId;
            Object.assign(base, info);

            if (opts.includeRawSigDict) rawSigDicts.push(dictToPlainObject(doc, sigDict));
          }

          signatures.push(base);
        });
      }
    }
  }

  // --- 2) fallback: scan all pages annots for /Subtype /Widget + /FT /Sig
  // (some PDFs have signature widgets but no clean AcroForm tree)
  if (signatures.length === 0) {
    for (let p = 0; p < pages.length; p++) {
      const pageNumber = p + 1;
      const page: any = pages[p];
      const pageDict = page.node as PDFDict;

      const annotsVal = pageDict.get(PDFName.of('Annots'));
      const annots = resolveArray(doc, annotsVal);
      if (!annots) continue;

      for (let i = 0; i < annots.size(); i++) {
        const aVal = annots.get(i);
        const aDict = resolveDict(doc, aVal);
        if (!aDict) continue;

        const subtype = aDict.get(PDFName.of('Subtype'));
        if (!(subtype instanceof PDFName) || subtype.asString() !== '/Widget') continue;

        const ft = aDict.get(PDFName.of('FT'));
        if (!(ft instanceof PDFName) || ft.asString() !== '/Sig') continue;

        const t = decodePdfString(aDict.get(PDFName.of('T')));
        const tu = decodePdfString(aDict.get(PDFName.of('TU')));

        const vVal = aDict.get(PDFName.of('V'));
        const sigDict = resolveDict(doc, vVal);

        const item: PdfSignatureItem = {
          id: (aVal instanceof PDFRef ? aVal.toString() : `sig-widget-${pageNumber}-${i}`),
          kind: 'dict',
          fieldName: t ?? null,
          partialName: tu ?? null,
          pageNumber,
          rect: opts.includeRect ? readRect(doc, aDict.get(PDFName.of('Rect'))) : null,
        };

        if (sigDict) {
          const sigObjId = vVal instanceof PDFRef ? vVal.toString() : null;
          item.sigObjectId = sigObjId;
          Object.assign(item, readSigDict(doc, sigDict));
          if (opts.includeRawSigDict) rawSigDicts.push(dictToPlainObject(doc, sigDict));
        }

        signatures.push(item);
      }
    }
  }

  return {
    pageCount,
    isEncrypted,
    hasAcroForm,
    signatures,
    rawSigDicts: opts.includeRawSigDict ? rawSigDicts : undefined,
  };
}

/* ---------------- helpers ---------------- */

function buildAnnotRefToPageMap(doc: PDFDocument): Map<string, number> {
  const map = new Map<string, number>();
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const page: any = pages[i];
    const pageDict = page.node as PDFDict;

    const annotsVal = pageDict.get(PDFName.of('Annots'));
    const annots = resolveArray(doc, annotsVal);
    if (!annots) continue;

    for (let j = 0; j < annots.size(); j++) {
      const aVal = annots.get(j);
      if (aVal instanceof PDFRef) map.set(aVal.toString(), pageNumber);
    }
  }
  return map;
}

function walkFieldTree(doc: PDFDocument, field: PDFDict, onLeaf: (leaf: PDFDict) => void) {
  // if has Kids => traverse
  const kidsVal = field.get(PDFName.of('Kids'));
  const kids = resolveArray(doc, kidsVal);
  if (kids && kids.size() > 0) {
    for (let i = 0; i < kids.size(); i++) {
      const kVal = kids.get(i);
      const kDict = resolveDict(doc, kVal);
      if (!kDict) continue;

      const hasFT = kDict.get(PDFName.of('FT')) instanceof PDFName;
      const hasKids = resolveArray(doc, kDict.get(PDFName.of('Kids')));

      // many PDFs put /FT only on the parent; ensure we pass leaf-like too
      if (!hasKids || hasKids.size() === 0) {
        onLeaf(mergeInherit(field, kDict));
      } else {
        // pass down inherited /FT, etc.
        walkFieldTree(doc, mergeInherit(field, kDict), onLeaf);
      }

      // if kid itself is leaf
      if (hasFT && (!hasKids || hasKids.size() === 0)) {
        // already handled
      }
    }
  } else {
    onLeaf(field);
  }
}

function mergeInherit(parent: PDFDict, child: PDFDict): PDFDict {
  // Minimal inheritance used: if child lacks /FT or /T, carry from parent.
  // pdf-lib PDFDict is immutable-ish; we won't mutate. We'll just return child and read fallback when needed.
  // For simplicity, we keep child but with fallback reads in normalize.
  return new InheritedDict(parent, child) as unknown as PDFDict;
}

// Proxy-like wrapper via class implementing get() to fallback parent.
class InheritedDict {
  constructor(private parent: PDFDict, private child: PDFDict) {}
  get(key: PDFName) {
    const v = this.child.get(key);
    if (v != null) return v;
    return this.parent.get(key);
  }
  entries() {
    return this.child.entries();
  }
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

function readSigDict(doc: PDFDocument, sig: PDFDict): Partial<PdfSignatureItem> {
  const filter = sig.get(PDFName.of('Filter'));
  const subFilter = sig.get(PDFName.of('SubFilter'));

  const br = sig.get(PDFName.of('ByteRange'));
  const byteRange = readNumberArray(doc, br);

  const contents = sig.get(PDFName.of('Contents'));
  const contentsLength = estimateContentsLength(contents);

  return {
    filter: filter instanceof PDFName ? filter.asString().replace(/^\//, '') : null,
    subFilter: subFilter instanceof PDFName ? subFilter.asString().replace(/^\//, '') : null,
    name: decodePdfString(sig.get(PDFName.of('Name'))) ?? null,
    reason: decodePdfString(sig.get(PDFName.of('Reason'))) ?? null,
    location: decodePdfString(sig.get(PDFName.of('Location'))) ?? null,
    contactInfo: decodePdfString(sig.get(PDFName.of('ContactInfo'))) ?? null,
    m: decodePdfString(sig.get(PDFName.of('M'))) ?? null,
    byteRange: byteRange?.length ? byteRange : null,
    hasContents: contents != null,
    contentsLength,
  };
}

function estimateContentsLength(v: unknown): number | null {
  // /Contents often is a hex string holding DER CMS signature.
  // We can only estimate length (hex string length / 2).
  if (v instanceof PDFHexString) {
    const s = v.asString(); // like <ABCDEF>
    const hex = s.replace(/[<>]/g, '').trim();
    return hex.length ? Math.floor(hex.length / 2) : null;
  }
  if (v instanceof PDFString) {
    // not common, but possible
    const t = v.asString();
    return t.length || null;
  }
  if (v instanceof PDFRawStream) {
    const bytes = (v as any).contents as Uint8Array | undefined;
    return bytes?.length ?? null;
  }
  return null;
}

function readNumberArray(doc: PDFDocument, v: unknown): number[] | null {
  const arr = resolveArray(doc, v);
  if (!arr || arr.size() === 0) return null;

  const out: number[] = [];
  for (let i = 0; i < arr.size(); i++) {
    const n = arr.get(i);
    if (n instanceof PDFNumber) out.push(n.asNumber());
  }
  return out.length ? out : null;
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
  if (v instanceof PDFString) return v.decodeText();
  if (v instanceof PDFHexString) return v.decodeText();

  if (v instanceof PDFArray) {
    const arr: unknown[] = [];
    for (let i = 0; i < v.size(); i++) arr.push(toPlain(doc, v.get(i)));
    return arr;
  }

  if (v instanceof PDFDict) return dictToPlainObject(doc, v);

  return null;
}
