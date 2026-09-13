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
const publicRoutes = [...new Set([
  '/',
  '/categories',
  ...extractStaticAppRoutes(),
  ...extractAvailableCatalogRoutes(),
])].sort();
const pageRoutes = [...publicRoutes, '/404'];
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

function validateInternalLinks(html, source) {
  for (const [, rawHref] of matches(html, /<a\b[^>]*\shref="([^"]+)"/gi)) {
    if (!rawHref.startsWith('/') || rawHref.startsWith('//')) continue;
    const pathname = rawHref.split(/[?#]/)[0];
    if (!pathname || pathname === '/') continue;

    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0];
    if (!locales.includes(locale)) continue;

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
    const expectedAlternates = [...locales, 'x-default'];
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

    validateInternalLinks(html, label);
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
  `[seo] ✅ ${locales.length} locales × ${pageRoutes.length} pages, ${publicRoutes.length} URLs publiques par sitemap.`,
);
