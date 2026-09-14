import fs from 'node:fs';
import path from 'node:path';

import {
  extractAvailableCatalogRoutes,
  extractStaticAppRoutes,
} from './catalog-routes.mjs';

const projectName = 'tools-central';
const site = 'https://www.tools-central.com';
const dist = path.resolve('dist', projectName, 'browser');
const angular = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
const i18n = angular.projects?.[projectName]?.i18n;
const locales = [i18n?.sourceLocale, ...Object.keys(i18n?.locales ?? {})].filter(Boolean);
const staticRoutes = [...new Set([
  '/',
  '/categories',
  ...extractStaticAppRoutes(),
])].sort();
const routesByLocale = new Map(locales.map(locale => [
  locale,
  [...new Set([...staticRoutes, ...extractAvailableCatalogRoutes(locale)])].sort(),
]));
const allPublicRoutes = [...new Set([...routesByLocale.values()].flat())].sort();
const localesByRoute = new Map();
for (const [locale, routes] of routesByLocale) {
  for (const route of routes) {
    const routeLocales = localesByRoute.get(route) ?? [];
    routeLocales.push(locale);
    localesByRoute.set(route, routeLocales);
  }
}
const errors = [];

function expectedUrl(locale, route) {
  return route === '/' ? `${site}/${locale}/` : `${site}/${locale}${route}`;
}

function pageFile(locale, route) {
  const relative = route === '/' ? '' : route.slice(1);
  return path.join(dist, locale, relative, 'index.html');
}

function matches(html, expression) {
  return [...html.matchAll(expression)];
}

function report(message) {
  errors.push(message);
}

function validateInternalLinks(html, source, publishedRoutes) {
  for (const [, rawHref] of matches(html, /<a\b[^>]*\shref="([^"]+)"/gi)) {
    if (!rawHref.startsWith('/') || rawHref.startsWith('//')) continue;
    const pathname = rawHref.split(/[?#]/)[0];
    if (!pathname || pathname === '/') continue;

    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0];
    if (!locales.includes(locale)) continue;

    const baseRoute = segments.length === 1 ? '/' : `/${segments.slice(1).join('/')}`;
    if (!publishedRoutes.has(baseRoute)) {
      report(`${source}: lien interne vers une variante non publiée (${pathname}).`);
      continue;
    }

    const target = path.join(dist, ...segments, 'index.html');
    if (!fs.existsSync(target)) {
      report(`${source}: lien interne sans page générée (${pathname}).`);
    }
  }
}

if (!fs.existsSync(dist)) {
  throw new Error(`Build statique introuvable : ${dist}`);
}

for (const locale of locales) {
  const publicRoutes = routesByLocale.get(locale) ?? [];
  const publishedRoutes = new Set(publicRoutes);
  const pageRoutes = [...publicRoutes, '/404'];
  for (const route of pageRoutes) {
    const file = pageFile(locale, route);
    const label = `${locale}${route}`;
    if (!fs.existsSync(file)) {
      report(`${label}: index.html absent.`);
      continue;
    }

    const html = fs.readFileSync(file, 'utf8');
    const canonical = matches(html, /<link\s+rel="canonical"\s+href="([^"]+)"/gi);
    const expectedCanonical = expectedUrl(locale, route);
    if (canonical.length !== 1 || canonical[0][1] !== expectedCanonical) {
      report(`${label}: canonical attendu ${expectedCanonical}.`);
    }

    const lang = html.match(/<html\s+lang="([^"]+)"/i)?.[1];
    if (lang !== locale) {
      report(`${label}: lang=${lang ?? 'absent'}, attendu ${locale}.`);
    }

    const alternates = matches(html, /<link\s+rel="alternate"\s+href="[^"]+"\s+hreflang="([^"]+)"/gi)
      .map((match) => match[1]);
    const expectedAlternates = [...(localesByRoute.get(route) ?? locales), 'x-default'];
    if (
      alternates.length !== expectedAlternates.length ||
      expectedAlternates.some((alternate) => !alternates.includes(alternate))
    ) {
      report(`${label}: alternates hreflang incomplets (${alternates.length}/${expectedAlternates.length}).`);
    }

    if (!/<title>[^<]+<\/title>/i.test(html)) {
      report(`${label}: title vide ou absent.`);
    }
    if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) {
      report(`${label}: meta description vide ou absente.`);
    }
    if (/\bTODO\b/.test(html)) {
      report(`${label}: marqueur TODO publié.`);
    }
    if (/<app-root\b[^>]*\bngskiphydration\b/i.test(html)) {
      report(`${label}: l’application racine désactive l’hydratation.`);
    }

    const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1];
    if (route === '/404' ? robots !== 'noindex,follow' : robots !== 'index,follow') {
      report(`${label}: robots=${robots ?? 'absent'} inattendu.`);
    }

    validateInternalLinks(html, label, publishedRoutes);
  }

  for (const route of allPublicRoutes.filter(candidate => !publishedRoutes.has(candidate))) {
    const file = pageFile(locale, route);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1];
    if (robots !== 'noindex,follow') {
      report(`${locale}${route}: variante non publiée sans noindex,follow.`);
    }
    const alternates = matches(html, /<link\s+rel="alternate"\s+href="[^"]+"\s+hreflang="([^"]+)"/gi)
      .map((match) => match[1]);
    const expectedAlternates = [...(localesByRoute.get(route) ?? []), 'x-default'];
    if (
      alternates.length !== expectedAlternates.length
      || expectedAlternates.some(alternate => !alternates.includes(alternate))
    ) {
      report(`${locale}${route}: alternates d’une variante non publiée incorrects.`);
    }
  }

  const sitemapFile = path.join(dist, `sitemap-${locale}.xml`);
  if (!fs.existsSync(sitemapFile)) {
    report(`sitemap-${locale}.xml absent.`);
    continue;
  }
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  const urls = matches(sitemap, /<url>/g).length;
  if (urls !== publicRoutes.length) {
    report(`sitemap-${locale}.xml: ${urls} URLs, attendu ${publicRoutes.length}.`);
  }
  if (sitemap.includes(`/${locale}/404`)) {
    report(`sitemap-${locale}.xml: la page 404 ne doit pas être indexée.`);
  }
  for (const route of allPublicRoutes.filter(route => !publicRoutes.includes(route))) {
    if (sitemap.includes(expectedUrl(locale, route))) {
      report(`sitemap-${locale}.xml: variante non publiée présente (${route}).`);
    }
  }
}

const robotsFile = path.join(dist, 'robots.txt');
if (!fs.existsSync(robotsFile) || !fs.readFileSync(robotsFile, 'utf8').includes(`${site}/sitemap.xml`)) {
  report('robots.txt absent ou sitemap principal incorrect.');
}

if (errors.length > 0) {
  console.error(`[seo] ❌ ${errors.length} incohérence(s) détectée(s).`);
  for (const error of errors.slice(0, 40)) console.error(`- ${error}`);
  if (errors.length > 40) console.error(`- … ${errors.length - 40} autre(s)`);
  process.exit(1);
}

console.log(
  `[seo] ✅ ${locales.length} locales, ${routesByLocale.size > 0 ? [...routesByLocale.values()].reduce((sum, routes) => sum + routes.length, 0) : 0} URLs indexables, variantes non relues exclues.`,
);
