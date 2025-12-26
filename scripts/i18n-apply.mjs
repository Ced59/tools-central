// scripts/i18n-apply.mjs
//
// Applique les traductions depuis des fichiers JSON "todo" vers les fichiers XLF.

import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false,
});

// --------------------
// Utils
// --------------------
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
    const id = u?.["@_id"];
    if (id) map.set(id, u);
  }
  return map;
}

function getOrCreateSegment(unit) {
  unit.segment = unit.segment ?? {};
  return unit.segment;
}

// --------------------
// XML illegal control chars helpers
// --------------------
function sanitizeXmlIllegalControlCharsToBackslashEscapes(s) {
  if (typeof s !== "string" || s.length === 0) return s;

  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);

    // allowed
    if (c === 0x09 || c === 0x0A || c === 0x0D) {
      out += s[i];
      continue;
    }

    if (c >= 0x20) {
      out += s[i];
      continue;
    }

    // illegal controls
    if (c === 0x0C) out += "\\\\f";
    else if (c === 0x08) out += "\\\\b";
    else if (c === 0x0B) out += "\\\\v";
    else if (c === 0x00) out += "\\\\0";
    // others: drop
  }

  return out;
}

function sanitizeValueDeep(value) {
  if (typeof value === "string") return sanitizeXmlIllegalControlCharsToBackslashEscapes(value);
  if (value && typeof value === "object") {
    const cloned = Array.isArray(value) ? [...value] : { ...value };
    for (const [k, v] of Object.entries(cloned)) {
      if (typeof v === "string") cloned[k] = sanitizeXmlIllegalControlCharsToBackslashEscapes(v);
      else if (typeof v === "object" && v) cloned[k] = sanitizeValueDeep(v);
    }
    return cloned;
  }
  return value;
}

// --------------------
// KaTeX helpers
// --------------------
function looksLikeKatex(id, value) {
  if ((id ?? "").endsWith("_katex")) return true;

  const s =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value["#text"] ?? "")
        : "";

  return /\\(text|mathrm|dfrac|frac|times|begin|end|left|right|%)/.test(s);
}

/**
 * - Protège { } contre ICU Angular i18n
 * - Double les backslashes simples
 * - Remplace TAB réel par \t littéral
 * - ET applique la sanitization XML (anti contrôles illégaux)
 */
function escapeKatexForXlfString(s) {
  if (typeof s !== "string" || s.length === 0) return s;

  let out = s
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");

  out = out.replace(/\t/g, "\\t");

  // Double uniquement les backslashes non déjà doublés
  out = out.replace(/(?<!\\)\\(?!\\)/g, "\\\\");
  out = sanitizeXmlIllegalControlCharsToBackslashEscapes(out);

  return out;
}

function escapeKatexForXlf(value) {
  if (typeof value === "string") return escapeKatexForXlfString(value);

  if (value && typeof value === "object") {
    const cloned = { ...value };
    if (typeof cloned["#text"] === "string") {
      cloned["#text"] = escapeKatexForXlfString(cloned["#text"]);
    }
    return cloned;
  }

  return value;
}

// --------------------
// XLF target writer
// --------------------
function setTarget(unit, value, state = "translated") {
  const seg = getOrCreateSegment(unit);

  // sanitize globally (even for non-katex)
  const safeValue = sanitizeValueDeep(value);

  if (typeof safeValue === "string") {
    if (!seg.target) {
      seg.target = { "#text": safeValue, "@_state": state };
      return;
    }
    if (typeof seg.target === "string") {
      seg.target = { "#text": seg.target };
    }
    seg.target["#text"] = safeValue;
    seg.target["@_state"] = state;
    return;
  }

  if (safeValue && typeof safeValue === "object") {
    seg.target = { ...safeValue, "@_state": state };
    return;
  }
}

// --------------------
// Input loader (file or directory)
// --------------------
function isDirectory(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function loadTodoPayloads(inputPath) {
  if (!fs.existsSync(inputPath)) return [];

  if (isDirectory(inputPath)) {
    const files = fs
      .readdirSync(inputPath)
      .filter((f) => f.endsWith(".todo.json"))
      .map((f) => path.join(inputPath, f));

    return files.map((f) => ({
      file: f,
      payload: JSON.parse(fs.readFileSync(f, "utf8")),
    }));
  }

  return [
    {
      file: inputPath,
      payload: JSON.parse(fs.readFileSync(inputPath, "utf8")),
    },
  ];
}

// --------------------
// Main
// --------------------
const inputPath = process.argv[2] ?? path.resolve("dist/i18n/todo");
if (!fs.existsSync(inputPath)) {
  console.error(`[i18n-apply] missing input path: ${inputPath}`);
  process.exit(1);
}

const todos = loadTodoPayloads(inputPath);
if (todos.length === 0) {
  console.log(`[i18n-apply] nothing to apply (no *.todo.json found)`);
  process.exit(0);
}

const localeDir = path.resolve("src/locale");

let applied = 0;
let missingUnits = 0;
let skippedEmpty = 0;
let skippedInvalid = 0;

for (const { file: todoFile, payload } of todos) {
  const locale = payload?.locale;
  const items = payload?.items ?? [];

  if (!locale || !Array.isArray(items)) {
    console.warn(`[i18n-apply] skip invalid todo file: ${todoFile}`);
    skippedInvalid++;
    continue;
  }

  const xlfPath = path.join(localeDir, `messages.${locale}.xlf`);
  if (!fs.existsSync(xlfPath)) {
    console.warn(`[i18n-apply] skip missing ${xlfPath} (from ${path.basename(todoFile)})`);
    continue;
  }

  const xlf = loadXlf(xlfPath);
  const map = indexUnitsById(xlf);

  let appliedInLocale = 0;

  for (const item of items) {
    const id = item?.id;
    const translatedTargetRaw = item?.translatedTarget;

    if (!id || translatedTargetRaw == null) {
      skippedEmpty++;
      continue;
    }

    const translatedTarget =
      typeof translatedTargetRaw === "string"
        ? translatedTargetRaw.trim()
        : translatedTargetRaw;

    const isEmptyString = typeof translatedTarget === "string" && translatedTarget.length === 0;

    const isEmptyObject =
      translatedTarget && typeof translatedTarget === "object"
        ? (translatedTarget["#text"] ?? "")
        .toString()
        .trim().length === 0 && !translatedTarget.pc
        : false;

    if (isEmptyString || isEmptyObject) {
      skippedEmpty++;
      continue;
    }

    const unit = map.get(id);
    if (!unit) {
      missingUnits++;
      continue;
    }

    const finalValue = looksLikeKatex(id, translatedTarget)
      ? escapeKatexForXlf(translatedTarget)
      : sanitizeValueDeep(translatedTarget);

    setTarget(unit, finalValue, "translated");
    applied++;
    appliedInLocale++;
  }

  writeXlf(xlfPath, xlf);
  console.log(`[i18n-apply] ${locale}: applied ${appliedInLocale} (from ${path.basename(todoFile)})`);
}

console.log(
  `[i18n-apply] done. applied=${applied}, missingUnits=${missingUnits}, skippedEmpty=${skippedEmpty}, skippedInvalid=${skippedInvalid}`
);
