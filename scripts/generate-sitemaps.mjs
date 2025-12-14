import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";

// ✅ mets ton domaine canonique (tu l’as demandé)
const SITE = "https://www.tools-central.com";

// tes sources de data
const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOLS_TS = path.resolve("src/app/data/tools.ts");

// Inclure les tools non dispo dans le sitemap ? (souvent non)
const INCLUDE_COMING_SOON_TOOLS = false;

// ---------- locales ----------
function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) throw new Error(`No i18n config for "${PROJECT_NAME}"`);

  const sourceLocale = project.i18n.sourceLocale; // ex "fr"
  const locales = Object.keys(project.i18n.locales || {}); // ex ["en","de"]
  return [sourceLocale, ...locales];
}

// ---------- filesystem helpers ----------
function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

// Normalise sans slash final (sauf racine locale /fr/)
function normalizePathNoTrailingSlash(p) {
  p = p.replace(/\/{2,}/g, "/");
  if (p === "/") return p;
  // garde "/fr/" (racine locale)
  if (/^\/[a-z]{2}\/$/i.test(p)) return p;
  return p.endsWith("/") ? p.slice(0, -1) : p;
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

// ---------- extraction des ids depuis TS (simple et robuste pour ton format) ----------
function extractCategoryIdsFromTs(tsContent) {
  // capture id: 'math'
  const ids = [...tsContent.matchAll(/id\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  // dédoublonne
  return [...new Set(ids)];
}

function pick(block, keys) {
  for (const k of keys) {
    const m = block.match(new RegExp(`${k}\\s*:\\s*['"]([^'"]+)['"]`));
    if (m?.[1]) return m[1];
  }
  return undefined;
}

function extractToolsFromTs(tsContent) {
  const tools = [];

  const objectBlocks = tsContent.match(/\{[\s\S]*?\}/g) || [];
  for (const block of objectBlocks) {
    const idTool = pick(block, ["idTool", "toolId", "id"]);
    const idCategory = pick(block, ["idCategory", "categoryId", "category"]);
    const idGroup = pick(block, ["idGroup", "groupId", "group"]);

    const availableRaw = block.match(/available\s*:\s*(true|false)/)?.[1];
    const available = availableRaw ? availableRaw === "true" : undefined;

    if (idTool && idCategory && idGroup) {
      tools.push({ idTool, idCategory, idGroup, available });
    }
  }

  const uniq = new Map(tools.map(t => [`${t.idCategory}:${t.idGroup}:${t.idTool}`, t]));
  return [...uniq.values()];
}

// ---------- 1) routes dynamiques (issues de tes data) ----------
function computeDynamicRoutes() {
  const routes = new Set();

  // pages “fixes”
  routes.add("/categories");

  if (fs.existsSync(CATEGORIES_TS)) {
    const catTs = fs.readFileSync(CATEGORIES_TS, "utf8");
    for (const catId of extractCategoryIdsFromTs(catTs)) {
      routes.add(`/categories/${catId}`);
    }
  }

  if (fs.existsSync(TOOLS_TS)) {
    const toolTs = fs.readFileSync(TOOLS_TS, "utf8");
    for (const t of extractToolsFromTs(toolTs)) {
      if (!INCLUDE_COMING_SOON_TOOLS && t.available === false) continue;

      // page groupe (2 segments)
      routes.add(`/categories/${t.idCategory}/${t.idGroup}`);

      // page outil (3 segments)
      routes.add(`/categories/${t.idCategory}/${t.idGroup}/${t.idTool}`);
    }
  }

  return [...routes];
}

// ---------- 2) scan du dist (en excluant les trucs CSR/Server) ----------
function computeRoutesFromDist(locale) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) return [];

  const files = walkFiles(localeDir).filter((f) => f.endsWith(".html"));

  const routes = [];
  for (const f of files) {
    const rel = toPosix(path.relative(localeDir, f)); // ex: "categories/math/index.html" ou "index.csr.html"

    // ❌ exclusions Angular SSR (très important)
    if (rel.includes(".csr")) continue;
    if (rel.includes(".server")) continue;
    if (rel.includes("index.csr")) continue;

    // on ne prend pas les pages d'assets/ ou trucs non-pages
    if (rel.startsWith("assets/")) continue;

    // index.html => route du dossier
    if (rel.endsWith("/index.html") || rel === "index.html") {
      const dirRel = rel === "index.html" ? "" : rel.slice(0, -"index.html".length); // "categories/math/"
      // /fr/ + dirRel
      const route = normalizePathNoTrailingSlash(`/${locale}/${dirRel}`);
      routes.push(route === `/${locale}` ? `/${locale}/` : route); // garde /fr/ pour racine
      continue;
    }

    // foo.html => /foo
    const withoutExt = rel.replace(/\.html$/, "");
    const route = normalizePathNoTrailingSlash(`/${locale}/${withoutExt}`);
    routes.push(route);
  }

  return [...new Set(routes)];
}

// ---------- main ----------
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`DIST_DIR not found: ${DIST_DIR} (build first)`);
}

const locales = readAngularLocales();
console.log("🌍 Locales:", locales.join(", "));

const dynamicRoutes = computeDynamicRoutes();
console.log("🧭 Dynamic routes:", dynamicRoutes);

const sitemapFiles = [];

for (const locale of locales) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️ missing locale folder: ${localeDir}`);
    continue;
  }

  const distRoutes = computeRoutesFromDist(locale);

  // on combine
  const allRoutes = new Set();

  // 1) scan dist
  for (const r of distRoutes) allRoutes.add(r);

  // 2) routes dynamiques (préfixées par locale)
  for (const r of dynamicRoutes) {
    if (r === "/") allRoutes.add(`/${locale}/`);
    else allRoutes.add(normalizePathNoTrailingSlash(`/${locale}${r}`));
  }

  // lastmod : on met "now" (sinon on doit mapper chaque route vers un fichier, plus lourd)
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
