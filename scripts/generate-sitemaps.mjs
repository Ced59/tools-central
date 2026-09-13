import fs from 'node:fs';
import path from 'node:path';
import { extractAvailableCatalogRoutes, extractStaticAppRoutes } from './catalog-routes.mjs';

const DIST_DIR = path.resolve('dist/tools-central/browser');
const ANGULAR_JSON = path.resolve('angular.json');
const PROJECT_NAME = 'tools-central';
const SITE = 'https://www.tools-central.com';
const DEFAULT_LOCALE = 'fr';

function readLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, 'utf8'));
  const i18n = angular.projects?.[PROJECT_NAME]?.i18n;
  if (!i18n) throw new Error(`Configuration i18n absente pour ${PROJECT_NAME}.`);
  return [i18n.sourceLocale, ...Object.keys(i18n.locales ?? {})];
}

function localizedPath(locale, baseRoute) {
  return baseRoute === '/' ? `/${locale}/` : `/${locale}${baseRoute}`;
}

function buildUrlset(entries, locales) {
  const urls = entries
    .map(({ baseRoute, locale }) => {
      const alternates = locales
        .map(
          (alternateLocale) =>
            `    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${SITE}${localizedPath(alternateLocale, baseRoute)}" />`,
        )
        .join('\n');
      const xDefault = `${SITE}${localizedPath(DEFAULT_LOCALE, baseRoute)}`;

      return `  <url>
    <loc>${SITE}${localizedPath(locale, baseRoute)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}" />
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function buildSitemapIndex(files) {
  const lastmod = new Date().toISOString();
  const entries = files
    .map(
      (file) => `  <sitemap>
    <loc>${SITE}/${file}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
}

function write(file, content) {
  fs.writeFileSync(path.join(DIST_DIR, file), content, 'utf8');
  console.log(`wrote ${file}`);
}

if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`Répertoire de build introuvable : ${DIST_DIR}`);
}

const locales = readLocales();
const routes = new Set(['/', '/categories']);
for (const route of extractStaticAppRoutes()) routes.add(route);
for (const route of extractAvailableCatalogRoutes()) routes.add(route);

const baseRoutes = [...routes].sort((a, b) => a.localeCompare(b));
const sitemapFiles = [];

for (const locale of locales) {
  const localeDirectory = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDirectory)) {
    console.warn(`locale ignorée, build absent : ${locale}`);
    continue;
  }

  const file = `sitemap-${locale}.xml`;
  const entries = baseRoutes.map((baseRoute) => ({ baseRoute, locale }));
  write(file, buildUrlset(entries, locales));
  sitemapFiles.push(file);
}

write('sitemap.xml', buildSitemapIndex(sitemapFiles));
console.log(`Sitemaps generated: ${sitemapFiles.length} locales x ${baseRoutes.length} routes`);
