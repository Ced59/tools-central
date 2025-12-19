// scripts/i18n-repair.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const projectRoot = process.cwd();
const localeDir = path.join(projectRoot, "src", "locale");
const frPath = path.join(localeDir, "messages.fr.xlf");

if (!fs.existsSync(frPath)) {
  console.error(`[i18n-repair] missing ${frPath}`);
  process.exit(1);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  preserveOrder: false,
  trimValues: false,
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  preserveOrder: false,
  format: true,
  suppressEmptyNode: false,
});

const asArray = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

const deepClone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

function innerXmlOf(node, tagName) {
  if (node == null) return "";
  if (typeof node === "string") return node;
  // rebuild only inner xml
  const xml = builder.build({ [tagName]: node });
  return xml.replace(new RegExp(`^<${tagName}[^>]*>|</${tagName}>$`, "g"), "");
}

function extractPlaceholderNamesFromSegmentNode(node, tagName) {
  const s = innerXmlOf(node, tagName);
  const names = new Set();

  // XLF2: pc equivStart/equivEnd ; ph equiv
  const re = /\bequiv(Start|End)?="([^"]+)"/g;
  let m;
  while ((m = re.exec(s))) {
    names.add(m[2]);
  }
  return names;
}

function placeholderSetsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Build a "TODO" target that preserves the FR placeholders:
 * - We copy the FR <source> node structure
 * - Replace only textual parts with a minimal TODO sentence (keeping placeholders intact)
 */
function buildTodoTargetFromFrSource(frSourceNode) {
  if (frSourceNode == null) return "TODO";

  if (typeof frSourceNode === "string") {
    // No placeholders => simple TODO
    return "TODO";
  }

  // We clone the FR node and try to replace visible text in "#text" if present.
  const t = deepClone(frSourceNode);

  // Common shapes: { pc: {...}, "#text": "..." } or arrays/objects nested
  // We do a conservative walk: replace any "#text" string with a TODO sentence,
  // but keep placeholders (pc/ph) untouched.
  const walk = (obj) => {
    if (obj == null) return;
    if (typeof obj === "string") return;

    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }

    if (typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        if (k === "#text" && typeof obj[k] === "string") {
          obj[k] = "TODO";
        } else {
          walk(obj[k]);
        }
      }
    }
  };

  walk(t);

  // If after walk there's no "#text" anywhere, we still want some text.
  // Add a trailing "#text" if missing.
  const hasText = (obj) => {
    let found = false;
    const walk2 = (o) => {
      if (found || o == null) return;
      if (Array.isArray(o)) return o.forEach(walk2);
      if (typeof o === "object") {
        if (typeof o["#text"] === "string" && o["#text"].trim()) {
          found = true;
          return;
        }
        Object.values(o).forEach(walk2);
      }
    };
    walk2(obj);
    return found;
  };

  if (!hasText(t)) {
    // Put text after the structure
    t["#text"] = "TODO";
  }

  return t;
}

// --- Load FR map id -> FR source node (object/string, not flattened)
const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frFile = frXml?.xliff?.file;
const frUnits = asArray(frFile?.unit);

const frById = new Map();
for (const u of frUnits) {
  const id = u?.["@_id"];
  const sourceNode = u?.segment?.source;
  if (id) frById.set(id, sourceNode);
}

const files = fs
  .readdirSync(localeDir)
  .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf") && f !== "messages.fr.xlf");

let changedCount = 0;

for (const fileName of files) {
  const locale = fileName.slice("messages.".length, -".xlf".length);
  const filePath = path.join(localeDir, fileName);

  const xml = parser.parse(fs.readFileSync(filePath, "utf8"));
  const xliff = xml?.xliff;
  const xFile = xliff?.file;

  if (!xliff || !xFile) {
    console.warn(`[i18n-repair] skip (unexpected format): ${fileName}`);
    continue;
  }

  // Force proper languages
  xliff["@_srcLang"] = "fr";
  xliff["@_trgLang"] = locale;

  const units = asArray(xFile.unit);
  let fileChanged = false;

  for (const u of units) {
    const id = u?.["@_id"];
    if (!id) continue;

    const frSource = frById.get(id);
    if (frSource == null) continue;

    if (!u.segment) u.segment = {};
    const seg = u.segment;

    // 1) Force <source> to be EXACT FR structure (not a string)
    const currentSource = seg.source;
    const sameSource =
      innerXmlOf(currentSource, "source") === innerXmlOf(frSource, "source");

    if (!sameSource) {
      seg.source = deepClone(frSource);
      fileChanged = true;
    }

    // 2) Ensure target exists and placeholder-compatible
    const currentTarget = seg.target;

    const frPlaceholders = extractPlaceholderNamesFromSegmentNode(frSource, "source");
    const targetPlaceholders = extractPlaceholderNamesFromSegmentNode(currentTarget, "target");

    const targetIsEmpty =
      currentTarget == null ||
      (typeof currentTarget === "string" && currentTarget.trim().length === 0) ||
      (typeof currentTarget === "object" && innerXmlOf(currentTarget, "target").trim().length === 0);

    const targetOk = placeholderSetsEqual(frPlaceholders, targetPlaceholders);

    if (targetIsEmpty) {
      // Build TODO that preserves placeholders
      seg.target = buildTodoTargetFromFrSource(frSource);
      fileChanged = true;
    } else if (!targetOk) {
      // Fix placeholder mismatch by replacing with placeholder-safe TODO
      seg.target = buildTodoTargetFromFrSource(frSource);
      fileChanged = true;
    }
  }

  xFile.unit = units;

  if (fileChanged) {
    fs.writeFileSync(filePath, builder.build(xml), "utf8");
    changedCount++;
    console.log(`[i18n-repair] fixed: ${fileName}`);
  } else {
    console.log(`[i18n-repair] ok: ${fileName}`);
  }
}

console.log(`[i18n-repair] done. files changed: ${changedCount}`);
