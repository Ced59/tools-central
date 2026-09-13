import fs from 'node:fs';
import path from 'node:path';

const featuresRoot = path.resolve('src/app/features');
const allowedLayers = {
  domain: new Set(['domain']),
  application: new Set(['application', 'domain']),
  infrastructure: new Set(['infrastructure', 'application', 'domain']),
  presentation: new Set(['presentation', 'application', 'infrastructure']),
};
const errors = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function featureLocation(file) {
  const relative = path.relative(featuresRoot, file).replaceAll('\\', '/');
  const [feature, layer] = relative.split('/');
  return { feature, layer, relative };
}

function resolveImport(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  return path.resolve(path.dirname(sourceFile), specifier);
}

if (!fs.existsSync(featuresRoot)) {
  console.log('[architecture] Aucun répertoire features à contrôler.');
  process.exit(0);
}

for (const file of walk(featuresRoot).filter((candidate) => candidate.endsWith('.ts') && !candidate.endsWith('.spec.ts'))) {
  const source = featureLocation(file);
  if (!allowedLayers[source.layer]) {
    errors.push(`${source.relative}: couche inconnue « ${source.layer} ».`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const imports = [
    ...content.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);

  for (const specifier of imports) {
    const resolved = resolveImport(file, specifier);
    if (!resolved || !resolved.startsWith(featuresRoot)) continue;

    const target = featureLocation(resolved);
    if (source.feature !== target.feature) {
      const publicApi = path.resolve(featuresRoot, target.feature, 'index');
      if (resolved !== publicApi) {
        errors.push(`${source.relative}: import profond interdit vers la feature ${target.feature} (${specifier}).`);
      }
      continue;
    }

    if (!allowedLayers[source.layer].has(target.layer)) {
      errors.push(`${source.relative}: ${source.layer} ne peut pas dépendre de ${target.layer} (${specifier}).`);
    }
  }
}

const packageJson = fs.readFileSync('package.json', 'utf8');
const sourceFiles = walk(path.resolve('src')).filter((file) => /\.(?:ts|html|scss|css)$/.test(file));
const primeUsage = sourceFiles.find((file) => /\b(?:primeng|primeicons|pi pi-)\b/i.test(fs.readFileSync(file, 'utf8')));
if (/"(?:primeng|@primeng\/themes|primeicons)"\s*:/.test(packageJson) || primeUsage) {
  errors.push(`Dépendance ou classe Prime interdite${primeUsage ? ` dans ${path.relative('.', primeUsage)}` : ''}.`);
}

if (errors.length > 0) {
  console.error(`[architecture] ❌ ${errors.length} violation(s).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[architecture] ✅ Frontières des features et interdiction Prime validées.');
