import {
  PDF_PRIVACY_MAX_DISCOVERED_ITEMS,
  PDF_PRIVACY_MAX_PAGES,
  buildPdfPrivacyReport,
  sanitizePdfPrivacyValue,
  type PdfPrivacyFinding,
  type PdfPrivacyReport,
} from '../domain/pdf-privacy.models';

export type PdfPrivacyEngineFailureCode = 'invalid-pdf' | 'too-many-pages' | 'inspection-limit';

export class PdfPrivacyEngineError extends Error {
  constructor(readonly code: PdfPrivacyEngineFailureCode) {
    super(code);
  }
}

export interface PdfJsPrivacyMetadata {
  info: object;
  metadata: { getAll(): object } | null;
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

type ConsumeDiscoveryBudget = (count?: number) => void;

const INFO_METADATA_KEYS = new Set([
  'title', 'author', 'subject', 'keywords', 'creator', 'producer',
  'creationdate', 'moddate', 'trapped',
]);

const XMP_PRIVACY_KEY_PARTS = [
  'title', 'creator', 'author', 'description', 'subject', 'keyword', 'producer',
  'creatortool', 'createdate', 'modifydate', 'metadatadate', 'documentid',
  'instanceid', 'history', 'email', 'company', 'manager',
];

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
    onProgress?: (percent: number) => void;
  },
): Promise<PdfPrivacyReport> {
  const pdfVersion = extractPdfVersion(input.headerData);
  if (!Number.isSafeInteger(document.numPages) || document.numPages <= 0) {
    throw new PdfPrivacyEngineError('invalid-pdf');
  }
  if (document.numPages > PDF_PRIVACY_MAX_PAGES) {
    throw new PdfPrivacyEngineError('too-many-pages');
  }

  input.onProgress?.(8);
  const [metadata, attachments, documentActions, hasJavascript, fields, signatures, permissions, openAction, outline] = await Promise.all([
    document.getMetadata(),
    document.getAttachments(),
    document.getJSActions(),
    document.hasJSActions(),
    document.getFieldObjects(),
    document.getSignatures(),
    document.getPermissions(),
    document.getOpenAction(),
    document.getOutline(),
  ]);
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

  collectMetadata(metadata, add, consumeDiscoveryBudget);
  collectAttachments(attachments, add, consumeDiscoveryBudget);
  const documentActionCount = collectJavascriptActions(
    documentActions,
    'document',
    add,
    consumeDiscoveryBudget,
  );
  if (hasJavascript && documentActionCount === 0) {
    add({
      id: 'javascript:document:detected',
      category: 'active-content',
      kind: 'javascript',
      severity: 'high',
      label: 'Document',
      occurrences: 1,
    });
  }
  collectOpenAction(openAction, add, consumeDiscoveryBudget);
  collectForms(fields, Boolean(document.isPureXfa), add, consumeDiscoveryBudget);
  collectSignatures(signatures, add, consumeDiscoveryBudget);
  collectOutlineLinks(outline ?? [], links, consumeDiscoveryBudget);

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    try {
      const [annotations, pageActions] = await Promise.all([
        page.getAnnotations({ intent: 'any' }),
        page.getJSActions(),
      ]);
      collectPageAnnotations(annotations, pageNumber, links, add, consumeDiscoveryBudget);
      collectJavascriptActions(
        pageActions,
        `page:${String(pageNumber)}`,
        add,
        consumeDiscoveryBudget,
        pageNumber,
      );
    } finally {
      page.cleanup();
    }
    input.onProgress?.(20 + Math.round(pageNumber / document.numPages * 72));
  }

  for (const [key, link] of links) {
    const pageNumber = link.pages.size === 1 ? [...link.pages][0] : undefined;
    add({
      id: `link:${key}`,
      category: 'links',
      kind: 'external-link',
      severity: 'medium',
      label: link.source === 'outline' ? 'Plan du document' : 'Annotation de lien',
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
      label: 'Protection du document',
      value: permissions
        ? `${String(permissions.size)} permission(s) annoncée(s)`
        : 'Document ouvert avec un mot de passe',
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
    if (!INFO_METADATA_KEYS.has(key.toLowerCase())) continue;
    const value = readableValue(rawValue);
    if (!value) continue;
    add({
      id: `metadata:info:${key.toLowerCase()}`,
      category: 'metadata',
      kind: 'document-metadata',
      severity: 'low',
      label: key,
      value,
    });
  }

  if (!metadata.metadata) return;
  for (const [key, rawValue] of objectEntries(metadata.metadata.getAll())) {
    consume();
    const normalizedKey = key.toLowerCase();
    if (!XMP_PRIVACY_KEY_PARTS.some(part => normalizedKey.includes(part))) continue;
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
    const fileName = readableValue(attachment?.['filename']) ?? sanitizePdfPrivacyValue(key) ?? `Fichier ${String(index)}`;
    const description = readableValue(attachment?.['description']);
    const contentType = readableValue(attachment?.['contentType']);
    const content = attachment?.['content'];
    const bytes = ArrayBuffer.isView(content) ? content.byteLength : undefined;
    add({
      id: `attachment:${String(index)}:${fileName}`,
      category: 'attachments',
      kind: 'embedded-file',
      severity: 'high',
      label: fileName,
      value: [contentType, description].filter(Boolean).join(' · ') || undefined,
      bytes,
    });
  }
}

function collectJavascriptActions(
  actions: Map<unknown, unknown> | null,
  scope: string,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
  pageNumber?: number,
): number {
  if (!actions) return 0;
  let count = 0;
  for (const [rawEvent, payload] of actions) {
    const event = sanitizePdfPrivacyValue(rawEvent) ?? 'Action';
    const occurrences = Math.max(1, Array.isArray(payload) ? payload.length : 1);
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
  const actionName = sanitizePdfPrivacyValue(action.get('action')) ?? 'Action nommée';
  add({
    id: `automatic:open:${actionName}`,
    category: 'active-content',
    kind: 'automatic-action',
    severity: 'high',
    label: 'À l’ouverture du document',
    value: actionName,
  });
}

function collectForms(
  fields: Map<string, readonly object[]> | null,
  pureXfa: boolean,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  let fieldCount = 0;
  let populatedCount = 0;
  let actionCount = 0;
  if (fields) {
    for (const controls of fields.values()) {
      consume(Math.max(1, controls.length));
      fieldCount += 1;
      let populated = false;
      for (const rawControl of controls) {
        const control = asRecord(rawControl);
        if (!control) continue;
        if (hasMeaningfulValue(control['value']) || hasMeaningfulValue(control['defaultValue'])) {
          populated = true;
        }
        if (control['actions'] || control['hasJSActions'] === true) actionCount += 1;
      }
      if (populated) populatedCount += 1;
    }
  }
  if (fieldCount > 0) {
    add({
      id: 'forms:acroform',
      category: 'forms',
      kind: 'form-fields',
      severity: populatedCount > 0 ? 'medium' : 'low',
      label: 'Formulaire AcroForm',
      value: `${String(fieldCount)} champ(s), ${String(populatedCount)} avec une valeur`,
      occurrences: fieldCount,
    });
  }
  if (actionCount > 0) {
    add({
      id: 'javascript:forms',
      category: 'active-content',
      kind: 'javascript',
      severity: 'high',
      label: 'Actions de formulaire',
      occurrences: actionCount,
    });
  }
  if (pureXfa) {
    add({
      id: 'forms:xfa',
      category: 'forms',
      kind: 'xfa-form',
      severity: 'medium',
      label: 'Formulaire XFA dynamique',
    });
  }
}

function collectSignatures(
  signatures: readonly object[] | null,
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
    const coversWholeDocument = signature?.['coversWholeDocument'];
    const modifications = finiteNumber(signature?.['modificationsAfterSignature']);
    const details = [
      subFilter,
      coversWholeDocument === true ? 'couvre tout le document' : undefined,
      coversWholeDocument === false ? 'ne couvre pas tout le document' : undefined,
      modifications && modifications > 0 ? `${String(modifications)} modification(s) ultérieure(s)` : undefined,
    ].filter(Boolean).join(' · ');
    add({
      id: `signature:${String(index + 1)}:${fieldName ?? ''}`,
      category: 'signatures',
      kind: 'digital-signature',
      severity: signer ? 'low' : 'info',
      label: fieldName ?? `Signature ${String(index + 1)}`,
      value: [signer, details].filter(Boolean).join(' · ') || undefined,
    });
  });
}

function collectOutlineLinks(
  nodes: readonly object[],
  links: Map<string, LinkAggregate>,
  consume: ConsumeDiscoveryBudget,
): void {
  const queue = [...nodes];
  while (queue.length > 0) {
    const node = asRecord(queue.shift());
    if (!node) continue;
    consume();
    const url = readableValue(node['url']) ?? readableValue(node['unsafeUrl']);
    if (url) addLink(links, url, undefined, 'outline');
    const children = node['items'];
    if (Array.isArray(children)) queue.push(...children.filter(isObject));
  }
}

function collectPageAnnotations(
  annotations: readonly object[],
  pageNumber: number,
  links: Map<string, LinkAggregate>,
  add: (finding: PdfPrivacyFinding) => void,
  consume: ConsumeDiscoveryBudget,
): void {
  for (const rawAnnotation of annotations) {
    consume();
    const annotation = asRecord(rawAnnotation);
    if (!annotation) continue;
    const url = readableValue(annotation['url']) ?? readableValue(annotation['unsafeUrl']);
    if (url) addLink(links, url, pageNumber, 'annotation');

    const action = readableValue(annotation['action']);
    if (action && /^(Launch|SubmitForm|ImportData|GoToR|Rendition|RichMediaExecute)$/iu.test(action)) {
      add({
        id: `automatic:annotation:${String(pageNumber)}:${action}:${readableValue(annotation['id']) ?? ''}`,
        category: 'active-content',
        kind: 'automatic-action',
        severity: 'high',
        label: action,
        pageNumber,
      });
    }

    const file = asRecord(annotation['file']);
    if (file) {
      const fileName = readableValue(file['filename']) ?? 'Pièce jointe annotée';
      const content = file['content'];
      add({
        id: `attachment:annotation:${String(pageNumber)}:${fileName}`,
        category: 'attachments',
        kind: 'embedded-file',
        severity: 'high',
        label: fileName,
        pageNumber,
        bytes: ArrayBuffer.isView(content) ? content.byteLength : undefined,
      });
    }
  }
}

function addLink(
  links: Map<string, LinkAggregate>,
  rawUrl: string,
  pageNumber: number | undefined,
  source: LinkAggregate['source'],
): void {
  const url = sanitizePdfPrivacyValue(rawUrl);
  if (!url || !/^(?:https?|mailto|tel|ftp):/iu.test(url)) return;
  const key = url.toLowerCase();
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

function objectEntries(value: object): [string, unknown][] {
  if (value instanceof Map) {
    return [...value.entries()].map(([key, entry]) => [String(key), entry]);
  }
  return Object.entries(value);
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
  return undefined;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  return readableValue(value) !== undefined;
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
