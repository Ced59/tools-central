import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://tools-central.com";

// Exclusions (à adapter)
const EXCLUDED_FILES = new Set([
  "index.html", // ⚠️ on le garde MAIS traité à part (racine locale)
  "robots.txt",
  "sitemap.xml",
]);
const EXCLUDED_HTML_BASENAMES = new Set([
  "404.html",
]);

function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) throw new Error(`No i18n config for "${PROJECT_NAME}"`);

  const sourceLocale = project.i18n.sourceLocale; // ex: "fr"
  const locales = Object.keys(project.i18n.locales || {}); // ex: ["en","de"]
  return [sourceLocale, ...locales];
}

function walkFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function normalizeUrlPath(urlPath) {
  // on force un trailing slash (recommandé quand tu publies des index.html)
  if (!urlPath.endsWith("/")) urlPath += "/";
  // évite les doubles slashes
  return urlPath.replace(/\/{2,}/g, "/");
}

function routeFromHtmlFile(locale, filePath) {
  // filePath: dist/.../browser/<locale>/.../(index).html
  const base = path.join(DIST_DIR, locale);
  const rel = toPosix(path.relative(base, filePath)); // ex: "categories/math/index.html"
  const name = path.basename(rel);

  if (!rel.endsWith(".html")) return null;
  if (EXCLUDED_HTML_BASENAMES.has(name)) return null;

  // index.html => route du dossier
  if (name === "index.html") {
    const dirRel = rel.slice(0, -"index.html".length); // "" ou "categories/math/"
    const route = "/" + locale + "/" + dirRel;
    return normalizeUrlPath(route);
  }

  // foo.html => /foo/
  const withoutExt = rel.replace(/\.html$/, ""); // "foo" ou "a/b/foo"
  const route = "/" + locale + "/" + withoutExt;
  return normalizeUrlPath(route);
}

function buildUrlset(urlEntries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    )
    .join("\n")}
</urlset>
`;
}

function buildSitemapIndex(items) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
    .map(
      (i) => `  <sitemap>
    <loc>${i.loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
    )
    .join("\n")}
</sitemapindex>
`;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ wrote ${path.relative(process.cwd(), filePath)}`);
}

// ---------- main ----------
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`DIST_DIR not found: ${DIST_DIR} (build first)`);
}

const locales = readAngularLocales();
console.log("🌍 Locales:", locales.join(", "));

const sitemapFiles = [];

for (const locale of locales) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️ missing locale folder: ${localeDir}`);
    continue;
  }

  const files = walkFiles(localeDir).filter((f) => f.endsWith(".html"));
  const entries = [];

  for (const f of files) {
    const route = routeFromHtmlFile(locale, f);
    if (!route) continue;

    // route => URL
    const loc = SITE + route;

    // lastmod = mtime du fichier
    const stat = fs.statSync(f);
    const lastmod = stat.mtime.toISOString();

    entries.push({ loc, lastmod });
  }

  // dédoublonne + trie (stable)
  const uniq = new Map(entries.map((e) => [e.loc, e]));
  const sorted = [...uniq.values()].sort((a, b) => a.loc.localeCompare(b.loc));

  const xml = buildUrlset(sorted);
  const filename = `sitemap-${locale}.xml`;
  writeFile(path.join(DIST_DIR, filename), xml);

  sitemapFiles.push({ loc: `${SITE}/${filename}` });
}

const indexXml = buildSitemapIndex(sitemapFiles);
writeFile(path.join(DIST_DIR, "sitemap.xml"), indexXml);
