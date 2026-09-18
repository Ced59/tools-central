import { describe, expect, it } from 'vitest';

import { isExactDecimalMultiple } from './exact-decimal';

describe('isExactDecimalMultiple', () => {
  it.each([
    [0.3, 0.1],
    [-0.3, 0.1],
    [1e-7, 1e-8],
    [1e20, 1e19],
  ])('recognizes %s as an exact multiple of %s', (value, divisor) => {
    expect(isExactDecimalMultiple(value, divisor)).toBe(true);
  });

  it.each([
    [0.30000000000001, 0.1],
    [0.35, 0.1],
    [1e-7, 3e-8],
  ])('rejects %s as a non-multiple of %s without an epsilon', (value, divisor) => {
    expect(isExactDecimalMultiple(value, divisor)).toBe(false);
  });
});
