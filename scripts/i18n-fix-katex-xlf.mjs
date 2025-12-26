// scripts/i18n-fix-katex-xlf.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const localeDir = path.resolve("src/locale");
const frPath = path.join(localeDir, "messages.fr.xlf");

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", trimValues: false });
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: false,
});

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function deepClone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

function isKatexId(id) {
  const s = String(id ?? "");
  return (
    /_katex$/i.test(s) ||
    /_latex$/i.test(s) ||
    /_formula_katex$/i.test(s) ||
    /_formula_latex$/i.test(s)
  );
}

// XML illegal control chars sanitizer (safety)
function sanitizeXmlIllegalControlCharsToBackslashEscapes(s) {
  if (typeof s !== "string" || s.length === 0) return s;

  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);

    // allowed
    if (c === 0x09 || c === 0x0A || c === 0x0D) { out += s[i]; continue; }
    if (c >= 0x20) { out += s[i]; continue; }

    if (c === 0x0C) out += "\\\\f";
    else if (c === 0x08) out += "\\\\b";
    else if (c === 0x0B) out += "\\\\v";
    else if (c === 0x00) out += "\\\\0";
    // other control chars: drop
  }

  return out;
}

function sanitizeNodeDeep(node) {
  if (node == null) return node;
  if (typeof node === "string") return sanitizeXmlIllegalControlCharsToBackslashEscapes(node);
  if (Array.isArray(node)) return node.map(sanitizeNodeDeep);
  if (typeof node === "object") {
    const cloned = { ...node };
    for (const [k, v] of Object.entries(cloned)) {
      if (typeof v === "string") cloned[k] = sanitizeXmlIllegalControlCharsToBackslashEscapes(v);
      else if (typeof v === "object" && v) cloned[k] = sanitizeNodeDeep(v);
    }
    return cloned;
  }
  return node;
}

function loadXlf(p) {
  return parser.parse(fs.readFileSync(p, "utf8"));
}

function writeXlf(p, obj) {
  if (obj["?xml"]) delete obj["?xml"];
  const xmlBody = builder.build(obj);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}\n`;
  fs.writeFileSync(p, xml, "utf8");
}

function indexUnitsById(xlfObj) {
  const units = asArray(xlfObj?.xliff?.file?.unit);
  const map = new Map();
  for (const u of units) {
    const id = u?.["@_id"];
    if (id) map.set(id, u);
  }
  return map;
}

if (!fs.existsSync(frPath)) {
  console.error(`Missing ${frPath}`);
  process.exit(1);
}

const fr = loadXlf(frPath);
const frUnits = indexUnitsById(fr);

const files = fs
  .readdirSync(localeDir)
  .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf") && f !== "messages.fr.xlf");

let touchedFiles = 0;

for (const f of files) {
  const locale = f.slice("messages.".length, -".xlf".length);
  const p = path.join(localeDir, f);

  const xlf = loadXlf(p);
  const units = asArray(xlf?.xliff?.file?.unit);
  const map = indexUnitsById(xlf);

  let changed = 0;

  for (const [id, frUnit] of frUnits.entries()) {
    if (!isKatexId(id)) continue;

    const trgUnit = map.get(id);
    if (!trgUnit) continue;

    const frSource = frUnit?.segment?.source;
    if (frSource == null) continue;

    trgUnit.segment = trgUnit.segment ?? {};
    trgUnit.segment.source = deepClone(frSource);

    // target = source FR (structure complète)
    trgUnit.segment.target = sanitizeNodeDeep(deepClone(frSource));
    if (typeof trgUnit.segment.target === "object") {
      trgUnit.segment.target["@_state"] = "translated";
    } else {
      // rare case: source is string
      trgUnit.segment.target = { "#text": trgUnit.segment.target, "@_state": "translated" };
    }

    changed++;
  }

  // also sanitize any existing target text nodes (safety)
  for (const u of units) {
    if (u?.segment?.target) {
      u.segment.target = sanitizeNodeDeep(u.segment.target);
    }
  }

  if (changed > 0) {
    // keep meta
    if (xlf?.xliff) {
      xlf.xliff["@_srcLang"] = "fr";
      xlf.xliff["@_trgLang"] = locale;
    }

    writeXlf(p, xlf);
    touchedFiles++;
    console.log(`[i18n-fix-katex] ${locale}: reset ${changed} KaTeX/LaTeX units from FR`);
  } else {
    console.log(`[i18n-fix-katex] ${locale}: nothing to reset`);
  }
}

console.log(`[i18n-fix-katex] done. files changed: ${touchedFiles}`);
