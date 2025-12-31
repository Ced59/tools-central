// scripts/editorials-generate.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const ATOMIC_TOOLS_DIR = path.join(ROOT, "src/app/data/atomic-tools");
const EDITORIALS_DIR = path.join(ROOT, "src/app/data/editorials");
const REGISTRY_PATH = path.join(EDITORIALS_DIR, "editorials.registry.ts");

const DRY_RUN = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force"); // overwrite even if file exists

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function writeText(file, content) {
  ensureDir(path.dirname(file));
  if (DRY_RUN) return;
  fs.writeFileSync(file, content, "utf8");
}

function safeIdentifier(s) {
  return s.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Extract tool blocks:
 * 'tool-id': { ... },
 *
 * Returns array of:
 * { toolId, category, group, titleText? }
 */
function extractToolsFromAtomicFile(tsSource) {
  const results = [];

  const blockRegex = /'([^']+)'\s*:\s*{([\s\S]*?)\n\s*},/g;
  let m;

  while ((m = blockRegex.exec(tsSource)) !== null) {
    const toolId = m[1];
    const body = m[2];

    const category = body.match(/category\s*:\s*'([^']+)'/)?.[1] ?? null;
    const group = body.match(/group\s*:\s*'([^']+)'/)?.[1] ?? null;

    // Only tools with category+group are eligible
    if (!category || !group) continue;

    // Try to extract the default localized title text (FR) for nicer placeholder
    // Example: title: $localize`:@@id:Mon titre`
    const titleText =
      body.match(/title\s*:\s*\$localize`[^`]*:([^`]+)`/)?.[1]?.trim() ?? null;

    results.push({ toolId, category, group, titleText });
  }

  return results;
}

function buildEditorialFileContent({ category, group, toolId, titleText }) {
  const keyBase = safeIdentifier(`${category}_${group}_${toolId}`);
  const defaultTitle =
    titleText ? `À propos : ${titleText}` : `À propos de l’outil ${toolId}`;

  const modelImport = buildRelativeImport(category, group);

  return `import { ToolEditorialModel } from "${modelImport}";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = false;

export const editorial: ToolEditorialModel = {
  title: $localize\`:@@ed_${keyBase}_title:${defaultTitle}\`,
  lead: $localize\`:@@ed_${keyBase}_lead:TODO: Décrire l’objectif exact de cet outil (intention unique, pas une paraphrase d’un autre).\`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize\`:@@ed_${keyBase}_usecases:Cas d’utilisation\`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize\`:@@ed_${keyBase}_uc1_title:TODO\`, text: $localize\`:@@ed_${keyBase}_uc1_text:TODO: Exemple concret 1\` },
        { title: $localize\`:@@ed_${keyBase}_uc2_title:TODO\`, text: $localize\`:@@ed_${keyBase}_uc2_text:TODO: Exemple concret 2\` },
        { title: $localize\`:@@ed_${keyBase}_uc3_title:TODO\`, text: $localize\`:@@ed_${keyBase}_uc3_text:TODO: Exemple concret 3\` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize\`:@@ed_${keyBase}_output:Ce que vous obtenez\`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize\`:@@ed_${keyBase}_out1:TODO: Décrire précisément la sortie.\`,
        $localize\`:@@ed_${keyBase}_out2:TODO: À quoi sert cette sortie.\`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize\`:@@ed_${keyBase}_limits:Limites et points d’attention\`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize\`:@@ed_${keyBase}_lim1:TODO.\` },
        { text: $localize\`:@@ed_${keyBase}_lim2:TODO.\` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize\`:@@ed_${keyBase}_faq:Questions fréquentes\`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize\`:@@ed_${keyBase}_q1:TODO\`, a: $localize\`:@@ed_${keyBase}_a1:TODO\` },
        { q: $localize\`:@@ed_${keyBase}_q2:TODO\`, a: $localize\`:@@ed_${keyBase}_a2:TODO\` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize\`:@@ed_${keyBase}_tip_title:Astuce\`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize\`:@@ed_${keyBase}_tip:TODO: Une astuce unique liée à l’intention de l’outil.\`,
    },
  ],
};
`;
}

function readEditorialReadyFlag(filePath) {
  const src = readText(filePath);
  const m = src.match(/export\s+const\s+editorialReady\s*=\s*(true|false)\s*;/);
  return m?.[1] === "true";
}

function generateRegistry(entries) {
  // entries: { key, importPath, available }
  const lines = [];
  lines.push(`import type { ToolEditorialModel } from '../../models/tool-editorial/tool-editorial.model';`);
  lines.push("");
  lines.push(`export type EditorialLoader = () => Promise<{ editorial: ToolEditorialModel; editorialReady?: boolean }>;`);
  lines.push("");
  lines.push(`export interface EditorialRegistryEntry {`);
  lines.push(`  available: boolean;`);
  lines.push(`  load: EditorialLoader;`);
  lines.push(`}`);
  lines.push("");
  lines.push(`/**`);
  lines.push(` * AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.`);
  lines.push(` * Run: npm run editorials:gen`);
  lines.push(` */`);
  lines.push(`export const EDITORIAL_REGISTRY: Record<string, EditorialRegistryEntry> = {`);

  for (const e of entries.sort((a, b) => a.key.localeCompare(b.key))) {
    lines.push(`  '${e.key}': {`);
    lines.push(`    available: ${e.available ? "true" : "false"},`);
    lines.push(`    load: () => import('${e.importPath}'),`);
    lines.push(`  },`);
  }

  lines.push(`} as const;`);
  lines.push("");
  return lines.join("\n");
}

function buildRelativeImport(category, group) {
  // editorial file is at: src/app/data/editorials/<category>/<group>/<tool>.editorial.ts
  // target is:           src/app/models/tool-editorial/tool-editorial.model.ts
  // so we need to go up 4 levels
  return `../../../../models/tool-editorial/tool-editorial.model`;
}

function main() {
  if (!fs.existsSync(ATOMIC_TOOLS_DIR)) {
    console.error(`❌ atomic-tools directory not found: ${ATOMIC_TOOLS_DIR}`);
    process.exit(1);
  }

  ensureDir(EDITORIALS_DIR);

  const atomicFiles = walk(ATOMIC_TOOLS_DIR)
    .filter(f => !f.endsWith(`${path.sep}index.ts`));

  const allTools = [];
  for (const f of atomicFiles) {
    const src = readText(f);
    const tools = extractToolsFromAtomicFile(src);
    allTools.push(...tools);
  }

  // Generate editorial files
  const created = [];
  for (const t of allTools) {
    const outDir = path.join(EDITORIALS_DIR, t.category, t.group);
    const outFile = path.join(outDir, `${t.toolId}.editorial.ts`);

    if (fs.existsSync(outFile) && !FORCE) continue;

    const content = buildEditorialFileContent(t);
    created.push(outFile);
    writeText(outFile, content);
  }

  // Build registry from existing editorials
  const editorialFiles = walk(EDITORIALS_DIR)
    .filter(f => f.endsWith(".editorial.ts"))
    .filter(f => !f.endsWith(`${path.sep}editorials.registry.ts`));

  const registryEntries = [];
  for (const file of editorialFiles) {
    // file: .../src/app/data/editorials/<cat>/<group>/<tool>.editorial.ts
    const rel = path.relative(EDITORIALS_DIR, file).replace(/\\/g, "/");
    const parts = rel.split("/");
    if (parts.length < 3) continue;

    const category = parts[0];
    const group = parts[1];
    const filename = parts[2];
    const toolId = filename.replace(/\.editorial\.ts$/, "");

    const key = `${category}/${group}/${toolId}`;
    const available = readEditorialReadyFlag(file);

    // import path from registry file location: ./<cat>/<group>/<tool>.editorial
    const importPath = `./${category}/${group}/${toolId}.editorial`;

    registryEntries.push({ key, importPath, available });
  }

  const registryContent = generateRegistry(registryEntries);
  writeText(REGISTRY_PATH, registryContent);

  console.log(`✅ editorials: scanned atomic-tools (${atomicFiles.length} files)`);
  console.log(`✅ editorials: found tools = ${allTools.length}`);
  console.log(`✅ editorials: created/overwritten = ${created.length}${DRY_RUN ? " (dry-run)" : ""}`);
  console.log(`✅ editorials: registry generated = ${path.relative(ROOT, REGISTRY_PATH)}`);
  if (created.length) {
    console.log(`ℹ️ Set "export const editorialReady = true;" in an editorial file to activate it.`);
  }
}

main();
