import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://www.tools-central.com";

// Sources data (SSOT)
const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOL_GROUPS_TS = path.resolve("src/app/data/tool-groups.ts");
const ATOMIC_TOOLS_DIR = path.resolve("src/app/data/atomic-tools");

// Config
const INCLUDE_COMING_SOON = false;

// ---------- locales ----------
function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) {
    throw new Error(`No i18n config for "${PROJECT_NAME}"`);
  }

  const sourceLocale = project.i18n.sourceLocale; // ex: "fr"
  const locales = Object.keys(project.i18n.locales || {});
  return [sourceLocale, ...locales];
}

// ---------- fs helpers ----------
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

// ---------- route extraction ----------

/**
 * Catégories: lire les clés top-level de CATEGORY_REGISTRY
 * (math/text/image...)
 */
function extractCategoryRoutesFromRegistry(tsContent) {
  const body =
    tsContent.match(/export\s+const\s+CATEGORY_REGISTRY\s*=\s*\{([\s\S]*?)\}\s*as\s*const\s*;/)?.[1] ??
    "";

  const keys = [...body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*:\s*\{/gm)].map((m) => m[1]);
  return uniq(keys).map((id) => `/categories/${id}`);
}

/**
 * Extrait routes.group('cat','group') / routes.tool('cat','group','tool')
 * en tenant compte de available:false (si INCLUDE_COMING_SOON=false).
 *
 * Fonctionne sur:
 * - TOOL_GROUP_REGISTRY (nested objects)
 * - export const XXX_TOOLS = { ... } (atomic tools)
 */
function extractRoutesFromRegistryLikeObject(tsContent) {
  const routes = [];

  // Match "key: { ... }" ou "'key': { ... }" et capture le body entre { ... }
  // Note: on s’appuie sur ton style: une entrée par objet, fermée par "},"
  const entryRegex =
    /(^|\n)\s*(?:['"]([^'"]+)['"]|([A-Za-z0-9_-]+))\s*:\s*\{([\s\S]*?)\n\s*\}\s*,?/g;

  let m;
  while ((m = entryRegex.exec(tsContent)) !== null) {
    const body = m[4] || "";

    // available
    const availableRaw = body.match(/available\s*:\s*(true|false)/)?.[1];
    const available = availableRaw ? availableRaw === "true" : true;
    if (!INCLUDE_COMING_SOON && available === false) continue;

    // routes.tool(cat, group, tool)
    for (const t of body.matchAll(
      /routes\.tool\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g
    )) {
      const [, cat, group, tool] = t;
      routes.push(`/categories/${cat}/${group}/${tool}`);
    }

    // routes.group(cat, group)
    for (const g of body.matchAll(
      /routes\.group\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g
    )) {
      const [, cat, group] = g;
      routes.push(`/categories/${cat}/${group}`);
    }

    // route: '/xxx' (au cas où tu as des routes directes)
    for (const d of body.matchAll(/route\s*:\s*['"]([^'"]+)['"]/g)) {
      routes.push(d[1]);
    }
  }

  return routes;
}

function normalizeNoTrailingSlash(p) {
  if (p === "/") return "/";
  return p.replace(/\/+$/g, "");
}

// ---------- sitemap builders ----------
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

// ---------- main ----------
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`DIST_DIR not found: ${DIST_DIR} (build first)`);
}

const locales = readAngularLocales();
console.log("🌍 Locales:", locales.join(", "));

const baseRoutes = new Set();
baseRoutes.add("/");
baseRoutes.add("/categories");

// categories
{
  const content = read(CATEGORIES_TS);
  for (const r of extractCategoryRoutesFromRegistry(content)) baseRoutes.add(r);
}

// groups
{
  const content = read(TOOL_GROUPS_TS);
  for (const r of extractRoutesFromRegistryLikeObject(content)) baseRoutes.add(r);
}

// atomic tools: scan folder recursively
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

const baseList = uniq([...baseRoutes].map(normalizeNoTrailingSlash)).sort((a, b) =>
  a.localeCompare(b)
);

console.log("🧭 Base routes count:", baseList.length);

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

writeFile(path.join(DIST_DIR, "sitemap.xml"), buildSitemapIndex(sitemapFiles));
console.log("✅ Done");
