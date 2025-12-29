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
  PDFStream,
  PDFString,
} from 'pdf-lib';

export interface PdfExtractedImage {
  id: string;                 // stable key (objectId if possible)
  index: number;              // 1..N
  objectId?: string | null;   // "423 0 R"
  name?: string | null;       // /Im0, etc (if known)
  width?: number | null;
  height?: number | null;

  colorSpace?: string | null;
  bitsPerComponent?: number | null;

  filters?: string[];
  extension?: string;         // jpg / jp2 / bin
  byteLength?: number;

  occurrences?: number;        // how many times referenced
  pages?: number[];            // pages where it appears

  // raw "dict PDF" (option)
  raw?: Record<string, unknown> | null;

  // bytes (option)
  bytes?: Uint8Array | null;

  // base64 (option)
  base64?: string | null;
}

export interface PdfImagesExtractOptions {
  includeBytes: boolean;
  includeRaw: boolean;
  includeBase64: boolean;
  uniqueOnly: boolean;
}

export interface PdfImagesExtractResult {
  pageCount: number;
  images: PdfExtractedImage[];
}

export async function extractPdfImages(
  doc: PDFDocument,
  opts: PdfImagesExtractOptions
): Promise<PdfImagesExtractResult> {
  const pages = doc.getPages();
  const pageCount = pages.length;

  // id -> accumulator
  const map = new Map<string, PdfExtractedImage>();

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const page: any = pages[i];

    const pageDict = page.node as PDFDict;

    // Resources
    const resourcesVal = pageDict.get(PDFName.of('Resources'));
    const resources = resolveDict(doc, resourcesVal);
    if (!resources) continue;

    // XObject
    const xobjVal = resources.get(PDFName.of('XObject'));
    const xobj = resolveDict(doc, xobjVal);
    if (!xobj) continue;

    // Iterate XObject entries
    for (const [key, value] of xobj.entries()) {
      const name = key instanceof PDFName ? key.asString().replace(/^\//, '') : null;

      const stream = resolveStream(doc, value);
      if (!stream) continue;

      const streamDict = (stream as any).dict as PDFDict | undefined;
      if (!streamDict) continue;

      const subtype = streamDict.get(PDFName.of('Subtype'));
      if (!(subtype instanceof PDFName) || subtype.asString() !== '/Image') continue;

      const objectId = value instanceof PDFRef ? value.toString() : null;
      const id = objectId ?? `page${pageNumber}:${name ?? 'image'}`;

      const existing = map.get(id);
      if (existing) {
        existing.occurrences = (existing.occurrences ?? 1) + 1;
        if (existing.pages && !existing.pages.includes(pageNumber)) existing.pages.push(pageNumber);
        continue;
      }

      const width = readNumber(streamDict.get(PDFName.of('Width')));
      const height = readNumber(streamDict.get(PDFName.of('Height')));
      const bpc = readNumber(streamDict.get(PDFName.of('BitsPerComponent')));

      const cs = readColorSpace(streamDict.get(PDFName.of('ColorSpace')));
      const filters = readFilters(doc, streamDict.get(PDFName.of('Filter')));

      const extension = guessExtension(filters);

      // bytes
      let bytes: Uint8Array | null = null;
      let base64: string | null = null;

      if (opts.includeBytes || opts.includeBase64) {
        bytes = readRawStreamBytes(stream);
        if (opts.includeBase64 && bytes) base64 = uint8ToBase64(bytes);
      }

      // raw dict
      const raw = opts.includeRaw ? dictToPlainObject(doc, streamDict) : null;

      map.set(id, {
        id,
        index: 0, // filled later
        objectId,
        name,
        width,
        height,
        bitsPerComponent: bpc,
        colorSpace: cs,
        filters,
        extension,
        byteLength: bytes?.length ?? undefined,
        occurrences: 1,
        pages: [pageNumber],
        raw,
        bytes: opts.includeBytes ? bytes : null,
        base64: opts.includeBase64 ? base64 : null,
      });
    }
  }

  // Sort by index (stable) and assign sequential index
  const images = Array.from(map.values()).sort((a, b) => {
    const ao = a.objectId ?? '';
    const bo = b.objectId ?? '';
    if (ao && bo && ao !== bo) return ao.localeCompare(bo);
    return (a.name ?? '').localeCompare(b.name ?? '');
  });

  images.forEach((img, idx) => (img.index = idx + 1));

  // uniqueOnly : on regroupe par signature (width/height/filters/byteLength) si pas d’objectId stable
  if (!opts.uniqueOnly) {
    return { pageCount, images };
  }

  const uniqMap = new Map<string, PdfExtractedImage>();

  for (const it of images) {
    const sig = [
      it.width ?? '',
      it.height ?? '',
      (it.filters ?? []).join(','),
      it.byteLength ?? '',
    ].join('|');

    const ex = uniqMap.get(sig);
    if (!ex) {
      uniqMap.set(sig, { ...it });
      continue;
    }

    ex.occurrences = (ex.occurrences ?? 1) + (it.occurrences ?? 1);

    const pages = new Set<number>([...(ex.pages ?? []), ...(it.pages ?? [])]);
    ex.pages = Array.from(pages).sort((a, b) => a - b);

    // garde le plus “riche”
    if (!ex.objectId && it.objectId) ex.objectId = it.objectId;
    if (!ex.name && it.name) ex.name = it.name;
  }

  const uniq = Array.from(uniqMap.values()).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  uniq.forEach((img, idx) => (img.index = idx + 1));

  return { pageCount, images: uniq };
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

function resolveStream(doc: PDFDocument, v: unknown): PDFStream | PDFRawStream | null {
  const ctx = doc.context;
  if (v instanceof PDFStream) return v;
  if (v instanceof PDFRawStream) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    if (looked instanceof PDFStream || looked instanceof PDFRawStream) return looked;
  }
  return null;
}

function readNumber(v: unknown): number | null {
  if (v instanceof PDFNumber) return v.asNumber();
  return null;
}

function readColorSpace(v: unknown): string | null {
  if (v instanceof PDFName) return v.asString().replace(/^\//, '');
  if (v instanceof PDFArray) {
    const first = v.get(0);
    if (first instanceof PDFName) return first.asString().replace(/^\//, '');
  }
  return null;
}

function readFilters(doc: PDFDocument, v: unknown): string[] {
  if (!v) return [];
  const ctx = doc.context;

  const norm = (x: unknown): string | null => {
    if (x instanceof PDFName) return x.asString().replace(/^\//, '');
    return null;
  };

  if (v instanceof PDFName) {
    const one = norm(v);
    return one ? [one] : [];
  }

  if (v instanceof PDFArray) {
    const out: string[] = [];
    for (let i = 0; i < v.size(); i++) {
      const n = norm(v.get(i));
      if (n) out.push(n);
    }
    return out;
  }

  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    if (looked instanceof PDFName) return [looked.asString().replace(/^\//, '')];
    if (looked instanceof PDFArray) {
      const out: string[] = [];
      for (let i = 0; i < looked.size(); i++) {
        const n = norm(looked.get(i));
        if (n) out.push(n);
      }
      return out;
    }
  }

  return [];
}

function guessExtension(filters: string[]): string {
  const f = filters.join(',');
  if (/DCTDecode/i.test(f)) return 'jpg';
  if (/JPXDecode/i.test(f)) return 'jp2';
  // CCITT, Flate, LZW, RunLength etc => brut
  return 'bin';
}

function readRawStreamBytes(stream: PDFStream | PDFRawStream): Uint8Array | null {
  // PDFRawStream est le plus courant via lookup
  const raw = stream as any;
  if (raw?.contents instanceof Uint8Array) return raw.contents as Uint8Array;
  if (typeof raw?.getContents === 'function') {
    const c = raw.getContents();
    if (c instanceof Uint8Array) return c;
  }
  return null;
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

  if (v instanceof PDFRef) {
    return { ref: v.toString() };
  }
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

  if (v instanceof PDFDict) {
    return dictToPlainObject(doc, v);
  }

  // stream => keep ref-ish info
  if (v instanceof PDFStream || v instanceof PDFRawStream) {
    const dict = (v as any).dict as PDFDict | undefined;
    return dict ? { stream: dictToPlainObject(doc, dict) } : { stream: true };
  }

  // lookup if possible
  try {
    const looked = (v instanceof PDFRef) ? ctx.lookup(v) : null;
    if (looked) return toPlain(doc, looked);
  } catch {}

  return null;
}

function uint8ToBase64(u8: Uint8Array): string {
  // chunked to avoid stack blow
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    const slice = u8.subarray(i, i + CHUNK);
    s += String.fromCharCode(...slice);
  }
  return btoa(s);
}
