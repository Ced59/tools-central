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
  // Les tokens utilisés en interne par Angular localize pour les ranges
  // ne doivent pas se retrouver en texte brut dans un <target>.
  return /\bSTART_TAG_[A-Z0-9_]+\b/.test(s) || /\bCLOSE_TAG_[A-Z0-9_]+\b/.test(s);
}

function validatePc(node, issues, ctx) {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((x) => validatePc(x, issues, ctx));
  if (typeof node !== "object") return;

  const pcs = node.pc ? asArray(node.pc) : [];
  for (const pc of pcs) {
    const es = pc?.["@_equivStart"];
    const ee = pc?.["@_equivEnd"];
    // pc MUST have both start/end
    if (!es || !ee) {
      issues.push(`${ctx} pc missing equivStart/equivEnd`);
    }
    // pc id should exist (pratique, souvent présent)
    if (!pc?.["@_id"]) {
      issues.push(`${ctx} pc missing @_id`);
    }
    // recurse into pc content
    validatePc(pc, issues, ctx);
  }

  const phs = node.ph ? asArray(node.ph) : [];
  for (const ph of phs) {
    // ph equiv should exist
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

      // 1) target string contenant des tokens de ranges => très suspect
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

      // 2) validate pc/ph structure if any
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

  if (count === 0) console.log("✅ No structural suspects found.");
  else process.exit(2);
}

main();
