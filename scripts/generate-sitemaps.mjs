import fs from "node:fs";
import path from "node:path";

// --------------------------------------------------
// Config
// --------------------------------------------------
const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://www.tools-central.com";

// Sources data (SSOT)
const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOL_GROUPS_TS = path.resolve("src/app/data/tool-groups.ts");
const ATOMIC_TOOLS_DIR = path.resolve("src/app/data/atomic-tools");
const APP_ROUTES_TS = path.resolve("src/app/app.routes.ts");

// Options
const INCLUDE_COMING_SOON = false;

// --------------------------------------------------
// Locales
// --------------------------------------------------
function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) {
    throw new Error(`No i18n config for "${PROJECT_NAME}"`);
  }

  const sourceLocale = project.i18n.sourceLocale;
  const locales = Object.keys(project.i18n.locales || {});
  return [sourceLocale, ...locales];
}

// --------------------------------------------------
// FS helpers
// --------------------------------------------------
function read(file) {
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}

function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}

function listFilesRecursive(dir, predicate = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, predicate));
    else if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

// --------------------------------------------------
// Route extraction helpers
// --------------------------------------------------

/**
 * Categories: top-level keys of CATEGORY_REGISTRY
 */
function extractCategoryRoutesFromRegistry(tsContent) {
  const body =
    tsContent.match(
      /export\s+const\s+CATEGORY_REGISTRY\s*=\s*\{([\s\S]*?)\}\s*as\s*const\s*;/
    )?.[1] ?? "";

  const keys = [...body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*:\s*\{/gm)].map(
    (m) => m[1]
  );

  return uniq(keys).map((id) => `/categories/${id}`);
}

/**
 * Extract routes from registry-like objects
 * (tool groups + atomic tools)
 */
function extractRoutesFromRegistryLikeObject(tsContent) {
  const routes = [];

  const entryRegex =
    /(^|\n)\s*(?:['"]([^'"]+)['"]|([A-Za-z0-9_-]+))\s*:\s*\{([\s\S]*?)\n\s*\}\s*,?/g;

  let m;
  while ((m = entryRegex.exec(tsContent)) !== null) {
    const body = m[4] || "";

    const availableRaw = body.match(/available\s*:\s*(true|false)/)?.[1];
    const available = availableRaw ? availableRaw === "true" : true;
    if (!INCLUDE_COMING_SOON && available === false) continue;

    for (const t of body.matchAll(
      /routes\.tool\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g
    )) {
      const [, cat, group, tool] = t;
      routes.push(`/categories/${cat}/${group}/${tool}`);
    }

    for (const g of body.matchAll(
      /routes\.group\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g
    )) {
      const [, cat, group] = g;
      routes.push(`/categories/${cat}/${group}`);
    }

    for (const d of body.matchAll(/route\s*:\s*['"]([^'"]+)['"]/g)) {
      routes.push(d[1]);
    }
  }

  return routes;
}

/**
 * Extract static routes from Angular Routes config
 * - includes: path: 'privacy-policy'
 * - excludes: '', '**', dynamic ':id'
 */
function extractStaticRoutesFromAngularRoutes(tsContent) {
  const out = [];

  for (const m of tsContent.matchAll(/path\s*:\s*['"]([^'"]+)['"]/g)) {
    const p = m[1].trim();
    if (!p || p === "**") continue;
    if (p.includes(":")) continue;

    out.push(p.startsWith("/") ? p : `/${p}`);
  }

  return uniq(out);
}

function normalizeNoTrailingSlash(p) {
  if (p === "/") return "/";
  return p.replace(/\/+$/g, "");
}

// --------------------------------------------------
// Sitemap builders
// --------------------------------------------------
function buildUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
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

// --------------------------------------------------
// Main
// --------------------------------------------------
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`DIST_DIR not found: ${DIST_DIR} (build first)`);
}

const locales = readAngularLocales();
console.log("🌍 Locales:", locales.join(", "));

const baseRoutes = new Set();

// Core pages
baseRoutes.add("/");
baseRoutes.add("/categories");

// Angular static routes (legal pages, etc.)
{
  const content = read(APP_ROUTES_TS);
  const staticRoutes = extractStaticRoutesFromAngularRoutes(content);
  for (const r of staticRoutes) baseRoutes.add(r);
}

// Categories
{
  const content = read(CATEGORIES_TS);
  for (const r of extractCategoryRoutesFromRegistry(content)) baseRoutes.add(r);
}

// Tool groups
{
  const content = read(TOOL_GROUPS_TS);
  for (const r of extractRoutesFromRegistryLikeObject(content)) baseRoutes.add(r);
}

// Atomic tools
{
  const files = listFilesRecursive(
    ATOMIC_TOOLS_DIR,
    (f) => f.endsWith(".ts") && !f.endsWith(".spec.ts")
  );

  if (files.length === 0) {
    console.warn(`⚠️ No files found under ${ATOMIC_TOOLS_DIR}`);
  }

  for (const file of files) {
    const content = read(file);
    const extracted = extractRoutesFromRegistryLikeObject(content);
    for (const r of extracted) baseRoutes.add(r);
  }
}

// Final base list (no locale)
const baseList = uniq([...baseRoutes].map(normalizeNoTrailingSlash)).sort((a, b) =>
  a.localeCompare(b)
);

// --------------------------------------------------
// BONUS: console output (unique routes, no locale)
// --------------------------------------------------
console.log("");
console.log("🧾 Base routes (unique, no locale):");
for (const r of baseList) console.log(" - " + r);
console.log("🧭 Base routes count:", baseList.length);
console.log("");

// --------------------------------------------------
// Generate sitemaps per locale
// --------------------------------------------------
const sitemapFiles = [];

for (const locale of locales) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️ missing locale folder: ${localeDir}`);
    continue;
  }

  const lastmod = new Date().toISOString();

  const entries = baseList.map((r) => {
    const withLocale = r === "/" ? `/${locale}/` : `/${locale}${r}`;
    return { loc: SITE + withLocale, lastmod };
  });

  const xml = buildUrlset(entries);
  const filename = `sitemap-${locale}.xml`;
  writeFile(path.join(DIST_DIR, filename), xml);

  sitemapFiles.push({ loc: `${SITE}/${filename}` });
}

// Sitemap index
writeFile(
  path.join(DIST_DIR, "sitemap.xml"),
  buildSitemapIndex(sitemapFiles)
);

console.log("✅ Sitemap generation done");
