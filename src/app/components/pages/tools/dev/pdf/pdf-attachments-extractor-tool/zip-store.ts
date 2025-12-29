// Minimal ZIP writer (STORE, no compression) — browser-safe, no deps.
// Supports Uint8Array content; produces Uint8Array .zip

export interface ZipFileEntry {
  name: string;
  data: Uint8Array;
  mtime?: Date;
}

function crc32(buf: Uint8Array): number {
  // standard CRC32
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date) {
  const year = Math.max(1980, d.getFullYear());
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = Math.floor(d.getSeconds() / 2); // DOS stores seconds/2

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

function writeU16LE(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff);
}

function writeU32LE(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}

function writeBytes(arr: number[], bytes: Uint8Array) {
  for (let i = 0; i < bytes.length; i++) arr.push(bytes[i]);
}

function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function buildZipStore(entries: ZipFileEntry[]): Uint8Array {
  const out: number[] = [];
  const central: number[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = encodeUtf8(e.name.replace(/\\/g, '/'));
    const data = e.data ?? new Uint8Array();
    const crc = crc32(data);
    const dt = dosDateTime(e.mtime ?? new Date());

    // Local file header
    // signature
    writeU32LE(out, 0x04034b50);
    // version needed
    writeU16LE(out, 20);
    // flags: 0 (we'll store UTF-8 via extra bit 11)
    // set UTF-8 flag (bit 11) => 0x0800
    writeU16LE(out, 0x0800);
    // compression method: 0 (STORE)
    writeU16LE(out, 0);
    // mod time/date
    writeU16LE(out, dt.dosTime);
    writeU16LE(out, dt.dosDate);
    // crc-32
    writeU32LE(out, crc);
    // compressed/uncompressed sizes
    writeU32LE(out, data.length);
    writeU32LE(out, data.length);
    // filename len / extra len
    writeU16LE(out, nameBytes.length);
    writeU16LE(out, 0);
    // filename
    writeBytes(out, nameBytes);
    // file data
    writeBytes(out, data);

    const localHeaderOffset = offset;
    offset = out.length;

    // Central directory header
    writeU32LE(central, 0x02014b50);
    writeU16LE(central, 20);        // version made by
    writeU16LE(central, 20);        // version needed
    writeU16LE(central, 0x0800);    // flags UTF-8
    writeU16LE(central, 0);         // compression
    writeU16LE(central, dt.dosTime);
    writeU16LE(central, dt.dosDate);
    writeU32LE(central, crc);
    writeU32LE(central, data.length);
    writeU32LE(central, data.length);
    writeU16LE(central, nameBytes.length);
    writeU16LE(central, 0);         // extra
    writeU16LE(central, 0);         // comment
    writeU16LE(central, 0);         // disk start
    writeU16LE(central, 0);         // internal attrs
    writeU32LE(central, 0);         // external attrs
    writeU32LE(central, localHeaderOffset);
    writeBytes(central, nameBytes);
  }

  const centralStart = out.length;
  writeBytes(out, new Uint8Array(central));
  const centralSize = out.length - centralStart;

  // End of central directory
  writeU32LE(out, 0x06054b50);
  writeU16LE(out, 0); // disk
  writeU16LE(out, 0); // disk start
  writeU16LE(out, entries.length);
  writeU16LE(out, entries.length);
  writeU32LE(out, centralSize);
  writeU32LE(out, centralStart);
  writeU16LE(out, 0); // comment length

  return new Uint8Array(out);
}
