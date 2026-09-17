/// <reference lib="webworker" />

import {
  PDFWorker,
  PasswordResponses,
  getDocument,
  version,
} from 'pdfjs-dist';

import type { PdfPrivacyFailureCode } from '../application/pdf-privacy.use-cases';
import {
  PdfActionDictionaryInspectionError,
  inspectPdfStructuralSignals,
} from './pdf-action-dictionary.engine';
import { validatePdfObjectStreamBudgets } from './pdf-object-stream-preflight';
import {
  PdfPrivacyEngineError,
  extractPdfVersion,
  inspectPdfPrivacyDocument,
} from './pdf-privacy.engine';
import {
  mustRejectAfterPasswordClassification,
  shouldDeferStructuralFailure,
} from './pdf-privacy-worker-policy';
import type {
  PdfPrivacyWorkerRequest,
  PdfPrivacyWorkerResponse,
} from './pdf-privacy.worker.messages';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = ({ data }: MessageEvent<PdfPrivacyWorkerRequest>) => {
  void inspect(data);
};

async function inspect(command: PdfPrivacyWorkerRequest): Promise<void> {
  let loadingTask: ReturnType<typeof getDocument> | undefined;
  let pdfWorker: PDFWorker | undefined;

  try {
    const input = new Uint8Array(command.data);
    const headerData = input.slice(0, 1_024);
    const fileBytes = input.byteLength;
    extractPdfVersion(headerData);
    let objectStreamPreflight: ReturnType<typeof validatePdfObjectStreamBudgets>;
    try {
      objectStreamPreflight = validatePdfObjectStreamBudgets(input);
    } catch {
      throw new PdfActionDictionaryInspectionError();
    }
    const rejectEncryptedObjectStreams = mustRejectAfterPasswordClassification(
      objectStreamPreflight,
    );
    post({ type: 'progress', percent: 1 });
    let structuralSignals: Awaited<ReturnType<typeof inspectPdfStructuralSignals>> = null;
    let structuralFailure: PdfActionDictionaryInspectionError | undefined;
    if (!rejectEncryptedObjectStreams) {
      try {
        structuralSignals = await inspectPdfStructuralSignals(input, objectStreamPreflight);
      } catch (error: unknown) {
        if (!shouldDeferStructuralFailure(error, objectStreamPreflight.encrypted)) throw error;
        structuralFailure = error;
      }
    }
    const parsingWorker = new Worker(versionedWorkerUrl(command.assetRoot), { type: 'module' });
    pdfWorker = new PDFWorker({ port: parsingWorker });
    loadingTask = getDocument({
      data: input,
      password: command.password,
      cMapUrl: new URL('cmaps/', command.assetRoot).toString(),
      cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', command.assetRoot).toString(),
      wasmUrl: new URL('wasm/', command.assetRoot).toString(),
      worker: pdfWorker,
      disableFontFace: true,
      useSystemFonts: false,
      useWorkerFetch: false,
      isEvalSupported: false,
      stopAtErrors: true,
    });
    post({ type: 'progress', percent: 2 });
    const document = await loadingTask.promise;
    if (rejectEncryptedObjectStreams) throw new PdfActionDictionaryInspectionError();
    if (structuralFailure) throw structuralFailure;
    if (!structuralSignals) throw new PdfActionDictionaryInspectionError();
    const report = await inspectPdfPrivacyDocument(
      document,
      {
        headerData,
        fileBytes,
        passwordUsed: Boolean(command.password),
        actionDictionaries: structuralSignals.actionDictionaries,
        associatedFiles: structuralSignals.associatedFiles,
        structuralSignatures: structuralSignals.signatures,
        onProgress: percent => {
          post({ type: 'progress', percent });
        },
      },
    );
    post({ type: 'success', report });
  } catch (error: unknown) {
    post({
      type: 'failure',
      code: failureCode(error),
      message: error instanceof Error ? error.message : 'The PDF privacy worker failed.',
    });
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
    pdfWorker?.destroy();
  }
}

function versionedWorkerUrl(assetRoot: string): string {
  const workerUrl = new URL('pdf.worker.privacy-bounded.mjs', assetRoot);
  workerUrl.searchParams.set('v', version);
  return workerUrl.toString();
}

function failureCode(error: unknown): PdfPrivacyFailureCode {
  if (error instanceof PdfPrivacyEngineError) return error.code;
  if (error instanceof PdfActionDictionaryInspectionError) return error.code;
  const code = error && typeof error === 'object' && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
  if (code === PasswordResponses.NEED_PASSWORD) return 'password-required';
  if (code === PasswordResponses.INCORRECT_PASSWORD) return 'incorrect-password';
  const message = error instanceof Error ? error.message : '';
  if (message.includes('TC_PDF_DECODED_STREAM_LIMIT')) return 'inspection-limit';
  const name = error instanceof Error ? error.name : '';
  if (name === 'InvalidPDFException' || name === 'FormatError') return 'invalid-pdf';
  return 'corrupt-document';
}

function post(response: PdfPrivacyWorkerResponse): void {
  workerScope.postMessage(response);
}
