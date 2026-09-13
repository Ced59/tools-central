import { CalculatePercentageOfNumberUseCase } from './calculate-percentage-of-number.use-case';
import { describe, expect, it } from 'vitest';

describe('CalculatePercentageOfNumberUseCase', () => {
  const useCase = new CalculatePercentageOfNumberUseCase();

  it('returns no result while an input is incomplete', () => {
    expect(useCase.execute({ percent: null, base: 100 })).toBeNull();
    expect(useCase.execute({ percent: 20, base: null })).toBeNull();
  });

  it('delegates a valid calculation to the domain', () => {
    expect(useCase.execute({ percent: 15, base: 200 })?.value).toBe(30);
  });
});
