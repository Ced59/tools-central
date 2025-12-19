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
 * Collecte les noms de placeholders "logiques" attendus par Angular:
 * - ph[@_equiv] ex: INTERPOLATION, LINE_BREAK...
 * - pc[@_equivStart] / pc[@_equivEnd] ex: START_TAG_SPAN / CLOSE_TAG_SPAN...
 */
function collectPlaceholders(node, set = new Set()) {
  if (node == null) return set;

  if (Array.isArray(node)) {
    for (const x of node) collectPlaceholders(x, set);
    return set;
  }

  if (typeof node !== "object") return set;

  // ph
  if (node.ph) {
    for (const ph of asArray(node.ph)) {
      const equiv = ph?.["@_equiv"];
      if (equiv) set.add(equiv);
    }
  }

  // pc
  if (node.pc) {
    for (const pc of asArray(node.pc)) {
      const es = pc?.["@_equivStart"];
      const ee = pc?.["@_equivEnd"];
      if (es) set.add(es);
      if (ee) set.add(ee);
      // pc peut contenir des ph
      collectPlaceholders(pc, set);
    }
  }

  // traverse tous les champs objets
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
  // si objet, on regarde s’il contient du texte visible
  const xml = builder.build({ target: t });
  const inner = xml.replace(/^<target>|<\/target>$/g, "");
  return inner.trim().length === 0;
}

const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frFile = frXml?.xliff?.file;
const frUnits = asArray(frFile?.unit);

// Map id -> FR source node (object OR string)
const frById = new Map();
for (const u of frUnits) {
  const id = u?.["@_id"];
  const seg = u?.segment;
  const source = seg?.source;
  if (id) frById.set(id, source);
}

const files = fs
  .readdirSync(localeDir)
  .filter(
    (f) =>
      f.startsWith("messages.") &&
      f.endsWith(".xlf") &&
      f !== "messages.fr.xlf"
  );

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

  // Force proper languages
  xliff["@_srcLang"] = "fr";
  xliff["@_trgLang"] = locale;

  const units = asArray(xFile.unit);
  let fileChanged = false;

  for (const u of units) {
    const id = u?.["@_id"];
    if (!id) continue;

    const frSource = frById.get(id);
    if (frSource == null) continue; // id inconnu côté FR

    if (!u.segment) u.segment = {};
    const seg = u.segment;

    const srcPh = collectPlaceholders(frSource);
    const tgtPh = collectPlaceholders(seg.target);

    // 1) Force <source> = FR (structure complète, pas string)
    const sameSource =
      JSON.stringify(seg.source ?? null) === JSON.stringify(frSource ?? null);

    if (!sameSource) {
      seg.source = deepClone(frSource);
      fileChanged = true;
    }

    // 2) Réparer target si vide
    if (isEmptyTarget(seg.target)) {
      // Si la source a des placeholders -> mettre une copie de la source pour compiler
      if (srcPh.size > 0) {
        seg.target = deepClone(frSource);
      } else {
        seg.target = "TODO";
      }
      fileChanged = true;
      continue;
    }

    // 3) Réparer target si placeholders mismatch
    // (ex: target contient START_TAG_SPAN mais source ne l’a pas)
    if (!samePlaceholderSet(srcPh, tgtPh)) {
      // sécurité: on remplace par la source (compile garanti)
      seg.target = deepClone(frSource);
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
