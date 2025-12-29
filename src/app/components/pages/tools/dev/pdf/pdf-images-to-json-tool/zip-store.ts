export interface ZipFile {
  name: string;
  data: Uint8Array;
}

/**
 * ZIP "store" (no compression) minimal.
 * Retourne Uint8Array du zip.
 */
export function buildZipStore(files: ZipFile[]): Uint8Array {
  const encoder = new TextEncoder();

  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = encoder.encode(sanitizeName(f.name));
    const crc = crc32(f.data);

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length);
    writeU32(local, 0, 0x04034b50);
    writeU16(local, 4, 20);      // version needed
    writeU16(local, 6, 0);       // flags
    writeU16(local, 8, 0);       // compression 0=store
    writeU16(local, 10, 0);      // mod time
    writeU16(local, 12, 0);      // mod date
    writeU32(local, 14, crc);
    writeU32(local, 18, f.data.length);
    writeU32(local, 22, f.data.length);
    writeU16(local, 26, nameBytes.length);
    writeU16(local, 28, 0);      // extra len
    local.set(nameBytes, 30);

    localHeaders.push(local, f.data);

    // Central directory header
    const central = new Uint8Array(46 + nameBytes.length);
    writeU32(central, 0, 0x02014b50);
    writeU16(central, 4, 20);    // version made by
    writeU16(central, 6, 20);    // version needed
    writeU16(central, 8, 0);     // flags
    writeU16(central, 10, 0);    // compression
    writeU16(central, 12, 0);
    writeU16(central, 14, 0);
    writeU32(central, 16, crc);
    writeU32(central, 20, f.data.length);
    writeU32(central, 24, f.data.length);
    writeU16(central, 28, nameBytes.length);
    writeU16(central, 30, 0);    // extra
    writeU16(central, 32, 0);    // comment
    writeU16(central, 34, 0);    // disk start
    writeU16(central, 36, 0);    // int attr
    writeU32(central, 38, 0);    // ext attr
    writeU32(central, 42, offset);
    central.set(nameBytes, 46);

    centralHeaders.push(central);

    offset += local.length + f.data.length;
  }

  const centralStart = offset;
  const centralSize = centralHeaders.reduce((a, c) => a + c.length, 0);

  const end = new Uint8Array(22);
  writeU32(end, 0, 0x06054b50);
  writeU16(end, 4, 0);
  writeU16(end, 6, 0);
  writeU16(end, 8, files.length);
  writeU16(end, 10, files.length);
  writeU32(end, 12, centralSize);
  writeU32(end, 16, centralStart);
  writeU16(end, 20, 0);

  return concat([...localHeaders, ...centralHeaders, end]);
}

/* ---------------- utils ---------------- */

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function sanitizeName(name: string): string {
  // avoid Windows weird chars
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
}

function writeU16(b: Uint8Array, off: number, v: number) {
  b[off] = v & 0xff;
  b[off + 1] = (v >>> 8) & 0xff;
}

function writeU32(b: Uint8Array, off: number, v: number) {
  b[off] = v & 0xff;
  b[off + 1] = (v >>> 8) & 0xff;
  b[off + 2] = (v >>> 16) & 0xff;
  b[off + 3] = (v >>> 24) & 0xff;
}

// CRC32
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
