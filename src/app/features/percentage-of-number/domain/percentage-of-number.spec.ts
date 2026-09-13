import {
  calculatePercentageOfNumber,
  InvalidPercentageOfNumberInputError,
} from './percentage-of-number';
import { describe, expect, it } from 'vitest';

describe('calculatePercentageOfNumber', () => {
  it('calculates decimal percentages without rounding the business result', () => {
    expect(calculatePercentageOfNumber({ percent: 12.5, base: 240 })).toEqual({
      coefficient: 0.125,
      value: 30,
      onePercentValue: 2.4,
    });
  });

  it('supports zero and negative values', () => {
    expect(calculatePercentageOfNumber({ percent: -10, base: 50 }).value).toBe(-5);
    expect(calculatePercentageOfNumber({ percent: 25, base: 0 }).value).toBe(0);
  });

  it.each([
    { percent: Number.NaN, base: 10 },
    { percent: 10, base: Number.POSITIVE_INFINITY },
  ])('rejects non-finite inputs: %o', (input) => {
    expect(() => calculatePercentageOfNumber(input)).toThrow(
      InvalidPercentageOfNumberInputError,
    );
  });
});
