// scripts/i18n-sync.mjs
//
// Synchronise les fichiers XLF de traduction avec le fichier source français.
// 
// Ce script :
// 1. Crée les fichiers XLF manquants pour les nouvelles langues
// 2. Ajoute les nouvelles unités de traduction
// 3. Met à jour les sources modifiées et marque les traductions comme "needs-review"
// 4. Gère spécialement les formules KaTeX/LaTeX en échappant les accolades

import fs from "node:fs";
import path from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const projectName = "tools-central";
const angularJson = JSON.parse(fs.readFileSync(path.resolve("angular.json"), "utf8"));

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,
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

function indexUnits(xlfObj) {
    const file = getFileNode(xlfObj);
    const units = normalizeArray(file?.unit);
    const map = new Map();
    for (const u of units) {
        if (u?.["@_id"]) {
            map.set(u["@_id"], u);
        }
    }
    return map;
}

function getOrCreateSegment(unit) {
    unit.segment = unit.segment ?? {};
    return unit.segment;
}

function normalizeTargetToObject(seg) {
    if (!seg.target) {
        return null;
    }
    if (typeof seg.target === "string") {
        seg.target = { "#text": seg.target };
    }
    return seg.target;
}

function getTargetState(unit) {
    const t = unit?.segment?.target;
    if (!t || typeof t === "string") {
        return "";
    }
    return t["@_state"] ?? "";
}

function setTargetState(unit, state) {
    const seg = getOrCreateSegment(unit);
    if (!seg.target) {
        seg.target = { "#text": "TODO" };
    }
    const t = normalizeTargetToObject(seg);
    t["@_state"] = state;
}

function ensureTarget(unit, defaultText = "TODO", stateIfCreated = "new") {
    const seg = getOrCreateSegment(unit);

    if (!seg.target) {
        seg.target = { "#text": defaultText, "@_state": stateIfCreated };
    } else {
        normalizeTargetToObject(seg);
    }

    return unit;
}

function getSourceValue(unit) {
    return unit?.segment?.source;
}

function setSourceValue(unit, newSource) {
    const seg = getOrCreateSegment(unit);
    seg.source = newSource;
}

function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
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

/**
 * Échappe les accolades pour éviter le parsing ICU d'Angular
 */
function escapeKatexBraces(value) {
    if (typeof value === "string") {
        let out = value;
        // Décoder d'abord les entités existantes
        out = out.replace(/&amp;#123;/g, "{");
        out = out.replace(/&amp;#125;/g, "}");
        out = out.replace(/&#123;/g, "{");
        out = out.replace(/&#125;/g, "}");
        // Normaliser les backslash
        while (out.includes("\\\\")) {
            out = out.replace(/\\\\/g, "\\");
        }
        // Ré-échapper les accolades
        out = out.replace(/\{/g, "&#123;");
        out = out.replace(/\}/g, "&#125;");
        return out;
    }

    if (value && typeof value === "object") {
        const cloned = JSON.parse(JSON.stringify(value));
        if (typeof cloned["#text"] === "string") {
            cloned["#text"] = escapeKatexBraces(cloned["#text"]);
        }
        return cloned;
    }

    return value;
}

/**
 * Traite une unité KaTeX: échappe les accolades dans source et target
 */
function processKatexUnit(unit) {
    const seg = getOrCreateSegment(unit);

    if (seg.source) {
        seg.source = escapeKatexBraces(seg.source);
    }

    if (seg.target) {
        if (typeof seg.target === "string") {
            seg.target = { "#text": escapeKatexBraces(seg.target), "@_state": "translated" };
        } else if (typeof seg.target === "object") {
            const text = seg.target["#text"];
            if (typeof text === "string") {
                seg.target["#text"] = escapeKatexBraces(text);
            }
            seg.target["@_state"] = "translated";
        }
    } else {
        // Pour KaTeX, le target = source (pas de traduction)
        seg.target = {
            "#text": typeof seg.source === "string" ? seg.source : (seg.source?.["#text"] ?? ""),
            "@_state": "translated"
        };
    }
}

// --------------------
// Config
// --------------------
const project = angularJson.projects?.[projectName];
if (!project?.i18n?.sourceLocale || !project?.i18n?.locales) {
    console.error(`[i18n-sync] missing i18n config in angular.json for "${projectName}"`);
    process.exit(1);
}

const sourceLocale = project.i18n.sourceLocale;
const targetLocales = Object.keys(project.i18n.locales);

const outDir = path.resolve("src/locale");
const sourceFile = path.join(outDir, `messages.${sourceLocale}.xlf`);

if (!fs.existsSync(sourceFile)) {
    console.error(`[i18n-sync] missing source: ${sourceFile}`);
    process.exit(1);
}

const sourceObj = loadXlf(sourceFile);
const sourceUnits = indexUnits(sourceObj);

// --------------------
// Traiter le fichier source français (échapper KaTeX)
// --------------------
let sourceModified = false;
const sourceFileNode = getFileNode(sourceObj);
const sourceUnitsList = normalizeArray(sourceFileNode.unit);

for (const unit of sourceUnitsList) {
    const id = unit?.["@_id"];
    if (id && isKatexId(id)) {
        const beforeJson = JSON.stringify(unit);
        processKatexUnit(unit);
        if (JSON.stringify(unit) !== beforeJson) {
            sourceModified = true;
        }
    }
}

if (sourceModified) {
    writeXlf(sourceFile, sourceObj);
    console.log(`[i18n-sync] source ${sourceLocale}: KaTeX formulas processed`);
}

// Recharger après modification
const sourceObjFresh = sourceModified ? loadXlf(sourceFile) : sourceObj;
const sourceUnitsFresh = indexUnits(sourceObjFresh);

// --------------------
// Main sync loop
// --------------------
for (const locale of targetLocales) {
    const targetFile = path.join(outDir, `messages.${locale}.xlf`);

    // Fichier de locale absent => créer depuis le source avec TODO + state=new
    if (!fs.existsSync(targetFile)) {
        const clone = JSON.parse(JSON.stringify(sourceObjFresh));
        const file = getFileNode(clone);
        const units = normalizeArray(file.unit);

        for (const u of units) {
            const id = u?.["@_id"];
            if (id && isKatexId(id)) {
                // KaTeX: copier source comme target
                processKatexUnit(u);
            } else {
                ensureTarget(u, "TODO", "new");
            }
        }

        file.unit = units;

        if (clone.xliff?.["@_srcLang"]) {
            clone.xliff["@_srcLang"] = sourceLocale;
        }
        if (clone.xliff?.["@_trgLang"]) {
            clone.xliff["@_trgLang"] = locale;
        }

        writeXlf(targetFile, clone);
        console.log(`[i18n-sync] created ${targetFile} with TODO targets (state=new)`);
        continue;
    }

    // Merge fichier existant
    const targetObj = loadXlf(targetFile);
    const targetUnits = indexUnits(targetObj);

    const file = getFileNode(targetObj);
    const existing = normalizeArray(file.unit);
    const merged = [...existing];

    let addedCount = 0;
    let updatedSourceCount = 0;
    let ensuredTargetCount = 0;
    let katexProcessedCount = 0;

    for (const [id, srcUnit] of sourceUnitsFresh.entries()) {
        if (!targetUnits.has(id)) {
            // Nouvelle unité
            const newUnit = JSON.parse(JSON.stringify(srcUnit));

            if (isKatexId(id)) {
                processKatexUnit(newUnit);
                katexProcessedCount++;
            } else {
                ensureTarget(newUnit, "TODO", "new");
            }

            merged.push(newUnit);
            addedCount++;
            continue;
        }

        const unit = targetUnits.get(id);

        // Traitement spécial KaTeX
        if (isKatexId(id)) {
            const beforeJson = JSON.stringify(unit);
            processKatexUnit(unit);
            if (JSON.stringify(unit) !== beforeJson) {
                katexProcessedCount++;
            }
            continue;
        }

        // Assurer que target existe (ne pas écraser la traduction existante)
        const hadTarget = !!unit?.segment?.target;
        ensureTarget(unit, "TODO", "new");
        if (!hadTarget && unit?.segment?.target) {
            ensuredTargetCount++;
        }

        // Détecter changement de source
        const srcSource = getSourceValue(srcUnit);
        const tgtSource = getSourceValue(unit);

        if (!deepEqual(tgtSource, srcSource)) {
            // Mettre à jour le source de la locale pour correspondre au fichier source
            setSourceValue(unit, JSON.parse(JSON.stringify(srcSource)));

            // Marquer comme needs-review, mais garder la traduction existante
            const currentState = getTargetState(unit);
            if (currentState !== "new") {
                setTargetState(unit, "needs-review");
            }

            updatedSourceCount++;
        }
    }

    file.unit = merged;

    // Mettre à jour les métadonnées
    if (targetObj.xliff) {
        targetObj.xliff["@_srcLang"] = sourceLocale;
        targetObj.xliff["@_trgLang"] = locale;
    }

    writeXlf(targetFile, targetObj);

    const parts = [];
    if (addedCount > 0) {
        parts.push(`+${addedCount} new`);
    }
    if (ensuredTargetCount > 0) {
        parts.push(`+${ensuredTargetCount} ensured target`);
    }
    if (updatedSourceCount > 0) {
        parts.push(`~${updatedSourceCount} source updated`);
    }
    if (katexProcessedCount > 0) {
        parts.push(`📐${katexProcessedCount} KaTeX`);
    }

    console.log(`[i18n-sync] merged ${targetFile} (${parts.join(", ") || "no changes"})`);
}
