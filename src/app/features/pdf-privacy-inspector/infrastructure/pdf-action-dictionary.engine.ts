import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFStream,
  PDFString,
  type PDFObject,
} from 'pdf-lib';

import { PDF_PRIVACY_MAX_DISCOVERED_ITEMS } from '../domain/pdf-privacy.models';

export interface PdfActionDictionarySignal {
  actionType: string;
  target?: string;
  occurrences: number;
}

export class PdfActionDictionaryInspectionError extends Error {
  readonly code = 'inspection-limit' as const;
}

const ACTION_NAMES = new Set([
  'GoToE',
  'GoToR',
  'ImportData',
  'JavaScript',
  'Launch',
  'Named',
  'Rendition',
  'ResetForm',
  'RichMediaExecute',
  'SetOCGState',
  'SubmitForm',
  'URI',
]);
const MAX_INDIRECT_OBJECTS = 100_000;
const MAX_TRAVERSED_OBJECTS = 250_000;
const MAX_TARGET_BYTES = 4_096;

/**
 * Reads action dictionaries without executing their contents. This second,
 * bounded parser is necessary because PDF.js intentionally normalizes away
 * action types such as Launch and does not expose SubmitForm at all.
 */
export async function inspectPdfActionDictionaries(
  data: Uint8Array,
): Promise<readonly PdfActionDictionarySignal[] | null> {
  try {
    const document = await PDFDocument.load(data, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });
    const roots = document.context.enumerateIndirectObjects();
    if (roots.length > MAX_INDIRECT_OBJECTS) throw new PdfActionDictionaryInspectionError();

    const queue: PDFObject[] = roots.map(([, object]) => object);
    const visited = new Set<PDFObject>();
    const signals = new Map<string, PdfActionDictionarySignal>();

    while (queue.length > 0) {
      const object = queue.pop();
      if (!object || object instanceof PDFRef || visited.has(object)) continue;
      visited.add(object);
      if (visited.size > MAX_TRAVERSED_OBJECTS) throw new PdfActionDictionaryInspectionError();

      if (object instanceof PDFStream) {
        queue.push(object.dict);
        continue;
      }
      if (object instanceof PDFArray) {
        for (const child of object.asArray()) queue.push(child);
        continue;
      }
      if (!(object instanceof PDFDict)) continue;

      collectActionDictionary(object, signals, !document.isEncrypted);
      for (const child of object.values()) queue.push(child);
    }

    return [...signals.values()];
  } catch (error: unknown) {
    if (error instanceof PdfActionDictionaryInspectionError) throw error;
    // PDF.js remains the source of truth for validity/password handling. Some
    // encrypted or damaged PDFs cannot be opened by the secondary parser.
    return null;
  }
}

function collectActionDictionary(
  dictionary: PDFDict,
  signals: Map<string, PdfActionDictionarySignal>,
  canReadTarget: boolean,
): void {
  const actionName = dictionary.lookupMaybe(PDFName.of('S'), PDFName);
  if (!actionName || actionName.sizeInBytes() > 128) return;
  const actionType = actionName.decodeText();
  if (!actionType || !ACTION_NAMES.has(actionType)) return;

  const target = canReadTarget ? readTarget(dictionary) : undefined;
  const key = `${actionType}\u0000${target ?? ''}`;
  const current = signals.get(key);
  if (current) {
    current.occurrences += 1;
    return;
  }
  if (signals.size >= PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfActionDictionaryInspectionError();
  }
  signals.set(key, { actionType, target, occurrences: 1 });
}

function readTarget(dictionary: PDFDict): string | undefined {
  return readText(dictionary.lookup(PDFName.of('F')))
    ?? readText(dictionary.lookup(PDFName.of('URI')));
}

function readText(object: PDFObject | undefined, depth = 0): string | undefined {
  if (depth > 4) return undefined;
  if (object instanceof PDFString || object instanceof PDFHexString) {
    if (object.asBytes().byteLength > MAX_TARGET_BYTES) return '[cible trop longue]';
    return object.decodeText();
  }
  if (object instanceof PDFName) {
    return object.sizeInBytes() <= MAX_TARGET_BYTES ? object.decodeText() : '[cible trop longue]';
  }
  if (!(object instanceof PDFDict)) return undefined;

  for (const key of ['UF', 'F', 'Unix', 'DOS', 'Mac']) {
    const value = object.lookup(PDFName.of(key));
    const text = readText(value, depth + 1);
    if (text) return text;
  }
  return undefined;
}
