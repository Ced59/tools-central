// scripts/i18n-repair.mjs
//
// Script de réparation des fichiers XLF.
//
// Ce script :
// 1. Vérifie que les sources correspondent au fichier français
// 2. Répare les targets vides ou corrompus
// 3. Corrige les formules KaTeX (échappement des accolades)
// 4. Sanitize les caractères de contrôle illégaux XML
// 5. Vérifie la cohérence des placeholders

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
    processEntities: false,
});

// --------------------
// Utils
// --------------------
function asArray(v) {
    if (!v) {
        return [];
    }
    return Array.isArray(v) ? v : [v];
}

function deepClone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
}

// --------------------
// KaTeX detection and processing
// --------------------
function isKatexId(id) {
    const s = String(id ?? "");
    return (
        /_katex$/i.test(s) ||
        /_latex$/i.test(s) ||
        /_formula_katex$/i.test(s) ||
        /_formula_latex$/i.test(s)
    );
}

function normalizeKatexFormula(text) {
    if (typeof text !== "string") {
        return text;
    }

    let result = text;
    result = result.replace(/&amp;#123;/g, "{");
    result = result.replace(/&amp;#125;/g, "}");
    result = result.replace(/&#123;/g, "{");
    result = result.replace(/&#125;/g, "}");

    while (result.includes("\\\\")) {
        result = result.replace(/\\\\/g, "\\");
    }

    result = result.replace(/\{/g, "&#123;");
    result = result.replace(/\}/g, "&#125;");

    return result;
}

function processKatexValue(value) {
    if (typeof value === "string") {
        return normalizeKatexFormula(value);
    }
    if (value && typeof value === "object") {
        const cloned = deepClone(value);
        if (typeof cloned["#text"] === "string") {
            cloned["#text"] = normalizeKatexFormula(cloned["#text"]);
        }
        return cloned;
    }
    return value;
}

// --------------------
// XML illegal control chars
// --------------------
function hasXmlIllegalControlChars(s) {
    if (typeof s !== "string" || s.length === 0) {
        return false;
    }
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c < 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D) {
            return true;
        }
    }
    return false;
}

function sanitizeXmlIllegalControlCharsToBackslashEscapes(s) {
    if (typeof s !== "string" || s.length === 0) {
        return s;
    }

    let out = "";
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);

        if (c === 0x09 || c === 0x0A || c === 0x0D) {
            out += s[i];
            continue;
        }
        if (c >= 0x20) {
            out += s[i];
            continue;
        }

        if (c === 0x0C) {
            out += "\\f";
        } else if (c === 0x08) {
            out += "\\b";
        } else if (c === 0x0B) {
            out += "\\v";
        } else if (c === 0x00) {
            out += "\\0";
        }
    }

    return out;
}

function sanitizeNodeDeep(node) {
    if (node == null) {
        return node;
    }
    if (typeof node === "string") {
        return sanitizeXmlIllegalControlCharsToBackslashEscapes(node);
    }
    if (Array.isArray(node)) {
        return node.map(sanitizeNodeDeep);
    }
    if (typeof node === "object") {
        const cloned = { ...node };
        for (const [k, v] of Object.entries(cloned)) {
            if (typeof v === "string") {
                cloned[k] = sanitizeXmlIllegalControlCharsToBackslashEscapes(v);
            } else if (typeof v === "object" && v) {
                cloned[k] = sanitizeNodeDeep(v);
            }
        }
        return cloned;
    }
    return node;
}

// --------------------
// Placeholder collection
// --------------------
function collectPlaceholders(node, set = new Set()) {
    if (node == null) {
        return set;
    }
    if (Array.isArray(node)) {
        for (const x of node) {
            collectPlaceholders(x, set);
        }
        return set;
    }
    if (typeof node !== "object") {
        return set;
    }

    if (node.ph) {
        for (const ph of asArray(node.ph)) {
            const equiv = ph?.["@_equiv"];
            if (equiv) {
                set.add(equiv);
            }
        }
    }

    if (node.pc) {
        for (const pc of asArray(node.pc)) {
            const es = pc?.["@_equivStart"];
            const ee = pc?.["@_equivEnd"];
            if (es) {
                set.add(es);
            }
            if (ee) {
                set.add(ee);
            }
            collectPlaceholders(pc, set);
        }
    }

    for (const [k, v] of Object.entries(node)) {
        if (k === "ph" || k === "pc") {
            continue;
        }
        if (typeof v === "object") {
            collectPlaceholders(v, set);
        }
    }
    return set;
}

function samePlaceholderSet(a, b) {
    if (a.size !== b.size) {
        return false;
    }
    for (const x of a) {
        if (!b.has(x)) {
            return false;
        }
    }
    return true;
}

// --------------------
// Target validation
// --------------------
function isEmptyTarget(t) {
    if (t == null) {
        return true;
    }
    if (typeof t === "string") {
        return t.trim().length === 0;
    }
    const xml = builder.build({ target: t });
    const inner = xml.replace(/^<target[^>]*>|<\/target>$/g, "");
    return inner.trim().length === 0;
}

function hasRawRangeTokensInText(s) {
    return /\bSTART_TAG_[A-Z0-9_]+\b/.test(s) || /\bCLOSE_TAG_[A-Z0-9_]+\b/.test(s);
}

function hasRawRangeTokens(node) {
    if (node == null) {
        return false;
    }
    if (typeof node === "string") {
        return hasRawRangeTokensInText(node);
    }
    if (Array.isArray(node)) {
        return node.some(hasRawRangeTokens);
    }
    if (typeof node === "object") {
        if (typeof node["#text"] === "string" && hasRawRangeTokensInText(node["#text"])) {
            return true;
        }
        for (const v of Object.values(node)) {
            if ((typeof v === "object" || typeof v === "string") && hasRawRangeTokens(v)) {
                return true;
            }
        }
    }
    return false;
}

function hasInvalidPcPhStructure(node) {
    if (node == null) {
        return false;
    }
    if (typeof node === "string") {
        return false;
    }
    if (Array.isArray(node)) {
        return node.some(hasInvalidPcPhStructure);
    }
    if (typeof node !== "object") {
        return false;
    }

    if (node.pc) {
        for (const pc of asArray(node.pc)) {
            const es = pc?.["@_equivStart"];
            const ee = pc?.["@_equivEnd"];
            if (!es || !ee) {
                return true;
            }
            if (!pc?.["@_id"]) {
                return true;
            }
            if (hasInvalidPcPhStructure(pc)) {
                return true;
            }
        }
    }

    if (node.ph) {
        for (const ph of asArray(node.ph)) {
            if (!ph?.["@_equiv"]) {
                return true;
            }
            if (!ph?.["@_id"]) {
                return true;
            }
        }
    }

    for (const [k, v] of Object.entries(node)) {
        if (k === "ph" || k === "pc") {
            continue;
        }
        if (typeof v === "object" && hasInvalidPcPhStructure(v)) {
            return true;
        }
    }

    return false;
}

// --------------------
// Main
// --------------------
const frXml = parser.parse(fs.readFileSync(frPath, "utf8"));
const frUnits = asArray(frXml?.xliff?.file?.unit);

const frById = new Map();
for (const u of frUnits) {
    const id = u?.["@_id"];
    const source = u?.segment?.source;
    if (id) {
        frById.set(id, source);
    }
}

// D'abord, réparer le fichier français lui-même (KaTeX)
let frChanged = false;
for (const u of frUnits) {
    const id = u?.["@_id"];
    if (!id || !isKatexId(id)) {
        continue;
    }

    if (!u.segment) {
        u.segment = {};
    }
    const seg = u.segment;

    if (seg.source) {
        const before = JSON.stringify(seg.source);
        seg.source = processKatexValue(seg.source);
        if (JSON.stringify(seg.source) !== before) {
            frChanged = true;
            frById.set(id, seg.source);
        }
    }

    if (seg.target) {
        const before = JSON.stringify(seg.target);
        if (typeof seg.target === "string") {
            seg.target = { "#text": processKatexValue(seg.target), "@_state": "translated" };
        } else {
            seg.target["#text"] = processKatexValue(seg.target["#text"]);
            seg.target["@_state"] = "translated";
        }
        if (JSON.stringify(seg.target) !== before) {
            frChanged = true;
        }
    }
}

if (frChanged) {
    fs.writeFileSync(frPath, builder.build(frXml), "utf8");
    console.log(`[i18n-repair] fixed KaTeX in: messages.fr.xlf`);
}

// Maintenant réparer les autres fichiers
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
        if (!id) {
            continue;
        }

        const frSource = frById.get(id);
        if (frSource == null) {
            continue;
        }

        if (!u.segment) {
            u.segment = {};
        }
        const seg = u.segment;

        // Traitement spécial KaTeX
        if (isKatexId(id)) {
            const normalizedSource = processKatexValue(frSource);

            const sourceBefore = JSON.stringify(seg.source);
            seg.source = deepClone(normalizedSource);
            if (JSON.stringify(seg.source) !== sourceBefore) {
                fileChanged = true;
            }

            // Target = source pour KaTeX
            const targetBefore = JSON.stringify(seg.target);
            const targetText = typeof normalizedSource === "string"
                ? normalizedSource
                : (normalizedSource?.["#text"] ?? "");

            if (typeof seg.target === "string") {
                seg.target = { "#text": targetText, "@_state": "translated" };
            } else if (seg.target && typeof seg.target === "object") {
                seg.target["#text"] = targetText;
                seg.target["@_state"] = "translated";
            } else {
                seg.target = { "#text": targetText, "@_state": "translated" };
            }
            if (JSON.stringify(seg.target) !== targetBefore) {
                fileChanged = true;
            }

            continue;
        }

        // Unité normale (non-KaTeX)

        // Forcer <source> = FR
        const sameSource = JSON.stringify(seg.source ?? null) === JSON.stringify(frSource ?? null);
        if (!sameSource) {
            seg.source = deepClone(frSource);
            fileChanged = true;
        }

        // Sanitize le contenu target
        if (seg.target) {
            const before = JSON.stringify(seg.target);
            seg.target = sanitizeNodeDeep(seg.target);
            const after = JSON.stringify(seg.target);
            if (before !== after) {
                fileChanged = true;
            }
        }

        const srcPh = collectPlaceholders(frSource);
        const tgtPh = collectPlaceholders(seg.target);

        // Si target vide -> réparer
        if (isEmptyTarget(seg.target)) {
            seg.target = srcPh.size > 0 ? deepClone(frSource) : "TODO";
            fileChanged = true;
            continue;
        }

        // Tokens bruts => réparer
        if (hasRawRangeTokens(seg.target)) {
            seg.target = deepClone(frSource);
            fileChanged = true;
            continue;
        }

        // Structure invalide => réparer
        if (hasInvalidPcPhStructure(seg.target)) {
            seg.target = deepClone(frSource);
            fileChanged = true;
            continue;
        }

        // Mismatch de placeholders => réparer
        if (!samePlaceholderSet(srcPh, tgtPh)) {
            seg.target = deepClone(frSource);
            fileChanged = true;
            continue;
        }

        // Sécurité finale
        if (typeof seg.target === "string" && hasXmlIllegalControlChars(seg.target)) {
            seg.target = sanitizeXmlIllegalControlCharsToBackslashEscapes(seg.target);
            fileChanged = true;
        }
        if (typeof seg.target === "object" && typeof seg.target["#text"] === "string" && hasXmlIllegalControlChars(seg.target["#text"])) {
            seg.target["#text"] = sanitizeXmlIllegalControlCharsToBackslashEscapes(seg.target["#text"]);
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
