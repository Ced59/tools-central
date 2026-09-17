import { PdfActionDictionaryInspectionError } from './pdf-action-dictionary.engine';

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
