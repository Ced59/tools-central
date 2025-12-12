import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://tools-central.com";

// Routes par langue (à enrichir plus tard)
const routes = ["/"];

const now = new Date().toISOString();

// ---------- helpers ----------

function readAngularLocales() {
  if (!fs.existsSync(ANGULAR_JSON)) {
    throw new Error("angular.json not found");
  }

  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];

  if (!project?.i18n) {
    throw new Error(`No i18n config found for project "${PROJECT_NAME}"`);
  }

  const sourceLocale = project.i18n.sourceLocale;
  const locales = Object.keys(project.i18n.locales || {});

  return [sourceLocale, ...locales];
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ wrote ${path.relative(process.cwd(), filePath)}`);
}

function url(locale, route) {
  const suffix = route === "/" ? "/" : route;
  return `${SITE}/${locale}${suffix}`;
}

function buildUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${now}</lastmod>
  </url>`
    )
    .join("\n")}
</urlset>
`;
}

function buildSitemapIndex(items) {
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

// ---------- main ----------

ensureDir(DIST_DIR);

const locales = readAngularLocales();
console.log("🌍 Locales from angular.json:", locales.join(", "));

// 1) sitemap par langue
const sitemapFiles = [];

for (const locale of locales) {
  const urls = routes.map((r) => url(locale, r));
  const xml = buildUrlset(urls);

  const filename = `sitemap-${locale}.xml`;
  writeFile(path.join(DIST_DIR, filename), xml);

  sitemapFiles.push({ loc: `${SITE}/${filename}` });
}

// 2) sitemap index (root)
const indexXml = buildSitemapIndex(sitemapFiles);
writeFile(path.join(DIST_DIR, "sitemap.xml"), indexXml);
