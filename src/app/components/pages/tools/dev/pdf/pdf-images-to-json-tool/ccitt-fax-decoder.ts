export interface CcittDecodeParams {
  columns: number;     // width
  rows: number;        // height
  k: number;           // -1 => Group 4
  blackIs1: boolean;   // PDF param (on gère l'inversion dans le writer)
}

/**
 * Décode CCITT Group 4 (K=-1) en lignes 1-bit packées MSB->LSB.
 * Retourne rowsBits[y] = Uint8Array(rowBytes).
 */
export function decodeCcittG4ToRows(data: Uint8Array, p: CcittDecodeParams): Uint8Array[] {
  if (p.k !== -1) {
    throw new Error(`CCITT K=${p.k} non supporté (seulement Group 4 / K=-1 pour l’instant).`);
  }

  const width = p.columns;
  const height = p.rows;
  const rowBytes = Math.ceil(width / 8);

  const br = new BitReader(data);

  const rows: Uint8Array[] = [];

  // ✅ refLine = liste de positions de changements (0..width), alternance blanc/noir
  let refLine: number[] = [0, width];

  for (let y = 0; y < height; y++) {
    const outRow = new Uint8Array(rowBytes);

    let a0 = 0;
    let color = 0; // 0=white, 1=black
    const curChanges: number[] = [0];

    while (a0 < width) {
      const mode = readMode(br);

      if (mode.kind === 'pass') {
        const b1 = findB1(refLine, a0);
        const b2 = findB2(refLine, b1);
        a0 = clamp(b2, 0, width);
        curChanges.push(a0);
        continue;
      }

      if (mode.kind === 'vertical') {
        const b1 = findB1(refLine, a0);
        const a1 = clamp(b1 + mode.delta, 0, width);

        if (a1 > a0 && color === 1) fillBlack(outRow, a0, a1);

        a0 = a1;
        curChanges.push(a0);
        color ^= 1;
        continue;
      }

      // horizontal => 2 runs : run1 (current color) + run2 (opposite)
      const run1 = readRun(br, color);
      const a1 = clamp(a0 + run1, 0, width);
      if (a1 > a0 && color === 1) fillBlack(outRow, a0, a1);

      color ^= 1;

      const run2 = readRun(br, color);
      const a2 = clamp(a1 + run2, 0, width);
      if (a2 > a1 && color === 1) fillBlack(outRow, a1, a2);

      a0 = a2;
      curChanges.push(a0);
      color ^= 1;
    }

    refLine = normalizeChanges(curChanges, width);
    rows.push(outRow);
  }

  return rows;
}

/* ---------------- Bit reader ---------------- */

class BitReader {
  private i = 0;
  private bit = 0;
  constructor(private readonly b: Uint8Array) {}

  readBit(): number {
    if (this.i >= this.b.length) return 0;
    const v = (this.b[this.i] >>> (7 - this.bit)) & 1;
    this.bit++;
    if (this.bit === 8) { this.bit = 0; this.i++; }
    return v;
  }

  readBits(n: number): number {
    let v = 0;
    for (let k = 0; k < n; k++) v = (v << 1) | this.readBit();
    return v;
  }

  peekBits(n: number): number {
    const saveI = this.i, saveB = this.bit;
    const v = this.readBits(n);
    this.i = saveI; this.bit = saveB;
    return v;
  }

  skipBits(n: number) {
    for (let k = 0; k < n; k++) this.readBit();
  }
}

/* ---------------- G4 modes ---------------- */

type Mode =
  | { kind: 'pass' }
  | { kind: 'horizontal' }
  | { kind: 'vertical'; delta: number };

function readMode(br: BitReader): Mode {
  const b1 = br.peekBits(1);
  if (b1 === 1) { br.skipBits(1); return { kind: 'vertical', delta: 0 }; }

  const b3 = br.peekBits(3);
  if (b3 === 0b001) { br.skipBits(3); return { kind: 'horizontal' }; }
  if (b3 === 0b010) { br.skipBits(3); return { kind: 'vertical', delta: +1 }; }
  if (b3 === 0b011) { br.skipBits(3); return { kind: 'vertical', delta: -1 }; }

  const b4 = br.peekBits(4);
  if (b4 === 0b0001) { br.skipBits(4); return { kind: 'pass' }; }

  const b6 = br.peekBits(6);
  if (b6 === 0b000011) { br.skipBits(6); return { kind: 'vertical', delta: -2 }; }
  if (b6 === 0b000010) { br.skipBits(6); return { kind: 'vertical', delta: +2 }; }

  const b7 = br.peekBits(7);
  if (b7 === 0b0000011) { br.skipBits(7); return { kind: 'vertical', delta: -3 }; }
  if (b7 === 0b0000010) { br.skipBits(7); return { kind: 'vertical', delta: +3 }; }

  br.skipBits(1);
  return { kind: 'horizontal' };
}

/* ---------------- Run lengths ---------------- */

type Code = { bits: number; len: number; run: number };

const WHITE_TERMS: Code[] = [
  { run: 0,  len: 8,  bits: 0b00110101 },
  { run: 1,  len: 6,  bits: 0b000111 },
  { run: 2,  len: 4,  bits: 0b0111 },
  { run: 3,  len: 4,  bits: 0b1000 },
  { run: 4,  len: 4,  bits: 0b1011 },
  { run: 5,  len: 4,  bits: 0b1100 },
  { run: 6,  len: 4,  bits: 0b1110 },
  { run: 7,  len: 4,  bits: 0b1111 },
  { run: 8,  len: 5,  bits: 0b10011 },
  { run: 9,  len: 5,  bits: 0b10100 },
  { run: 10, len: 5,  bits: 0b00111 },
  { run: 11, len: 5,  bits: 0b01000 },
  { run: 12, len: 6,  bits: 0b001000 },
  { run: 13, len: 6,  bits: 0b000011 },
  { run: 14, len: 6,  bits: 0b110100 },
  { run: 15, len: 6,  bits: 0b110101 },
  { run: 16, len: 6,  bits: 0b101010 },
  { run: 17, len: 6,  bits: 0b101011 },
  { run: 18, len: 7,  bits: 0b0100111 },
  { run: 19, len: 7,  bits: 0b0001100 },
  { run: 20, len: 7,  bits: 0b0001000 },
  { run: 21, len: 7,  bits: 0b0010111 },
  { run: 22, len: 7,  bits: 0b0000011 },
  { run: 23, len: 7,  bits: 0b0000100 },
  { run: 24, len: 7,  bits: 0b0101000 },
  { run: 25, len: 7,  bits: 0b0101011 },
  { run: 26, len: 7,  bits: 0b0010011 },
  { run: 27, len: 7,  bits: 0b0100100 },
  { run: 28, len: 7,  bits: 0b0011000 },
  { run: 29, len: 8,  bits: 0b00000010 },
  { run: 30, len: 8,  bits: 0b00000011 },
  { run: 31, len: 8,  bits: 0b00011010 },
  { run: 32, len: 8,  bits: 0b00011011 },
  { run: 33, len: 8,  bits: 0b00010010 },
  { run: 34, len: 8,  bits: 0b00010011 },
  { run: 35, len: 8,  bits: 0b00010100 },
  { run: 36, len: 8,  bits: 0b00010101 },
  { run: 37, len: 8,  bits: 0b00010110 },
  { run: 38, len: 8,  bits: 0b00010111 },
  { run: 39, len: 8,  bits: 0b00101000 },
  { run: 40, len: 8,  bits: 0b00101001 },
  { run: 41, len: 8,  bits: 0b00101010 },
  { run: 42, len: 8,  bits: 0b00101011 },
  { run: 43, len: 8,  bits: 0b00101100 },
  { run: 44, len: 8,  bits: 0b00101101 },
  { run: 45, len: 8,  bits: 0b00000100 },
  { run: 46, len: 8,  bits: 0b00000101 },
  { run: 47, len: 8,  bits: 0b00001010 },
  { run: 48, len: 8,  bits: 0b00001011 },
  { run: 49, len: 8,  bits: 0b01010010 },
  { run: 50, len: 8,  bits: 0b01010011 },
  { run: 51, len: 8,  bits: 0b01010100 },
  { run: 52, len: 8,  bits: 0b01010101 },
  { run: 53, len: 8,  bits: 0b00100100 },
  { run: 54, len: 8,  bits: 0b00100101 },
  { run: 55, len: 8,  bits: 0b01011000 },
  { run: 56, len: 8,  bits: 0b01011001 },
  { run: 57, len: 8,  bits: 0b01011010 },
  { run: 58, len: 8,  bits: 0b01011011 },
  { run: 59, len: 8,  bits: 0b01001010 },
  { run: 60, len: 8,  bits: 0b01001011 },
  { run: 61, len: 8,  bits: 0b00110010 },
  { run: 62, len: 8,  bits: 0b00110011 },
  { run: 63, len: 8,  bits: 0b00110100 },
];

const BLACK_TERMS: Code[] = [
  { run: 0,  len: 10, bits: 0b0000110111 },
  { run: 1,  len: 3,  bits: 0b010 },
  { run: 2,  len: 2,  bits: 0b11 },
  { run: 3,  len: 2,  bits: 0b10 },
  { run: 4,  len: 3,  bits: 0b011 },
  { run: 5,  len: 4,  bits: 0b0011 },
  { run: 6,  len: 4,  bits: 0b0010 },
  { run: 7,  len: 5,  bits: 0b00011 },
  { run: 8,  len: 6,  bits: 0b000101 },
  { run: 9,  len: 6,  bits: 0b000100 },
  { run: 10, len: 7,  bits: 0b0000100 },
  { run: 11, len: 7,  bits: 0b0000101 },
  { run: 12, len: 7,  bits: 0b0000111 },
  { run: 13, len: 8,  bits: 0b00000100 },
  { run: 14, len: 8,  bits: 0b00000111 },
  { run: 15, len: 9,  bits: 0b000011000 },
  { run: 16, len: 10, bits: 0b0000010111 },
  { run: 17, len: 10, bits: 0b0000011000 },
  { run: 18, len: 10, bits: 0b0000001000 },
  { run: 19, len: 11, bits: 0b00001100111 },
  { run: 20, len: 11, bits: 0b00001101000 },
  { run: 21, len: 11, bits: 0b00001101100 },
  { run: 22, len: 11, bits: 0b00000110111 },
  { run: 23, len: 11, bits: 0b00000101000 },
  { run: 24, len: 11, bits: 0b00000010111 },
  { run: 25, len: 11, bits: 0b00000011000 },
  { run: 26, len: 12, bits: 0b000011001010 },
  { run: 27, len: 12, bits: 0b000011001011 },
  { run: 28, len: 12, bits: 0b000011001100 },
  { run: 29, len: 12, bits: 0b000011001101 },
  { run: 30, len: 12, bits: 0b000001101000 },
  { run: 31, len: 12, bits: 0b000001101001 },
  { run: 32, len: 12, bits: 0b000001101010 },
  { run: 33, len: 12, bits: 0b000001101011 },
  { run: 34, len: 12, bits: 0b000011010010 },
  { run: 35, len: 12, bits: 0b000011010011 },
  { run: 36, len: 12, bits: 0b000011010100 },
  { run: 37, len: 12, bits: 0b000011010101 },
  { run: 38, len: 12, bits: 0b000011010110 },
  { run: 39, len: 12, bits: 0b000011010111 },
  { run: 40, len: 12, bits: 0b000001101100 },
  { run: 41, len: 12, bits: 0b000001101101 },
  { run: 42, len: 12, bits: 0b000011011010 },
  { run: 43, len: 12, bits: 0b000011011011 },
  { run: 44, len: 12, bits: 0b000001010100 },
  { run: 45, len: 12, bits: 0b000001010101 },
  { run: 46, len: 12, bits: 0b000001010110 },
  { run: 47, len: 12, bits: 0b000001010111 },
  { run: 48, len: 12, bits: 0b000001100100 },
  { run: 49, len: 12, bits: 0b000001100101 },
  { run: 50, len: 12, bits: 0b000001010010 },
  { run: 51, len: 12, bits: 0b000001010011 },
  { run: 52, len: 12, bits: 0b000000100100 },
  { run: 53, len: 12, bits: 0b000000110111 },
  { run: 54, len: 12, bits: 0b000000111000 },
  { run: 55, len: 12, bits: 0b000000100111 },
  { run: 56, len: 12, bits: 0b000000101000 },
  { run: 57, len: 12, bits: 0b000001011000 },
  { run: 58, len: 12, bits: 0b000001011001 },
  { run: 59, len: 12, bits: 0b000000101011 },
  { run: 60, len: 12, bits: 0b000000101100 },
  { run: 61, len: 12, bits: 0b000001011010 },
  { run: 62, len: 12, bits: 0b000001100110 },
  { run: 63, len: 12, bits: 0b000001100111 },
];

const WHITE_MAKEUP: Code[] = [
  { run: 64,  len: 5,  bits: 0b11011 },
  { run: 128, len: 5,  bits: 0b10010 },
  { run: 192, len: 6,  bits: 0b010111 },
  { run: 256, len: 7,  bits: 0b0110111 },
  { run: 320, len: 8,  bits: 0b00110110 },
  { run: 384, len: 8,  bits: 0b00110111 },
  { run: 448, len: 8,  bits: 0b01100100 },
  { run: 512, len: 8,  bits: 0b01100101 },
  { run: 576, len: 8,  bits: 0b01101000 },
  { run: 640, len: 8,  bits: 0b01100111 },
  { run: 704, len: 9,  bits: 0b011001100 },
  { run: 768, len: 9,  bits: 0b011001101 },
  { run: 832, len: 9,  bits: 0b011010010 },
  { run: 896, len: 9,  bits: 0b011010011 },
  { run: 960, len: 9,  bits: 0b011010100 },
  { run: 1024,len: 9,  bits: 0b011010101 },
  { run: 1088,len: 9,  bits: 0b011010110 },
  { run: 1152,len: 9,  bits: 0b011010111 },
  { run: 1216,len: 9,  bits: 0b011011000 },
  { run: 1280,len: 9,  bits: 0b011011001 },
  { run: 1344,len: 9,  bits: 0b011011010 },
  { run: 1408,len: 9,  bits: 0b011011011 },
  { run: 1472,len: 9,  bits: 0b010011000 },
  { run: 1536,len: 9,  bits: 0b010011001 },
  { run: 1600,len: 9,  bits: 0b010011010 },
  { run: 1664,len: 6,  bits: 0b011000 },
  { run: 1728,len: 9,  bits: 0b010011011 },
];

const BLACK_MAKEUP: Code[] = [
  { run: 64,  len: 10, bits: 0b0000001111 },
  { run: 128, len: 12, bits: 0b000011001000 },
  { run: 192, len: 12, bits: 0b000011001001 },
  { run: 256, len: 12, bits: 0b000001011011 },
  { run: 320, len: 12, bits: 0b000000110011 },
  { run: 384, len: 12, bits: 0b000000110100 },
  { run: 448, len: 12, bits: 0b000000110101 },
  { run: 512, len: 13, bits: 0b0000001101100 },
  { run: 576, len: 13, bits: 0b0000001101101 },
  { run: 640, len: 13, bits: 0b0000001001010 },
  { run: 704, len: 13, bits: 0b0000001001011 },
  { run: 768, len: 13, bits: 0b0000001001100 },
  { run: 832, len: 13, bits: 0b0000001001101 },
  { run: 896, len: 13, bits: 0b0000001110010 },
  { run: 960, len: 13, bits: 0b0000001110011 },
  { run: 1024,len: 13, bits: 0b0000001110100 },
  { run: 1088,len: 13, bits: 0b0000001110101 },
  { run: 1152,len: 13, bits: 0b0000001110110 },
  { run: 1216,len: 13, bits: 0b0000001110111 },
  { run: 1280,len: 13, bits: 0b0000001010010 },
  { run: 1344,len: 13, bits: 0b0000001010011 },
  { run: 1408,len: 13, bits: 0b0000001010100 },
  { run: 1472,len: 13, bits: 0b0000001010101 },
  { run: 1536,len: 13, bits: 0b0000001011010 },
  { run: 1600,len: 13, bits: 0b0000001011011 },
  { run: 1664,len: 13, bits: 0b0000001100100 },
  { run: 1728,len: 13, bits: 0b0000001100101 },
];

function readRun(br: BitReader, color: number): number {
  let total = 0;

  while (true) {
    const mk = decodePrefix(br, color === 0 ? WHITE_MAKEUP : BLACK_MAKEUP);
    if (mk) { total += mk.run; continue; }

    const term = decodePrefix(br, color === 0 ? WHITE_TERMS : BLACK_TERMS);
    if (!term) throw new Error('CCITT: run decode failed');
    total += term.run;
    return total;
  }
}

function decodePrefix(br: BitReader, table: Code[]): Code | null {
  for (let len = 2; len <= 13; len++) {
    const bits = br.peekBits(len);
    for (let i = 0; i < table.length; i++) {
      const c = table[i];
      if (c.len === len && c.bits === bits) {
        br.skipBits(len);
        return c;
      }
    }
  }
  return null;
}

/* ---------------- Reference line helpers ---------------- */

function normalizeChanges(changes: number[], width: number): number[] {
  const arr = changes.slice();
  if (arr[0] !== 0) arr.unshift(0);
  if (arr[arr.length - 1] !== width) arr.push(width);

  arr.sort((a, b) => a - b);

  const cleaned: number[] = [];
  for (const v of arr) {
    const vv = clamp(v, 0, width);
    if (cleaned.length === 0 || cleaned[cleaned.length - 1] !== vv) cleaned.push(vv);
  }
  if (cleaned[0] !== 0) cleaned.unshift(0);
  if (cleaned[cleaned.length - 1] !== width) cleaned.push(width);
  return cleaned;
}

function findB1(ref: number[], a0: number): number {
  for (let i = 0; i < ref.length; i++) if (ref[i] > a0) return ref[i];
  return ref[ref.length - 1];
}

function findB2(ref: number[], b1: number): number {
  for (let i = 0; i < ref.length; i++) if (ref[i] > b1) return ref[i];
  return ref[ref.length - 1];
}

/* ---------------- Drawing black bits ---------------- */

function fillBlack(row: Uint8Array, x1: number, x2: number) {
  const start = Math.max(0, x1);
  const end = Math.max(0, x2);
  if (end <= start) return;

  for (let x = start; x < end; x++) {
    const byte = x >>> 3;
    const bit = 7 - (x & 7);
    row[byte] |= (1 << bit);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
