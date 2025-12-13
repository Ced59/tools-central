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

function getText(node) {
  // <source>text</source> peut être string ou objet (ph etc) ; on garde brut si non-string
  if (node == null) return "";
  if (typeof node === "string") return node;
  // fallback : re-builder le sous-noeud
  return builder.build({ source: node }).replace(/^<source>|<\/source>$/g, "");
}

function setText(parent, key, value) {
  // on met une string simple (suffisant pour tes contenus actuels)
  parent[key] = value;
}

const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frFile = frXml?.xliff?.file;
const frUnits = asArray(frFile?.unit);

// Map id -> FR source
const frById = new Map();
for (const u of frUnits) {
  const id = u?.["@_id"];
  const seg = u?.segment;
  const source = seg?.source;
  if (id) frById.set(id, source);
}

const files = fs.readdirSync(localeDir)
  .filter(f => f.startsWith("messages.") && f.endsWith(".xlf") && f !== "messages.fr.xlf");

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
    if (frSource == null) {
      // unit inexistante côté FR => on ne touche pas
      continue;
    }

    if (!u.segment) u.segment = {};
    const seg = u.segment;

    const currentSource = seg.source;
    const currentTarget = seg.target;

    const currentSourceText = getText(currentSource);
    const frSourceText = getText(frSource);

    // 1) Si <source> n'est pas FR et target absent => on migre l'ancien source -> target
    const hasTarget = currentTarget != null && getText(currentTarget).trim().length > 0;

    if (currentSourceText.trim() && currentSourceText !== frSourceText && !hasTarget) {
      setText(seg, "target", currentSourceText);
      fileChanged = true;
    }

    // 2) Force <source> = FR
    if (currentSourceText !== frSourceText) {
      setText(seg, "source", frSourceText);
      fileChanged = true;
    }

    // 3) Si target absent/empty => TODO (optionnel)
    const t = seg.target;
    if (t == null || getText(t).trim().length === 0) {
      setText(seg, "target", "TODO");
      fileChanged = true;
    }
  }

  // Re-assign units (au cas où c'était un objet)
  xFile.unit = units;

  if (fileChanged) {
    const out = builder.build(xml);
    fs.writeFileSync(filePath, out, "utf8");
    changedCount++;
    console.log(`[i18n-repair] fixed: ${fileName}`);
  } else {
    console.log(`[i18n-repair] ok: ${fileName}`);
  }
}

console.log(`[i18n-repair] done. files changed: ${changedCount}`);
