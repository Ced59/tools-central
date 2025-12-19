import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const ANGULAR_JSON = path.resolve("angular.json");
const PROJECT_NAME = "tools-central";
const SITE = "https://www.tools-central.com";

const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOL_GROUPS_TS = path.resolve("src/app/data/tool-groups.ts");
const ATOMIC_TOOLS_TS = path.resolve("src/app/data/atomic-tools.ts");

const INCLUDE_COMING_SOON = false;

// ---------- locales ----------
function readAngularLocales() {
  const angular = JSON.parse(fs.readFileSync(ANGULAR_JSON, "utf8"));
  const project = angular.projects?.[PROJECT_NAME];
  if (!project?.i18n) {
    throw new Error(`No i18n config for "${PROJECT_NAME}"`);
  }

  const sourceLocale = project.i18n.sourceLocale; // "fr"
  const locales = Object.keys(project.i18n.locales || {});
  return [sourceLocale, ...locales];
}

// ---------- parsing helpers ----------
function read(file) {
  if (!fs.existsSync(file)) {
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}

function extractCategoryRoutes(tsContent) {
  // id: 'math' -> /categories/math
  const ids = [...tsContent.matchAll(/id\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return uniq(ids).map((id) => `/categories/${id}`);
}

function extractRoutesFromArrayTs(tsContent) {
  const routes = [];
  const blocks = tsContent.match(/\{[\s\S]*?\}/g) ?? [];

  for (const b of blocks) {
    // Chercher route: "..." OU route: routes.xxx(...)
    const directRoute = b.match(/route\s*:\s*['"]([^'"]+)['"]/)?.[1];
    const dynamicRoute = b.match(/route\s*:\s*routes\.tool\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
    const groupRoute = b.match(/route\s*:\s*routes\.group\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);

    const availableRaw = b.match(/available\s*:\s*(true|false)/)?.[1];
    const available = availableRaw ? availableRaw === "true" : true;

    let route = null;

    if (directRoute) {
      route = directRoute;
    } else if (dynamicRoute) {
      // routes.tool(cat, group, tool) -> /categories/cat/group/tool
      const [, cat, group, tool] = dynamicRoute;
      route = `/categories/${cat}/${group}/${tool}`;
    } else if (groupRoute) {
      // routes.group(cat, group) -> /categories/cat/group
      const [, cat, group] = groupRoute;
      route = `/categories/${cat}/${group}`;
    }

    if (!route) {
      continue;
    }
    if (!INCLUDE_COMING_SOON && available === false) {
      continue;
    }

    routes.push(route);
  }
  return routes;
}

function normalizeNoTrailingSlash(p) {
  if (p === "/") {
    return "/";
  }
  return p.replace(/\/+$/g, "");
}

function buildUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(({ loc, lastmod }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`)
    .join("\n")}
</urlset>
`;
}

function buildSitemapIndex(items) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
    .map((i) => `  <sitemap>
    <loc>${i.loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`)
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

// routes "canon" (sans prefix locale)
const baseRoutes = new Set();
baseRoutes.add("/");
baseRoutes.add("/categories");

// catégories
for (const r of extractCategoryRoutes(read(CATEGORIES_TS))) {
  baseRoutes.add(r);
}

// groups + atomic tools
for (const r of extractRoutesFromArrayTs(read(TOOL_GROUPS_TS))) {
  baseRoutes.add(r);
}
for (const r of extractRoutesFromArrayTs(read(ATOMIC_TOOLS_TS))) {
  baseRoutes.add(r);
}

const baseList = uniq([...baseRoutes].map(normalizeNoTrailingSlash)).sort((a, b) => a.localeCompare(b));
console.log("🧭 Base routes:", baseList);

const sitemapFiles = [];

for (const locale of locales) {
  const localeDir = path.join(DIST_DIR, locale);
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️ missing locale folder: ${localeDir}`);
    continue;
  }

  const lastmod = new Date().toISOString();

  // prefix locale : /fr + route
  const entries = baseList.map((r) => {
    const withLocale = r === "/" ? `/${locale}/` : `/${locale}${r}`;
    return {
      loc: SITE + withLocale,
      lastmod,
    };
  });

  const xml = buildUrlset(entries);
  const filename = `sitemap-${locale}.xml`;
  writeFile(path.join(DIST_DIR, filename), xml);

  sitemapFiles.push({ loc: `${SITE}/${filename}` });
}

writeFile(path.join(DIST_DIR, "sitemap.xml"), buildSitemapIndex(sitemapFiles));
