import fs from 'node:fs';
import path from 'node:path';
import { extractAvailableCatalogRoutes, extractStaticAppRoutes } from './catalog-routes.mjs';

const outputFile = path.resolve('dist/prerender-routes.txt');
const routes = new Set(['/', '/categories']);

for (const route of extractStaticAppRoutes()) routes.add(route);
for (const route of extractAvailableCatalogRoutes()) routes.add(route);

const normalized = [...routes]
  .map((route) => (route === '/' ? route : route.replace(/\/+$/g, '')))
  .sort((a, b) => a.localeCompare(b));

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${normalized.join('\n')}\n`, 'utf8');

console.log(`Prerender routes written: ${outputFile}`);
console.log(`count=${normalized.length}`);
