import { describe, expect, it } from 'vitest';

import { parseLocaleNumber } from './ui-primitives';

describe('parseLocaleNumber', () => {
  it('parses grouping and decimal separators from an English locale', () => {
    expect(parseLocaleNumber('1,200.5', 'en-US')).toBe(1200.5);
  });

  it('parses grouping and decimal separators from a German locale', () => {
    expect(parseLocaleNumber('1.200,5', 'de-DE')).toBe(1200.5);
  });

  it('parses narrow non-breaking spaces from a French locale', () => {
    expect(parseLocaleNumber('1\u202f200,5', 'fr-FR')).toBe(1200.5);
  });

  it('rejects non-numeric values', () => {
    expect(parseLocaleNumber('un nombre', 'fr-FR')).toBeNull();
  });
});
