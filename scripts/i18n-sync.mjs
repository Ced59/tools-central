import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const projectName = "tools-central";
const angularJson = JSON.parse(fs.readFileSync(path.resolve("angular.json"), "utf8"));
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false
});

const project = angularJson.projects?.[projectName];
if (!project?.i18n?.sourceLocale || !project?.i18n?.locales) {
  console.error(`[i18n-sync] missing i18n config in angular.json for "${projectName}"`);
  process.exit(1);
}

const sourceLocale = project.i18n.sourceLocale;
const targetLocales = Object.keys(project.i18n.locales);

const outDir = path.resolve("src/locale");
const sourceFile = path.join(outDir, `messages.${sourceLocale}.xlf`);

if (!fs.existsSync(sourceFile)) {
  console.error(`[i18n-sync] missing source: ${sourceFile}`);
  process.exit(1);
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function normalizeArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function indexUnits(xlfObj) {
  const file = xlfObj?.xliff?.file;
  const units = normalizeArray(file?.unit);
  const map = new Map();
  for (const u of units) {
    if (u?.["@_id"]) map.set(u["@_id"], u);
  }
  return map;
}

function ensureTarget(unit, defaultText = "@@TODO_TRANSLATE@@") {
  // XLF2: unit.segment.target
  const seg = unit.segment ?? {};
  if (!seg.target) {
    seg.target = defaultText;
    // optionnel: indiquer l'état
    // seg.target = { "#text": defaultText, "@_state": "new" };
  }
  unit.segment = seg;
  return unit;
}

function loadXlf(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}

function writeXlf(filePath, obj) {
  // ✅ important: si jamais un '?xml' traine, on le vire
  if (obj["?xml"]) delete obj["?xml"];

  const xmlBody = builder.build(obj);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}\n`;
  fs.writeFileSync(filePath, xml, "utf8");
}

const sourceObj = loadXlf(sourceFile);
const sourceUnits = indexUnits(sourceObj);

// Pour chaque locale cible : créer si absent, sinon merger
for (const locale of targetLocales) {
  const targetFile = path.join(outDir, `messages.${locale}.xlf`);

  // si pas de fichier => on crée une base avec targets TODO partout
  if (!fs.existsSync(targetFile)) {
    const clone = JSON.parse(JSON.stringify(sourceObj));
    const file = clone.xliff.file;
    const units = normalizeArray(file.unit).map(u => ensureTarget(u, "TODO"));
    file.unit = units;

    // met à jour srcLang (optionnel)
    if (clone.xliff?.["@_srcLang"]) clone.xliff["@_srcLang"] = sourceLocale;

    writeXlf(targetFile, clone);
    console.log(`[i18n-sync] created ${targetFile} with TODO targets`);
    continue;
  }

  // fichier existant => merge sans écraser les targets existants
  const targetObj = loadXlf(targetFile);
  const targetUnits = indexUnits(targetObj);

  const file = targetObj.xliff.file;
  const existing = normalizeArray(file.unit);

  const merged = [...existing]; // on conserve tout

  // ajoute les nouvelles units
  for (const [id, srcUnit] of sourceUnits.entries()) {
    if (!targetUnits.has(id)) {
      const newUnit = ensureTarget(JSON.parse(JSON.stringify(srcUnit)), "TODO");
      merged.push(newUnit);
    } else {
      // si l’unit existe mais pas de target => on ajoute TODO sans toucher à ce qui existe
      const unit = targetUnits.get(id);
      ensureTarget(unit, "TODO");
    }
  }

  file.unit = merged;
  writeXlf(targetFile, targetObj);
  console.log(`[i18n-sync] merged ${targetFile} (+TODO for missing targets)`);
}
