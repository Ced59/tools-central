// scripts/i18n-fix-xlf-katex-and-controls.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const LOCALE_DIR = path.resolve("src/locale");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: false,
});
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

// XML 1.0 illegal control chars: < 0x20 except TAB/LF/CR
function sanitizeXmlControls(s) {
  if (typeof s !== "string" || s.length === 0) return s;

  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);

    // allowed
    if (c === 0x09 || c === 0x0a || c === 0x0d) {
      out += s[i];
      continue;
    }
    // normal printable
    if (c >= 0x20) {
      out += s[i];
      continue;
    }

    // illegal controls: convert common ones to visible escaped sequences
    if (c === 0x0c) out += "\\\\f"; // was \f (from \frac bug)
    else if (c === 0x08) out += "\\\\b";
    else if (c === 0x0b) out += "\\\\v";
    else if (c === 0x00) out += "\\\\0";
    // others: drop
  }

  return out;
}

function sanitizeNodeDeep(node) {
  if (node == null) return node;
  if (typeof node === "string") return sanitizeXmlControls(node);
  if (Array.isArray(node)) return node.map(sanitizeNodeDeep);
  if (typeof node === "object") {
    const cloned = { ...node };
    for (const [k, v] of Object.entries(cloned)) {
      if (typeof v === "string") cloned[k] = sanitizeXmlControls(v);
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

const files = fs
  .readdirSync(LOCALE_DIR)
  .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf"));

let changedFiles = 0;

for (const f of files) {
  const filePath = path.join(LOCALE_DIR, f);
  const locale = f.slice("messages.".length, -".xlf".length);

  const xlf = loadXlf(filePath);
  const fileNode = xlf?.xliff?.file;
  if (!fileNode) continue;

  const units = asArray(fileNode.unit);
  let changed = 0;
  let resetKatex = 0;
  let sanitized = 0;

  for (const u of units) {
    const id = u?.["@_id"];

    // sanitize everything (source/target/notes etc.)
    const before = JSON.stringify(u);
    const afterObj = sanitizeNodeDeep(u);
    const after = JSON.stringify(afterObj);
    if (before !== after) {
      // mutate in place
      Object.assign(u, afterObj);
      sanitized++;
      changed++;
    }

    // reset katex/latex targets to source (prevent future corruption)
    if (isKatexId(id) && u?.segment?.source != null) {
      const src = deepClone(u.segment.source);

      u.segment.target = sanitizeNodeDeep(deepClone(src));
      if (typeof u.segment.target === "object") {
        u.segment.target["@_state"] = "translated";
      } else {
        u.segment.target = { "#text": u.segment.target, "@_state": "translated" };
      }

      resetKatex++;
      changed++;
    }
  }

  if (changed > 0) {
    // keep meta consistent
    if (xlf?.xliff) {
      xlf.xliff["@_srcLang"] = xlf.xliff["@_srcLang"] ?? "fr";
      xlf.xliff["@_trgLang"] = locale;
    }

    writeXlf(filePath, xlf);
    changedFiles++;
    console.log(`[i18n-fix-xlf] ${locale}: resetKatex=${resetKatex}, sanitizedUnits=${sanitized}`);
  } else {
    console.log(`[i18n-fix-xlf] ${locale}: no changes`);
  }
}

console.log(`[i18n-fix-xlf] done. files changed: ${changedFiles}`);
