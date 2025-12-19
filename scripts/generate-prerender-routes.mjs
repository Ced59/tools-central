import fs from "node:fs";
import path from "node:path";

const OUT_FILE = path.resolve("dist/prerender-routes.txt");

// Sources
const CATEGORIES_TS = path.resolve("src/app/data/categories.ts");
const TOOL_GROUPS_TS = path.resolve("src/app/data/tool-groups.ts");
const ATOMIC_TOOLS_TS = path.resolve("src/app/data/atomic-tools.ts");

// Inclure les éléments disponibles=false ?
const INCLUDE_COMING_SOON = false;

// ---- helpers
function read(file) {
  if (!fs.existsSync(file)) {
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}

// Parse très simple : on récupère les objets { ... } puis on lit route/available
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

function extractCategoryRoutes(tsContent) {
  // categories.ts n'a pas "route", donc on fabrique /categories/<id>
  const ids = [...tsContent.matchAll(/id\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const uniqIds = uniq(ids);

  const out = [];
  for (const id of uniqIds) {
    out.push(`/categories/${id}`);
  }
  return out;
}

// ---- main
const routes = new Set();

// pages fixes
routes.add(`/`);
routes.add(`/categories`);

// pages catégories
for (const r of extractCategoryRoutes(read(CATEGORIES_TS))) {
  routes.add(r);
}

// pages groups (2 segments) + pages tools (3 segments)
for (const r of extractRoutesFromArrayTs(read(TOOL_GROUPS_TS))) {
  routes.add(r);
}
for (const r of extractRoutesFromArrayTs(read(ATOMIC_TOOLS_TS))) {
  routes.add(r);
}

// normalisation (pas de trailing slash sauf "/")
const normalized = uniq(
  [...routes].map((r) => {
    if (r === "/") {
      return "/";
    }
    return r.replace(/\/+$/g, ""); // enlève / final
  })
).sort((a, b) => a.localeCompare(b));

// output 1 route par ligne
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, normalized.join("\n") + "\n", "utf8");

console.log(`✅ prerender routes written: ${OUT_FILE}`);
console.log(`   count=${normalized.length}`);
