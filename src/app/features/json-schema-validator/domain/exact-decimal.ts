interface ExactDecimal {
  coefficient: bigint;
  scale: number;
}

export function isExactDecimalMultiple(value: number, divisor: number): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor <= 0) return false;
  const dividend = parseExactDecimal(String(value));
  const multiple = parseExactDecimal(String(divisor));
  if (dividend === null || multiple === null || multiple.coefficient === 0n) return false;

  const scaleDifference = multiple.scale - dividend.scale;
  if (scaleDifference >= 0) {
    return (dividend.coefficient * powerOfTen(scaleDifference)) % multiple.coefficient === 0n;
  }
  return dividend.coefficient % (multiple.coefficient * powerOfTen(-scaleDifference)) === 0n;
}

function parseExactDecimal(value: string): ExactDecimal | null {
  if (!/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/iu.test(value)) return null;
  const exponentIndex = value.search(/[eE]/u);
  const mantissa = exponentIndex < 0 ? value : value.slice(0, exponentIndex);
  const exponent = exponentIndex < 0 ? 0 : Number(value.slice(exponentIndex + 1));
  if (!Number.isSafeInteger(exponent)) return null;

  const negative = mantissa.startsWith('-');
  const unsignedMantissa = negative ? mantissa.slice(1) : mantissa;
  const dotIndex = unsignedMantissa.indexOf('.');
  const integer = dotIndex < 0 ? unsignedMantissa : unsignedMantissa.slice(0, dotIndex);
  const fraction = dotIndex < 0 ? '' : unsignedMantissa.slice(dotIndex + 1);
  let coefficient = BigInt(`${negative ? '-' : ''}${integer}${fraction}`);
  let scale = fraction.length - exponent;
  if (coefficient === 0n) return { coefficient: 0n, scale: 0 };
  while (coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale -= 1;
  }
  return { coefficient, scale };
}

function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}
