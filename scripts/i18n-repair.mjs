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

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function deepClone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

/**
 * Collect placeholders expected by Angular:
 * - ph[@_equiv]
 * - pc[@_equivStart]/pc[@_equivEnd]
 */
function collectPlaceholders(node, set = new Set()) {
  if (node == null) return set;

  if (Array.isArray(node)) {
    for (const x of node) collectPlaceholders(x, set);
    return set;
  }
  if (typeof node !== "object") return set;

  if (node.ph) {
    for (const ph of asArray(node.ph)) {
      const equiv = ph?.["@_equiv"];
      if (equiv) set.add(equiv);
    }
  }

  if (node.pc) {
    for (const pc of asArray(node.pc)) {
      const es = pc?.["@_equivStart"];
      const ee = pc?.["@_equivEnd"];
      if (es) set.add(es);
      if (ee) set.add(ee);
      collectPlaceholders(pc, set);
    }
  }

  for (const [k, v] of Object.entries(node)) {
    if (k === "ph" || k === "pc") continue;
    if (typeof v === "object") collectPlaceholders(v, set);
  }
  return set;
}

function samePlaceholderSet(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function isEmptyTarget(t) {
  if (t == null) return true;
  if (typeof t === "string") return t.trim().length === 0;
  const xml = builder.build({ target: t });
  const inner = xml.replace(/^<target>|<\/target>$/g, "");
  return inner.trim().length === 0;
}

function hasRawRangeTokensInText(s) {
  return /\bSTART_TAG_[A-Z0-9_]+\b/.test(s) || /\bCLOSE_TAG_[A-Z0-9_]+\b/.test(s);
}

function hasRawRangeTokens(node) {
  if (node == null) return false;
  if (typeof node === "string") return hasRawRangeTokensInText(node);
  if (Array.isArray(node)) return node.some(hasRawRangeTokens);
  if (typeof node === "object") {
    if (typeof node["#text"] === "string" && hasRawRangeTokensInText(node["#text"])) return true;
    for (const v of Object.values(node)) {
      if (typeof v === "object" || typeof v === "string") {
        if (hasRawRangeTokens(v)) return true;
      }
    }
  }
  return false;
}

// Validate that pc/ph elements are structurally usable
function hasInvalidPcPhStructure(node) {
  if (node == null) return false;
  if (typeof node === "string") return false;
  if (Array.isArray(node)) return node.some(hasInvalidPcPhStructure);
  if (typeof node !== "object") return false;

  if (node.pc) {
    for (const pc of asArray(node.pc)) {
      const es = pc?.["@_equivStart"];
      const ee = pc?.["@_equivEnd"];
      // both must exist
      if (!es || !ee) return true;
      // ids are expected/very common; missing ids tends to break tooling
      if (!pc?.["@_id"]) return true;
      if (hasInvalidPcPhStructure(pc)) return true;
    }
  }

  if (node.ph) {
    for (const ph of asArray(node.ph)) {
      if (!ph?.["@_equiv"]) return true;
      if (!ph?.["@_id"]) return true;
    }
  }

  for (const [k, v] of Object.entries(node)) {
    if (k === "ph" || k === "pc") continue;
    if (typeof v === "object") {
      if (hasInvalidPcPhStructure(v)) return true;
    }
  }

  return false;
}

const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frUnits = asArray(frXml?.xliff?.file?.unit);

const frById = new Map();
for (const u of frUnits) {
  const id = u?.["@_id"];
  const source = u?.segment?.source;
  if (id) frById.set(id, source);
}

const files = fs
  .readdirSync(localeDir)
  .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf") && f !== "messages.fr.xlf");

let changedCount = 0;

for (const fileName of files) {
  const locale = fileName.slice("messages.".length, -".xlf".length);
  const filePath = path.join(localeDir, fileName);

  const xml = parser.parse(fs.readFileSync(filePath, "utf8"));
  const xliff = xml.xliff;
  const xFile = xliff?.file;

  if (!xliff || !xFile) {
    console.warn(`[i18n-repair] skip (unexpected format): ${fileName}`);
    continue;
  }

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

    const srcPh = collectPlaceholders(frSource);
    const tgtPh = collectPlaceholders(seg.target);

    // Force <source> = FR
    const sameSource = JSON.stringify(seg.source ?? null) === JSON.stringify(frSource ?? null);
    if (!sameSource) {
      seg.source = deepClone(frSource);
      fileChanged = true;
    }

    // If target empty -> repair
    if (isEmptyTarget(seg.target)) {
      seg.target = srcPh.size > 0 ? deepClone(frSource) : "TODO";
      fileChanged = true;
      continue;
    }

    // NEW: if raw START_TAG/CLOSE_TAG tokens appear in text => repair
    if (hasRawRangeTokens(seg.target)) {
      seg.target = deepClone(frSource);
      fileChanged = true;
      continue;
    }

    // NEW: invalid pc/ph structure => repair
    if (hasInvalidPcPhStructure(seg.target)) {
      seg.target = deepClone(frSource);
      fileChanged = true;
      continue;
    }

    // Old rule: placeholder set mismatch => repair
    if (!samePlaceholderSet(srcPh, tgtPh)) {
      seg.target = deepClone(frSource);
      fileChanged = true;
      continue;
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
