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
  inspectPdfActionDictionaries,
} from './pdf-action-dictionary.engine';
import {
  PdfPrivacyEngineError,
  inspectPdfPrivacyDocument,
  type PdfJsPrivacyDocument,
} from './pdf-privacy.engine';
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
    const parsingWorker = new Worker(versionedWorkerUrl(command.assetRoot), { type: 'module' });
    pdfWorker = new PDFWorker({ port: parsingWorker });
    const input = new Uint8Array(command.data);
    const headerData = input.slice(0, 1_024);
    const fileBytes = input.byteLength;
    post({ type: 'progress', percent: 1 });
    const actionDictionaries = await inspectPdfActionDictionaries(input);
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
    const report = await inspectPdfPrivacyDocument(
      document as unknown as PdfJsPrivacyDocument,
      {
        headerData,
        fileBytes,
        passwordUsed: Boolean(command.password),
        actionDictionaries,
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
  const workerUrl = new URL('pdf.worker.min.mjs', assetRoot);
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
  const name = error instanceof Error ? error.name : '';
  if (name === 'InvalidPDFException' || name === 'FormatError') return 'invalid-pdf';
  return 'corrupt-document';
}

function post(response: PdfPrivacyWorkerResponse): void {
  workerScope.postMessage(response);
}
