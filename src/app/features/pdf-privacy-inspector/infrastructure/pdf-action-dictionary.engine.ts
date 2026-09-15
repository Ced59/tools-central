import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  type PDFObject,
} from 'pdf-lib';
import { Inflate } from 'pako';

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
  encrypted: boolean;
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
export const PDF_PRIVACY_MAX_JAVASCRIPT_BYTES = 1 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_XMP_BYTES = 2 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_XFA_BYTES = 8 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH = 256;
export const PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES = 32 * 1_024 * 1_024;
const TEXT_INFLATE_CHUNK_BYTES = 64 * 1_024;
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
  validatedTextLimits: Map<PDFObject, number>;
  decodedTextBytes: Map<PDFObject, number>;
  fieldObjectCount: number;
  fieldJavascriptBytes: number;
  fieldJavascriptObjects: Set<PDFObject>;
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
  fieldContext: boolean;
  chainDepth: number;
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
  fieldContext: boolean;
  chainDepth: number;
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
      validatedTextLimits: new Map<PDFObject, number>(),
      decodedTextBytes: new Map<PDFObject, number>(),
      fieldObjectCount: 0,
      fieldJavascriptBytes: 0,
      fieldJavascriptObjects: new Set<PDFObject>(),
    };
    validateXmpMetadataBudget(document, state);

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

      if (isFieldActionParent(object)) state.fieldObjectCount += 1;
      validateDecodedTextBudgets(object, state);
      inspectActionTriggers(object, state);
      inspectAssociatedFiles(object, state);
      inspectEmbeddedFileSpec(object, state);
      queue.push({ kind: 'children-frame', iterator: structuralChildren(object) });
    }
    validateFieldActionExpansionBudget(state);

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
      encrypted: document.isEncrypted,
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
  fieldContext: boolean,
  state: InspectionState,
): void {
  const actionName = readName(dictionary, 'S');
  if (!actionName || actionName.sizeInBytes() > 128) return;
  const actionType = actionName.decodeText();
  if (!actionType || !ACTION_NAMES.has(actionType)) return;
  if (fieldContext && actionType === 'JavaScript') {
    const javascript = readObject(dictionary, 'JS');
    const resolvedJavascript = javascript
      ? resolvePdfObject(javascript, state.document)
      : undefined;
    if (javascript && resolvedJavascript && !state.fieldJavascriptObjects.has(resolvedJavascript)) {
      state.fieldJavascriptObjects.add(resolvedJavascript);
      state.fieldJavascriptBytes += measurePdfTextBytes(javascript, state);
    }
  }

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
  const fieldContext = isFieldActionParent(dictionary);
  const openAction = dictionary.get(PDFName.of('OpenAction'));
  if (openAction) {
    inspectActionEntry(openAction, 'open-action', triggerId, state, false, fieldContext, new Set());
  }

  const additionalActions = dictionary.get(PDFName.of('AA'));
  if (additionalActions) {
    inspectActionEntry(
      additionalActions,
      additionalActionContext(dictionary),
      triggerId,
      state,
      true,
      fieldContext,
      new Set(),
    );
  }

  const action = dictionary.get(PDFName.of('A'));
  if (!action) return;
  inspectActionEntry(
    action,
    actionContext(dictionary),
    triggerId,
    state,
    false,
    fieldContext,
    new Set(),
  );
}

function inspectActionEntry(
  object: PDFObject,
  context: PdfActionDictionaryContext,
  triggerId: string | undefined,
  state: InspectionState,
  allowContainer: boolean,
  fieldContext: boolean,
  path: Set<PDFObject>,
): void {
  const stack: ActionWorkItem[] = [{
    kind: 'visit', object, context, triggerId, allowContainer, fieldContext, chainDepth: 0,
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
        fieldContext: workItem.fieldContext,
        chainDepth: workItem.chainDepth,
      });
      continue;
    }

    consumeTraversalStep(state);
    if (workItem.chainDepth > PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH) {
      throw new PdfActionDictionaryInspectionError();
    }
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
        fieldContext: workItem.fieldContext,
        chainDepth: workItem.chainDepth,
      });
      continue;
    }
    const dictionary = workItem.object instanceof PDFStream
      ? workItem.object.dict
      : workItem.object;
    if (!(dictionary instanceof PDFDict)) continue;
    validateDecodedTextBudgets(dictionary, state);

    if (workItem.allowContainer) {
      stack.push({
        kind: 'children',
        iterator: dictionary.asMap().values(),
        context: workItem.context,
        triggerId: workItem.triggerId,
        fieldContext: workItem.fieldContext,
        chainDepth: workItem.chainDepth,
      });
      continue;
    }

    const actionType = readName(dictionary, 'S')?.decodeText();
    if (actionType) {
      collectActionDictionary(
        dictionary,
        workItem.context,
        workItem.triggerId,
        workItem.fieldContext,
        state,
      );
      const next = dictionary.get(PDFName.of('Next'));
      if (next) {
        stack.push({
          kind: 'visit',
          object: next,
          context: 'next-action',
          triggerId: workItem.triggerId,
          allowContainer: false,
          fieldContext: workItem.fieldContext,
          chainDepth: workItem.chainDepth + 1,
        });
      }
      continue;
    }
  }
}

function actionContext(parent: PDFDict): PdfActionDictionaryContext {
  const subtype = readName(parent, 'Subtype')?.decodeText();
  if (subtype && ANNOTATION_SUBTYPES.has(subtype)) return 'annotation-action';
  if (parent.has(PDFName.of('Title'))) return 'outline-action';
  return 'explicit-action';
}

function readName(dictionary: PDFDict, key: string): PDFName | undefined {
  const value = readObject(dictionary, key);
  return value instanceof PDFName ? value : undefined;
}

function readDictionary(dictionary: PDFDict, key: string): PDFDict | undefined {
  const value = readObject(dictionary, key);
  return value instanceof PDFDict ? value : undefined;
}

function readObject(dictionary: PDFDict, key: string): PDFObject | undefined {
  try {
    return dictionary.lookup(PDFName.of(key));
  } catch {
    return undefined;
  }
}

function additionalActionContext(parent: PDFDict): PdfActionDictionaryContext {
  const subtype = readName(parent, 'Subtype')?.decodeText();
  if (subtype === 'Widget' || parent.has(PDFName.of('FT'))) return 'field-additional-action';
  if (subtype && ANNOTATION_SUBTYPES.has(subtype)) return 'annotation-additional-action';
  const type = readName(parent, 'Type')?.decodeText();
  return type === 'Page' ? 'page-additional-action' : 'additional-action';
}

function isFieldActionParent(parent: PDFDict): boolean {
  return readName(parent, 'Subtype')?.decodeText() === 'Widget'
    || parent.has(PDFName.of('FT'));
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
  const embeddedFile = findEmbeddedFileStream(fileSpec);
  if (!embeddedFile) return;
  const currentId = state.associatedFileIds.get(fileSpec);
  if (currentId !== undefined) return;
  consumeDiscoveredSignal(state);
  const id = state.associatedFileIds.size + 1;
  state.associatedFileIds.set(fileSpec, id);
  state.associatedFiles.set(id, {
    id,
    fileName: state.canReadTarget
      ? readDisplayText(readObject(fileSpec, 'UF'))
        ?? readDisplayText(readObject(fileSpec, 'F'))
      : undefined,
    description: state.canReadTarget
      ? readDisplayText(readObject(fileSpec, 'Desc'))
      : undefined,
    contentType: readName(embeddedFile.dict, 'Subtype')?.decodeText(),
    bytes: embeddedFile.getContentsSize(),
    occurrences: 1,
  });
}

function findEmbeddedFileStream(fileSpec: PDFDict): PDFStream | undefined {
  const embeddedFiles = readDictionary(fileSpec, 'EF');
  if (!embeddedFiles) return undefined;
  for (const key of ['UF', 'F', 'Unix', 'Mac', 'DOS']) {
    const stream = readObject(embeddedFiles, key);
    if (stream instanceof PDFStream) return stream;
  }
  return undefined;
}

function validateXmpMetadataBudget(document: PDFDocument, state: InspectionState): void {
  if (document.isEncrypted) return;
  const metadata = readObject(document.catalog, 'Metadata');
  if (!metadata) return;
  validatePdfTextObjects(metadata, PDF_PRIVACY_MAX_XMP_BYTES, state);
}

function validateDecodedTextBudgets(dictionary: PDFDict, state: InspectionState): void {
  if (state.document.isEncrypted) return;
  const javascript = readObject(dictionary, 'JS');
  if (javascript) {
    validatePdfTextObjects(javascript, PDF_PRIVACY_MAX_JAVASCRIPT_BYTES, state);
  }
  const xfa = readObject(dictionary, 'XFA');
  if (xfa) validatePdfTextObjects(xfa, PDF_PRIVACY_MAX_XFA_BYTES, state);
}

function validatePdfTextObjects(
  root: PDFObject,
  maxDecodedBytes: number,
  state: InspectionState,
): void {
  const stack = [root];
  while (stack.length > 0) {
    const rawObject = stack.pop();
    if (!rawObject) continue;
    const object = resolvePdfObject(rawObject, state.document);
    if (!object) continue;
    const validatedLimit = state.validatedTextLimits.get(object);
    if (validatedLimit !== undefined && validatedLimit <= maxDecodedBytes) continue;
    state.validatedTextLimits.set(object, maxDecodedBytes);

    if (object instanceof PDFString || object instanceof PDFHexString) {
      const decodedBytes = object.asBytes().byteLength;
      state.decodedTextBytes.set(object, decodedBytes);
      if (decodedBytes > maxDecodedBytes) {
        throw new PdfActionDictionaryInspectionError();
      }
      continue;
    }
    if (object instanceof PDFRawStream) {
      state.decodedTextBytes.set(object, validateDecodedStreamSize(object, maxDecodedBytes));
      continue;
    }
    if (object instanceof PDFStream) throw new PdfActionDictionaryInspectionError();
    if (object instanceof PDFArray) stack.push(...object.asArray());
  }
}

function measurePdfTextBytes(root: PDFObject, state: InspectionState): number {
  const stack = [root];
  const visited = new Set<PDFObject>();
  let total = 0;
  while (stack.length > 0) {
    const rawObject = stack.pop();
    if (!rawObject) continue;
    const object = resolvePdfObject(rawObject, state.document);
    if (!object || visited.has(object)) continue;
    visited.add(object);
    const decodedBytes = state.decodedTextBytes.get(object);
    if (decodedBytes !== undefined) {
      total += decodedBytes;
    } else if (object instanceof PDFArray) {
      stack.push(...object.asArray());
    }
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  return total;
}

function resolvePdfObject(object: PDFObject, document: PDFDocument): PDFObject | undefined {
  if (!(object instanceof PDFRef)) return object;
  try {
    return document.context.lookup(object);
  } catch {
    return undefined;
  }
}

function validateDecodedStreamSize(stream: PDFRawStream, maxDecodedBytes: number): number {
  const contents = stream.getContents();
  const filters = readFilterNames(stream.dict);
  if (filters.length === 0) {
    if (contents.byteLength > maxDecodedBytes) {
      throw new PdfActionDictionaryInspectionError();
    }
    return contents.byteLength;
  }
  if (filters.length !== 1 || !['FlateDecode', 'Fl'].includes(filters[0])) {
    throw new PdfActionDictionaryInspectionError();
  }
  return validateInflatedSize(contents, maxDecodedBytes);
}

function readFilterNames(dictionary: PDFDict): readonly string[] {
  const filter = readObject(dictionary, 'Filter');
  if (!filter) return [];
  if (filter instanceof PDFName) return [filter.decodeText()];
  if (!(filter instanceof PDFArray)) throw new PdfActionDictionaryInspectionError();
  const names: string[] = [];
  for (let index = 0; index < filter.size(); index += 1) {
    const value = filter.lookup(index);
    if (!(value instanceof PDFName)) throw new PdfActionDictionaryInspectionError();
    names.push(value.decodeText());
  }
  return names;
}

function validateInflatedSize(contents: Uint8Array, maxDecodedBytes: number): number {
  const inflater = new Inflate({ chunkSize: TEXT_INFLATE_CHUNK_BYTES });
  let decodedBytes = 0;
  inflater.onData = chunk => {
    decodedBytes += chunk.byteLength;
    if (decodedBytes > maxDecodedBytes) {
      throw new PdfActionDictionaryInspectionError();
    }
  };
  try {
    const succeeded = inflater.push(contents, true);
    if (!succeeded || inflater.err !== 0) throw new PdfActionDictionaryInspectionError();
    return decodedBytes;
  } catch (error: unknown) {
    if (error instanceof PdfActionDictionaryInspectionError) throw error;
    throw new PdfActionDictionaryInspectionError();
  }
}

function validateFieldActionExpansionBudget(state: InspectionState): void {
  const expandedBytes = state.fieldJavascriptBytes * Math.max(1, state.fieldObjectCount);
  if (
    !Number.isSafeInteger(expandedBytes)
    || expandedBytes > PDF_PRIVACY_MAX_FIELD_ACTION_EXPANSION_BYTES
  ) {
    throw new PdfActionDictionaryInspectionError();
  }
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
  return readText(readObject(dictionary, 'F'))
    ?? readText(readObject(dictionary, 'URI'))
    ?? readText(readObject(dictionary, 'N'));
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
    const value = readObject(object, key);
    const text = readText(value, depth + 1);
    if (text) return text;
  }
  return undefined;
}

function readDisplayText(object: PDFObject | undefined): string | undefined {
  const value = readText(object);
  return typeof value === 'string' ? value : undefined;
}
