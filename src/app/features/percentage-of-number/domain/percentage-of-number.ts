export type PercentageOfNumberInput = Readonly<{
  percent: number;
  base: number;
}>;

export type PercentageOfNumberResult = Readonly<{
  coefficient: number;
  value: number;
  onePercentValue: number;
}>;

export class InvalidPercentageOfNumberInputError extends RangeError {
  constructor(field: keyof PercentageOfNumberInput) {
    super(`The ${field} value must be a finite number.`);
    this.name = 'InvalidPercentageOfNumberInputError';
  }
}

export function calculatePercentageOfNumber(
  input: PercentageOfNumberInput,
): PercentageOfNumberResult {
  if (!Number.isFinite(input.percent)) {
    throw new InvalidPercentageOfNumberInputError('percent');
  }

  if (!Number.isFinite(input.base)) {
    throw new InvalidPercentageOfNumberInputError('base');
  }

  const coefficient = input.percent / 100;

  return {
    coefficient,
    value: input.base * coefficient,
    onePercentValue: input.base / 100,
  };
}
