// Import du fichier json de traductions dans tous les fichiers messages.
// Lancement avec npm run i18n:apply

import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

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

function indexUnitsById(xlfObj) {
  const file = getFileNode(xlfObj);
  const units = normalizeArray(file.unit);
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

function setTarget(unit, value, state = "translated") {
  const seg = getOrCreateSegment(unit);

  // Cas string classique
  if (typeof value === "string") {
    if (!seg.target) {
      seg.target = { "#text": value, "@_state": state };
      return;
    }
    if (typeof seg.target === "string") {
      seg.target = { "#text": seg.target };
    }
    seg.target["#text"] = value;
    seg.target["@_state"] = state;
    return;
  }

  // Cas "rich text" (pc + #text) => on remplace target en gardant la structure
  if (value && typeof value === "object") {
    // Important: on ajoute l'état sans casser la structure
    seg.target = { ...value, "@_state": state };
    return;
  }

  // sinon ignore
}

// ---- args
const inputJson = process.argv[2] ?? path.resolve("dist/i18n/translations.todo.json");
if (!fs.existsSync(inputJson)) {
  console.error(`[i18n-apply] missing input json: ${inputJson}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(inputJson, "utf8"));
const locales = payload?.locales ?? {};
const localeDir = path.resolve("src/locale");

let applied = 0;
let missingUnits = 0;

for (const [locale, items] of Object.entries(locales)) {
  const filePath = path.join(localeDir, `messages.${locale}.xlf`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[i18n-apply] skip missing ${filePath}`);
    continue;
  }

  const xlf = loadXlf(filePath);
  const map = indexUnitsById(xlf);

  let appliedInLocale = 0;

  for (const item of items) {
    const id = item?.id;
    const translatedTargetRaw = item?.translatedTarget;

// string -> trim
    const translatedTarget =
      typeof translatedTargetRaw === "string"
        ? translatedTargetRaw.trim()
        : translatedTargetRaw;

// skip si vide
    const isEmptyString = typeof translatedTarget === "string" && translatedTarget.length === 0;
    const isEmptyObject =
      translatedTarget && typeof translatedTarget === "object"
        ? (translatedTarget["#text"] ?? "").toString().trim().length === 0 && !translatedTarget.pc
        : false;

    if (!id || translatedTarget == null || isEmptyString || isEmptyObject) continue;


    const unit = map.get(id);
    if (!unit) {
      missingUnits++;
      continue;
    }

    setTarget(unit, translatedTarget, "translated");
    applied++;
    appliedInLocale++;
  }

  writeXlf(filePath, xlf);
  console.log(`[i18n-apply] ${locale}: applied ${appliedInLocale}`);
}

console.log(`[i18n-apply] done. applied=${applied}, missingUnits=${missingUnits}`);
