import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = join(projectRoot, 'node_modules', 'pdfjs-dist');
const browserRoot = join(projectRoot, 'dist', 'tools-central', 'browser');
const targetRoot = join(browserRoot, 'assets', 'pdfjs');

if (!existsSync(browserRoot)) {
  throw new Error(`Build output missing: ${browserRoot}`);
}

const targetRelative = relative(browserRoot, targetRoot);
if (targetRelative.startsWith('..') || targetRelative.includes(`..${sep}`)) {
  throw new Error(`Refusing to stage PDF.js outside build output: ${targetRoot}`);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(targetRoot, { recursive: true });

for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
  cpSync(join(packageRoot, directory), join(targetRoot, directory), { recursive: true });
}
cpSync(join(packageRoot, 'build', 'pdf.worker.min.mjs'), join(targetRoot, 'pdf.worker.min.mjs'));

console.log(`[assets] PDF.js resources staged once in ${targetRoot}`);
