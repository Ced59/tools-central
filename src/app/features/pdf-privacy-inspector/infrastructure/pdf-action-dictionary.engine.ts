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
  targetStatus?: 'too-long';
  occurrences: number;
  triggerIds?: readonly string[];
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
  'GoTo3DView',
  'ImportData',
  'JavaScript',
  'Launch',
  'Movie',
  'Named',
  'Rendition',
  'ResetForm',
  'RichMediaExecute',
  'SetOCGState',
  'Sound',
  'SubmitForm',
  'URI',
]);
const TARGET_BEARING_ACTION_NAMES = new Set([
  'GoToE', 'GoToR', 'ImportData', 'Launch', 'SubmitForm',
]);
const MAX_INDIRECT_OBJECTS = 100_000;
const MAX_TRAVERSED_OBJECTS = 250_000;
const MAX_TARGET_BYTES = 4_096;
const TARGET_TOO_LONG = Symbol('target-too-long');
const ANNOTATION_SUBTYPES = new Set([
  'FileAttachment', 'Link', 'Movie', 'RichMedia', 'Screen', 'Sound', 'Widget', '3D',
]);

interface InspectionState {
  document: PDFDocument;
  signals: Map<string, StoredActionDictionarySignal>;
  associatedFiles: Map<number, PdfAssociatedFileSignal>;
  associatedFileIds: Map<PDFDict, number>;
  objectIds: Map<PDFObject, string>;
  canReadTarget: boolean;
  traversalSteps: number;
  discoveredSignals: number;
}

interface StoredActionDictionarySignal {
  actionType: string;
  context: PdfActionDictionaryContext;
  target?: string;
  targetStatus?: 'too-long';
  occurrences: number;
  triggerIds: Set<string>;
}

interface StructuralChildrenFrame {
  kind: 'children-frame';
  iterator: Iterator<PDFObject>;
}

type StructuralWorkItem = PDFObject | StructuralChildrenFrame;

interface ActionVisitFrame {
  kind: 'visit';
  object: PDFObject;
  context: PdfActionDictionaryContext;
  triggerId: string | undefined;
  allowContainer: boolean;
}

interface ActionLeaveFrame {
  kind: 'leave';
  object: PDFObject;
}

interface ActionChildrenFrame {
  kind: 'children';
  iterator: Iterator<PDFObject>;
  context: PdfActionDictionaryContext;
  triggerId: string | undefined;
}

type ActionWorkItem = ActionVisitFrame | ActionLeaveFrame | ActionChildrenFrame;

interface AssociatedVisitFrame {
  kind: 'visit';
  object: PDFObject;
}

interface AssociatedLeaveFrame {
  kind: 'leave';
  object: PDFObject;
}

interface AssociatedChildrenFrame {
  kind: 'children';
  iterator: Iterator<PDFObject>;
}

type AssociatedWorkItem = AssociatedVisitFrame | AssociatedLeaveFrame | AssociatedChildrenFrame;

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
    const indirectObjects = document.context.enumerateIndirectObjects();
    if (indirectObjects.length > MAX_INDIRECT_OBJECTS) {
      throw new PdfActionDictionaryInspectionError();
    }

    const queue: StructuralWorkItem[] = [document.catalog];
    const visited = new Set<PDFObject>();
    const state: InspectionState = {
      document,
      signals: new Map<string, StoredActionDictionarySignal>(),
      associatedFiles: new Map<number, PdfAssociatedFileSignal>(),
      associatedFileIds: new Map<PDFDict, number>(),
      objectIds: new Map(indirectObjects.map(([reference, object]) => [
        object,
        pdfJsReferenceId(reference),
      ])),
      canReadTarget: !document.isEncrypted,
      traversalSteps: 0,
      discoveredSignals: 0,
    };

    while (queue.length > 0) {
      const workItem = queue.pop();
      if (!workItem) continue;
      if (isStructuralChildrenFrame(workItem)) {
        const next = workItem.iterator.next();
        if (next.done) continue;
        queue.push(workItem);
        queue.push(next.value);
        continue;
      }
      const object = workItem;
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
        queue.push({ kind: 'children-frame', iterator: object.asArray().values() });
        continue;
      }
      if (!(object instanceof PDFDict)) continue;

      inspectActionTriggers(object, state);
      inspectAssociatedFiles(object, state);
      inspectEmbeddedFileSpec(object, state);
      queue.push({ kind: 'children-frame', iterator: structuralChildren(object) });
    }

    return {
      actionDictionaries: [...state.signals.values()].map(signal => ({
        actionType: signal.actionType,
        context: signal.context,
        target: signal.target,
        targetStatus: signal.targetStatus,
        occurrences: signal.occurrences,
        ...(signal.triggerIds.size > 0 ? { triggerIds: [...signal.triggerIds] } : {}),
      })),
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
  triggerId: string | undefined,
  state: InspectionState,
): void {
  const actionName = dictionary.lookupMaybe(PDFName.of('S'), PDFName);
  if (!actionName || actionName.sizeInBytes() > 128) return;
  const actionType = actionName.decodeText();
  if (!actionType || !ACTION_NAMES.has(actionType)) return;

  consumeDiscoveredSignal(state);

  const rawTarget = state.canReadTarget ? readTarget(dictionary) : undefined;
  const target = typeof rawTarget === 'string' ? rawTarget : undefined;
  const targetStatus = rawTarget === TARGET_TOO_LONG ? 'too-long' : undefined;
  const shouldIdentifyTrigger = target === undefined && TARGET_BEARING_ACTION_NAMES.has(actionType);
  const key = `${context}\u0000${actionType}\u0000${target ?? ''}\u0000${targetStatus ?? ''}`;
  const current = state.signals.get(key);
  if (current) {
    current.occurrences += 1;
    if (shouldIdentifyTrigger && triggerId) current.triggerIds.add(triggerId);
    return;
  }
  state.signals.set(key, {
    actionType,
    context,
    target,
    targetStatus,
    occurrences: 1,
    triggerIds: new Set(shouldIdentifyTrigger && triggerId ? [triggerId] : []),
  });
}

function inspectActionTriggers(dictionary: PDFDict, state: InspectionState): void {
  const triggerId = state.objectIds.get(dictionary);
  const openAction = dictionary.get(PDFName.of('OpenAction'));
  if (openAction) {
    inspectActionEntry(openAction, 'open-action', triggerId, state, false, new Set());
  }

  const additionalActions = dictionary.get(PDFName.of('AA'));
  if (additionalActions) {
    inspectActionEntry(
      additionalActions,
      additionalActionContext(dictionary),
      triggerId,
      state,
      true,
      new Set(),
    );
  }

  const action = dictionary.get(PDFName.of('A'));
  if (!action) return;
  inspectActionEntry(action, actionContext(dictionary), triggerId, state, false, new Set());
}

function inspectActionEntry(
  object: PDFObject,
  context: PdfActionDictionaryContext,
  triggerId: string | undefined,
  state: InspectionState,
  allowContainer: boolean,
  path: Set<PDFObject>,
): void {
  const stack: ActionWorkItem[] = [{
    kind: 'visit', object, context, triggerId, allowContainer,
  }];
  while (stack.length > 0) {
    const workItem = stack.pop();
    if (!workItem) continue;
    if (workItem.kind === 'leave') {
      path.delete(workItem.object);
      continue;
    }
    if (workItem.kind === 'children') {
      const next = workItem.iterator.next();
      if (next.done) continue;
      stack.push(workItem);
      stack.push({
        kind: 'visit',
        object: next.value,
        context: workItem.context,
        triggerId: workItem.triggerId,
        allowContainer: false,
      });
      continue;
    }

    consumeTraversalStep(state);
    if (path.has(workItem.object)) continue;
    path.add(workItem.object);
    stack.push({ kind: 'leave', object: workItem.object });

    if (workItem.object instanceof PDFRef) {
      const resolved = state.document.context.lookup(workItem.object);
      if (resolved) {
        stack.push({ ...workItem, object: resolved });
      }
      continue;
    }
    if (workItem.object instanceof PDFArray) {
      stack.push({
        kind: 'children',
        iterator: workItem.object.asArray().values(),
        context: workItem.context,
        triggerId: workItem.triggerId,
      });
      continue;
    }
    const dictionary = workItem.object instanceof PDFStream
      ? workItem.object.dict
      : workItem.object;
    if (!(dictionary instanceof PDFDict)) continue;

    if (workItem.allowContainer) {
      stack.push({
        kind: 'children',
        iterator: dictionary.asMap().values(),
        context: workItem.context,
        triggerId: workItem.triggerId,
      });
      continue;
    }

    const actionType = dictionary.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText();
    if (actionType) {
      collectActionDictionary(dictionary, workItem.context, workItem.triggerId, state);
      const next = dictionary.get(PDFName.of('Next'));
      if (next) {
        stack.push({
          kind: 'visit',
          object: next,
          context: 'next-action',
          triggerId: workItem.triggerId,
          allowContainer: false,
        });
      }
      continue;
    }
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
  if (associatedFiles) inspectAssociatedFileEntry(associatedFiles, state);
}

function inspectEmbeddedFileSpec(dictionary: PDFDict, state: InspectionState): void {
  if (dictionary.has(PDFName.of('EF'))) collectAssociatedFile(dictionary, state);
}

function inspectAssociatedFileEntry(
  object: PDFObject,
  state: InspectionState,
): void {
  const path = new Set<PDFObject>();
  const stack: AssociatedWorkItem[] = [{ kind: 'visit', object }];
  while (stack.length > 0) {
    const workItem = stack.pop();
    if (!workItem) continue;
    if (workItem.kind === 'leave') {
      path.delete(workItem.object);
      continue;
    }
    if (workItem.kind === 'children') {
      const next = workItem.iterator.next();
      if (next.done) continue;
      stack.push(workItem);
      stack.push({ kind: 'visit', object: next.value });
      continue;
    }

    consumeTraversalStep(state);
    if (path.has(workItem.object)) continue;
    path.add(workItem.object);
    stack.push({ kind: 'leave', object: workItem.object });
    if (workItem.object instanceof PDFRef) {
      const resolved = state.document.context.lookup(workItem.object);
      if (resolved) stack.push({ kind: 'visit', object: resolved });
      continue;
    }
    if (workItem.object instanceof PDFArray) {
      stack.push({ kind: 'children', iterator: workItem.object.asArray().values() });
      continue;
    }
    if (workItem.object instanceof PDFDict) collectAssociatedFile(workItem.object, state);
  }
}

function collectAssociatedFile(fileSpec: PDFDict, state: InspectionState): void {
  const currentId = state.associatedFileIds.get(fileSpec);
  if (currentId !== undefined) return;
  consumeDiscoveredSignal(state);
  const id = state.associatedFileIds.size + 1;
  state.associatedFileIds.set(fileSpec, id);
  const embeddedFile = findEmbeddedFileStream(fileSpec);
  state.associatedFiles.set(id, {
    id,
    fileName: state.canReadTarget
      ? readDisplayText(fileSpec.lookup(PDFName.of('UF')))
        ?? readDisplayText(fileSpec.lookup(PDFName.of('F')))
      : undefined,
    description: state.canReadTarget
      ? readDisplayText(fileSpec.lookup(PDFName.of('Desc')))
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

function isStructuralChildrenFrame(
  workItem: StructuralWorkItem,
): workItem is StructuralChildrenFrame {
  return 'kind' in workItem;
}

function* structuralChildren(parent: PDFDict): IterableIterator<PDFObject> {
  for (const [key, child] of parent.asMap()) {
    if (!isHandledTriggerKey(parent, key)) yield child;
  }
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

function pdfJsReferenceId(reference: PDFRef): string {
  return `${String(reference.objectNumber)}R${reference.generationNumber === 0
    ? ''
    : String(reference.generationNumber)}`;
}

function readTarget(dictionary: PDFDict): string | typeof TARGET_TOO_LONG | undefined {
  return readText(dictionary.lookup(PDFName.of('F')))
    ?? readText(dictionary.lookup(PDFName.of('URI')));
}

function readText(
  object: PDFObject | undefined,
  depth = 0,
): string | typeof TARGET_TOO_LONG | undefined {
  if (depth > 4) return undefined;
  if (object instanceof PDFString || object instanceof PDFHexString) {
    if (object.asBytes().byteLength > MAX_TARGET_BYTES) return TARGET_TOO_LONG;
    return object.decodeText();
  }
  if (object instanceof PDFName) {
    return object.sizeInBytes() <= MAX_TARGET_BYTES ? object.decodeText() : TARGET_TOO_LONG;
  }
  if (!(object instanceof PDFDict)) return undefined;

  for (const key of ['UF', 'F', 'Unix', 'DOS', 'Mac']) {
    const value = object.lookup(PDFName.of(key));
    const text = readText(value, depth + 1);
    if (text) return text;
  }
  return undefined;
}

function readDisplayText(object: PDFObject | undefined): string | undefined {
  const value = readText(object);
  return typeof value === 'string' ? value : undefined;
}
