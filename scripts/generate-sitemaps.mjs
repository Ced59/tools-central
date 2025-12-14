import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://www.tools-central.com";

// Data files (optionnels, pour compléter si dispo)
const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOLS_TS = path.resolve("src/app/data/tools.ts");
const INCLUDE_COMING_SOON_TOOLS = false;

// ========== locales ==========
function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) throw new Error(`No i18n config for "${PROJECT_NAME}"`);

  const sourceLocale = project.i18n.sourceLocale;
  const locales = Object.keys(project.i18n.locales || {});
  return [sourceLocale, ...locales];
}

// ========== helpers ==========
function toPosix(p) {
  return p.split(path.sep).join("/");
}

function normalizeRoute(route) {
  // convert multiple slashes, remove trailing slash except "/xx/"
  route = route.replace(/\/{2,}/g, "/");

  // Keep locale root "/fr/"
  if (/^\/[A-Za-z-]+\/$/.test(route)) return route;

  // remove trailing slash
  if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
  return route;
}

function escapeXml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
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
    <loc>${escapeXml(i.loc)}</loc>
    <lastmod>${escapeXml(now)}</lastmod>
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

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

// ========== dist scan (source de vérité) ==========
function computeRoutesFromDist(locale) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) return [];

  const htmlFiles = walkFiles(localeDir).filter((f) => f.endsWith(".html"));

  const routes = new Set();

  for (const filePath of htmlFiles) {
    const rel = toPosix(path.relative(localeDir, filePath)); // e.g. categories/math/index.html

    // Exclusions SSR/CSR
    if (rel.includes(".csr")) continue;
    if (rel.includes(".server")) continue;
    if (rel.includes("index.csr")) continue;

    // Exclude assets
    if (rel.startsWith("assets/")) continue;

    // Convert index.html -> folder route
    if (rel === "index.html") {
      routes.add(`/${locale}/`);
      continue;
    }

    if (rel.endsWith("/index.html")) {
      const dirRel = rel.slice(0, -"index.html".length); // keep trailing slash
      const route = normalizeRoute(`/${locale}/${dirRel}`);
      routes.add(route);
      continue;
    }

    // any other .html => /path (rare)
    const withoutExt = rel.replace(/\.html$/, "");
    routes.add(normalizeRoute(`/${locale}/${withoutExt}`));
  }

  return [...routes];
}

// ========== optional: extract from TS (fallback) ==========
// Note: On garde ça souple. Mais le sitemap principal est basé sur dist.
function pick(block, keys) {
  for (const k of keys) {
    const re = new RegExp(`${k}\\s*:\\s*['"]([^'"]+)['"]`);
    const m = block.match(re);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

function extractToolsFromTs(tsContent) {
  const tools = [];

  // naive object blocks - OK tant que tools.ts est une liste d'objets simples
  const objectBlocks = tsContent.match(/\{[\s\S]*?\}/g) || [];
  for (const block of objectBlocks) {
    const idTool = pick(block, ["idTool", "toolId", "id"]);
    const idCategory = pick(block, ["idCategory", "categoryId", "category"]);
    const idGroup = pick(block, ["idGroup", "groupId", "group", "subCategory", "subCategoryId"]);

    const availableRaw = block.match(/available\s*:\s*(true|false)/)?.[1];
    const available = availableRaw ? availableRaw === "true" : undefined;

    if (idTool && idCategory && idGroup) {
      tools.push({ idTool, idCategory, idGroup, available });
    }
  }

  const uniq = new Map(tools.map((t) => [`${t.idCategory}:${t.idGroup}:${t.idTool}`, t]));
  return [...uniq.values()];
}

function computeDynamicRoutesFromData() {
  const routes = new Set();

  // pages fixes
  routes.add("/categories");

  // catégories (niveau 1)
  if (fs.existsSync(CATEGORIES_TS)) {
    const catTs = fs.readFileSync(CATEGORIES_TS, "utf8");
    // id: 'math'
    const ids = [...catTs.matchAll(/id\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const idCategory of new Set(ids)) {
      routes.add(`/categories/${idCategory}`);
    }
  }

  // groups + tools (niveaux 2/3)
  if (fs.existsSync(TOOLS_TS)) {
    const toolTs = fs.readFileSync(TOOLS_TS, "utf8");
    const tools = extractToolsFromTs(toolTs);

    for (const t of tools) {
      if (!INCLUDE_COMING_SOON_TOOLS && t.available === false) continue;
      routes.add(`/categories/${t.idCategory}/${t.idGroup}`);
      routes.add(`/categories/${t.idCategory}/${t.idGroup}/${t.idTool}`);
    }
  }

  return [...routes];
}

// ========== main ==========
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`DIST_DIR not found: ${DIST_DIR} (build first)`);
}

const locales = readAngularLocales();
console.log("🌍 Locales:", locales.join(", "));

const dynamicRoutes = computeDynamicRoutesFromData();
console.log("🧭 Dynamic routes (data):", dynamicRoutes);

const sitemapFiles = [];

for (const locale of locales) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️ missing locale folder: ${localeDir}`);
    continue;
  }

  const distRoutes = computeRoutesFromDist(locale);

  // Combine (dist = vérité, data = complément si manquant)
  const allRoutes = new Set(distRoutes);

  // Add dynamic routes prefixées
  for (const r of dynamicRoutes) {
    if (r === "/") allRoutes.add(`/${locale}/`);
    else allRoutes.add(normalizeRoute(`/${locale}${r}`));
  }

  // Important: si tu veux STRICTEMENT ce qui existe en dist, commente le bloc ci-dessus.
  // Mais ton besoin actuel = "assurer toutes les profondeurs" => on tente de compléter.

  const lastmod = new Date().toISOString();

  const entries = [...allRoutes]
    .filter(Boolean)
    .map((route) => ({
      loc: SITE + route,
      lastmod,
    }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const xml = buildUrlset(entries);
  const filename = `sitemap-${locale}.xml`;
  writeFile(path.join(DIST_DIR, filename), xml);

  sitemapFiles.push({ loc: `${SITE}/${filename}` });
}

writeFile(path.join(DIST_DIR, "sitemap.xml"), buildSitemapIndex(sitemapFiles));
