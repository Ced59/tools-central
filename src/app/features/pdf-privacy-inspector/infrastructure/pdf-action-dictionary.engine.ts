import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  type PDFObject,
} from 'pdf-lib';
import { Inflate } from 'pako';

import { PDF_PRIVACY_MAX_DISCOVERED_ITEMS } from '../domain/pdf-privacy.models';
import {
  type PdfObjectStreamPreflightResult,
  validatePdfObjectStreamBudgets,
} from './pdf-object-stream-preflight';

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

export interface PdfStructuralSignatureSignal {
  fieldName?: string;
  signerName?: string;
  subFilter?: string;
  contactInfo?: string;
  location?: string;
  reason?: string;
  signingTime?: string;
}

export interface PdfStructuralSignals {
  actionDictionaries: readonly PdfActionDictionarySignal[];
  associatedFiles: readonly PdfAssociatedFileSignal[];
  signatures: readonly PdfStructuralSignatureSignal[];
  encrypted: boolean;
  hasUnboundedEncryptedTextStreams: boolean;
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
export const PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_SIGNATURE_TAIL_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_DOCUMENT_JAVASCRIPT_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_NAMETREE_JAVASCRIPT_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_FIELD_NAME_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_INFO_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_FIELD_OPTION_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_FIELD_APPEARANCE_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_ANNOTATION_JAVASCRIPT_EXPANSION_BYTES = 32 * 1_024 * 1_024;
export const PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES = 32 * 1_024 * 1_024;
const NORMALIZED_CHOICE_OPTION_OVERHEAD_BYTES = 64;
const NORMALIZED_GEOMETRY_NUMBER_BYTES = 8;
const NORMALIZED_GEOMETRY_ARRAY_OVERHEAD_BYTES = 32;
const TEXT_INFLATE_CHUNK_BYTES = 64 * 1_024;
const TARGET_TOO_LONG = Symbol('target-too-long');
const ANNOTATION_SUBTYPES = new Set([
  'FileAttachment', 'Link', 'Movie', 'RichMedia', 'Screen', 'Sound', 'Widget', '3D',
]);

interface InspectionState {
  document: PDFDocument;
  fileData: Uint8Array;
  signals: Map<string, StoredActionDictionarySignal>;
  associatedFiles: Map<number, PdfAssociatedFileSignal>;
  signatures: PdfStructuralSignatureSignal[];
  associatedFileIds: Map<PDFDict, number>;
  objectIds: Map<PDFObject, string>;
  canReadTarget: boolean;
  traversalSteps: number;
  discoveredSignals: number;
  validatedTextLimits: Map<PDFObject, number>;
  decodedTextBytes: Map<PDFObject, number>;
  documentJavascriptBytes: number;
  documentJavascriptObjects: Set<PDFObject>;
  nameTreeJavascriptExpansionBytes: number;
  fieldObjectCount: number;
  fieldObjects: Set<PDFObject>;
  acroFormFieldObjects: Set<PDFObject>;
  fieldOccurrenceCount: number;
  fieldOccurrenceSignatureBytes: number;
  fieldQualifiedNameBytes: number;
  fieldJavascriptBytes: number;
  fieldJavascriptObjects: Set<PDFObject>;
  signatureObjectCount: number;
  signaturePayloadBytes: number;
  signatureTailBytes: number;
  infoExpansionBytes: number;
  annotationTargetExpansionBytes: number;
  fieldValueExpansionBytes: number;
  fieldOptionExpansionBytes: number;
  fieldAppearanceExpansionBytes: number;
  annotationTextExpansionBytes: number;
  annotationGeometryExpansionBytes: number;
  annotationJavascriptExpansionBytes: number;
  outlineValueExpansionBytes: number;
  geometryExpansionSizes: Map<PDFObject, number>;
  hasUnboundedEncryptedTextStreams: boolean;
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
  objectStreamPreflight?: PdfObjectStreamPreflightResult,
): Promise<PdfStructuralSignals | null> {
  try {
    try {
      if (!objectStreamPreflight) validatePdfObjectStreamBudgets(data);
    } catch {
      throw new PdfActionDictionaryInspectionError();
    }
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
      fileData: data,
      signals: new Map<string, StoredActionDictionarySignal>(),
      associatedFiles: new Map<number, PdfAssociatedFileSignal>(),
      signatures: [],
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
      documentJavascriptBytes: 0,
      documentJavascriptObjects: new Set<PDFObject>(),
      nameTreeJavascriptExpansionBytes: 0,
      fieldObjectCount: 0,
      fieldObjects: new Set<PDFObject>(),
      acroFormFieldObjects: new Set<PDFObject>(),
      fieldOccurrenceCount: 0,
      fieldOccurrenceSignatureBytes: 0,
      fieldQualifiedNameBytes: 0,
      fieldJavascriptBytes: 0,
      fieldJavascriptObjects: new Set<PDFObject>(),
      signatureObjectCount: 0,
      signaturePayloadBytes: 0,
      signatureTailBytes: 0,
      infoExpansionBytes: 0,
      annotationTargetExpansionBytes: 0,
      fieldValueExpansionBytes: 0,
      fieldOptionExpansionBytes: 0,
      fieldAppearanceExpansionBytes: 0,
      annotationTextExpansionBytes: 0,
      annotationGeometryExpansionBytes: 0,
      annotationJavascriptExpansionBytes: 0,
      outlineValueExpansionBytes: 0,
      geometryExpansionSizes: new Map(),
      hasUnboundedEncryptedTextStreams: false,
    };
    validateInfoBudget(document, state);
    validateAcroFormFieldBudgets(document, state);
    validateXmpMetadataBudget(document, state);
    validateOutlineBudget(document, state);
    validatePageTreeAnnotationBudgets(document, state);
    inspectJavascriptNameTreeNextActions(document, state);

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

      if (isFieldActionParent(object)) validateFieldObjectBudget(object, state);
      validateActionJavascriptBudget(object, state);
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
      signatures: state.signatures,
      encrypted: document.isEncrypted,
      hasUnboundedEncryptedTextStreams: state.hasUnboundedEncryptedTextStreams,
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
  const fieldContext = state.acroFormFieldObjects.has(dictionary) || isFieldActionParent(dictionary);
  const openAction = dictionary.get(PDFName.of('OpenAction'));
  if (openAction) {
    inspectActionEntry(openAction, 'open-action', triggerId, state, false, fieldContext, new Set());
  }

  const additionalActions = dictionary.get(PDFName.of('AA'));
  if (additionalActions) {
    inspectActionEntry(
      additionalActions,
      additionalActionContext(dictionary, fieldContext),
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
        chainDepth: workItem.chainDepth + 1,
      });
      continue;
    }
    const dictionary = workItem.object instanceof PDFStream
      ? workItem.object.dict
      : workItem.object;
    if (!(dictionary instanceof PDFDict)) continue;
    validateActionJavascriptBudget(dictionary, state);

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
    }
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

function additionalActionContext(
  parent: PDFDict,
  fieldContext = false,
): PdfActionDictionaryContext {
  const subtype = readName(parent, 'Subtype')?.decodeText();
  if (fieldContext || subtype === 'Widget' || parent.has(PDFName.of('FT'))) {
    return 'field-additional-action';
  }
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
    bytes: state.canReadTarget ? readEmbeddedFileBytes(embeddedFile) : undefined,
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
  const metadata = readObject(document.catalog, 'Metadata');
  if (!metadata) return;
  validatePdfTextObjects(metadata, PDF_PRIVACY_MAX_XMP_BYTES, state);
}

function validateInfoBudget(document: PDFDocument, state: InspectionState): void {
  const rawInfo = document.context.trailerInfo.Info;
  const info = rawInfo ? resolvePdfObject(rawInfo, document) : undefined;
  if (!(info instanceof PDFDict)) return;
  const entries = info.asMap();
  consumeDiscoveredSignal(state, entries.size);
  for (const [key, rawValue] of entries) {
    const value = resolvePdfObject(rawValue, document);
    let expandedBytes = key.sizeInBytes();
    if (value instanceof PDFString || value instanceof PDFHexString) {
      expandedBytes += value.asBytes().byteLength;
    } else if (value instanceof PDFName) {
      expandedBytes += value.sizeInBytes();
    }
    state.infoExpansionBytes += expandedBytes;
    if (
      !Number.isSafeInteger(state.infoExpansionBytes)
      || state.infoExpansionBytes > PDF_PRIVACY_MAX_INFO_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
  }
}

function validateActionJavascriptBudget(dictionary: PDFDict, state: InspectionState): void {
  if (readName(dictionary, 'S')?.decodeText() !== 'JavaScript') return;
  const javascript = readObject(dictionary, 'JS');
  if (javascript) {
    validatePdfTextObjects(javascript, PDF_PRIVACY_MAX_JAVASCRIPT_BYTES, state);
    state.documentJavascriptBytes += measureUniquePdfTextBytes(
      javascript,
      state,
      state.documentJavascriptObjects,
    );
    if (
      !Number.isSafeInteger(state.documentJavascriptBytes)
      || state.documentJavascriptBytes > PDF_PRIVACY_MAX_DOCUMENT_JAVASCRIPT_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
  }
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
      const decodedBytes = validateDecodedStreamSize(object, maxDecodedBytes, state);
      if (decodedBytes !== undefined) state.decodedTextBytes.set(object, decodedBytes);
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

function measureUniquePdfTextBytes(
  root: PDFObject,
  state: InspectionState,
  measuredObjects: Set<PDFObject>,
): number {
  const stack = [root];
  let total = 0;
  while (stack.length > 0) {
    const rawObject = stack.pop();
    if (!rawObject) continue;
    const object = resolvePdfObject(rawObject, state.document);
    if (!object || measuredObjects.has(object)) continue;
    measuredObjects.add(object);
    const decodedBytes = state.decodedTextBytes.get(object);
    if (decodedBytes !== undefined) {
      total += decodedBytes;
    } else if (object instanceof PDFArray) {
      for (let index = 0; index < object.size(); index += 1) {
        const child = object.get(index);
        stack.push(child);
      }
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

function validateDecodedStreamSize(
  stream: PDFRawStream,
  maxDecodedBytes: number,
  state: InspectionState,
): number | undefined {
  const contents = stream.getContents();
  const filters = readFilterNames(stream.dict);
  if (filters.length === 0) {
    if (contents.byteLength > maxDecodedBytes) {
      throw new PdfActionDictionaryInspectionError();
    }
    return contents.byteLength;
  }
  if (state.document.isEncrypted) {
    state.hasUnboundedEncryptedTextStreams = true;
    return undefined;
  }
  if (filters.length !== 1 || !['FlateDecode', 'Fl'].includes(filters[0])) {
    throw new PdfActionDictionaryInspectionError();
  }
  return validateInflatedSize(contents, maxDecodedBytes);
}

function validateFieldObjectBudget(
  field: PDFDict,
  state: InspectionState,
  inheritedFieldType?: string,
): void {
  if (state.fieldObjects.has(field)) return;
  state.fieldObjects.add(field);
  state.fieldObjectCount += 1;
  if (state.fieldObjectCount > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfActionDictionaryInspectionError();
  }
  const fieldType = readName(field, 'FT')?.decodeText() ?? inheritedFieldType;
  if (fieldType !== 'Sig') return;

  state.signatureObjectCount += 1;
  if (state.signatureObjectCount > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfActionDictionaryInspectionError();
  }
  const signature = readDictionary(field, 'V');
  const contents = signature ? readObject(signature, 'Contents') : undefined;
  if (!(contents instanceof PDFString) && !(contents instanceof PDFHexString)) return;
  state.signaturePayloadBytes += contents.asBytes().byteLength;
  if (
    !Number.isSafeInteger(state.signaturePayloadBytes)
    || state.signaturePayloadBytes > PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES
  ) {
    throw new PdfActionDictionaryInspectionError();
  }
  if (contents.asBytes().byteLength === 0 || !signature) return;
  const byteRange = readValidSignatureByteRange(signature, state);
  if (!byteRange) return;
  validateSignatureTailBudget(byteRange, state);
  const readable = state.canReadTarget;
  state.signatures.push({
    fieldName: readable ? readDisplayText(readObject(field, 'T')) : undefined,
    signerName: readable ? readDisplayText(readObject(signature, 'Name')) : undefined,
    subFilter: readDisplayText(readObject(signature, 'SubFilter')),
    contactInfo: readable ? readDisplayText(readObject(signature, 'ContactInfo')) : undefined,
    location: readable ? readDisplayText(readObject(signature, 'Location')) : undefined,
    reason: readable ? readDisplayText(readObject(signature, 'Reason')) : undefined,
    signingTime: readable ? readDisplayText(readObject(signature, 'M')) : undefined,
  });
}

function validateAcroFormFieldBudgets(document: PDFDocument, state: InspectionState): void {
  const acroForm = readDictionary(document.catalog, 'AcroForm');
  const xfa = acroForm ? readObject(acroForm, 'XFA') : undefined;
  if (xfa) validatePdfTextObjects(xfa, PDF_PRIVACY_MAX_XFA_BYTES, state);
  const rawFields = acroForm ? readObject(acroForm, 'Fields') : undefined;
  if (!(rawFields instanceof PDFArray)) return;

  const stack: (
    | { kind: 'leave'; object: PDFObject }
    | {
      kind: 'visit';
      object: PDFObject;
      parentNameBytes: number;
      inheritedValueBytes: number;
      inheritedDefaultValueBytes: number;
      inheritedOptionBytes: number;
      inheritedDefaultAppearanceBytes: number;
      inheritedFieldType: string | undefined;
    }
  )[] = [];
  const acroFormDefaultAppearanceBytes = measureNormalizedValueBytes(
    acroForm ? readObject(acroForm, 'DA') : undefined,
    state,
  );
  for (let index = 0; index < rawFields.size(); index += 1) {
    const field = rawFields.get(index);
    stack.push({
      kind: 'visit',
      object: field,
      parentNameBytes: 0,
      inheritedValueBytes: 0,
      inheritedDefaultValueBytes: 0,
      inheritedOptionBytes: 0,
      inheritedDefaultAppearanceBytes: acroFormDefaultAppearanceBytes,
      inheritedFieldType: undefined,
    });
  }
  const path = new Set<PDFObject>();
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    if (item.kind === 'leave') {
      path.delete(item.object);
      continue;
    }
    consumeTraversalStep(state);

    const field = resolvePdfObject(item.object, document);
    if (!(field instanceof PDFDict)) continue;
    if (path.has(field)) {
      throw new PdfActionDictionaryInspectionError();
    }
    path.add(field);
    stack.push({ kind: 'leave', object: field });
    state.acroFormFieldObjects.add(field);
    const fieldType = readName(field, 'FT')?.decodeText() ?? item.inheritedFieldType;

    state.fieldOccurrenceCount += 1;
    if (state.fieldOccurrenceCount > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
      throw new PdfActionDictionaryInspectionError();
    }
    validateFieldOccurrenceSignatureBudget(field, fieldType, state);

    validateFieldObjectBudget(field, state, fieldType);
    const valueBytes = field.has(PDFName.of('V'))
      ? measureNormalizedValueBytes(readObject(field, 'V'), state)
      : item.inheritedValueBytes;
    const defaultValueBytes = field.has(PDFName.of('DV'))
      ? measureNormalizedValueBytes(readObject(field, 'DV'), state)
      : item.inheritedDefaultValueBytes;
    state.fieldValueExpansionBytes += valueBytes + defaultValueBytes;
    if (
      !Number.isSafeInteger(state.fieldValueExpansionBytes)
      || state.fieldValueExpansionBytes > PDF_PRIVACY_MAX_FIELD_VALUE_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    const optionBytes = field.has(PDFName.of('Opt'))
      ? measureChoiceOptionBytes(readObject(field, 'Opt'), state)
      : item.inheritedOptionBytes;
    state.fieldOptionExpansionBytes += optionBytes;
    if (
      !Number.isSafeInteger(state.fieldOptionExpansionBytes)
      || state.fieldOptionExpansionBytes > PDF_PRIVACY_MAX_FIELD_OPTION_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    const defaultAppearanceBytes = field.has(PDFName.of('DA'))
      ? measureNormalizedValueBytes(readObject(field, 'DA'), state)
      : item.inheritedDefaultAppearanceBytes;
    state.fieldAppearanceExpansionBytes += defaultAppearanceBytes;
    if (
      !Number.isSafeInteger(state.fieldAppearanceExpansionBytes)
      || state.fieldAppearanceExpansionBytes > PDF_PRIVACY_MAX_FIELD_APPEARANCE_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    let qualifiedNameBytes = item.parentNameBytes;
    if (field.has(PDFName.of('T'))) {
      const partialName = readObject(field, 'T');
      const partialNameBytes = partialName instanceof PDFString || partialName instanceof PDFHexString
        ? partialName.asBytes().byteLength
        : 0;
      qualifiedNameBytes = item.parentNameBytes === 0
        ? partialNameBytes
        : item.parentNameBytes + 1 + partialNameBytes;
      if (!Number.isSafeInteger(qualifiedNameBytes)) {
        throw new PdfActionDictionaryInspectionError();
      }
    }
    state.fieldQualifiedNameBytes += qualifiedNameBytes;
    if (
      !Number.isSafeInteger(state.fieldQualifiedNameBytes)
      || state.fieldQualifiedNameBytes > PDF_PRIVACY_MAX_FIELD_NAME_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }

    const kids = readObject(field, 'Kids');
    if (!(kids instanceof PDFArray)) continue;
    for (let index = 0; index < kids.size(); index += 1) {
      const child = kids.get(index);
      stack.push({
        kind: 'visit',
        object: child,
        parentNameBytes: qualifiedNameBytes,
        inheritedValueBytes: valueBytes,
        inheritedDefaultValueBytes: defaultValueBytes,
        inheritedOptionBytes: optionBytes,
        inheritedDefaultAppearanceBytes: defaultAppearanceBytes,
        inheritedFieldType: fieldType,
      });
    }
  }
}

function validateFieldOccurrenceSignatureBudget(
  field: PDFDict,
  fieldType: string | undefined,
  state: InspectionState,
): void {
  if (fieldType !== 'Sig') return;
  const signature = readDictionary(field, 'V');
  const contents = signature ? readObject(signature, 'Contents') : undefined;
  if (!(contents instanceof PDFString) && !(contents instanceof PDFHexString)) return;
  state.fieldOccurrenceSignatureBytes += contents.asBytes().byteLength;
  if (
    !Number.isSafeInteger(state.fieldOccurrenceSignatureBytes)
    || state.fieldOccurrenceSignatureBytes > PDF_PRIVACY_MAX_SIGNATURE_EXPANSION_BYTES
  ) {
    throw new PdfActionDictionaryInspectionError();
  }
}

type SignatureByteRange = readonly [number, number, number, number];

function readValidSignatureByteRange(
  signature: PDFDict,
  state: InspectionState,
): SignatureByteRange | undefined {
  const byteRange = readObject(signature, 'ByteRange');
  if (!(byteRange instanceof PDFArray) || byteRange.size() !== 4) return undefined;
  const values: number[] = [];
  for (let index = 0; index < byteRange.size(); index += 1) {
    const value = resolvePdfObject(byteRange.get(index), state.document);
    if (!(value instanceof PDFNumber)) return undefined;
    const number = value.asNumber();
    if (!Number.isSafeInteger(number) || number < 0) return undefined;
    values.push(number);
  }
  const [start, firstLength, secondStart, secondLength] = values;
  if (
    start !== 0
    || firstLength <= 0
    || start + firstLength > secondStart
  ) return undefined;
  const signedEnd = secondStart + secondLength;
  if (
    !Number.isSafeInteger(signedEnd)
    || signedEnd > state.fileData.byteLength
    || state.fileData.byteLength === 0
  ) return undefined;
  return [start, firstLength, secondStart, secondLength];
}

function validateSignatureTailBudget(byteRange: SignatureByteRange, state: InspectionState): void {
  const signedEnd = byteRange[2] + byteRange[3];
  for (let index = signedEnd; index < state.fileData.byteLength; index += 1) {
    state.signatureTailBytes += 1;
    if (state.signatureTailBytes > PDF_PRIVACY_MAX_SIGNATURE_TAIL_BYTES) {
      throw new PdfActionDictionaryInspectionError();
    }
    if (!isPdfWhitespace(state.fileData[index])) break;
  }
}

function isPdfWhitespace(value: number | undefined): boolean {
  return value === 0x00
    || value === 0x09
    || value === 0x0a
    || value === 0x0c
    || value === 0x0d
    || value === 0x20;
}

function validatePageAnnotationBudget(page: PDFDict, state: InspectionState): void {
  const annotations = readObject(page, 'Annots');
  if (!(annotations instanceof PDFArray)) return;
  consumeDiscoveredSignal(state, annotations.size());
  for (let index = 0; index < annotations.size(); index += 1) {
    const annotation = resolvePdfObject(annotations.get(index), state.document);
    if (!(annotation instanceof PDFDict)) continue;
    for (const key of ['Contents', 'T', 'Subj', 'RC', 'NM', 'M', 'CreationDate']) {
      state.annotationTextExpansionBytes += measureNormalizedValueBytes(
        readObject(annotation, key),
        state,
      );
    }
    if (
      !Number.isSafeInteger(state.annotationTextExpansionBytes)
      || state.annotationTextExpansionBytes > PDF_PRIVACY_MAX_ANNOTATION_TEXT_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    for (const key of ['Rect', 'QuadPoints', 'Vertices', 'InkList', 'L', 'CL', 'RD', 'Path']) {
      state.annotationGeometryExpansionBytes += measureGeometryBytes(
        readObject(annotation, key),
        state,
      );
    }
    state.annotationGeometryExpansionBytes += measureGeometryBytes(
      readObject(annotation, 'Border'),
      state,
    );
    const borderStyle = readDictionary(annotation, 'BS');
    if (borderStyle) {
      state.annotationGeometryExpansionBytes += measureGeometryBytes(
        readObject(borderStyle, 'D'),
        state,
      );
    }
    if (
      !Number.isSafeInteger(state.annotationGeometryExpansionBytes)
      || state.annotationGeometryExpansionBytes > PDF_PRIVACY_MAX_ANNOTATION_GEOMETRY_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    state.annotationJavascriptExpansionBytes += measureAnnotationJavascriptBytes(annotation, state);
    if (
      !Number.isSafeInteger(state.annotationJavascriptExpansionBytes)
      || state.annotationJavascriptExpansionBytes
        > PDF_PRIVACY_MAX_ANNOTATION_JAVASCRIPT_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
    state.annotationTargetExpansionBytes += measureAnnotationTargetBytes(annotation, state);
    if (
      !Number.isSafeInteger(state.annotationTargetExpansionBytes)
      || state.annotationTargetExpansionBytes > PDF_PRIVACY_MAX_ANNOTATION_TARGET_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }
  }
}

function validatePageTreeAnnotationBudgets(
  document: PDFDocument,
  state: InspectionState,
): void {
  const root = document.catalog.get(PDFName.of('Pages'));
  if (!root) return;
  const stack: ({ kind: 'visit'; object: PDFObject } | { kind: 'leave'; object: PDFObject })[] = [
    { kind: 'visit', object: root },
  ];
  const path = new Set<PDFObject>();
  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) continue;
    if (frame.kind === 'leave') {
      path.delete(frame.object);
      continue;
    }
    consumeTraversalStep(state);
    const node = resolvePdfObject(frame.object, document);
    if (!(node instanceof PDFDict) || path.has(node)) continue;
    path.add(node);
    stack.push({ kind: 'leave', object: node });
    const kids = readObject(node, 'Kids');
    if (!(kids instanceof PDFArray)) {
      validatePageAnnotationBudget(node, state);
      continue;
    }
    for (let index = kids.size() - 1; index >= 0; index -= 1) {
      stack.push({ kind: 'visit', object: kids.get(index) });
    }
  }
}

function inspectJavascriptNameTreeNextActions(
  document: PDFDocument,
  state: InspectionState,
): void {
  const names = readDictionary(document.catalog, 'Names');
  const root = names ? names.get(PDFName.of('JavaScript')) : undefined;
  if (!root) return;
  const stack = [root];
  const visited = new Set<PDFObject>();
  while (stack.length > 0) {
    const rawNode = stack.pop();
    if (!rawNode) continue;
    consumeTraversalStep(state);
    const node = resolvePdfObject(rawNode, document);
    if (!(node instanceof PDFDict) || visited.has(node)) continue;
    visited.add(node);
    const entries = readObject(node, 'Names');
    if (entries instanceof PDFArray) {
      for (let index = 1; index < entries.size(); index += 2) {
        const entry = resolvePdfObject(entries.get(index), document);
        if (!(entry instanceof PDFDict)) continue;
        const javascript = readObject(entry, 'JS');
        if (readName(entry, 'S')?.decodeText() === 'JavaScript' && javascript) {
          validatePdfTextObjects(javascript, PDF_PRIVACY_MAX_JAVASCRIPT_BYTES, state);
          state.nameTreeJavascriptExpansionBytes += measurePdfTextBytes(javascript, state);
          if (
            !Number.isSafeInteger(state.nameTreeJavascriptExpansionBytes)
            || state.nameTreeJavascriptExpansionBytes
              > PDF_PRIVACY_MAX_NAMETREE_JAVASCRIPT_EXPANSION_BYTES
          ) {
            throw new PdfActionDictionaryInspectionError();
          }
        }
        const next = entry.get(PDFName.of('Next'));
        if (next) {
          inspectActionEntry(next, 'next-action', undefined, state, false, false, new Set());
        }
      }
    }
    const kids = readObject(node, 'Kids');
    if (!(kids instanceof PDFArray)) continue;
    for (let index = 0; index < kids.size(); index += 1) {
      stack.push(kids.get(index));
    }
  }
}

function measureAnnotationJavascriptBytes(
  annotation: PDFDict,
  state: InspectionState,
): number {
  let total = 0;
  const action = annotation.get(PDFName.of('A'));
  if (action) total += measureActionJavascriptChainBytes(action, state);
  const additionalActions = readDictionary(annotation, 'AA');
  if (additionalActions) {
    for (const rawAction of additionalActions.asMap().values()) {
      total += measureActionJavascriptChainBytes(rawAction, state);
    }
  }
  if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  return total;
}

function measureAnnotationTargetBytes(
  annotation: PDFDict,
  state: InspectionState,
): number {
  let total = 0;
  const action = annotation.get(PDFName.of('A'));
  if (action) total += measureActionTargetChainBytes(action, state);
  const additionalActions = readDictionary(annotation, 'AA');
  if (additionalActions) {
    for (const rawAction of additionalActions.asMap().values()) {
      total += measureActionTargetChainBytes(rawAction, state);
    }
  }
  if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  return total;
}

function measureActionTargetChainBytes(
  root: PDFObject,
  state: InspectionState,
): number {
  const stack: { object: PDFObject; depth: number }[] = [{ object: root, depth: 0 }];
  const visited = new Set<PDFObject>();
  let total = 0;
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    if (item.depth > PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH) {
      throw new PdfActionDictionaryInspectionError();
    }
    consumeTraversalStep(state);
    const object = resolvePdfObject(item.object, state.document);
    if (!object || visited.has(object)) continue;
    visited.add(object);
    if (object instanceof PDFArray) {
      for (let index = 0; index < object.size(); index += 1) {
        stack.push({ object: object.get(index), depth: item.depth + 1 });
      }
      continue;
    }
    if (!(object instanceof PDFDict)) continue;
    total += measureTargetBytes(object, state.document);
    const next = object.get(PDFName.of('Next'));
    if (next) stack.push({ object: next, depth: item.depth + 1 });
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  return total;
}

function measureActionJavascriptChainBytes(
  root: PDFObject,
  state: InspectionState,
): number {
  const stack: { object: PDFObject; depth: number }[] = [{ object: root, depth: 0 }];
  const visited = new Set<PDFObject>();
  let total = 0;
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    if (item.depth > PDF_PRIVACY_MAX_ACTION_CHAIN_DEPTH) {
      throw new PdfActionDictionaryInspectionError();
    }
    consumeTraversalStep(state);
    const object = resolvePdfObject(item.object, state.document);
    if (!object || visited.has(object)) continue;
    visited.add(object);
    if (object instanceof PDFArray) {
      for (let index = 0; index < object.size(); index += 1) {
        stack.push({ object: object.get(index), depth: item.depth + 1 });
      }
      continue;
    }
    if (!(object instanceof PDFDict)) continue;
    if (readName(object, 'S')?.decodeText() === 'JavaScript') {
      const javascript = readObject(object, 'JS');
      if (javascript) {
        validatePdfTextObjects(javascript, PDF_PRIVACY_MAX_JAVASCRIPT_BYTES, state);
        total += measurePdfTextBytes(javascript, state);
      }
    }
    const next = object.get(PDFName.of('Next'));
    if (next) stack.push({ object: next, depth: item.depth + 1 });
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  return total;
}

function measureTargetBytes(
  dictionary: PDFDict,
  document: PDFDocument,
  depth = 0,
): number {
  if (depth > 4) return 0;
  for (const key of ['F', 'UF', 'URI', 'N', 'D']) {
    const rawValue = dictionary.get(PDFName.of(key));
    if (!rawValue) continue;
    const value = resolvePdfObject(rawValue, document);
    if (value instanceof PDFString || value instanceof PDFHexString) {
      return value.asBytes().byteLength;
    }
    if (value instanceof PDFName) return value.sizeInBytes();
    if (value instanceof PDFDict) {
      const nestedBytes = measureTargetBytes(value, document, depth + 1);
      if (nestedBytes > 0) return nestedBytes;
    }
  }
  return 0;
}

function validateOutlineBudget(document: PDFDocument, state: InspectionState): void {
  const outlines = readDictionary(document.catalog, 'Outlines');
  const first = outlines?.get(PDFName.of('First'));
  if (!first) return;

  const stack = [first];
  const visitedReferences = new Set<PDFRef>();
  const visitedItems = new Set<PDFDict>();
  while (stack.length > 0) {
    const rawItem = stack.pop();
    if (!rawItem) continue;
    consumeTraversalStep(state);

    if (rawItem instanceof PDFRef) {
      if (visitedReferences.has(rawItem)) continue;
      visitedReferences.add(rawItem);
    }
    const item = resolvePdfObject(rawItem, document);
    if (!(item instanceof PDFDict) || visitedItems.has(item)) continue;
    visitedItems.add(item);
    consumeDiscoveredSignal(state);

    state.outlineValueExpansionBytes += measureNormalizedValueBytes(
      readObject(item, 'Title'),
      state,
    );
    state.outlineValueExpansionBytes += measureNormalizedValueBytes(
      readObject(item, 'Dest'),
      state,
    );
    const action = readDictionary(item, 'A');
    if (action) {
      state.outlineValueExpansionBytes += measureTargetBytes(action, state.document);
    }
    if (
      !Number.isSafeInteger(state.outlineValueExpansionBytes)
      || state.outlineValueExpansionBytes > PDF_PRIVACY_MAX_OUTLINE_VALUE_EXPANSION_BYTES
    ) {
      throw new PdfActionDictionaryInspectionError();
    }

    const next = item.get(PDFName.of('Next'));
    const child = item.get(PDFName.of('First'));
    if (next) stack.push(next);
    if (child) stack.push(child);
  }
}

function measureNormalizedValueBytes(
  root: PDFObject | undefined,
  state: InspectionState,
): number {
  if (!root) return 0;
  const stack = [root];
  const visitedContainers = new Set<PDFObject>();
  let total = 0;
  while (stack.length > 0) {
    const rawValue = stack.pop();
    if (!rawValue) continue;
    consumeTraversalStep(state);
    const value = resolvePdfObject(rawValue, state.document);
    if (value instanceof PDFString || value instanceof PDFHexString) {
      total += value.asBytes().byteLength;
    } else if (value instanceof PDFName) {
      total += value.sizeInBytes();
    } else if (value instanceof PDFArray && !visitedContainers.has(value)) {
      visitedContainers.add(value);
      for (let index = 0; index < value.size(); index += 1) {
        stack.push(value.get(index));
      }
    }
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  return total;
}

function measureChoiceOptionBytes(
  root: PDFObject | undefined,
  state: InspectionState,
): number {
  if (!(root instanceof PDFArray)) return 0;
  let total = 0;
  for (let index = 0; index < root.size(); index += 1) {
    total += NORMALIZED_CHOICE_OPTION_OVERHEAD_BYTES;
    total += measureNormalizedValueBytes(root.get(index), state);
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  return total;
}

function measureGeometryBytes(
  root: PDFObject | undefined,
  state: InspectionState,
): number {
  if (!root) return 0;
  const resolvedRoot = resolvePdfObject(root, state.document);
  if (!resolvedRoot) return 0;
  const cached = state.geometryExpansionSizes.get(resolvedRoot);
  if (cached !== undefined) return cached;
  const stack = [resolvedRoot];
  const visitedContainers = new Set<PDFObject>();
  let total = 0;
  while (stack.length > 0) {
    const rawValue = stack.pop();
    if (!rawValue) continue;
    consumeTraversalStep(state);
    const value = resolvePdfObject(rawValue, state.document);
    if (value instanceof PDFNumber) {
      total += NORMALIZED_GEOMETRY_NUMBER_BYTES;
    } else if (value instanceof PDFArray && !visitedContainers.has(value)) {
      visitedContainers.add(value);
      total += NORMALIZED_GEOMETRY_ARRAY_OVERHEAD_BYTES;
      for (let index = 0; index < value.size(); index += 1) {
        stack.push(value.get(index));
      }
    }
    if (!Number.isSafeInteger(total)) throw new PdfActionDictionaryInspectionError();
  }
  state.geometryExpansionSizes.set(resolvedRoot, total);
  return total;
}

function readEmbeddedFileBytes(stream: PDFStream): number | undefined {
  return stream.dict.has(PDFName.of('Filter')) ? undefined : stream.getContentsSize();
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
  const expandedBytes = state.fieldJavascriptBytes * Math.max(
    1,
    state.fieldObjectCount,
    state.fieldOccurrenceCount,
  );
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

function consumeDiscoveredSignal(state: InspectionState, count = 1): void {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new PdfActionDictionaryInspectionError();
  }
  state.discoveredSignals += count;
  if (
    !Number.isSafeInteger(state.discoveredSignals)
    || state.discoveredSignals > PDF_PRIVACY_MAX_DISCOVERED_ITEMS
  ) {
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
