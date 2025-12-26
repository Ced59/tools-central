// scripts/i18n-aggregate.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const projectName = "tools-central";
const LOCALE_DIR = path.resolve("src/locale");
const OUT_DIR = path.resolve("dist/i18n/todo");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readXml(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  return parser.parse(xml);
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function normalizeArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function getFileNode(xlfObj) {
  const file = xlfObj?.xliff?.file;
  if (!file) throw new Error("Invalid XLF: missing xliff.file");
  return file;
}

function getUnits(fileNode) {
  return normalizeArray(fileNode?.unit);
}

function getUnitId(unit) {
  return unit?.["@_id"] || unit?.id || "";
}

function getSourceValue(unit) {
  const src = unit?.segment?.source;
  if (!src) return "";

  if (typeof src === "string") return src;

  if (typeof src === "object") {
    // keep object for placeholders if present
    if (typeof src["#text"] === "string") return { "#text": src["#text"] };
    return src;
  }

  return "";
}

function getTargetText(unit) {
  const t = unit?.segment?.target;
  if (!t) return "";

  if (typeof t === "string") return t;

  if (typeof t === "object") {
    if (typeof t["#text"] === "string") return t["#text"];
    return t["#text"] ?? "";
  }

  return "";
}

function getTargetState(unit) {
  const t = unit?.segment?.target;
  if (!t || typeof t !== "object") return "";
  return t["@_state"] || "";
}

function isTodoTarget(targetText) {
  return targetText === "TODO";
}

function listLocaleXlfs() {
  if (!fs.existsSync(LOCALE_DIR)) return [];
  return fs
    .readdirSync(LOCALE_DIR)
    .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf"))
    .map((f) => path.join(LOCALE_DIR, f));
}

function getLocaleFromXlfPath(p) {
  const base = path.basename(p);
  const m = base.match(/^messages\.(.+)\.xlf$/);
  return m ? m[1] : base;
}

function main() {
  ensureDir(OUT_DIR);

  const xlfFiles = listLocaleXlfs();
  if (xlfFiles.length === 0) {
    console.log("[i18n-aggregate] no locale XLF files found.");
    return;
  }

  let totalOut = 0;

  for (const xlfPath of xlfFiles) {
    const locale = getLocaleFromXlfPath(xlfPath);

    const xlfObj = readXml(xlfPath);
    const fileNode = getFileNode(xlfObj);
    const units = getUnits(fileNode);

    const outItems = [];

    for (const u of units) {
      const id = getUnitId(u);
      if (!id) continue;

      const targetText = getTargetText(u);
      const state = getTargetState(u);

      const isTodo = isTodoTarget(targetText);
      const isFlagged = state === "new" || state === "needs-review";

      // Export if missing (TODO) OR flagged (new/needs-review)
      if (!isTodo && !isFlagged) continue;

      const currentTarget =
        targetText && targetText.trim().length > 0 ? targetText : "TODO";

      // ✅ BONUS:
      // Pre-fill translatedTarget with currentTarget (if present) for easier review/diff.
      // IMPORTANT: i18n-translate still forces retranslation for needs-review.
      const translatedTarget =
        currentTarget !== "TODO" ? currentTarget : "";

      outItems.push({
        id,
        status: isTodo && !isFlagged ? "new" : (state || "new"),
        source: getSourceValue(u),
        currentTarget,
        translatedTarget,
      });
    }

    const outPath = path.join(OUT_DIR, `${locale}.todo.json`);
    writeJson(outPath, {
      generatedAt: new Date().toISOString(),
      projectName,
      sourceLocale: "fr",
      locale,
      items: outItems,
    });

    console.log(`[i18n-aggregate] ${locale}: ${outItems.length} items -> ${outPath}`);
    totalOut += outItems.length;
  }

  console.log(`[i18n-aggregate] done (${totalOut} total)`);
}

main();
