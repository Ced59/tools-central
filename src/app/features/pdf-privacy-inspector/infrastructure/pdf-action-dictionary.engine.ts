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
  | 'annotation-additional-action'
  | 'field-additional-action'
  | 'page-additional-action'
  | 'annotation-action'
  | 'outline-action'
  | 'next-action'
  | 'explicit-action'
  | 'unknown';

export interface PdfAssociatedFileSignal {
  id: number;
  fileName?: string;
  description?: string;
  contentType?: string;
  bytes?: number;
  occurrences: number;
}

export interface PdfStructuralSignals {
  actionDictionaries: readonly PdfActionDictionarySignal[];
  associatedFiles: readonly PdfAssociatedFileSignal[];
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
const ANNOTATION_SUBTYPES = new Set([
  'FileAttachment', 'Link', 'Movie', 'RichMedia', 'Screen', 'Sound', 'Widget', '3D',
]);

interface InspectionState {
  document: PDFDocument;
  signals: Map<string, PdfActionDictionarySignal>;
  associatedFiles: Map<number, PdfAssociatedFileSignal>;
  associatedFileIds: Map<PDFDict, number>;
  canReadTarget: boolean;
  traversalSteps: number;
  discoveredSignals: number;
}

/**
 * Reads action dictionaries without executing their contents. This second,
 * bounded parser is necessary because PDF.js intentionally normalizes away
 * action types such as Launch and does not expose SubmitForm at all.
 */
export async function inspectPdfStructuralSignals(
  data: Uint8Array,
): Promise<PdfStructuralSignals | null> {
  try {
    const document = await PDFDocument.load(data, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });
    const indirectObjectCount = document.context.enumerateIndirectObjects().length;
    if (indirectObjectCount > MAX_INDIRECT_OBJECTS) throw new PdfActionDictionaryInspectionError();

    const queue: PDFObject[] = [document.catalog];
    const visited = new Set<PDFObject>();
    const state: InspectionState = {
      document,
      signals: new Map<string, PdfActionDictionarySignal>(),
      associatedFiles: new Map<number, PdfAssociatedFileSignal>(),
      associatedFileIds: new Map<PDFDict, number>(),
      canReadTarget: !document.isEncrypted,
      traversalSteps: 0,
      discoveredSignals: 0,
    };

    while (queue.length > 0) {
      const object = queue.pop();
      if (!object) continue;
      consumeTraversalStep(state);

      if (object instanceof PDFRef) {
        if (visited.has(object)) continue;
        visited.add(object);
        const resolved = document.context.lookup(object);
        if (resolved) queue.push(resolved);
        continue;
      }

      if (visited.has(object)) continue;
      visited.add(object);

      if (object instanceof PDFStream) {
        queue.push(object.dict);
        continue;
      }
      if (object instanceof PDFArray) {
        queue.push(...object.asArray());
        continue;
      }
      if (!(object instanceof PDFDict)) continue;

      inspectActionTriggers(object, state);
      inspectAssociatedFiles(object, state);
      for (const [key, child] of object.entries()) {
        if (isHandledTriggerKey(object, key)) continue;
        queue.push(child);
      }
    }

    return {
      actionDictionaries: [...state.signals.values()],
      associatedFiles: [...state.associatedFiles.values()],
    };
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
  state: InspectionState,
): void {
  const actionName = dictionary.lookupMaybe(PDFName.of('S'), PDFName);
  if (!actionName || actionName.sizeInBytes() > 128) return;
  const actionType = actionName.decodeText();
  if (!actionType || !ACTION_NAMES.has(actionType)) return;

  consumeDiscoveredSignal(state);

  const target = state.canReadTarget ? readTarget(dictionary) : undefined;
  const key = `${context}\u0000${actionType}\u0000${target ?? ''}`;
  const current = state.signals.get(key);
  if (current) {
    current.occurrences += 1;
    return;
  }
  state.signals.set(key, { actionType, context, target, occurrences: 1 });
}

function inspectActionTriggers(dictionary: PDFDict, state: InspectionState): void {
  const openAction = dictionary.get(PDFName.of('OpenAction'));
  if (openAction) inspectActionEntry(openAction, 'open-action', state, false, new Set());

  const additionalActions = dictionary.get(PDFName.of('AA'));
  if (additionalActions) {
    inspectActionEntry(
      additionalActions,
      additionalActionContext(dictionary),
      state,
      true,
      new Set(),
    );
  }

  const action = dictionary.get(PDFName.of('A'));
  if (!action) return;
  inspectActionEntry(action, actionContext(dictionary), state, false, new Set());
}

function inspectActionEntry(
  object: PDFObject,
  context: PdfActionDictionaryContext,
  state: InspectionState,
  allowContainer: boolean,
  path: Set<PDFObject>,
): void {
  consumeTraversalStep(state);
  if (path.has(object)) return;
  path.add(object);
  try {
    if (object instanceof PDFRef) {
      const resolved = state.document.context.lookup(object);
      if (resolved) inspectActionEntry(resolved, context, state, allowContainer, path);
      return;
    }
    if (object instanceof PDFArray) {
      for (const child of object.asArray()) {
        inspectActionEntry(child, context, state, false, path);
      }
      return;
    }
    const dictionary = object instanceof PDFStream ? object.dict : object;
    if (!(dictionary instanceof PDFDict)) return;

    const actionType = dictionary.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText();
    if (actionType) {
      collectActionDictionary(dictionary, context, state);
      const next = dictionary.get(PDFName.of('Next'));
      if (next) inspectActionEntry(next, 'next-action', state, false, path);
      return;
    }
    if (!allowContainer) return;
    for (const child of dictionary.values()) {
      inspectActionEntry(child, context, state, false, path);
    }
  } finally {
    path.delete(object);
  }
}

function actionContext(parent: PDFDict): PdfActionDictionaryContext {
  const subtype = parent.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText();
  if (subtype && ANNOTATION_SUBTYPES.has(subtype)) return 'annotation-action';
  if (parent.has(PDFName.of('Title'))) return 'outline-action';
  return 'explicit-action';
}

function additionalActionContext(parent: PDFDict): PdfActionDictionaryContext {
  const subtype = parent.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText();
  if (subtype === 'Widget' || parent.has(PDFName.of('FT'))) return 'field-additional-action';
  if (subtype && ANNOTATION_SUBTYPES.has(subtype)) return 'annotation-additional-action';
  const type = parent.lookupMaybe(PDFName.of('Type'), PDFName)?.decodeText();
  return type === 'Page' ? 'page-additional-action' : 'additional-action';
}

function inspectAssociatedFiles(parent: PDFDict, state: InspectionState): void {
  const associatedFiles = parent.get(PDFName.of('AF'));
  if (associatedFiles) inspectAssociatedFileEntry(associatedFiles, state, new Set());
}

function inspectAssociatedFileEntry(
  object: PDFObject,
  state: InspectionState,
  path: Set<PDFObject>,
): void {
  consumeTraversalStep(state);
  if (path.has(object)) return;
  path.add(object);
  try {
    if (object instanceof PDFRef) {
      const resolved = state.document.context.lookup(object);
      if (resolved) inspectAssociatedFileEntry(resolved, state, path);
      return;
    }
    if (object instanceof PDFArray) {
      for (const child of object.asArray()) inspectAssociatedFileEntry(child, state, path);
      return;
    }
    if (!(object instanceof PDFDict)) return;
    collectAssociatedFile(object, state);
  } finally {
    path.delete(object);
  }
}

function collectAssociatedFile(fileSpec: PDFDict, state: InspectionState): void {
  const currentId = state.associatedFileIds.get(fileSpec);
  if (currentId !== undefined) {
    const current = state.associatedFiles.get(currentId);
    if (current) current.occurrences += 1;
    return;
  }
  consumeDiscoveredSignal(state);
  const id = state.associatedFileIds.size + 1;
  state.associatedFileIds.set(fileSpec, id);
  const embeddedFile = findEmbeddedFileStream(fileSpec);
  state.associatedFiles.set(id, {
    id,
    fileName: state.canReadTarget
      ? readText(fileSpec.lookup(PDFName.of('UF')))
        ?? readText(fileSpec.lookup(PDFName.of('F')))
      : undefined,
    description: state.canReadTarget
      ? readText(fileSpec.lookup(PDFName.of('Desc')))
      : undefined,
    contentType: embeddedFile?.dict.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText(),
    bytes: embeddedFile?.getContentsSize(),
    occurrences: 1,
  });
}

function findEmbeddedFileStream(fileSpec: PDFDict): PDFStream | undefined {
  const embeddedFiles = fileSpec.lookupMaybe(PDFName.of('EF'), PDFDict);
  if (!embeddedFiles) return undefined;
  for (const key of ['UF', 'F']) {
    const stream = embeddedFiles.lookup(PDFName.of(key));
    if (stream instanceof PDFStream) return stream;
  }
  return undefined;
}

function isHandledTriggerKey(parent: PDFDict, key: PDFName): boolean {
  const name = key.decodeText();
  if (name === 'A' || name === 'AA' || name === 'AF' || name === 'OpenAction') return true;
  return name === 'Next' && parent.has(PDFName.of('S'));
}

function consumeTraversalStep(state: InspectionState): void {
  state.traversalSteps += 1;
  if (state.traversalSteps > MAX_TRAVERSED_OBJECTS) {
    throw new PdfActionDictionaryInspectionError();
  }
}

function consumeDiscoveredSignal(state: InspectionState): void {
  state.discoveredSignals += 1;
  if (state.discoveredSignals > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfActionDictionaryInspectionError();
  }
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
