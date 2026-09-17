import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const targetRoot = join(projectRoot, '.generated', 'pdfjs');
const targetPath = join(targetRoot, 'pdf.worker.privacy-bounded.mjs');
const decodedStreamLimitBytes = 32 * 1_024 * 1_024;

// PDF.js does not expose a decoded-stream ceiling. Keep the normal worker
// untouched and generate a fail-closed copy used only by the privacy inspector.
const bufferAnchor = 'ensureBuffer(e){const t=this.buffer;if(e<=t.byteLength)return t;';
const bufferReplacement = `ensureBuffer(e){if(!Number.isSafeInteger(e)||e>${String(decodedStreamLimitBytes)})throw new Error("TC_PDF_DECODED_STREAM_LIMIT");this.minBufferLength=Math.min(this.minBufferLength,${String(decodedStreamLimitBytes)});const t=this.buffer;if(e<=t.byteLength)return t;`;
const asyncAnchor = 'for await(const e of n){r.push(e);i+=e.byteLength}const o=new Uint8Array(i);';
const asyncReplacement = `for await(const e of n){i+=e.byteLength;if(!Number.isSafeInteger(i)||i>${String(decodedStreamLimitBytes)})throw new Error("TC_PDF_DECODED_STREAM_LIMIT");r.push(e)}const o=new Uint8Array(i);`;

const source = readFileSync(sourcePath, 'utf8');
for (const [label, anchor] of [
  ['DecodeStream buffer', bufferAnchor],
  ['DecompressionStream output', asyncAnchor],
]) {
  const firstAnchor = source.indexOf(anchor);
  if (firstAnchor < 0 || firstAnchor !== source.lastIndexOf(anchor)) {
    throw new Error(`PDF.js ${label} anchor changed; review the bounded privacy worker patch.`);
  }
}

mkdirSync(targetRoot, { recursive: true });
writeFileSync(
  targetPath,
  source.replace(bufferAnchor, bufferReplacement).replace(asyncAnchor, asyncReplacement),
);

console.log(`[pdfjs] bounded privacy worker prepared at ${targetPath}`);
