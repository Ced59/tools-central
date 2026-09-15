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
  context: PdfActionDictionaryContext;
  target?: string;
  occurrences: number;
}

export type PdfActionDictionaryContext =
  | 'open-action'
  | 'additional-action'
  | 'annotation-action'
  | 'outline-action'
  | 'explicit-action'
  | 'unknown';

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
const ANNOTATION_SUBTYPES = new Set([
  'FileAttachment', 'Link', 'Movie', 'RichMedia', 'Screen', 'Sound', 'Widget', '3D',
]);

interface PendingObject {
  object: PDFObject;
  context: PdfActionDictionaryContext;
}

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
    const indirectObjectCount = document.context.enumerateIndirectObjects().length;
    if (indirectObjectCount > MAX_INDIRECT_OBJECTS) throw new PdfActionDictionaryInspectionError();

    const queue: PendingObject[] = [{ object: document.catalog, context: 'unknown' }];
    const visited = new Map<PDFObject, Set<PdfActionDictionaryContext>>();
    const signals = new Map<string, PdfActionDictionarySignal>();
    let traversalSteps = 0;

    while (queue.length > 0) {
      const pending = queue.pop();
      if (!pending) continue;
      traversalSteps += 1;
      if (traversalSteps > MAX_TRAVERSED_OBJECTS) throw new PdfActionDictionaryInspectionError();

      if (pending.object instanceof PDFRef) {
        const resolved = document.context.lookup(pending.object);
        if (resolved) queue.push({ object: resolved, context: pending.context });
        continue;
      }

      const contexts = visited.get(pending.object) ?? new Set<PdfActionDictionaryContext>();
      if (contexts.has(pending.context)) continue;
      contexts.add(pending.context);
      visited.set(pending.object, contexts);

      if (pending.object instanceof PDFStream) {
        queue.push({ object: pending.object.dict, context: pending.context });
        continue;
      }
      if (pending.object instanceof PDFArray) {
        for (const child of pending.object.asArray()) {
          queue.push({ object: child, context: pending.context });
        }
        continue;
      }
      if (!(pending.object instanceof PDFDict)) continue;

      collectActionDictionary(
        pending.object,
        pending.context,
        signals,
        !document.isEncrypted,
      );
      for (const [key, child] of pending.object.entries()) {
        queue.push({
          object: child,
          context: childContext(pending.object, pending.context, key),
        });
      }
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
  context: PdfActionDictionaryContext,
  signals: Map<string, PdfActionDictionarySignal>,
  canReadTarget: boolean,
): void {
  const actionName = dictionary.lookupMaybe(PDFName.of('S'), PDFName);
  if (!actionName || actionName.sizeInBytes() > 128) return;
  const actionType = actionName.decodeText();
  if (!actionType || !ACTION_NAMES.has(actionType)) return;

  const target = canReadTarget ? readTarget(dictionary) : undefined;
  const key = `${context}\u0000${actionType}\u0000${target ?? ''}`;
  const current = signals.get(key);
  if (current) {
    current.occurrences += 1;
    return;
  }
  if (signals.size >= PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfActionDictionaryInspectionError();
  }
  signals.set(key, { actionType, context, target, occurrences: 1 });
}

function childContext(
  parent: PDFDict,
  parentContext: PdfActionDictionaryContext,
  key: PDFName,
): PdfActionDictionaryContext {
  const name = key.decodeText();
  if (name === 'OpenAction') return 'open-action';
  if (name === 'AA') return 'additional-action';
  if (name === 'Outlines') return 'outline-action';
  if (name === 'A') {
    if (parentContext === 'outline-action') return parentContext;
    const subtype = parent.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText();
    return subtype && ANNOTATION_SUBTYPES.has(subtype)
      ? 'annotation-action'
      : 'explicit-action';
  }
  return parentContext;
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
