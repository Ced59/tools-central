import { describe, expect, it } from 'vitest';

import { canonicalizeHreflang } from './hreflang-code';

describe('canonicalizeHreflang', () => {
  it('normalise les codes de langue, script et région enregistrés', () => {
    expect(canonicalizeHreflang('FR-latn-fr')).toBe('fr-Latn-FR');
    expect(canonicalizeHreflang('x-default')).toBe('x-default');
  });

  it('refuse les codes de forme valide absents des registres', () => {
    expect(canonicalizeHreflang('zz-ZZ')).toBeNull();
    expect(canonicalizeHreflang('fr-Abcd')).toBeNull();
  });
});
