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

function buildUrlset(entries, localesByRoute) {
  const urls = entries
    .map(({ baseRoute, locale }) => {
      const routeLocales = localesByRoute.get(baseRoute) ?? [];
      const alternates = routeLocales
        .map(
          (alternateLocale) =>
            `    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${SITE}${localizedPath(alternateLocale, baseRoute)}" />`,
        )
        .join('\n');
      const xDefaultLocale = routeLocales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : routeLocales[0];
      const xDefault = `${SITE}${localizedPath(xDefaultLocale, baseRoute)}`;

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
const staticRoutes = new Set(['/', '/categories', ...extractStaticAppRoutes()]);
const routesByLocale = new Map(locales.map(locale => [
  locale,
  [...new Set([...staticRoutes, ...extractAvailableCatalogRoutes(locale)])]
    .sort((a, b) => a.localeCompare(b)),
]));
const localesByRoute = new Map();
for (const [locale, routes] of routesByLocale) {
  for (const route of routes) {
    const routeLocales = localesByRoute.get(route) ?? [];
    routeLocales.push(locale);
    localesByRoute.set(route, routeLocales);
  }
}
const sitemapFiles = [];

for (const locale of locales) {
  const localeDirectory = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDirectory)) {
    console.warn(`locale ignorée, build absent : ${locale}`);
    continue;
  }

  const file = `sitemap-${locale}.xml`;
  const entries = (routesByLocale.get(locale) ?? []).map((baseRoute) => ({ baseRoute, locale }));
  write(file, buildUrlset(entries, localesByRoute));
  sitemapFiles.push(file);
}

write('sitemap.xml', buildSitemapIndex(sitemapFiles));
const routeCounts = [...routesByLocale.values()].map(routes => routes.length);
console.log(
  `Sitemaps generated: ${sitemapFiles.length} locales, ${Math.min(...routeCounts)}-${Math.max(...routeCounts)} routes`,
);
