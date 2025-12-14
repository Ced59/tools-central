import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const projectName = "tools-central";
const angularJson = JSON.parse(fs.readFileSync(path.resolve("angular.json"), "utf8"));

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false
});

function normalizeArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function loadXlf(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}

function writeXlf(filePath, obj) {
  if (obj["?xml"]) delete obj["?xml"];
  const xmlBody = builder.build(obj);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}\n`;
  fs.writeFileSync(filePath, xml, "utf8");
}

function getFileNode(xlfObj) {
  const file = xlfObj?.xliff?.file;
  if (!file) throw new Error("Invalid XLF: missing xliff.file");
  return file;
}

function indexUnits(xlfObj) {
  const file = getFileNode(xlfObj);
  const units = normalizeArray(file?.unit);
  const map = new Map();
  for (const u of units) {
    if (u?.["@_id"]) map.set(u["@_id"], u);
  }
  return map;
}

function getOrCreateSegment(unit) {
  unit.segment = unit.segment ?? {};
  return unit.segment;
}

function normalizeTargetToObject(seg) {
  if (!seg.target) return null;
  if (typeof seg.target === "string") {
    seg.target = { "#text": seg.target };
  }
  return seg.target;
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

function setTargetState(unit, state) {
  const seg = getOrCreateSegment(unit);
  if (!seg.target) {
    seg.target = { "#text": "TODO" };
  }
  const t = normalizeTargetToObject(seg);
  t["@_state"] = state;
}

function ensureTarget(unit, defaultText = "TODO", stateIfCreated = "new") {
  const seg = getOrCreateSegment(unit);
  if (!seg.target) {
    seg.target = { "#text": defaultText, "@_state": stateIfCreated };
  } else {
    // normalize into object so we can attach state safely later
    normalizeTargetToObject(seg);
  }
  return unit;
}

function getSourceValue(unit) {
  return unit?.segment?.source;
}

function setSourceValue(unit, newSource) {
  const seg = getOrCreateSegment(unit);
  seg.source = newSource;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---- config
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

const sourceObj = loadXlf(sourceFile);
const sourceUnits = indexUnits(sourceObj);

// ---- main
for (const locale of targetLocales) {
  const targetFile = path.join(outDir, `messages.${locale}.xlf`);

  // locale file absent => create from source with TODO + state=new
  if (!fs.existsSync(targetFile)) {
    const clone = JSON.parse(JSON.stringify(sourceObj));
    const file = getFileNode(clone);
    const units = normalizeArray(file.unit).map(u => ensureTarget(u, "TODO", "new"));
    file.unit = units;

    if (clone.xliff?.["@_srcLang"]) clone.xliff["@_srcLang"] = sourceLocale;
    if (clone.xliff?.["@_trgLang"]) clone.xliff["@_trgLang"] = locale;

    writeXlf(targetFile, clone);
    console.log(`[i18n-sync] created ${targetFile} with TODO targets (state=new)`);
    continue;
  }

  // merge existing
  const targetObj = loadXlf(targetFile);
  const targetUnits = indexUnits(targetObj);

  const file = getFileNode(targetObj);
  const existing = normalizeArray(file.unit);
  const merged = [...existing];

  let addedCount = 0;
  let updatedSourceCount = 0;
  let ensuredTargetCount = 0;

  for (const [id, srcUnit] of sourceUnits.entries()) {
    if (!targetUnits.has(id)) {
      const newUnit = JSON.parse(JSON.stringify(srcUnit));
      ensureTarget(newUnit, "TODO", "new");
      merged.push(newUnit);
      addedCount++;
      continue;
    }

    const unit = targetUnits.get(id);

    // ensure target exists (do NOT overwrite existing translation)
    const beforeTarget = unit?.segment?.target ? 1 : 0;
    ensureTarget(unit, "TODO", "new");
    const afterTarget = unit?.segment?.target ? 1 : 0;
    if (!beforeTarget && afterTarget) ensuredTargetCount++;

    // detect source change
    const srcSource = getSourceValue(srcUnit);
    const tgtSource = getSourceValue(unit);

    if (!deepEqual(tgtSource, srcSource)) {
      // update locale source to match source-locale file
      setSourceValue(unit, JSON.parse(JSON.stringify(srcSource)));

      // mark as needs-review, but keep existing translation text
      // (avoid overriding 'new' if it's already TODO newly created)
      const currentState = getTargetState(unit);
      if (currentState !== "new") {
        setTargetState(unit, "needs-review");
      }

      updatedSourceCount++;
    }
  }

  file.unit = merged;
  writeXlf(targetFile, targetObj);

  console.log(
    `[i18n-sync] merged ${targetFile} (+${addedCount} new, +${ensuredTargetCount} ensured target, ~${updatedSourceCount} source updated)`
  );
}
