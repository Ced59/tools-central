// scripts/i18n-diagnose.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const projectRoot = process.cwd();
const localeDir = path.join(projectRoot, "src", "locale");
const frPath = path.join(localeDir, "messages.fr.xlf");

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", trimValues: false });
const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@_", format: false });

function asArray(v) { return v ? (Array.isArray(v) ? v : [v]) : []; }

function hasXmlIllegalControlChars(s) {
  if (typeof s !== "string" || s.length === 0) return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D) return true;
  }
  return false;
}

function extractAnyText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "object") return String(node["#text"] ?? "");
  return "";
}

function collectPlaceholders(node, set = new Set()) {
  if (node == null) return set;
  if (Array.isArray(node)) { for (const x of node) collectPlaceholders(x, set); return set; }
  if (typeof node !== "object") return set;

  if (node.ph) for (const ph of asArray(node.ph)) { const e = ph?.["@_equiv"]; if (e) set.add(e); }
  if (node.pc) for (const pc of asArray(node.pc)) {
    const es = pc?.["@_equivStart"]; const ee = pc?.["@_equivEnd"];
    if (es) set.add(es); if (ee) set.add(ee);
    collectPlaceholders(pc, set);
  }

  for (const [k, v] of Object.entries(node)) {
    if (k === "ph" || k === "pc") continue;
    if (typeof v === "object") collectPlaceholders(v, set);
  }
  return set;
}

function sameSet(a, b) {
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

if (!fs.existsSync(frPath)) {
  console.error(`Missing ${frPath}`);
  process.exit(1);
}

const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frUnits = asArray(frXml?.xliff?.file?.unit);

const frById = new Map();
for (const u of frUnits) {
  const id = u?.["@_id"];
  const src = u?.segment?.source;
  if (id) frById.set(id, src);
}

const files = fs.readdirSync(localeDir).filter(f => f.startsWith("messages.") && f.endsWith(".xlf") && f !== "messages.fr.xlf");

let offenders = 0;

for (const fileName of files) {
  const locale = fileName.slice("messages.".length, -".xlf".length);
  const filePath = path.join(localeDir, fileName);

  const xml = parser.parse(fs.readFileSync(filePath, "utf8"));
  const units = asArray(xml?.xliff?.file?.unit);

  for (const u of units) {
    const id = u?.["@_id"];
    if (!id) continue;

    const frSource = frById.get(id);
    if (frSource == null) continue;

    const srcPh = collectPlaceholders(frSource);
    const tgt = u?.segment?.target;
    const tgtPh = collectPlaceholders(tgt);

    const tgtText = extractAnyText(tgt);

    // Placeholder mismatch OR empty OR illegal XML controls
    if (isEmptyTarget(tgt) || !sameSet(srcPh, tgtPh) || hasXmlIllegalControlChars(tgtText)) {
      console.log(
        `[OFFENDER] ${locale} id=${id} srcPH=${srcPh.size} tgtPH=${tgtPh.size} empty=${isEmptyTarget(tgt)} ctrl=${hasXmlIllegalControlChars(tgtText)}`
      );
      offenders++;
      if (offenders >= 50) process.exit(2);
    }
  }
}

if (offenders === 0) console.log("✅ No placeholder mismatches / control-char issues found.");
else process.exit(2);
