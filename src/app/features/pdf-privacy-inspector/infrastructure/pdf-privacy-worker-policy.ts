import { PdfActionDictionaryInspectionError } from './pdf-action-dictionary.engine';
import type { PdfObjectStreamPreflightResult } from './pdf-object-stream-preflight';

export function mustRejectBeforePdfJs(preflight: PdfObjectStreamPreflightResult): boolean {
  return preflight.skippedEncryptedObjectStreams > 0;
}

/**
 * PDF.js is consulted after a structural failure only when it must first
 * distinguish a missing or incorrect password from a decrypted safety limit.
 */
export function shouldDeferStructuralFailure(
  error: unknown,
  encrypted: boolean,
): error is PdfActionDictionaryInspectionError {
  return encrypted && error instanceof PdfActionDictionaryInspectionError;
}
