import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const projectName = "tools-central";
const angularJson = JSON.parse(fs.readFileSync(path.resolve("angular.json"), "utf8"));
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function normalizeArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function loadXlf(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}

function getFileNode(xlfObj) {
  const file = xlfObj?.xliff?.file;
  if (!file) throw new Error("Invalid XLF: missing xliff.file");
  return file;
}

function getTargetText(unit) {
  const t = unit?.segment?.target;
  if (!t) return "";
  if (typeof t === "string") return t;
  return t["#text"] ?? "";
}

function getTargetState(unit) {
  const t = unit?.segment?.target;
  if (!t || typeof t === "string") return "";
  return t["@_state"] ?? "";
}

function getSourceValue(unit) {
  // ✅ IMPORTANT: keep as string OR object (with ph / text / etc.)
  return unit?.segment?.source;
}

// ---- config
const project = angularJson.projects?.[projectName];
if (!project?.i18n?.sourceLocale || !project?.i18n?.locales) {
  console.error(`[i18n-aggregate] missing i18n config in angular.json for "${projectName}"`);
  process.exit(1);
}

const sourceLocale = project.i18n.sourceLocale;
const targetLocales = Object.keys(project.i18n.locales);

const localeDir = path.resolve("src/locale");
const outDir = path.resolve("dist/i18n");
fs.mkdirSync(outDir, { recursive: true });

const outputFile = path.join(outDir, "translations.todo.json");

const payload = {
  generatedAt: new Date().toISOString(),
  projectName,
  sourceLocale,
  locales: {}
};

let total = 0;

for (const locale of targetLocales) {
  const filePath = path.join(localeDir, `messages.${locale}.xlf`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[i18n-aggregate] skip missing ${filePath}`);
    continue;
  }

  const xlf = loadXlf(filePath);
  const file = getFileNode(xlf);
  const units = normalizeArray(file.unit);

  const items = [];

  for (const u of units) {
    const id = u?.["@_id"];
    if (!id) continue;

    const state = getTargetState(u);
    const targetText = getTargetText(u);
    const isTodo = (targetText || "").trim() === "TODO";
    const isFlagged = state === "new" || state === "needs-review";

    if (!isTodo && !isFlagged) continue;

    items.push({
      id,
      status: isTodo && !isFlagged ? "new" : (state || "new"),
      source: getSourceValue(u),           // ✅ object preserved
      currentTarget: targetText,
      translatedTarget: ""                 // to be filled
    });
  }

  items.sort((a, b) => a.id.localeCompare(b.id));

  payload.locales[locale] = items;
  total += items.length;

  console.log(`[i18n-aggregate] ${locale}: ${items.length} items`);
}

fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), "utf8");
console.log(`[i18n-aggregate] wrote ${outputFile} (${total} total)`);
