// scripts/i18n-diagnose-structure.mjs
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const projectRoot = process.cwd();
const localeDir = path.join(projectRoot, "src", "locale");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  preserveOrder: false,
  trimValues: false,
});

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function hasRawRangeTokens(s) {
  return /\bSTART_TAG_[A-Z0-9_]+\b/.test(s) || /\bCLOSE_TAG_[A-Z0-9_]+\b/.test(s);
}

function hasXmlIllegalControlChars(s) {
  if (typeof s !== "string" || s.length === 0) return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D) return true;
  }
  return false;
}

function validatePc(node, issues, ctx) {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((x) => validatePc(x, issues, ctx));
  if (typeof node !== "object") return;

  const pcs = node.pc ? asArray(node.pc) : [];
  for (const pc of pcs) {
    const es = pc?.["@_equivStart"];
    const ee = pc?.["@_equivEnd"];
    if (!es || !ee) issues.push(`${ctx} pc missing equivStart/equivEnd`);
    if (!pc?.["@_id"]) issues.push(`${ctx} pc missing @_id`);
    validatePc(pc, issues, ctx);
  }

  const phs = node.ph ? asArray(node.ph) : [];
  for (const ph of phs) {
    if (!ph?.["@_equiv"]) issues.push(`${ctx} ph missing @_equiv`);
    if (!ph?.["@_id"]) issues.push(`${ctx} ph missing @_id`);
  }

  for (const v of Object.values(node)) {
    if (typeof v === "object") validatePc(v, issues, ctx);
  }
}

function main() {
  const files = fs
    .readdirSync(localeDir)
    .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf"));

  let count = 0;

  for (const f of files) {
    const locale = f.slice("messages.".length, -".xlf".length);
    const p = path.join(localeDir, f);
    const xml = parser.parse(fs.readFileSync(p, "utf8"));

    const units = asArray(xml?.xliff?.file?.unit);
    for (const u of units) {
      const id = u?.["@_id"];
      const tgt = u?.segment?.target;

      const ctx = `${locale} id=${id}`;

      // raw START_TAG tokens in text
      if (typeof tgt === "string" && hasRawRangeTokens(tgt)) {
        console.log(`[SUSPECT] ${ctx} target has raw range tokens`);
        count++;
        continue;
      }
      if (typeof tgt === "object" && typeof tgt?.["#text"] === "string" && hasRawRangeTokens(tgt["#text"])) {
        console.log(`[SUSPECT] ${ctx} target.#text has raw range tokens`);
        count++;
        continue;
      }

      // illegal control chars in text node
      const tText =
        typeof tgt === "string" ? tgt :
          (tgt && typeof tgt === "object" ? String(tgt["#text"] ?? "") : "");

      if (hasXmlIllegalControlChars(tText)) {
        console.log(`[SUSPECT] ${ctx} target contains illegal XML control chars`);
        count++;
        continue;
      }

      // validate pc/ph structure
      const issues = [];
      validatePc(tgt, issues, ctx);
      if (issues.length) {
        console.log(`[SUSPECT] ${ctx}`);
        for (const it of issues.slice(0, 5)) console.log(`  - ${it}`);
        count++;
        if (count >= 50) process.exit(2);
      }
    }
  }

  if (count === 0) console.log("✅ No structural/control-char suspects found.");
  else process.exit(2);
}

main();
