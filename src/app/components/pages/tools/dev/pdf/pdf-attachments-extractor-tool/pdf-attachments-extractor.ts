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

export interface PdfAttachmentItem {
  id: string; // stable-ish
  displayName: string; // user-facing filename
  keyName?: string | null; // name tree key
  description?: string | null;

  mime?: string | null;
  size: number;

  checksum?: string | null;
  creationDate?: string | null;
  modDate?: string | null;

  // bytes for download
  bytes?: Uint8Array | null;

  // raw optional
  raw?: Record<string, unknown> | null;
}

export interface PdfAttachmentsExtractOptions {
  includeBytes: boolean;
  includeRaw: boolean;
}

export interface PdfAttachmentsExtractResult {
  pageCount: number;
  attachments: PdfAttachmentItem[];
}

export async function extractPdfAttachments(
  doc: PDFDocument,
  opts: PdfAttachmentsExtractOptions
): Promise<PdfAttachmentsExtractResult> {
  const catalog = (doc as any).catalog as PDFDict | undefined;
  const pageCount = doc.getPages().length;

  const namesDict = resolveDict(doc, catalog?.get(PDFName.of('Names')));
  const embedded = resolveDict(doc, namesDict?.get(PDFName.of('EmbeddedFiles')));

  const attachments: PdfAttachmentItem[] = [];
  if (!embedded) return { pageCount, attachments };

  const collected: Array<{ key: string; fileSpec: PDFDict; fileSpecRef?: PDFRef }> = [];
  readNameTree(doc, embedded, collected);

  for (const it of collected) {
    const fileSpec = it.fileSpec;
    const fsRef = it.fileSpecRef;

    const uf = decodePdfString(fileSpec.get(PDFName.of('UF')));
    const f = decodePdfString(fileSpec.get(PDFName.of('F')));
    const desc = decodePdfString(fileSpec.get(PDFName.of('Desc')));

    const displayName = (uf ?? f ?? it.key ?? 'attachment.bin').trim() || 'attachment.bin';

    const ef = resolveDict(doc, fileSpec.get(PDFName.of('EF')));
    const streamVal = ef?.get(PDFName.of('UF')) ?? ef?.get(PDFName.of('F'));
    const stream = resolveStream(doc, streamVal);

    const bytes = stream ? readStreamBytes(stream) : null;
    const size = bytes?.length ?? 0;

    const params = stream ? resolveDict(doc, stream.dict.get(PDFName.of('Params'))) : null;
    const checksum = decodePdfString(params?.get(PDFName.of('CheckSum'))) ?? null;
    const creationDate = decodePdfString(params?.get(PDFName.of('CreationDate'))) ?? null;
    const modDate = decodePdfString(params?.get(PDFName.of('ModDate'))) ?? null;
    const mime = guessMime(doc, stream);

    const id = fsRef?.toString() ?? `att-${attachments.length + 1}-${displayName}`;

    attachments.push({
      id,
      displayName,
      keyName: it.key ?? null,
      description: desc ?? null,
      mime,
      size,
      checksum,
      creationDate,
      modDate,
      bytes: opts.includeBytes ? bytes : null,
      raw: opts.includeRaw ? dictToPlainObject(doc, fileSpec) : null,
    });
  }

  return { pageCount, attachments };
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

function resolveStream(doc: PDFDocument, v: unknown): PDFRawStream | null {
  const ctx = doc.context;
  if (v instanceof PDFRawStream) return v;
  if (v instanceof PDFRef) {
    const looked = ctx.lookup(v);
    return looked instanceof PDFRawStream ? looked : null;
  }
  return null;
}

function decodePdfString(v: unknown): string | null {
  if (v instanceof PDFString) return v.decodeText().trim() || null;
  if (v instanceof PDFHexString) return v.decodeText().trim() || null;
  return null;
}

function readStreamBytes(s: PDFRawStream): Uint8Array {
  // pdf-lib raw stream exposes Uint8Array contents
  const b = (s as any).contents as Uint8Array | undefined;
  return b ? new Uint8Array(b) : new Uint8Array();
}

function readNameTree(
  doc: PDFDocument,
  node: PDFDict,
  out: Array<{ key: string; fileSpec: PDFDict; fileSpecRef?: PDFRef }>
) {
  // Name tree: can contain /Names [ key value key value ... ] OR /Kids [ ... ]
  const names = resolveArray(doc, node.get(PDFName.of('Names')));
  if (names && names.size() >= 2) {
    for (let i = 0; i + 1 < names.size(); i += 2) {
      const k = names.get(i);
      const v = names.get(i + 1);

      const key = decodePdfString(k) ?? (k instanceof PDFName ? k.asString() : `key-${i}`);
      const fileSpecRef = v instanceof PDFRef ? v : undefined;
      const fileSpec = resolveDict(doc, v);

      if (fileSpec) out.push({ key, fileSpec, fileSpecRef });
    }
  }

  const kids = resolveArray(doc, node.get(PDFName.of('Kids')));
  if (kids && kids.size() > 0) {
    for (let i = 0; i < kids.size(); i++) {
      const child = resolveDict(doc, kids.get(i));
      if (child) readNameTree(doc, child, out);
    }
  }
}

function guessMime(doc: PDFDocument, stream: PDFRawStream | null): string | null {
  if (!stream) return null;

  const subtype = stream.dict.get(PDFName.of('Subtype'));
  if (subtype instanceof PDFName) {
    const s = subtype.asString().replace(/^\//, '');
    // Some PDFs store "application#2Fxml" etc. (rare)
    if (s.includes('/')) return s;
    // fallback: known token mapping
    if (s.toLowerCase() === 'xml') return 'application/xml';
    if (s.toLowerCase() === 'zip') return 'application/zip';
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
