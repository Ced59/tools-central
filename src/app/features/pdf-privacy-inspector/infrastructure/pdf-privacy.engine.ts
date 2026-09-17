import {
  PDF_PRIVACY_MAX_DISCOVERED_ITEMS,
  PDF_PRIVACY_MAX_PAGES,
  buildPdfPrivacyReport,
  sanitizePdfPrivacyValue,
  type PdfPrivacyFinding,
  type PdfPrivacyFindingMessage,
  type PdfPrivacyReport,
} from '../domain/pdf-privacy.models';
import type {
  PdfActionDictionarySignal,
  PdfAssociatedFileSignal,
  PdfStructuralSignatureSignal,
} from './pdf-action-dictionary.engine';

export type PdfPrivacyEngineFailureCode = 'invalid-pdf' | 'too-many-pages' | 'inspection-limit';

export class PdfPrivacyEngineError extends Error {
  constructor(readonly code: PdfPrivacyEngineFailureCode) {
    super(code);
  }
}

export const PDF_PRIVACY_MAX_PDFJS_OUTPUT_BYTES = 32 * 1_024 * 1_024;
const PDF_PRIVACY_MAX_PDFJS_OUTPUT_NODES = 1_000_000;

/**
 * Applies a document-wide bound to values materialized by PDF.js after it has
 * decrypted filtered streams. Object identity is retained across calls so a
 * shared value is charged once, while repeated occurrences still consume the
 * existing discovery budgets when they are normalized into findings.
 */
export class PdfJsDecryptedOutputBudget {
  private consumedBytes = 0;
  private enqueuedNodes = 0;
  private readonly visited = new WeakSet();

  constructor(private readonly maxBytes = PDF_PRIVACY_MAX_PDFJS_OUTPUT_BYTES) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new PdfPrivacyEngineError('inspection-limit');
    }
  }

  consume(value: unknown): void {
    const stack: unknown[] = [];
    const enqueue = (item: unknown): void => {
      this.enqueuedNodes += 1;
      if (this.enqueuedNodes > PDF_PRIVACY_MAX_PDFJS_OUTPUT_NODES) {
        throw new PdfPrivacyEngineError('inspection-limit');
      }
      stack.push(item);
    };
    enqueue(value);

    while (stack.length > 0) {
      const current = stack.pop();
      if (typeof current === 'string') {
        this.addBytes(current.length * 2);
        continue;
      }
      if (typeof current === 'number' || typeof current === 'bigint') {
        this.addBytes(8);
        continue;
      }
      if (typeof current === 'boolean') {
        this.addBytes(1);
        continue;
      }
      if ((typeof current !== 'object' && typeof current !== 'function') || current === null) {
        continue;
      }
      if (this.visited.has(current)) continue;
      this.visited.add(current);

      if (current instanceof ArrayBuffer) {
        this.addBytes(current.byteLength);
        continue;
      }
      if (ArrayBuffer.isView(current)) {
        this.addBytes(current.byteLength);
        continue;
      }
      if (current instanceof Map) {
        for (const [key, entry] of current) {
          enqueue(key);
          enqueue(entry);
        }
        continue;
      }
      if (current instanceof Set) {
        for (const entry of current) enqueue(entry);
        continue;
      }

      const iterator = (current as { [Symbol.iterator]?: () => Iterator<unknown> })[
        Symbol.iterator
      ];
      if (typeof iterator === 'function') {
        const values = iterator.call(current);
        for (let next = values.next(); !next.done; next = values.next()) enqueue(next.value);
        continue;
      }

      for (const key of Reflect.ownKeys(current)) {
        if (typeof key === 'string') this.addBytes(key.length * 2);
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (descriptor && 'value' in descriptor) enqueue(descriptor.value);
      }
    }
  }

  private addBytes(bytes: number): void {
    this.consumedBytes += bytes;
    if (!Number.isSafeInteger(this.consumedBytes) || this.consumedBytes > this.maxBytes) {
      throw new PdfPrivacyEngineError('inspection-limit');
    }
  }
}

export interface PdfJsPrivacyMetadata {
  info: object;
  metadata: Iterable<readonly [string, unknown]> | null;
}

export interface PdfJsPrivacyPage {
  getAnnotations(options?: { intent?: string }): Promise<readonly object[]>;
  getJSActions(): Promise<Map<unknown, unknown> | null>;
  cleanup(): void;
}

export interface PdfJsPrivacyDocument {
  numPages: number;
  isPureXfa?: boolean;
  getMetadata(): Promise<PdfJsPrivacyMetadata>;
  getAttachments(): Promise<Map<string, object> | null>;
  getJSActions(): Promise<Map<unknown, unknown> | null>;
  hasJSActions(): Promise<boolean>;
  getFieldObjects(): Promise<Map<string, readonly object[]> | null>;
  getSignatures(): Promise<readonly object[] | null>;
  getPermissions(): Promise<Set<number> | null>;
  getOpenAction(): Promise<Map<unknown, unknown> | null>;
  getOutline(): Promise<readonly object[] | null>;
  getPage(pageNumber: number): Promise<PdfJsPrivacyPage>;
}

interface LinkAggregate {
  url: string;
  occurrences: number;
  pages: Set<number>;
  source: 'annotation' | 'outline';
}

interface ActionDictionaryIndex {
  targets: Set<string>;
  targetlessAnnotationTriggerIds: Set<string>;
  targetlessOutlineExternalActions: number;
  fieldJavascriptOccurrences: number;
  pageJavascriptOccurrences: number;
}

type ConsumeDiscoveryBudget = (count?: number) => void;

const INFO_METADATA_KEYS = new Set([
  'title', 'author', 'subject', 'keywords', 'creator', 'producer',
  'creationdate', 'moddate', 'trapped',
]);

const PDFJS_EXTERNAL_TARGET_ACTIONS = new Set(['Launch', 'GoToR']);

// Stable values from PDF.js' public AnnotationType contract. Keeping the
// mapping local avoids loading the full display bundle in the inspection
// engine and makes the worker-facing data shapes explicit.
const PDFJS_INTERACTIVE_ANNOTATION_TYPES = new Map<number,
  | 'interactive-sound'
  | 'interactive-video'
  | 'interactive-screen'
  | 'interactive-3d'
  | 'rich-media'
>([
  [18, 'interactive-sound'],
  [19, 'interactive-video'],
  [21, 'interactive-screen'],
  [25, 'interactive-3d'],
  [27, 'rich-media'],
]);

export function extractPdfVersion(data: Uint8Array): string {
  const prefix = new TextDecoder('latin1').decode(data.subarray(0, Math.min(data.byteLength, 1_024)));
  const match = prefix.match(/%PDF-(1\.[0-7]|2\.0)/u);
  if (!match) throw new PdfPrivacyEngineError('invalid-pdf');
  return match[1];
}

export async function inspectPdfPrivacyDocument(
  document: PdfJsPrivacyDocument,
  input: {
    headerData: Uint8Array;
    fileBytes: number;
    passwordUsed: boolean;
    actionDictionaries?: readonly PdfActionDictionarySignal[] | null;
    associatedFiles?: readonly PdfAssociatedFileSignal[] | null;
    structuralEncrypted?: boolean;
    structuralSignatures?: readonly PdfStructuralSignatureSignal[] | null;
    onProgress?: (percent: number) => void;
  },
): Promise<PdfPrivacyReport> {
  const headerPdfVersion = extractPdfVersion(input.headerData);
  if (!Number.isSafeInteger(document.numPages) || document.numPages <= 0) {
    throw new PdfPrivacyEngineError('invalid-pdf');
  }
  if (document.numPages > PDF_PRIVACY_MAX_PAGES) {
    throw new PdfPrivacyEngineError('too-many-pages');
  }

  const structuralAttachmentsAvailable = input.associatedFiles !== null
    && input.associatedFiles !== undefined;
  const decryptedOutputBudget = new PdfJsDecryptedOutputBudget();
  input.onProgress?.(8);
  const metadata = await document.getMetadata();
  decryptedOutputBudget.consume(metadata);
  const attachments = !structuralAttachmentsAvailable || input.structuralEncrypted === true
    ? await document.getAttachments()
    : null;
  decryptedOutputBudget.consume(attachments);
  const documentActions = await document.getJSActions();
  decryptedOutputBudget.consume(documentActions);
  const hasJavascript = await document.hasJSActions();
  decryptedOutputBudget.consume(hasJavascript);
  const fields = await document.getFieldObjects();
  decryptedOutputBudget.consume(fields);
  const signatures = await document.getSignatures();
  decryptedOutputBudget.consume(signatures);
  const permissions = await document.getPermissions();
  decryptedOutputBudget.consume(permissions);
  const openAction = await document.getOpenAction();
  decryptedOutputBudget.consume(openAction);
  const outline = await document.getOutline();
  decryptedOutputBudget.consume(outline);
  const pdfVersion = effectivePdfVersion(metadata.info) ?? headerPdfVersion;
  input.onProgress?.(20);

  const findings: PdfPrivacyFinding[] = [];
  const links = new Map<string, LinkAggregate>();
  const consumeDiscoveryBudget = createDiscoveryBudget();
  const add = (finding: PdfPrivacyFinding): void => {
    findings.push(finding);
    if (findings.length > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
      throw new PdfPrivacyEngineError('inspection-limit');
    }
  };
  const actionIndex = collectActionDictionarySignals(
    input.actionDictionaries,
    add,
    consumeDiscoveryBudget,
  );
  const associatedFiles = structuralAttachmentsAvailable && input.structuralEncrypted === true
    ? mergeDecryptedAttachmentMetadata(input.associatedFiles ?? [], attachments)
    : input.associatedFiles;
  collectAssociatedFileSignals(
    associatedFiles,
    add,
    consumeDiscoveryBudget,
  );

  collectMetadata(metadata, add, consumeDiscoveryBudget);
  if (!structuralAttachmentsAvailable) {
    collectAttachments(attachments, add, consumeDiscoveryBudget);
  }
  const documentActionCount = collectJavascriptActions(
    documentActions,
    'document',
    add,
    consumeDiscoveryBudget,
  );
  const formActionCount = collectForms(
    fields,
    Boolean(document.isPureXfa) || hasXfaMetadata(metadata.info),
    actionIndex?.fieldJavascriptOccurrences ?? 0,
    add,
    consumeDiscoveryBudget,
  );
  collectOpenAction(openAction, add, consumeDiscoveryBudget);
  collectSignatures(
    mergeSignatureInventories(
      signatures,
      input.structuralSignatures,
      input.passwordUsed || permissions !== null,
    ),
    add,
    consumeDiscoveryBudget,
  );
  collectOutlineItems(outline ?? [], links, actionIndex, add, consumeDiscoveryBudget);

  let pageActionCount = actionIndex?.pageJavascriptOccurrences ?? 0;
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    try {
      const annotations = await page.getAnnotations({ intent: 'any' });
      decryptedOutputBudget.consume(annotations);
      const pageActions = await page.getJSActions();
      decryptedOutputBudget.consume(pageActions);
      collectPageAnnotations(
        annotations,
        pageNumber,
        links,
        actionIndex,
        structuralAttachmentsAvailable,
        add,
        consumeDiscoveryBudget,
      );
      pageActionCount += collectJavascriptActions(
        pageActions,
        `page:${String(pageNumber)}`,
        add,
        consumeDiscoveryBudget,
        pageNumber,
        actionIndex,
      );
    } finally {
      page.cleanup();
    }
    input.onProgress?.(20 + Math.round(pageNumber / document.numPages * 72));
  }

  if (
    hasJavascript
    && documentActionCount === 0
    && formActionCount === 0
    && pageActionCount === 0
  ) {
    add({
      id: 'javascript:forms:detected',
      category: 'active-content',
      kind: 'javascript',
      severity: 'high',
      message: { code: 'form-actions-undetailed' },
      occurrences: 1,
    });
  }

  for (const [key, link] of links) {
    const pageNumber = link.pages.size === 1 ? [...link.pages][0] : undefined;
    add({
      id: `link:${key}`,
      category: 'links',
      kind: 'external-link',
      severity: 'medium',
      message: { code: link.source === 'outline' ? 'outline-link' : 'annotation-link' },
      value: link.url,
      pageNumber,
      occurrences: link.occurrences,
    });
  }

  const encrypted = permissions !== null || input.passwordUsed;
  if (encrypted) {
    add({
      id: 'encryption',
      category: 'encryption',
      kind: 'encryption',
      severity: 'info',
      message: permissions
        ? { code: 'document-permissions', count: permissions.size }
        : { code: 'document-password' },
    });
  }

  input.onProgress?.(98);
  return buildPdfPrivacyReport({
    pdfVersion,
    pageCount: document.numPages,
    inspectedPages: document.numPages,
    fileBytes: input.fileBytes,
    encrypted,
    passwordUsed: input.passwordUsed,
    findings,
  });
}

function collectMetadata(
  metadata: PdfJsPrivacyMetadata,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  for (const [key, rawValue] of objectEntries(metadata.info)) {
    consume();
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === 'custom' && isObject(rawValue)) {
      collectCustomInfoMetadata(rawValue, add, consume);
      continue;
    }
    if (!INFO_METADATA_KEYS.has(normalizedKey)) continue;
    const value = readableValue(rawValue);
    if (!value) continue;
    add({
      id: `metadata:info:${normalizedKey}`,
      category: 'metadata',
      kind: 'document-metadata',
      severity: 'low',
      label: key,
      value,
    });
  }

  if (!metadata.metadata) return;
  for (const [key, rawValue] of metadata.metadata) {
    consume();
    const normalizedKey = key.toLowerCase();
    const value = readableValue(rawValue);
    if (!value) continue;
    add({
      id: `metadata:xmp:${normalizedKey}`,
      category: 'metadata',
      kind: 'xmp-metadata',
      severity: 'low',
      label: key,
      value,
    });
  }
}

function collectCustomInfoMetadata(
  custom: object,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  let index = 0;
  for (const [key, rawValue] of objectEntries(custom)) {
    consume();
    const value = readableValue(rawValue);
    if (!value) continue;
    index += 1;
    add({
      id: `metadata:info:custom:${String(index)}`,
      category: 'metadata',
      kind: 'document-metadata',
      severity: 'low',
      label: sanitizePdfPrivacyValue(key) ?? 'Custom',
      value,
    });
  }
}

function collectAttachments(
  attachments: Map<string, object> | null,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  if (!attachments) return;
  let index = 0;
  for (const [key, rawAttachment] of attachments) {
    consume();
    index += 1;
    const attachment = asRecord(rawAttachment);
    const fileName = readableValue(attachment?.['filename']) ?? sanitizePdfPrivacyValue(key);
    const description = readableValue(attachment?.['description']);
    const contentType = readableValue(attachment?.['contentType']);
    const content = attachment?.['content'];
    const bytes = ArrayBuffer.isView(content) ? content.byteLength : undefined;
    add({
      id: `attachment:${String(index)}:${fileName ?? ''}`,
      category: 'attachments',
      kind: 'embedded-file',
      severity: 'high',
      label: fileName,
      message: fileName ? undefined : { code: 'unnamed-attachment', index },
      value: [contentType, description].filter(Boolean).join(' · ') || undefined,
      bytes,
    });
  }
}

interface DecryptedAttachmentMetadata {
  fileName?: string;
  description?: string;
  contentType?: string;
}

function mergeDecryptedAttachmentMetadata(
  signals: readonly PdfAssociatedFileSignal[],
  attachments: Map<string, object> | null,
): readonly PdfAssociatedFileSignal[] {
  if (!attachments || attachments.size === 0) return signals;
  const metadata = [...attachments].map(([key, rawAttachment]): DecryptedAttachmentMetadata => {
    const attachment = asRecord(rawAttachment);
    return {
      fileName: readableValue(attachment?.['filename']) ?? sanitizePdfPrivacyValue(key),
      description: readableValue(attachment?.['description']),
      contentType: readableValue(attachment?.['contentType']),
    };
  });
  const usedMetadata = new Set<number>();
  const merged = signals.map(signal => {
    const signalFileName = sanitizePdfPrivacyValue(signal.fileName);
    let metadataIndex = signalFileName
      ? metadata.findIndex((item, index) => (
        !usedMetadata.has(index) && item.fileName === signalFileName
      ))
      : -1;
    if (metadataIndex < 0 && !signalFileName) {
      const signalContentType = sanitizePdfPrivacyValue(signal.contentType);
      metadataIndex = metadata.findIndex((item, index) => (
        !usedMetadata.has(index)
        && (!signalContentType || item.contentType === signalContentType)
      ));
    }
    if (metadataIndex < 0) return signal;
    usedMetadata.add(metadataIndex);
    const decrypted = metadata[metadataIndex];
    return {
      ...signal,
      fileName: signalFileName ?? decrypted.fileName,
      description: sanitizePdfPrivacyValue(signal.description) ?? decrypted.description,
      contentType: sanitizePdfPrivacyValue(signal.contentType) ?? decrypted.contentType,
    };
  });
  let nextId = signals.reduce((maximum, signal) => (
    Number.isSafeInteger(signal.id) ? Math.max(maximum, signal.id) : maximum
  ), 0);
  for (const [index, decrypted] of metadata.entries()) {
    if (usedMetadata.has(index)) continue;
    nextId += 1;
    merged.push({ id: nextId, ...decrypted, occurrences: 1 });
  }
  return merged;
}

function collectAssociatedFileSignals(
  signals: readonly PdfAssociatedFileSignal[] | null | undefined,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): boolean {
  if (signals === null || signals === undefined) return false;
  for (const signal of signals) {
    const occurrences = Number.isSafeInteger(signal.occurrences) && signal.occurrences > 0
      ? signal.occurrences
      : 1;
    consume(occurrences);
    const fileName = sanitizePdfPrivacyValue(signal.fileName);
    const description = sanitizePdfPrivacyValue(signal.description);
    const contentType = sanitizePdfPrivacyValue(signal.contentType);
    add({
      id: `attachment:associated:${String(signal.id)}`,
      category: 'attachments',
      kind: 'embedded-file',
      severity: 'high',
      label: fileName,
      message: fileName ? undefined : { code: 'unnamed-attachment', index: signal.id },
      value: [contentType, description].filter(Boolean).join(' · ') || undefined,
      bytes: Number.isSafeInteger(signal.bytes) && (signal.bytes ?? -1) >= 0
        ? signal.bytes
        : undefined,
      occurrences,
    });
  }
  return true;
}

function collectJavascriptActions(
  actions: Map<unknown, unknown> | null,
  scope: string,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
  pageNumber?: number,
  actionIndex?: ActionDictionaryIndex | null,
): number {
  if (!actions) return 0;
  let count = 0;
  for (const [rawEvent, payload] of actions) {
    const event = sanitizePdfPrivacyValue(rawEvent) ?? 'Action';
    let occurrences = Math.max(1, Array.isArray(payload) ? payload.length : 1);
    if (actionIndex && actionIndex.pageJavascriptOccurrences > 0) {
      const duplicates = Math.min(occurrences, actionIndex.pageJavascriptOccurrences);
      occurrences -= duplicates;
      actionIndex.pageJavascriptOccurrences -= duplicates;
    }
    if (occurrences === 0) continue;
    consume(occurrences);
    count += occurrences;
    add({
      id: `javascript:${scope}:${event}`,
      category: 'active-content',
      kind: 'javascript',
      severity: 'high',
      label: event,
      pageNumber,
      occurrences,
    });
  }
  return count;
}

function collectOpenAction(
  action: Map<unknown, unknown> | null,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  if (!action) return;
  consume(Math.max(1, action.size));
  if (!action.has('action')) return;
  const actionName = sanitizePdfPrivacyValue(action.get('action'));
  add({
    id: `automatic:open:${actionName ?? 'unknown'}`,
    category: 'active-content',
    kind: 'automatic-action',
    severity: 'high',
    message: { code: 'open-action' },
    value: actionName,
  });
}

function collectForms(
  fields: Map<string, readonly object[]> | null,
  xfaPresent: boolean,
  structurallyReportedActionCount: number,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): number {
  let fieldCount = 0;
  let populatedCount = 0;
  let actionCount = 0;
  if (fields) {
    for (const controls of fields.values()) {
      consume(Math.max(1, controls.length));
      const logicalFields = groupLogicalFieldControls(controls);
      fieldCount += logicalFields.length;
      for (const logicalField of logicalFields) {
        let populated = false;
        const actionIdentities = new Map<string, Set<string>>();
        let hasUndetailedActions = false;
        for (const control of logicalField) {
          if (hasStoredFieldValue(control)) {
            populated = true;
          }
          const hasDetailedActions = collectActionIdentities(
            control['actions'],
            actionIdentities,
            consume,
          );
          if (control['hasJSActions'] === true && !hasDetailedActions) {
            hasUndetailedActions = true;
          }
        }
        const detailedActionCount = [...actionIdentities.values()]
          .reduce((count, payloads) => count + payloads.size, 0);
        actionCount += detailedActionCount + (hasUndetailedActions ? 1 : 0);
        if (populated) populatedCount += 1;
      }
    }
  }
  if (fieldCount > 0) {
    add({
      id: 'forms:acroform',
      category: 'forms',
      kind: 'form-fields',
      severity: populatedCount > 0 ? 'medium' : 'low',
      message: { code: 'acroform-summary', fieldCount, populatedCount },
      occurrences: fieldCount,
    });
  }
  const unreportedActionCount = Math.max(0, actionCount - structurallyReportedActionCount);
  if (unreportedActionCount > 0) {
    add({
      id: 'javascript:forms',
      category: 'active-content',
      kind: 'javascript',
      severity: 'high',
      message: { code: 'form-actions' },
      occurrences: unreportedActionCount,
    });
  }
  if (xfaPresent) {
    add({
      id: 'forms:xfa',
      category: 'forms',
      kind: 'xfa-form',
      severity: 'medium',
      message: { code: 'xfa-form' },
    });
  }
  return Math.max(actionCount, structurallyReportedActionCount);
}

function collectSignatures(
  signatures: readonly object[] | null | undefined,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  if (!signatures) return;
  signatures.forEach((rawSignature, index) => {
    consume();
    const signature = asRecord(rawSignature);
    const signer = readableValue(signature?.['signerName']);
    const fieldName = readableValue(signature?.['fieldName']);
    const subFilter = readableValue(signature?.['subFilter']);
    const contactInfo = readableValue(signature?.['contactInfo']);
    const location = readableValue(signature?.['location']);
    const reason = readableValue(signature?.['reason']);
    const signingTime = readableValue(signature?.['signingTime']);
    const coversWholeDocument = signature?.['coversWholeDocument'];
    const modifications = finiteNumber(signature?.['modificationsAfterSignature']);
    const containsPrivateMetadata = [fieldName, signer, contactInfo, location, reason, signingTime]
      .some(value => value !== undefined);
    add({
      id: `signature:${String(index + 1)}:${fieldName ?? ''}`,
      category: 'signatures',
      kind: 'digital-signature',
      severity: containsPrivateMetadata ? 'low' : 'info',
      label: fieldName,
      value: signer,
      message: {
        code: 'signature-details',
        index: index + 1,
        subFilter,
        contactInfo,
        location,
        reason,
        signingTime,
        coversWholeDocument: typeof coversWholeDocument === 'boolean'
          ? coversWholeDocument
          : undefined,
        modifications: modifications && modifications > 0 ? modifications : undefined,
      },
    });
  });
}

function mergeSignatureInventories(
  pdfJsSignatures: readonly object[] | null | undefined,
  structuralSignatures: readonly PdfStructuralSignatureSignal[] | null | undefined,
  encrypted: boolean,
): readonly object[] | null {
  if (!pdfJsSignatures?.length) return structuralSignatures ?? null;
  if (!structuralSignatures?.length) return pdfJsSignatures;

  const structuralUsed = structuralSignatures.map(() => false);
  const structuralByFieldName = new Map<string, { indices: number[]; cursor: number }>();
  const unnamedStructuralIndices: number[] = [];
  let unnamedStructuralCursor = 0;
  structuralSignatures.forEach((signature, index) => {
    const fieldName = readableValue(signature.fieldName);
    if (!fieldName) {
      unnamedStructuralIndices.push(index);
      return;
    }
    const matches = structuralByFieldName.get(fieldName);
    if (matches) {
      matches.indices.push(index);
    } else {
      structuralByFieldName.set(fieldName, { indices: [index], cursor: 0 });
    }
  });
  const merged = pdfJsSignatures.map(pdfJsSignature => {
    const pdfJsRecord = asRecord(pdfJsSignature);
    const fieldName = readableValue(pdfJsRecord?.['fieldName']);
    let structuralIndex: number | undefined;
    if (fieldName) {
      const matches = structuralByFieldName.get(fieldName);
      if (matches && matches.cursor < matches.indices.length) {
        structuralIndex = matches.indices[matches.cursor];
        matches.cursor += 1;
      } else if (encrypted && unnamedStructuralCursor < unnamedStructuralIndices.length) {
        structuralIndex = unnamedStructuralIndices[unnamedStructuralCursor];
        unnamedStructuralCursor += 1;
      }
    } else if (unnamedStructuralCursor < unnamedStructuralIndices.length) {
      structuralIndex = unnamedStructuralIndices[unnamedStructuralCursor];
      unnamedStructuralCursor += 1;
    }
    if (structuralIndex === undefined) return pdfJsSignature;
    structuralUsed[structuralIndex] = true;

    const combined: Record<string, unknown> = { ...structuralSignatures[structuralIndex] };
    if (pdfJsRecord) {
      for (const [key, value] of Object.entries(pdfJsRecord)) {
        if (value !== undefined && value !== null) combined[key] = value;
      }
    }
    return combined;
  });
  structuralSignatures.forEach((signature, index) => {
    if (!structuralUsed[index]) merged.push(signature);
  });
  return merged;
}

function collectOutlineItems(
  nodes: readonly object[],
  links: Map<string, LinkAggregate>,
  actionIndex: ActionDictionaryIndex | null,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  const queue = [...nodes];
  if (queue.length > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfPrivacyEngineError('inspection-limit');
  }
  let cursor = 0;
  let index = 0;
  while (cursor < queue.length) {
    const node = asRecord(queue[cursor]);
    cursor += 1;
    if (!node) continue;
    index += 1;
    consume();
    collectPdfJsActionShape(
      node,
      `outline:${String(index)}`,
      undefined,
      links,
      actionIndex,
      add,
    );
    const children = node['items'];
    if (Array.isArray(children)) {
      for (const child of children) {
        if (!isObject(child)) continue;
        if (queue.length >= PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
          throw new PdfPrivacyEngineError('inspection-limit');
        }
        queue.push(child);
      }
    }
  }
}

function collectPageAnnotations(
  annotations: readonly object[],
  pageNumber: number,
  links: Map<string, LinkAggregate>,
  actionIndex: ActionDictionaryIndex | null,
  structuralAttachmentsAvailable: boolean,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  for (const rawAnnotation of annotations) {
    consume();
    const annotation = asRecord(rawAnnotation);
    if (!annotation) continue;
    const annotationId = readableValue(annotation['id']) ?? 'unknown';
    collectPdfJsActionShape(
      annotation,
      `annotation:${String(pageNumber)}:${annotationId}`,
      pageNumber,
      links,
      actionIndex,
      add,
    );

    const annotationType = finiteNumber(annotation['annotationType']);
    const interactiveCode = annotationType === undefined
      ? undefined
      : PDFJS_INTERACTIVE_ANNOTATION_TYPES.get(annotationType);
    if (interactiveCode && !asRecord(annotation['richMedia'])) {
      addAutomaticAction(
        `interactive:${String(pageNumber)}:${annotationId}`,
        { code: interactiveCode },
        undefined,
        pageNumber,
        add,
      );
    }

    const file = asRecord(annotation['file']);
    if (file && !structuralAttachmentsAvailable) {
      const fileName = readableValue(file['filename']);
      const content = file['content'];
      add({
        id: `attachment:annotation:${String(pageNumber)}:${fileName ?? 'unknown'}`,
        category: 'attachments',
        kind: 'embedded-file',
        severity: 'high',
        label: fileName,
        message: fileName ? undefined : { code: 'annotated-attachment' },
        pageNumber,
        bytes: ArrayBuffer.isView(content) ? content.byteLength : undefined,
      });
    }
  }
}

function collectPdfJsActionShape(
  item: Record<string, unknown>,
  contextId: string,
  pageNumber: number | undefined,
  links: Map<string, LinkAggregate>,
  actionIndex: ActionDictionaryIndex | null,
  add: (finding: PdfPrivacyFinding) => void,
): void {
  const source = contextId.startsWith('outline:') ? 'outline' : 'annotation';
  const triggerId = readableValue(item['id']);
  const url = readableValue(item['url']);
  const unsafeUrl = readableValue(item['unsafeUrl']);
  if (url) {
    addLink(links, url, pageNumber, source);
  } else if (unsafeUrl) {
    const target = sanitizePdfPrivacyValue(unsafeUrl);
    if (!target || !consumeMatchingDictionaryAction(actionIndex, target, source, triggerId)) {
      addAutomaticAction(
        `external-target:${contextId}`,
        { code: 'unsafe-external-target' },
        redactUnsafeTarget(unsafeUrl),
        pageNumber,
        add,
      );
    }
  }

  // PDF.js exposes Named actions through `action`; Launch and GoToR targets
  // are represented by url/unsafeUrl instead of their original action name.
  const namedAction = readableValue(item['action']);
  if (namedAction) {
    addAutomaticAction(
      `named:${contextId}:${namedAction}`,
      { code: 'named-action' },
      namedAction,
      pageNumber,
      add,
    );
  }

  const attachment = asRecord(item['attachment']);
  if (attachment) {
    const fileName = readableValue(attachment['filename'])
      ?? readableValue(attachment['name']);
    addAutomaticAction(
      `attachment-target:${contextId}:${fileName ?? 'unknown'}`,
      { code: 'attachment-opening' },
      fileName,
      pageNumber,
      add,
    );
  }

  const richMedia = asRecord(item['richMedia']);
  if (richMedia) {
    const fileName = readableValue(richMedia['filename']);
    const contentType = readableValue(richMedia['contentType']);
    addAutomaticAction(
      `rich-media:${contextId}:${fileName ?? ''}`,
      { code: 'rich-media' },
      [fileName, contentType].filter(Boolean).join(' · ') || undefined,
      pageNumber,
      add,
    );
  }
}

function collectActionDictionarySignals(
  signals: readonly PdfActionDictionarySignal[] | null | undefined,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): ActionDictionaryIndex | null {
  if (signals === null || signals === undefined) return null;
  const actionIndex: ActionDictionaryIndex = {
    targets: new Set<string>(),
    targetlessAnnotationTriggerIds: new Set<string>(),
    targetlessOutlineExternalActions: 0,
    fieldJavascriptOccurrences: 0,
    pageJavascriptOccurrences: 0,
  };
  let findingIndex = 0;
  for (const signal of signals) {
    const target = sanitizePdfPrivacyValue(signal.target);
    if (target) {
      actionIndex.targets.add(target);
      const normalizedTarget = normalizeSafeExternalUrl(target);
      if (normalizedTarget) actionIndex.targets.add(normalizedTarget);
    }
    const unsafeUri = signal.actionType === 'URI'
      && target !== undefined
      && normalizeSafeExternalUrl(target) === undefined;
    const contextualUri = signal.actionType === 'URI'
      && (
        signal.context === 'open-action'
        || signal.context === 'additional-action'
        || signal.context === 'annotation-additional-action'
        || signal.context === 'field-additional-action'
        || signal.context === 'page-additional-action'
        || signal.context === 'next-action'
      );
    const rawJavascript = signal.actionType === 'JavaScript'
      && (
        signal.context === 'annotation-action'
        || signal.context === 'annotation-additional-action'
        || signal.context === 'field-additional-action'
        || signal.context === 'page-additional-action'
        || signal.context === 'outline-action'
        || signal.context === 'next-action'
        || signal.context === 'explicit-action'
      );
    const namedAdditionalAction = signal.actionType === 'Named'
      && (
        signal.context === 'additional-action'
        || signal.context === 'annotation-additional-action'
        || signal.context === 'field-additional-action'
        || signal.context === 'page-additional-action'
        || signal.context === 'next-action'
      );
    const highRisk = isHighRiskAction(signal.actionType);
    if (!highRisk && !unsafeUri && !contextualUri && !rawJavascript && !namedAdditionalAction) {
      continue;
    }
    const occurrences = Number.isSafeInteger(signal.occurrences) && signal.occurrences > 0
      ? signal.occurrences
      : 1;
    if (
      signal.actionType === 'JavaScript'
      && signal.context === 'field-additional-action'
    ) {
      actionIndex.fieldJavascriptOccurrences += occurrences;
      if (!Number.isSafeInteger(actionIndex.fieldJavascriptOccurrences)) {
        throw new PdfPrivacyEngineError('inspection-limit');
      }
    }
    if (
      signal.actionType === 'JavaScript'
      && (signal.context === 'page-additional-action' || signal.context === 'explicit-action')
    ) {
      actionIndex.pageJavascriptOccurrences += occurrences;
      if (!Number.isSafeInteger(actionIndex.pageJavascriptOccurrences)) {
        throw new PdfPrivacyEngineError('inspection-limit');
      }
    }
    if (highRisk && !target && signal.context === 'annotation-action') {
      for (const triggerId of signal.triggerIds ?? []) {
        actionIndex.targetlessAnnotationTriggerIds.add(triggerId);
      }
    }
    if (
      !target
      && signal.context === 'outline-action'
      && PDFJS_EXTERNAL_TARGET_ACTIONS.has(signal.actionType)
    ) {
      actionIndex.targetlessOutlineExternalActions += occurrences;
    }
    consume(occurrences);
    findingIndex += 1;
    add({
      id: `automatic:dictionary:${String(findingIndex)}:${signal.actionType}`,
      category: 'active-content',
      kind: signal.actionType === 'JavaScript' ? 'javascript' : 'automatic-action',
      severity: 'high',
      message: actionDictionaryMessage(signal),
      value: sanitizeActionTarget(signal.target),
      occurrences,
    });
  }
  return actionIndex;
}

function consumeMatchingDictionaryAction(
  actionIndex: ActionDictionaryIndex | null,
  target: string,
  source: LinkAggregate['source'],
  triggerId: string | undefined,
): boolean {
  if (!actionIndex) return false;
  if (actionIndex.targets.has(target)) return true;
  const normalizedTarget = normalizeSafeExternalUrl(target);
  if (normalizedTarget && actionIndex.targets.has(normalizedTarget)) return true;
  if (source === 'outline' && actionIndex.targetlessOutlineExternalActions > 0) {
    actionIndex.targetlessOutlineExternalActions -= 1;
    return true;
  }
  if (
    source === 'annotation'
    && triggerId !== undefined
    && actionIndex.targetlessAnnotationTriggerIds.has(triggerId)
  ) {
    actionIndex.targetlessAnnotationTriggerIds.delete(triggerId);
    return true;
  }
  return false;
}

function actionDictionaryMessage(signal: PdfActionDictionarySignal): PdfPrivacyFindingMessage {
  let context: 'open-action' | 'additional-action' | 'chained-action' | 'other' = 'other';
  if (signal.context === 'next-action') {
    context = 'chained-action';
  } else if (signal.context === 'open-action') {
    context = 'open-action';
  } else if (
    signal.context === 'additional-action'
    || signal.context === 'annotation-additional-action'
    || signal.context === 'field-additional-action'
    || signal.context === 'page-additional-action'
  ) {
    context = 'additional-action';
  }
  return {
    code: 'dictionary-action',
    actionType: signal.actionType,
    context,
    targetStatus: signal.targetStatus,
  };
}

function isHighRiskAction(actionType: string): boolean {
  return /^(?:GoTo3DView|GoToE|GoToR|ImportData|Launch|Movie|Rendition|RichMediaExecute|Sound|SubmitForm)$/u.test(actionType);
}

function sanitizeActionTarget(rawTarget: string | undefined): string | undefined {
  const target = sanitizePdfPrivacyValue(rawTarget);
  if (!target) return undefined;
  if (isSafeExternalUrl(target)) return target;
  return redactUnsafeTarget(target);
}

function isSafeExternalUrl(value: string): boolean {
  return /^(?:https?|mailto|tel|ftp):/iu.test(value);
}

function normalizeSafeExternalUrl(rawValue: string): string | undefined {
  const value = sanitizePdfPrivacyValue(rawValue);
  if (!value) return undefined;
  const dotCount = value.match(/\./gu)?.length ?? 0;
  const candidate = /^www\./iu.test(value) && dotCount >= 2
    ? `http://${value}`
    : value;
  if (!isSafeExternalUrl(candidate)) return undefined;
  try {
    return new URL(candidate).href;
  } catch {
    return undefined;
  }
}

function addAutomaticAction(
  id: string,
  message: PdfPrivacyFindingMessage,
  value: string | undefined,
  pageNumber: number | undefined,
  add: (finding: PdfPrivacyFinding) => void,
): void {
  add({
    id: `automatic:${id}`,
    category: 'active-content',
    kind: 'automatic-action',
    severity: 'high',
    message,
    value,
    pageNumber,
  });
}

function redactUnsafeTarget(rawTarget: string): string | undefined {
  const target = sanitizePdfPrivacyValue(rawTarget);
  if (!target) return undefined;
  const scheme = target.match(/^([a-z][a-z\d+.-]*):/iu)?.[1];
  return scheme ? `${scheme.toLowerCase()}:…` : target;
}

function addLink(
  links: Map<string, LinkAggregate>,
  rawUrl: string,
  pageNumber: number | undefined,
  source: LinkAggregate['source'],
): void {
  const url = sanitizePdfPrivacyValue(rawUrl);
  if (!url || !isSafeExternalUrl(url)) return;
  const key = url;
  const current = links.get(key);
  if (current) {
    current.occurrences += 1;
    if (pageNumber) current.pages.add(pageNumber);
    return;
  }
  if (links.size >= PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
    throw new PdfPrivacyEngineError('inspection-limit');
  }
  links.set(key, {
    url,
    occurrences: 1,
    pages: new Set(pageNumber ? [pageNumber] : []),
    source,
  });
}

function* objectEntries(value: object): IterableIterator<[string, unknown]> {
  if (value instanceof Map) {
    for (const [key, entry] of value) yield [String(key), entry];
    return;
  }
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      yield [key, (value as Record<string, unknown>)[key]];
    }
  }
}

function hasXfaMetadata(info: object): boolean {
  for (const [key, value] of objectEntries(info)) {
    if (key.toLowerCase() === 'isxfapresent' && value === true) return true;
  }
  return false;
}

function effectivePdfVersion(info: object): string | undefined {
  for (const [key, value] of objectEntries(info)) {
    if (key.toLowerCase() !== 'pdfformatversion') continue;
    const version = readableValue(value);
    return version && /^(?:1\.[0-7]|2\.0)$/u.test(version) ? version : undefined;
  }
  return undefined;
}

function readableValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return sanitizePdfPrivacyValue(value
      .filter(item => ['string', 'number', 'boolean'].includes(typeof item))
      .map(String)
      .join(', '));
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return sanitizePdfPrivacyValue(value);
  }
  const namedValue = asRecord(value);
  if (namedValue && typeof namedValue['name'] === 'string') {
    return sanitizePdfPrivacyValue(namedValue['name']);
  }
  return undefined;
}

function groupLogicalFieldControls(controls: readonly object[]): readonly (readonly Record<string, unknown>[])[] {
  const records = controls.map(asRecord).filter(record => record !== null);
  if (records.length === 0) return [[]];

  const recordsById = new Map<string, Record<string, unknown>>();
  const childIds = new Set<string>();
  for (const record of records) {
    const id = readableValue(record['id']);
    if (id) recordsById.set(id, record);
    const kids = Array.isArray(record['kidIds']) ? record['kidIds'] : [];
    for (const kid of kids) {
      const kidId = readableValue(kid);
      if (kidId) childIds.add(kidId);
    }
  }
  if (recordsById.size === 0) return [records];

  const groups: Record<string, unknown>[][] = [];
  const assigned = new Set<Record<string, unknown>>();
  const collectGroup = (root: Record<string, unknown>): void => {
    const group: Record<string, unknown>[] = [];
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || assigned.has(current)) continue;
      assigned.add(current);
      group.push(current);
      const kids = Array.isArray(current['kidIds']) ? current['kidIds'] : [];
      for (const kid of kids) {
        const child = recordsById.get(readableValue(kid) ?? '');
        if (child) stack.push(child);
      }
    }
    if (group.length > 0) groups.push(group);
  };

  for (const [id, record] of recordsById) {
    if (!childIds.has(id)) collectGroup(record);
  }
  for (const record of recordsById.values()) collectGroup(record);
  const unidentified = records.filter(record => !assigned.has(record));
  if (unidentified.length > 0) {
    if (groups.length === 0) groups.push(unidentified);
    else groups[0].push(...unidentified);
  }
  return groups;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  return readableValue(value) !== undefined;
}

function hasStoredFieldValue(control: Record<string, unknown>): boolean {
  const fieldType = readableValue(control['type'])?.toLowerCase();
  if (fieldType === 'button') return false;
  const values = [control['value'], control['defaultValue']];
  if (fieldType === 'checkbox' || fieldType === 'radiobutton') {
    return values.some(value => hasMeaningfulValue(value) && !isOffFieldValue(value));
  }
  return values.some(hasMeaningfulValue);
}

function isOffFieldValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'off';
}

function collectActionIdentities(
  value: unknown,
  identities: Map<string, Set<string>>,
  consume: ConsumeDiscoveryBudget,
): boolean {
  const entries: Iterable<[unknown, unknown]> = value instanceof Map
    ? value.entries()
    : Object.entries(asRecord(value) ?? {});
  let hasDetailedActions = false;
  for (const [rawEvent, rawPayloads] of entries) {
    hasDetailedActions = true;
    const event = sanitizePdfPrivacyValue(rawEvent) ?? 'unknown';
    const payloads = Array.isArray(rawPayloads) ? rawPayloads : [rawPayloads];
    const eventPayloads = identities.get(event) ?? new Set<string>();
    if (payloads.length === 0) {
      consume();
      eventPayloads.add('');
    }
    for (const payload of payloads) {
      consume();
      eventPayloads.add(typeof payload === 'string' ? payload : `unknown:${typeof payload}`);
    }
    identities.set(event, eventPayloads);
  }
  return hasDetailedActions;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isObject(value) ? value as Record<string, unknown> : null;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function createDiscoveryBudget(): ConsumeDiscoveryBudget {
  let consumed = 0;
  return (count = 1): void => {
    consumed += count;
    if (!Number.isSafeInteger(consumed) || consumed > PDF_PRIVACY_MAX_DISCOVERED_ITEMS) {
      throw new PdfPrivacyEngineError('inspection-limit');
    }
  };
}
