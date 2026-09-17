import { describe, expect, it } from 'vitest';

import { PdfActionDictionaryInspectionError } from './pdf-action-dictionary.engine';
import {
  mustRejectBeforePdfJs,
  shouldDeferStructuralFailure,
} from './pdf-privacy-worker-policy';

describe('shouldDeferStructuralFailure', () => {
  it('rejette un object stream chiffré avant PDF.js', () => {
    expect(mustRejectBeforePdfJs({
      encrypted: true,
      skippedEncryptedObjectStreams: 1,
    })).toBe(true);
    expect(mustRejectBeforePdfJs({
      encrypted: true,
      skippedEncryptedObjectStreams: 0,
    })).toBe(false);
  });

  it('arrête avant PDF.js pour une limite structurelle non chiffrée', () => {
    expect(shouldDeferStructuralFailure(
      new PdfActionDictionaryInspectionError(),
      false,
    )).toBe(false);
  });

  it('diffère seulement une limite chiffrée pour classifier le mot de passe', () => {
    expect(shouldDeferStructuralFailure(
      new PdfActionDictionaryInspectionError(),
      true,
    )).toBe(true);
    expect(shouldDeferStructuralFailure(new Error('unexpected'), true)).toBe(false);
  });
});
