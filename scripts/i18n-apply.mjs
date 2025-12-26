// scripts/i18n-apply.mjs
//
// Applique les traductions depuis des fichiers JSON "todo" vers les fichiers XLF.
// 
// IMPORTANT: Ce script gère spécialement les formules KaTeX/LaTeX en échappant
// les accolades { } avec &#123; &#125; pour éviter le parsing ICU d'Angular.

import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

// Configuration du parser XML - IMPORTANT: preserveOrder=false pour simplifier
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,  // Préserver les espaces
});

const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: false,
    processEntities: false,  // IMPORTANT: Ne pas ré-encoder les entités HTML
});

// --------------------
// Utils
// --------------------
function normalizeArray(v) {
    if (!v) {
        return [];
    }
    return Array.isArray(v) ? v : [v];
}

function loadXlf(filePath) {
    const xml = fs.readFileSync(filePath, "utf8");
    return parser.parse(xml);
}

function writeXlf(filePath, obj) {
    if (obj["?xml"]) {
        delete obj["?xml"];
    }
    const xmlBody = builder.build(obj);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}\n`;
    fs.writeFileSync(filePath, xml, "utf8");
}

function getFileNode(xlfObj) {
    const file = xlfObj?.xliff?.file;
    if (!file) {
        throw new Error("Invalid XLF: missing xliff.file");
    }
    return file;
}

function indexUnitsById(xlfObj) {
    const file = getFileNode(xlfObj);
    const units = normalizeArray(file.unit);
    const map = new Map();
    for (const u of units) {
        const id = u?.["@_id"];
        if (id) {
            map.set(id, u);
        }
    }
    return map;
}

function getOrCreateSegment(unit) {
    unit.segment = unit.segment ?? {};
    return unit.segment;
}

// --------------------
// XML illegal control chars helpers
// --------------------
function sanitizeXmlIllegalControlCharsToBackslashEscapes(s) {
    if (typeof s !== "string" || s.length === 0) {
        return s;
    }

    let out = "";
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);

        // Caractères autorisés en XML 1.0
        if (c === 0x09 || c === 0x0A || c === 0x0D) {
            out += s[i];
            continue;
        }

        if (c >= 0x20) {
            out += s[i];
            continue;
        }

        // Caractères de contrôle illégaux - convertir en séquences visibles
        if (c === 0x0C) {
            out += "\\f";
        } else if (c === 0x08) {
            out += "\\b";
        } else if (c === 0x0B) {
            out += "\\v";
        } else if (c === 0x00) {
            out += "\\0";
        }
        // Autres: ignorer
    }

    return out;
}

function sanitizeValueDeep(value) {
    if (typeof value === "string") {
        return sanitizeXmlIllegalControlCharsToBackslashEscapes(value);
    }
    if (value && typeof value === "object") {
        const cloned = Array.isArray(value) ? [...value] : { ...value };
        for (const [k, v] of Object.entries(cloned)) {
            if (typeof v === "string") {
                cloned[k] = sanitizeXmlIllegalControlCharsToBackslashEscapes(v);
            } else if (typeof v === "object" && v) {
                cloned[k] = sanitizeValueDeep(v);
            }
        }
        return cloned;
    }
    return value;
}

// --------------------
// KaTeX detection and processing
// --------------------

/**
 * Détecte si un ID correspond à une formule KaTeX/LaTeX
 */
function isKatexId(id) {
    const s = String(id ?? "");
    return (
        /_katex$/i.test(s) ||
        /_latex$/i.test(s) ||
        /_formula_katex$/i.test(s) ||
        /_formula_latex$/i.test(s)
    );
}

/**
 * Détecte si une valeur ressemble à du KaTeX
 */
function looksLikeKatex(id, value) {
    if (isKatexId(id)) {
        return true;
    }

    const s = typeof value === "string"
        ? value
        : (value && typeof value === "object" ? (value["#text"] ?? "") : "");

    return /\\(text|mathrm|dfrac|frac|times|begin|end|left|right|%)/.test(s);
}

/**
 * Échappe les accolades pour éviter le parsing ICU d'Angular.
 * IMPORTANT: Cette fonction doit produire du texte qui sera écrit tel quel dans le XML,
 * donc on utilise les entités HTML directement.
 */
function escapeKatexBraces(s) {
    if (typeof s !== "string" || s.length === 0) {
        return s;
    }

    // Normaliser d'abord (au cas où il y aurait des entités existantes)
    let out = s;

    // Décoder les entités existantes
    out = out.replace(/&amp;#123;/g, "{");
    out = out.replace(/&amp;#125;/g, "}");
    out = out.replace(/&#123;/g, "{");
    out = out.replace(/&#125;/g, "}");

    // Normaliser les backslash multiples
    while (out.includes("\\\\")) {
        out = out.replace(/\\\\/g, "\\");
    }

    // Ré-échapper les accolades
    out = out.replace(/\{/g, "&#123;");
    out = out.replace(/\}/g, "&#125;");

    // Appliquer la sanitization XML
    out = sanitizeXmlIllegalControlCharsToBackslashEscapes(out);

    return out;
}

function escapeKatexForXlf(value) {
    if (typeof value === "string") {
        return escapeKatexBraces(value);
    }

    if (value && typeof value === "object") {
        const cloned = { ...value };
        if (typeof cloned["#text"] === "string") {
            cloned["#text"] = escapeKatexBraces(cloned["#text"]);
        }
        return cloned;
    }

    return value;
}

// --------------------
// XLF target writer
// --------------------
function setTarget(unit, value, state = "translated") {
    const seg = getOrCreateSegment(unit);

    // Sanitize globalement (même pour non-katex)
    const safeValue = sanitizeValueDeep(value);

    if (typeof safeValue === "string") {
        if (!seg.target) {
            seg.target = { "#text": safeValue, "@_state": state };
            return;
        }
        if (typeof seg.target === "string") {
            seg.target = { "#text": seg.target };
        }
        seg.target["#text"] = safeValue;
        seg.target["@_state"] = state;
        return;
    }

    if (safeValue && typeof safeValue === "object") {
        seg.target = { ...safeValue, "@_state": state };
        return;
    }
}

// --------------------
// Input loader (file or directory)
// --------------------
function isDirectory(p) {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function loadTodoPayloads(inputPath) {
    if (!fs.existsSync(inputPath)) {
        return [];
    }

    if (isDirectory(inputPath)) {
        const files = fs
            .readdirSync(inputPath)
            .filter((f) => f.endsWith(".todo.json"))
            .map((f) => path.join(inputPath, f));

        return files.map((f) => ({
            file: f,
            payload: JSON.parse(fs.readFileSync(f, "utf8")),
        }));
    }

    return [
        {
            file: inputPath,
            payload: JSON.parse(fs.readFileSync(inputPath, "utf8")),
        },
    ];
}

// --------------------
// Main
// --------------------
const inputPath = process.argv[2] ?? path.resolve("dist/i18n/todo");
if (!fs.existsSync(inputPath)) {
    console.error(`[i18n-apply] missing input path: ${inputPath}`);
    process.exit(1);
}

const todos = loadTodoPayloads(inputPath);
if (todos.length === 0) {
    console.log(`[i18n-apply] nothing to apply (no *.todo.json found)`);
    process.exit(0);
}

const localeDir = path.resolve("src/locale");

let applied = 0;
let missingUnits = 0;
let skippedEmpty = 0;
let skippedInvalid = 0;

for (const { file: todoFile, payload } of todos) {
    const locale = payload?.locale;
    const items = payload?.items ?? [];

    if (!locale || !Array.isArray(items)) {
        console.warn(`[i18n-apply] skip invalid todo file: ${todoFile}`);
        skippedInvalid++;
        continue;
    }

    const xlfPath = path.join(localeDir, `messages.${locale}.xlf`);
    if (!fs.existsSync(xlfPath)) {
        console.warn(`[i18n-apply] skip missing ${xlfPath} (from ${path.basename(todoFile)})`);
        continue;
    }

    const xlf = loadXlf(xlfPath);
    const map = indexUnitsById(xlf);

    let appliedInLocale = 0;

    for (const item of items) {
        const id = item?.id;
        const translatedTargetRaw = item?.translatedTarget;

        if (!id || translatedTargetRaw == null) {
            skippedEmpty++;
            continue;
        }

        const translatedTarget = typeof translatedTargetRaw === "string"
            ? translatedTargetRaw.trim()
            : translatedTargetRaw;

        const isEmptyString = typeof translatedTarget === "string" && translatedTarget.length === 0;

        const isEmptyObject = translatedTarget && typeof translatedTarget === "object"
            ? (translatedTarget["#text"] ?? "").toString().trim().length === 0 && !translatedTarget.pc
            : false;

        if (isEmptyString || isEmptyObject) {
            skippedEmpty++;
            continue;
        }

        const unit = map.get(id);
        if (!unit) {
            missingUnits++;
            continue;
        }

        // Traitement spécial pour KaTeX: échapper les accolades
        const finalValue = looksLikeKatex(id, translatedTarget)
            ? escapeKatexForXlf(translatedTarget)
            : sanitizeValueDeep(translatedTarget);

        setTarget(unit, finalValue, "translated");
        applied++;
        appliedInLocale++;
    }

    writeXlf(xlfPath, xlf);
    console.log(`[i18n-apply] ${locale}: applied ${appliedInLocale} (from ${path.basename(todoFile)})`);
}

console.log(
    `[i18n-apply] done. applied=${applied}, missingUnits=${missingUnits}, skippedEmpty=${skippedEmpty}, skippedInvalid=${skippedInvalid}`
);
