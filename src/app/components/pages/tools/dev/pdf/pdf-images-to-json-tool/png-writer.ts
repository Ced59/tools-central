export interface Png1BitOptions {
  width: number;
  height: number;
  blackIs1: boolean; // si true: bit=1 => noir, sinon bit=1 => blanc
}

/**
 * Construit un PNG (grayscale, 1-bit, non entrelacé) depuis des lignes de bits.
 * rowsBits: tableau de Uint8Array, chaque entrée = bits packés MSB->LSB sur width pixels.
 */
export function writePng1Bit(rowsBits: Uint8Array[], opts: Png1BitOptions): Uint8Array {
  const { width, height, blackIs1 } = opts;
  const rowBytes = Math.ceil(width / 8);

  // Filtre PNG par ligne: 1 byte (0) + data
  const raw = new Uint8Array(height * (1 + rowBytes));
  let o = 0;

  // PNG grayscale 1-bit : 0 = noir ? Non: pour grayscale, 0=black, 1=white,
  // mais ici on stocke 1-bit, value 0 ou 1. On contrôle via inversion.
  // On veut: noir => 0, blanc => 1 dans l’échantillon PNG.
  // Si blackIs1 (dans les bits CCITT) => bit 1 = noir, il faut inverser.
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter None
    const row = rowsBits[y] ?? new Uint8Array(rowBytes);

    if (!blackIs1) {
      // bits: 0=white 1=black => on veut 0=black 1=white => inverse bits
      for (let i = 0; i < rowBytes; i++) raw[o + i] = row[i] ^ 0xff;
    } else {
      // bits: 1=black déjà => on veut 0=black => inverse aussi
      for (let i = 0; i < rowBytes; i++) raw[o + i] = row[i] ^ 0xff;
    }

    // Si on a dépassé width (dernier octet), il faut nettoyer les bits de padding
    const extra = rowBytes * 8 - width;
    if (extra > 0) {
      const mask = 0xff << extra; // garde les bits utiles à gauche
      raw[o + rowBytes - 1] = raw[o + rowBytes - 1] & mask;
    }

    o += rowBytes;
  }

  const idat = zlibStore(raw);
  const chunks: Uint8Array[] = [];

  // Signature
  chunks.push(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 1;  // bit depth
  ihdr[9] = 0;  // color type: grayscale
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(pngChunk('IHDR', ihdr));

  // IDAT
  chunks.push(pngChunk('IDAT', idat));

  // IEND
  chunks.push(pngChunk('IEND', new Uint8Array(0)));

  return concat(chunks);
}

/* ---------------- PNG chunk helpers ---------------- */

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const len = data.length;
  const out = new Uint8Array(8 + len + 4);
  writeU32(out, 0, len);
  out.set(typeBytes, 4);
  out.set(data, 8);
  const crc = crc32(out.subarray(4, 8 + len));
  writeU32(out, 8 + len, crc);
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

function writeU32(buf: Uint8Array, off: number, v: number) {
  buf[off] = (v >>> 24) & 0xff;
  buf[off + 1] = (v >>> 16) & 0xff;
  buf[off + 2] = (v >>> 8) & 0xff;
  buf[off + 3] = v & 0xff;
}

/* ---------------- zlib/deflate store (no compression) ---------------- */

/**
 * zlib stream using deflate "stored blocks" (no compression)
 * zlib header 0x78 0x01 (fastest, no compression)
 */
function zlibStore(data: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [];
  let p = 0;

  while (p < data.length) {
    const remaining = data.length - p;
    const chunkLen = Math.min(0xffff, remaining);
    const isFinal = p + chunkLen >= data.length;

    // Deflate stored block header: BFINAL(1) + BTYPE(2)=00
    const header = new Uint8Array(5);
    header[0] = isFinal ? 0x01 : 0x00; // 00000001 final, else 00000000
    // LEN, NLEN little endian
    header[1] = chunkLen & 0xff;
    header[2] = (chunkLen >>> 8) & 0xff;
    const nlen = (~chunkLen) & 0xffff;
    header[3] = nlen & 0xff;
    header[4] = (nlen >>> 8) & 0xff;

    blocks.push(header, data.subarray(p, p + chunkLen));
    p += chunkLen;
  }

  const deflate = concat(blocks);
  const out = new Uint8Array(2 + deflate.length + 4);

  // zlib header
  out[0] = 0x78;
  out[1] = 0x01;

  out.set(deflate, 2);

  const ad = adler32(data);
  out[2 + deflate.length] = (ad >>> 24) & 0xff;
  out[2 + deflate.length + 1] = (ad >>> 16) & 0xff;
  out[2 + deflate.length + 2] = (ad >>> 8) & 0xff;
  out[2 + deflate.length + 3] = ad & 0xff;

  return out;
}

function adler32(data: Uint8Array): number {
  const MOD = 65521;
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

/* ---------------- CRC32 ---------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
