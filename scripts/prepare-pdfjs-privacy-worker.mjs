import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { patchPdfJsPrivacyWorker } from './pdfjs-privacy-worker-patch.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const targetRoot = join(projectRoot, '.generated', 'pdfjs');
const targetPath = join(targetRoot, 'pdf.worker.privacy-bounded.mjs');

// PDF.js does not expose a decoded-stream ceiling. Keep the normal worker
// untouched and generate a fail-closed copy used only by the privacy inspector.
const source = readFileSync(sourcePath, 'utf8');

mkdirSync(targetRoot, { recursive: true });
writeFileSync(targetPath, patchPdfJsPrivacyWorker(source));

console.log(`[pdfjs] bounded privacy worker prepared at ${targetPath}`);
