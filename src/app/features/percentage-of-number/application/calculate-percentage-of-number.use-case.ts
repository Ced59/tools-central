import {
  calculatePercentageOfNumber,
  type PercentageOfNumberResult,
} from '../domain/percentage-of-number';

export type CalculatePercentageOfNumberCommand = Readonly<{
  percent: number | null;
  base: number | null;
}>;

export class CalculatePercentageOfNumberUseCase {
  execute(command: CalculatePercentageOfNumberCommand): PercentageOfNumberResult | null {
    if (
      command.percent === null ||
      command.base === null ||
      !Number.isFinite(command.percent) ||
      !Number.isFinite(command.base)
    ) {
      return null;
    }

    return calculatePercentageOfNumber({ percent: command.percent, base: command.base });
  }
}
