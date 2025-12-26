// scripts/i18n-utils.mjs
//
// Module utilitaire partagé pour tous les scripts i18n.
// Contient les fonctions communes : lecture/écriture XLF, détection KaTeX, sanitization, etc.

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// Configuration
// =============================================================================
export const CONFIG = {
    projectName: "tools-central",
    sourceLocale: "fr",
    localeDir: path.resolve("src/locale"),
};

// =============================================================================
// Lecture de la configuration Angular
// =============================================================================
export function getTargetLocales() {
    const angularJsonPath = path.resolve("angular.json");
    if (!fs.existsSync(angularJsonPath)) {
        console.error("[i18n] angular.json not found");
        process.exit(1);
    }

    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, "utf8"));
    const project = angularJson.projects?.[CONFIG.projectName];

    if (!project?.i18n?.locales) {
        console.error(`[i18n] No i18n config found for project "${CONFIG.projectName}"`);
        process.exit(1);
    }

    return Object.keys(project.i18n.locales);
}

// =============================================================================
// Détection KaTeX/LaTeX
// =============================================================================
export function isKatexId(id) {
    const s = String(id ?? "");
    return (
        /_katex$/i.test(s) ||
        /_latex$/i.test(s) ||
        /_formula_katex$/i.test(s) ||
        /_formula_latex$/i.test(s)
    );
}

export function looksLikeKatex(text) {
    if (typeof text !== "string") {
        return false;
    }
    // Commandes LaTeX courantes
    return /\\(text|mathrm|dfrac|frac|times|begin|end|left|right|quad|sqrt|sum|prod|int|Rightarrow|Leftarrow|%)/.test(text);
}

// =============================================================================
// Échappement des accolades pour Angular ICU
// =============================================================================
export function escapeKatexBraces(text) {
    if (typeof text !== "string") {
        return text;
    }

    let out = text;

    // 1. Décoder les entités existantes (normalisation)
    out = out.replace(/&amp;#123;/g, "{");
    out = out.replace(/&amp;#125;/g, "}");
    out = out.replace(/&#123;/g, "{");
    out = out.replace(/&#125;/g, "}");

    // 2. Normaliser les backslash multiples → simple
    while (out.includes("\\\\")) {
        out = out.replace(/\\\\/g, "\\");
    }

    // 3. Échapper les accolades pour Angular
    out = out.replace(/\{/g, "&#123;");
    out = out.replace(/\}/g, "&#125;");

    return out;
}

export function unescapeKatexBraces(text) {
    if (typeof text !== "string") {
        return text;
    }
    return text
        .replace(/&#123;/g, "{")
        .replace(/&#125;/g, "}");
}

// =============================================================================
// Sanitization des caractères de contrôle XML illégaux
// =============================================================================
export function hasXmlIllegalControlChars(s) {
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

export function sanitizeXmlControlChars(s) {
    if (typeof s !== "string" || s.length === 0) {
        return s;
    }

    let out = "";
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);

        // Caractères autorisés
        if (c === 0x09 || c === 0x0A || c === 0x0D || c >= 0x20) {
            out += s[i];
            continue;
        }

        // Caractères de contrôle illégaux → séquences visibles
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

// =============================================================================
// Lecture/Écriture XLF via REGEX (pas de XMLBuilder = pas de bug </>)
// =============================================================================

/**
 * Extrait toutes les unités d'un fichier XLF sous forme de Map<id, {source, target, state, raw}>
 */
export function parseXlfUnits(content) {
    const units = new Map();

    // Regex pour capturer chaque <unit>...</unit>
    const unitRegex = /<unit\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/unit>/g;
    let match;

    while ((match = unitRegex.exec(content)) !== null) {
        const id = match[1];
        const unitContent = match[2];

        // Extraire source
        const sourceMatch = unitContent.match(/<source>([\s\S]*?)<\/source>/);
        const source = sourceMatch ? sourceMatch[1] : "";

        // Extraire target avec state
        const targetMatch = unitContent.match(/<target(?:\s+state="([^"]*)")?[^>]*>([\s\S]*?)<\/target>/);
        const target = targetMatch ? targetMatch[2] : null;
        const state = targetMatch ? (targetMatch[1] || "") : "";

        units.set(id, {
            source,
            target,
            state,
            raw: match[0],
            fullMatch: match,
        });
    }

    return units;
}

/**
 * Met à jour le target d'une unité spécifique dans le contenu XLF
 */
export function updateXlfTarget(content, unitId, newTarget, newState = "translated") {
    // Trouver l'unité
    const unitRegex = new RegExp(
        `(<unit\\s+id="${escapeRegex(unitId)}"[^>]*>[\\s\\S]*?<segment>)([\\s\\S]*?)(<\\/segment>)`,
        "g"
    );

    return content.replace(unitRegex, (match, before, segmentContent, after) => {
        // Remplacer ou ajouter le target
        const sourceMatch = segmentContent.match(/(<source>[\s\S]*?<\/source>)/);
        const source = sourceMatch ? sourceMatch[1] : "";

        const newTargetTag = `<target state="${newState}">${newTarget}</target>`;

        // Vérifier si un target existe déjà
        if (/<target[\s\S]*?<\/target>/.test(segmentContent)) {
            // Remplacer le target existant
            const newSegment = segmentContent.replace(
                /<target[\s\S]*?<\/target>/,
                newTargetTag
            );
            return before + newSegment + after;
        } else {
            // Ajouter le target après le source
            const newSegment = segmentContent.replace(
                /(<source>[\s\S]*?<\/source>)/,
                `$1\n        ${newTargetTag}`
            );
            return before + newSegment + after;
        }
    });
}

/**
 * Met à jour le source d'une unité spécifique
 */
export function updateXlfSource(content, unitId, newSource) {
    const unitRegex = new RegExp(
        `(<unit\\s+id="${escapeRegex(unitId)}"[^>]*>[\\s\\S]*?)(<source>)[\\s\\S]*?(<\\/source>)`,
        "g"
    );

    return content.replace(unitRegex, `$1$2${newSource}$3`);
}

/**
 * Ajoute une nouvelle unité à la fin du fichier XLF
 */
export function addXlfUnit(content, unitId, source, target, state = "new") {
    const newUnit = `    <unit id="${unitId}">
      <segment>
        <source>${source}</source>
        <target state="${state}">${target}</target>
      </segment>
    </unit>`;

    // Insérer avant </file>
    return content.replace(
        /(\s*)<\/file>/,
        `\n${newUnit}$1</file>`
    );
}

/**
 * Échappe les caractères spéciaux pour utilisation dans une regex
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =============================================================================
// Helpers fichiers
// =============================================================================
export function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

export function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, "utf8");
}

export function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

export function listXlfFiles(localeDir = CONFIG.localeDir) {
    if (!fs.existsSync(localeDir)) {
        return [];
    }
    return fs
        .readdirSync(localeDir)
        .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf"))
        .map((f) => ({
            fileName: f,
            filePath: path.join(localeDir, f),
            locale: f.slice("messages.".length, -".xlf".length),
        }));
}

export function getSourceXlfPath() {
    return path.join(CONFIG.localeDir, `messages.${CONFIG.sourceLocale}.xlf`);
}

export function getTargetXlfPath(locale) {
    return path.join(CONFIG.localeDir, `messages.${locale}.xlf`);
}

// =============================================================================
// Validation XML basique
// =============================================================================
export function validateXml(content) {
    const errors = [];

    // Vérifier les balises orphelines </>
    if (/<\/>/.test(content)) {
        errors.push("Found invalid empty closing tag </>");
    }

    // Vérifier les balises non fermées basiques
    const openTags = content.match(/<(unit|segment|source|target|xliff|file)\b[^>]*(?<!\/)>/g) || [];
    const closeTags = content.match(/<\/(unit|segment|source|target|xliff|file)>/g) || [];

    // Compter par type
    const openCounts = {};
    const closeCounts = {};

    for (const tag of openTags) {
        const name = tag.match(/<(\w+)/)?.[1];
        if (name) {
            openCounts[name] = (openCounts[name] || 0) + 1;
        }
    }

    for (const tag of closeTags) {
        const name = tag.match(/<\/(\w+)>/)?.[1];
        if (name) {
            closeCounts[name] = (closeCounts[name] || 0) + 1;
        }
    }

    for (const name of Object.keys(openCounts)) {
        if (openCounts[name] !== (closeCounts[name] || 0)) {
            errors.push(`Tag mismatch for <${name}>: ${openCounts[name]} open, ${closeCounts[name] || 0} close`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
